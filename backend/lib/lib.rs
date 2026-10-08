//! WrongWayio API: players, their infinite driving records, daily challenge
//! results and streaks, and the scoreboard built from them.
//!
//! - [`domain`]: the player and the rules for updating one. Pure, no I/O.
//! - [`store`]: the DynamoDB table the players live in.
//! - [`router`]: the HTTP routes.

pub mod domain;
pub mod error;
pub mod router;
pub mod store;
