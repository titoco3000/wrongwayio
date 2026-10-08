//! What a request can fail with, and how each failure looks on the wire:
//! a status code and `{"code": "..."}`. The codes match the frontend's `ApiErrorCode`.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug, PartialEq)]
pub enum ApiError {
    InvalidName,
    NameTaken,
    NotFound,
    /// The body parsed but its content is not acceptable.
    Invalid(&'static str),
    Internal,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code) = match self {
            ApiError::InvalidName => (StatusCode::BAD_REQUEST, "invalid-name"),
            ApiError::NameTaken => (StatusCode::CONFLICT, "name-taken"),
            ApiError::NotFound => (StatusCode::NOT_FOUND, "not-found"),
            ApiError::Invalid(_) => (StatusCode::BAD_REQUEST, "invalid"),
            ApiError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "internal"),
        };
        let body = match self {
            ApiError::Invalid(reason) => json!({ "code": code, "reason": reason }),
            _ => json!({ "code": code }),
        };
        (status, Json(body)).into_response()
    }
}
