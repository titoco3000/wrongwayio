//! The player and the rules for changing one. Nothing here touches the
//! network, so every rule is unit-tested below.

use chrono::{Duration, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::error::ApiError;

pub const NAME_MIN: usize = 2;
pub const NAME_MAX: usize = 20;

/// Trims and collapses runs of whitespace.
pub fn clean_name(name: &str) -> String {
    name.split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn is_valid_name(name: &str) -> bool {
    let len = clean_name(name).chars().count();
    (NAME_MIN..=NAME_MAX).contains(&len)
}

/// Names are unique regardless of case: this is the table's key.
pub fn name_key(name: &str) -> String {
    clean_name(name).to_lowercase()
}

/// Correct answers given in each gear. Serialized as `{"1": n, ... "5": n, "R": n}`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct ByGear {
    #[serde(rename = "1")]
    pub g1: u32,
    #[serde(rename = "2")]
    pub g2: u32,
    #[serde(rename = "3")]
    pub g3: u32,
    #[serde(rename = "4")]
    pub g4: u32,
    #[serde(rename = "5")]
    pub g5: u32,
    /// reverse ("rear")
    #[serde(rename = "R")]
    pub r: u32,
}

/// Best values ever reached in infinite driving; each is its own record.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Records {
    pub score: u32,
    /// longest run, ms
    pub ms: u64,
    pub by_gear: ByGear,
}

impl Records {
    /// Keeps the best of each record. Returns whether anything changed.
    pub fn merge(&mut self, other: &Records) -> bool {
        let before = self.clone();
        self.score = self.score.max(other.score);
        self.ms = self.ms.max(other.ms);
        self.by_gear.g1 = self.by_gear.g1.max(other.by_gear.g1);
        self.by_gear.g2 = self.by_gear.g2.max(other.by_gear.g2);
        self.by_gear.g3 = self.by_gear.g3.max(other.by_gear.g3);
        self.by_gear.g4 = self.by_gear.g4.max(other.by_gear.g4);
        self.by_gear.g5 = self.by_gear.g5.max(other.by_gear.g5);
        self.by_gear.r = self.by_gear.r.max(other.by_gear.r);
        *self != before
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DailyResult {
    Done,
    Failed,
}

/// The last daily challenge played. `date` is the player's local day, YYYY-MM-DD.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Daily {
    pub date: String,
    pub result: DailyResult,
}

/// Consecutive days with a won challenge, ending at `last_date`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Streak {
    pub count: u32,
    pub last_date: String,
}

/// A player, as stored.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct User {
    /// The table's partition key, so it keeps the name infra/dynamodb.tf gives it.
    #[serde(rename = "name_key")]
    pub name_key: String,
    pub name: String,
    /// Bumped on every write; a write only lands if the stored one still matches.
    pub version: u64,
    /// epoch ms
    pub created_at: i64,
    /// epoch ms when the premium pass runs out
    pub premium_until: Option<i64>,
    pub premium_from: Option<String>,
    pub infinite: Records,
    pub daily: Option<Daily>,
    pub streak: Streak,
    pub longest_streak: u32,
}

const DAY_MS: i64 = 24 * 60 * 60 * 1000;
pub const MAX_PREMIUM_DAYS: u32 = 365;
const MAX_STREAK: u32 = 10_000;

fn parse_date(date: &str) -> Result<NaiveDate, ApiError> {
    NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .map_err(|_| ApiError::Invalid("date must be YYYY-MM-DD"))
}

impl User {
    pub fn new(name: &str, now_ms: i64) -> Result<User, ApiError> {
        if !is_valid_name(name) {
            return Err(ApiError::InvalidName);
        }
        Ok(User {
            name_key: name_key(name),
            name: clean_name(name),
            created_at: now_ms,
            ..User::default()
        })
    }

