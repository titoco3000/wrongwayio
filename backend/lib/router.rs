//! Routes:
//!
//! - `POST /users` `{name}`: register. 409 `name-taken` if the name exists in any case.
//! - `GET  /users/{name}`: the player's data.
//! - `POST /users/{name}/infinite` `{score, ms, byGear}`: submit records; the best of each is kept.
//! - `POST /users/{name}/daily` `{date, result}`: submit a daily challenge result; streaks follow.
//! - `POST /users/{name}/premium` `{from, days}`: add premium days.
//! - `GET  /scoreboard?by=score|time|streak|gear-1..gear-5|gear-R&limit=N`: top players.
//!
//! There are no passwords in WrongWayio (logging in is a pinky promise), so
//! these routes take the player's name at its word.

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

use crate::domain::{name_key, ByGear, Daily, DailyResult, Records, Streak, User};
use crate::error::ApiError;
use crate::store::Store;

const DEFAULT_LIMIT: usize = 50;
const MAX_LIMIT: usize = 100;

pub fn app(store: Store) -> Router {
    Router::new()
        .route("/users", post(register))
        .route("/users/{name}", get(get_user))
        .route("/users/{name}/infinite", post(submit_infinite))
        .route("/users/{name}/daily", post(submit_daily))
        .route("/users/{name}/premium", post(grant_premium))
        .route("/scoreboard", get(scoreboard))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(store)
}

/// A player as the frontend sees it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserView {
    name: String,
    premium_until: Option<i64>,
    premium_from: Option<String>,
    infinite_records: Records,
    daily: Option<Daily>,
    streak: Streak,
    longest_streak: u32,
}

impl From<User> for UserView {
    fn from(u: User) -> Self {
        UserView {
            name: u.name,
            premium_until: u.premium_until,
            premium_from: u.premium_from,
            infinite_records: u.infinite,
            daily: u.daily,
            streak: u.streak,
            longest_streak: u.longest_streak,
        }
    }
}

#[derive(Deserialize)]
struct Register {
    name: String,
}

async fn register(
    State(store): State<Store>,
    Json(body): Json<Register>,
) -> Result<(StatusCode, Json<UserView>), ApiError> {
    let user = User::new(&body.name, Utc::now().timestamp_millis())?;
    store.create(&user).await?;
    Ok((StatusCode::CREATED, Json(user.into())))
}

async fn get_user(
    State(store): State<Store>,
    Path(name): Path<String>,
) -> Result<Json<UserView>, ApiError> {
    let user = store
        .get(&name_key(&name))
        .await?
        .ok_or(ApiError::NotFound)?;
    Ok(Json(user.into()))
}

async fn submit_infinite(
    State(store): State<Store>,
    Path(name): Path<String>,
    Json(records): Json<Records>,
) -> Result<Json<UserView>, ApiError> {
    let user = store
        .update(&name_key(&name), |u| {
            u.infinite.merge(&records);
            Ok(())
        })
        .await?;
    Ok(Json(user.into()))
}

#[derive(Deserialize)]
struct SubmitDaily {
    date: String,
    result: DailyResult,
}

async fn submit_daily(
    State(store): State<Store>,
    Path(name): Path<String>,
    Json(body): Json<SubmitDaily>,
) -> Result<Json<UserView>, ApiError> {
    let today = Utc::now().date_naive();
    let user = store
        .update(&name_key(&name), |u| {
            u.record_daily(&body.date, body.result, today)
        })
        .await?;
    Ok(Json(user.into()))
}

#[derive(Deserialize)]
struct GrantPremium {
    from: String,
    days: u32,
}

async fn grant_premium(
    State(store): State<Store>,
    Path(name): Path<String>,
    Json(body): Json<GrantPremium>,
) -> Result<Json<UserView>, ApiError> {
    let now = Utc::now().timestamp_millis();
    let user = store
        .update(&name_key(&name), |u| {
            u.grant_premium(&body.from, body.days, now)
        })
        .await?;
    Ok(Json(user.into()))
}

#[derive(Deserialize)]
struct ScoreboardQuery {
    by: Option<String>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    name: String,
    score: u32,
    ms: u64,
    longest_streak: u32,
    by_gear: ByGear,
}

