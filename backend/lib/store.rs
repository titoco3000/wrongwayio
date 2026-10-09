//! The DynamoDB table of players: one item per player, keyed by
//! [`name_key`](crate::domain::name_key).

use aws_sdk_dynamodb::error::SdkError;
use aws_sdk_dynamodb::types::{
    AttributeDefinition, AttributeValue, BillingMode, KeySchemaElement, KeyType,
    ScalarAttributeType,
};
use aws_sdk_dynamodb::Client;

use crate::domain::User;
use crate::error::ApiError;

/// Concurrent writers to one player (two devices, one logged in account)
/// retry this many times before giving up.
const WRITE_ATTEMPTS: usize = 4;

type Item = std::collections::HashMap<String, AttributeValue>;

#[derive(Clone)]
pub struct Store {
    client: Client,
    table: String,
}

fn internal(err: impl std::fmt::Debug) -> ApiError {
    tracing::error!("dynamodb: {err:?}");
    ApiError::Internal
}

impl Store {
    /// Connects to the table named by `TABLE_NAME`. With `DYNAMODB_ENDPOINT` set
    /// (DynamoDB Local, see `make db-local`) it talks to that instead of AWS,
    /// with throwaway credentials, and creates the table if it is missing.
    pub async fn from_env() -> Store {
        let table =
            std::env::var("TABLE_NAME").expect("TABLE_NAME is set (see backend/.env.<stage>)");
        let defaults = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
        let store = match std::env::var("DYNAMODB_ENDPOINT") {
            Ok(endpoint) => {
                let config = aws_sdk_dynamodb::config::Builder::from(&defaults)
                    .endpoint_url(endpoint)
                    .region(aws_sdk_dynamodb::config::Region::new("us-east-1"))
                    .credentials_provider(aws_sdk_dynamodb::config::Credentials::new(
                        "local", "local", None, None, "local",
                    ))
                    .build();
                let store = Store {
                    client: Client::from_conf(config),
                    table,
                };
                store.ensure_table().await;
                store
            }
            Err(_) => Store {
                client: Client::new(&defaults),
                table,
            },
        };
        store
    }

    /// Mirrors infra/dynamodb.tf, for the local database only. The container's
    /// port accepts connections before the database inside is ready, so a
    /// refused request is retried for a while.
    async fn ensure_table(&self) {
        for attempt in 1.. {
            let result = self
                .client
                .create_table()
                .table_name(&self.table)
                .billing_mode(BillingMode::PayPerRequest)
                .attribute_definitions(
                    AttributeDefinition::builder()
                        .attribute_name("name_key")
                        .attribute_type(ScalarAttributeType::S)
                        .build()
                        .expect("valid"),
                )
                .key_schema(
                    KeySchemaElement::builder()
                        .attribute_name("name_key")
                        .key_type(KeyType::Hash)
                        .build()
                        .expect("valid"),
                )
                .send()
                .await;
            match result {
                Ok(_) => return tracing::info!("created local table {}", self.table),
                Err(SdkError::ServiceError(e)) if e.err().is_resource_in_use_exception() => return,
                Err(e) if attempt < 60 => {
                    tracing::debug!("waiting for DynamoDB Local: {e:?}");
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
                Err(e) => panic!("cannot reach DynamoDB Local at DYNAMODB_ENDPOINT: {e:?}"),
            }
        }
    }

    pub async fn get(&self, key: &str) -> Result<Option<User>, ApiError> {
        let out = self
            .client
            .get_item()
            .table_name(&self.table)
            .key("name_key", AttributeValue::S(key.to_string()))
            .consistent_read(true)
            .send()
            .await
            .map_err(internal)?;
        out.item
            .map(|item| serde_dynamo::from_item(item).map_err(internal))
            .transpose()
    }

    /// Inserts a new player; `NameTaken` if the key already exists.
    pub async fn create(&self, user: &User) -> Result<(), ApiError> {
        let result = self
            .client
            .put_item()
            .table_name(&self.table)
            .set_item(Some(serde_dynamo::to_item(user).map_err(internal)?))
            .condition_expression("attribute_not_exists(name_key)")
            .send()
            .await;
        match result {
            Ok(_) => Ok(()),
            Err(SdkError::ServiceError(e)) if e.err().is_conditional_check_failed_exception() => {
                Err(ApiError::NameTaken)
            }
            Err(e) => Err(internal(e)),
        }
    }

    /// Reads the player, applies `change`, and writes back only the attributes
    /// it changed, each guarded by the value that was read. Two writers
    /// touching different attributes both land; if one touched the same
    /// attribute meanwhile, this retries from the read. `change` may
    /// therefore run more than once.
    pub async fn update(
        &self,
        key: &str,
        change: impl Fn(&mut User) -> Result<(), ApiError>,
    ) -> Result<User, ApiError> {
        for _ in 0..WRITE_ATTEMPTS {
            let old = self.get(key).await?.ok_or(ApiError::NotFound)?;
            let mut user = old.clone();
            change(&mut user)?;
            let before: Item = serde_dynamo::to_item(&old).map_err(internal)?;
            let after: Item = serde_dynamo::to_item(&user).map_err(internal)?;

            let mut set = Vec::new();
            let mut remove = Vec::new();
            let mut guards = vec!["attribute_exists(name_key)".to_string()];
            let mut update = self.client.update_item().table_name(&self.table);
            let mut names: Vec<&String> = before.keys().chain(after.keys()).collect();
            names.sort();
            names.dedup();
            for (i, name) in names.into_iter().enumerate() {
                if name == "name_key" || before.get(name) == after.get(name) {
                    continue;
                }
                let (n, v) = (format!("#n{i}"), format!(":v{i}"));
                update = update.expression_attribute_names(&n, name);
                match after.get(name) {
                    Some(value) => {
                        update = update.expression_attribute_values(&v, value.clone());
                        set.push(format!("{n} = {v}"));
                    }
                    None => remove.push(n.clone()),
                }
                match before.get(name) {
                    Some(value) => {
                        let o = format!(":o{i}");
                        update = update.expression_attribute_values(&o, value.clone());
                        guards.push(format!("{n} = {o}"));
                    }
                    None => guards.push(format!("attribute_not_exists({n})")),
                }
            }
            if set.is_empty() && remove.is_empty() {
                return Ok(user);
            }
            let mut expression = String::new();
            if !set.is_empty() {
                expression += &format!("SET {}", set.join(", "));
            }
            if !remove.is_empty() {
                expression += &format!(" REMOVE {}", remove.join(", "));
            }
            let result = update
                .key("name_key", AttributeValue::S(key.to_string()))
                .update_expression(expression)
                .condition_expression(guards.join(" AND "))
                .send()
                .await;
            match result {
                Ok(_) => return Ok(user),
                Err(SdkError::ServiceError(e))
                    if e.err().is_conditional_check_failed_exception() =>
                {
                    continue
                }
                Err(e) => return Err(internal(e)),
            }
        }
        Err(internal("too many concurrent writes"))
    }

    /// Every player. Fine for a small table; see infra/dynamodb.tf.
    pub async fn all(&self) -> Result<Vec<User>, ApiError> {
        let mut users = Vec::new();
        let mut pages = self
            .client
            .scan()
            .table_name(&self.table)
            .into_paginator()
            .items()
            .send();
        while let Some(item) = pages.next().await {
            users.push(serde_dynamo::from_item(item.map_err(internal)?).map_err(internal)?);
        }
        Ok(users)
    }
}