    /// Records the result of the daily challenge played on `date`.
    ///
    /// The first result of a day counts; later ones for the same (or an
    /// earlier) day are ignored, so replays and retried requests change
    /// nothing. A win on the day after the streak's last win extends it, a
    /// win after a gap starts a new one, a loss ends it.
    ///
    /// `today` is the server's UTC day. Players' local days differ from it by
    /// at most one, so anything further out is rejected.
    pub fn record_daily(
        &mut self,
        date: &str,
        result: DailyResult,
        today: NaiveDate,
    ) -> Result<(), ApiError> {
        let day = parse_date(date)?;
        if (day - today).num_days().abs() > 1 {
            return Err(ApiError::Invalid("date is too far from today"));
        }
        if let Some(last) = &self.daily {
            if parse_date(&last.date).is_ok_and(|last| last >= day) {
                return Ok(());
            }
        }
        match result {
            DailyResult::Done => {
                let continues = parse_date(&self.streak.last_date)
                    .is_ok_and(|last| last + Duration::days(1) == day);
                self.streak.count = if continues { self.streak.count + 1 } else { 1 };
                self.streak.last_date = date.to_string();
                self.longest_streak = self.longest_streak.max(self.streak.count);
            }
            DailyResult::Failed => self.streak.count = 0,
        }
        self.daily = Some(Daily {
            date: date.to_string(),
            result,
        });
        Ok(())
    }

    /// A streak of `count` wins ending on `date`, brought from the player's device (e.g. earned as a guest).
    /// Only applies when it ends on the streak's last win and beats the one kept here.
    pub fn adopt_streak(&mut self, date: &str, count: u32) {
        if self.streak.last_date == date && count > self.streak.count {
            self.streak.count = count.min(MAX_STREAK);
            self.longest_streak = self.longest_streak.max(self.streak.count);
        }
    }