#[derive(Clone, Copy, Debug)]
enum Board {
    Score,
    Time,
    Streak,
    /// points scored in one gear: "1".."5" or "R"
    Gear(char),
}

impl Board {
    fn parse(by: Option<&str>) -> Result<Board, ApiError> {
        match by {
            None | Some("score") => Ok(Board::Score),
            Some("time") => Ok(Board::Time),
            Some("streak") => Ok(Board::Streak),
            Some(by) => match by
                .strip_prefix("gear-")
                .and_then(|g| g.chars().next().filter(|_| by.len() == 6))
            {
                Some(g @ ('1'..='5' | 'R')) => Ok(Board::Gear(g)),
                _ => Err(ApiError::Invalid(
                    "by must be score, time, streak or gear-1..gear-5, gear-R",
                )),
            },
        }
    }

    fn value(self, e: &Entry) -> u64 {
        match self {
            Board::Score => e.score.into(),
            Board::Time => e.ms,
            Board::Streak => e.longest_streak.into(),
            Board::Gear(g) => match g {
                '1' => e.by_gear.g1,
                '2' => e.by_gear.g2,
                '3' => e.by_gear.g3,
                '4' => e.by_gear.g4,
                '5' => e.by_gear.g5,
                _ => e.by_gear.r,
            }
            .into(),
        }
    }
}

/// Best first, ties alphabetical; players with nothing on the board are left off.
fn rank(users: Vec<User>, board: Board, limit: usize) -> Vec<Entry> {
    let mut entries: Vec<Entry> = users
        .into_iter()
        .map(|u| Entry {
            name: u.name,
            score: u.infinite.score,
            ms: u.infinite.ms,
            longest_streak: u.longest_streak,
            by_gear: u.infinite.by_gear,
        })
        .filter(|e| board.value(e) > 0)
        .collect();
    entries.sort_by(|a, b| {
        board
            .value(b)
            .cmp(&board.value(a))
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    entries.truncate(limit);
    entries
}

async fn scoreboard(
    State(store): State<Store>,
    Query(q): Query<ScoreboardQuery>,
) -> Result<Json<Vec<Entry>>, ApiError> {
    let board = Board::parse(q.by.as_deref())?;
    let limit = q.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    Ok(Json(rank(store.all().await?, board, limit)))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn player(name: &str, score: u32, ms: u64, streak: u32) -> User {
        let mut u = User::new(name, 0).unwrap();
        u.infinite.score = score;
        u.infinite.ms = ms;
        u.longest_streak = streak;
        u
    }

    #[test]
    fn ranks_best_first_and_skips_empty() {
        let users = vec![
            player("bob", 5, 0, 0),
            player("Ann", 9, 0, 0),
            player("cy", 0, 0, 3),
            player("al", 9, 0, 0),
        ];
        let names = |b| {
            rank(users.clone(), b, 10)
                .into_iter()
                .map(|e| e.name)
                .collect::<Vec<_>>()
        };
        assert_eq!(names(Board::Score), ["al", "Ann", "bob"]);
        assert_eq!(names(Board::Streak), ["cy"]);
        assert_eq!(names(Board::Time), Vec::<String>::new());
        assert_eq!(rank(users, Board::Score, 2).len(), 2);
    }

    #[test]
    fn ranks_by_gear() {
        let mut a = player("aa", 9, 0, 0);
        a.infinite.by_gear.r = 4;
        let mut b = player("bb", 1, 0, 0);
        b.infinite.by_gear.r = 7;
        let c = player("cc", 50, 0, 0);
        let names = rank(vec![a, b, c], Board::Gear('R'), 10)
            .into_iter()
            .map(|e| e.name)
            .collect::<Vec<_>>();
        assert_eq!(names, ["bb", "aa"]);
    }

    #[test]
    fn board_param_is_checked() {
        assert!(Board::parse(Some("time")).is_ok());
        assert!(Board::parse(None).is_ok());
        assert!(Board::parse(Some("x")).is_err());
        assert!(matches!(Board::parse(Some("gear-R")), Ok(Board::Gear('R'))));
        assert!(matches!(Board::parse(Some("gear-3")), Ok(Board::Gear('3'))));
        assert!(Board::parse(Some("gear-6")).is_err());
        assert!(Board::parse(Some("gear-")).is_err());
        assert!(Board::parse(Some("gear-12")).is_err());
    }
}