    /// Adds `days` of premium on top of whatever is left.
    pub fn grant_premium(&mut self, from: &str, days: u32, now_ms: i64) -> Result<(), ApiError> {
        if days == 0 || days > MAX_PREMIUM_DAYS {
            return Err(ApiError::Invalid("days out of range"));
        }
        let start = now_ms.max(self.premium_until.unwrap_or(0));
        self.premium_until = Some(start + i64::from(days) * DAY_MS);
        self.premium_from = Some(clean_name(from));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn day(s: &str) -> NaiveDate {
        parse_date(s).unwrap()
    }

    fn user() -> User {
        User::new("Anna", 0).unwrap()
    }

    #[test]
    fn the_partition_key_is_stored_under_the_tables_key_name() {
        let item: std::collections::HashMap<String, aws_sdk_dynamodb::types::AttributeValue> =
            serde_dynamo::to_item(user()).unwrap();
        assert!(item.contains_key("name_key"));
        assert!(item.contains_key("longestStreak"));
    }

    #[test]
    fn names_are_cleaned_keyed_and_bounded() {
        assert_eq!(clean_name("  Anna   Lee "), "Anna Lee");
        assert_eq!(name_key("  ANNA   lee "), "anna lee");
        assert!(!is_valid_name("a"));
        assert!(!is_valid_name("  a  "));
        assert!(is_valid_name("ab"));
        assert!(is_valid_name(&"x".repeat(20)));
        assert!(!is_valid_name(&"x".repeat(21)));
        assert_eq!(User::new("x", 0), Err(ApiError::InvalidName));
    }

    #[test]
    fn records_keep_the_best_of_each() {
        let mut a = Records {
            score: 10,
            ms: 5000,
            by_gear: ByGear {
                g1: 4,
                ..Default::default()
            },
        };
        let b = Records {
            score: 7,
            ms: 9000,
            by_gear: ByGear {
                g1: 1,
                g3: 6,
                ..Default::default()
            },
        };
        assert!(a.merge(&b));
        assert_eq!(
            (a.score, a.ms, a.by_gear.g1, a.by_gear.g3),
            (10, 9000, 4, 6)
        );
        assert!(!a.merge(&b));
    }

    #[test]
    fn by_gear_uses_the_frontends_keys() {
        let json = serde_json::to_value(ByGear {
            g2: 3,
            ..Default::default()
        })
        .unwrap();
        assert_eq!(json["2"], 3);
        let parsed: Records = serde_json::from_str(r#"{"score":2,"byGear":{"5":9}}"#).unwrap();
        assert_eq!((parsed.score, parsed.ms, parsed.by_gear.g5), (2, 0, 9));
    }

    #[test]
    fn streak_grows_on_consecutive_wins() {
        let mut u = user();
        let today = day("2026-03-10");
        u.record_daily("2026-03-09", DailyResult::Done, today)
            .unwrap();
        u.record_daily("2026-03-10", DailyResult::Done, today)
            .unwrap();
        assert_eq!((u.streak.count, u.longest_streak), (2, 2));
    }

    #[test]
    fn a_gap_restarts_the_streak_but_keeps_the_longest() {
        let mut u = user();
        u.record_daily("2026-03-05", DailyResult::Done, day("2026-03-05"))
            .unwrap();
        u.record_daily("2026-03-06", DailyResult::Done, day("2026-03-06"))
            .unwrap();
        u.record_daily("2026-03-09", DailyResult::Done, day("2026-03-09"))
            .unwrap();
        assert_eq!((u.streak.count, u.longest_streak), (1, 2));
    }

    #[test]
    fn a_loss_ends_the_streak() {
        let mut u = user();
        u.record_daily("2026-03-05", DailyResult::Done, day("2026-03-05"))
            .unwrap();
        u.record_daily("2026-03-06", DailyResult::Failed, day("2026-03-06"))
            .unwrap();
        assert_eq!((u.streak.count, u.longest_streak), (0, 1));
        assert_eq!(u.daily.as_ref().unwrap().result, DailyResult::Failed);
    }

    #[test]
    fn the_first_result_of_a_day_wins() {
        let mut u = user();
        let today = day("2026-03-05");
        u.record_daily("2026-03-05", DailyResult::Failed, today)
            .unwrap();
        u.record_daily("2026-03-05", DailyResult::Done, today)
            .unwrap();
        assert_eq!(
            (u.streak.count, u.daily.as_ref().unwrap().result),
            (0, DailyResult::Failed)
        );
        // an older day can't overwrite a newer one either
        u.record_daily("2026-03-04", DailyResult::Done, today)
            .unwrap();
        assert_eq!(u.daily.as_ref().unwrap().date, "2026-03-05");
    }

    #[test]
    fn bad_dates_are_rejected() {
        let mut u = user();
        let today = day("2026-03-05");
        assert!(u.record_daily("nope", DailyResult::Done, today).is_err());
        assert!(u
            .record_daily("2026-03-08", DailyResult::Done, today)
            .is_err());
        assert!(u
            .record_daily("2026-03-01", DailyResult::Done, today)
            .is_err());
        assert!(u
            .record_daily("2026-03-06", DailyResult::Done, today)
            .is_ok());
    }

    #[test]
    fn a_longer_streak_from_the_device_is_adopted() {
        let mut u = user();
        let today = day("2026-03-09");
        u.record_daily("2026-03-09", DailyResult::Done, today)
            .unwrap();
        u.adopt_streak("2026-03-08", 9);
        assert_eq!(u.streak.count, 1);
        u.adopt_streak("2026-03-09", 9);
        assert_eq!((u.streak.count, u.longest_streak), (9, 9));
        u.adopt_streak("2026-03-09", 3);
        assert_eq!(u.streak.count, 9);
    }

    #[test]
    fn premium_stacks() {
        let mut u = user();
        u.grant_premium("Bob", 30, 1_000).unwrap();
        assert_eq!(u.premium_until, Some(1_000 + 30 * DAY_MS));
        u.grant_premium("Cy", 30, 1_000).unwrap();
        assert_eq!(u.premium_until, Some(1_000 + 60 * DAY_MS));
        assert_eq!(u.premium_from.as_deref(), Some("Cy"));
        assert!(u.grant_premium("Cy", 0, 0).is_err());
        assert!(u.grant_premium("Cy", MAX_PREMIUM_DAYS + 1, 0).is_err());
    }
}
