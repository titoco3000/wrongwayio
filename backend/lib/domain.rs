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

/// Gears in the order `User::driving_high_scores` keeps them.
pub const GEARS: [char; 6] = ['1', '2', '3', '4', '5', 'R'];

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DailyResult {
    Done,
    Failed,
}

/// A player, as stored: one DynamoDB item.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct User {
    /// The table's partition key, so it keeps the name infra/dynamodb.tf gives it.
    #[serde(rename = "name_key")]
    pub name_key: String,
    pub name: String,
    pub premium_from: Option<String>,
    /// epoch ms when the premium pass runs out
    pub premium_until: Option<i64>,
    /// epoch ms
    pub created_at: i64,
    /// First day (YYYY-MM-DD) of the running streak; `None` when there is none.
    pub current_streak_start: Option<String>,
    /// The player's local day (YYYY-MM-DD) of the last daily challenge played, won or lost.
    pub last_streak_checkin: Option<String>,
    pub largest_streak: u32,
    /// Best score in each gear, in the order of [`GEARS`]: 1, 2, 3, 4, 5, R.
    pub driving_high_scores: [u32; 6],
    /// Most games won in a row in marathon mode.
    pub marathon_high_score: u32,
}

const DAY_MS: i64 = 24 * 60 * 60 * 1000;
pub const MAX_PREMIUM_DAYS: u32 = 365;
const MAX_STREAK: u32 = 10_000;

fn parse_date(date: &str) -> Result<NaiveDate, ApiError> {
    NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .map_err(|_| ApiError::Invalid("date must be YYYY-MM-DD"))
}

fn format_date(day: NaiveDate) -> String {
    day.format("%Y-%m-%d").to_string()
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

    /// Best score over all gears.
    pub fn best_score(&self) -> u32 {
        self.driving_high_scores.iter().copied().max().unwrap_or(0)
    }

    /// Days won in the running streak, 0 after a loss.
    pub fn streak_count(&self) -> u32 {
        let start = self.current_streak_start.as_deref().map(parse_date);
        let last = self.last_streak_checkin.as_deref().map(parse_date);
        match (start, last) {
            (Some(Ok(start)), Some(Ok(last))) if last >= start => {
                u32::try_from((last - start).num_days() + 1).unwrap_or(MAX_STREAK)
            }
            _ => 0,
        }
    }

    /// Keeps the best of each gear. Returns whether anything changed.
    pub fn merge_scores(&mut self, other: &[u32; 6]) -> bool {
        let before = self.driving_high_scores;
        for (mine, theirs) in self.driving_high_scores.iter_mut().zip(*other) {
            *mine = (*mine).max(theirs);
        }
        self.driving_high_scores != before
    }

    /// Keeps the best marathon score. Returns whether anything changed.
    pub fn merge_marathon(&mut self, score: u32) -> bool {
        let changed = score > self.marathon_high_score;
        self.marathon_high_score = self.marathon_high_score.max(score);
        changed
    }

    /// Records the result of the daily challenge played on `date`.
    ///
    /// The first result of a day counts; later ones for the same (or an
    /// earlier) day are ignored, so replays and retried requests change
    /// nothing. A win on the day after the last check-in extends the streak, a
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
        let last = self.last_streak_checkin.as_deref().map(parse_date);
        if let Some(Ok(last)) = last {
            if last >= day {
                return Ok(());
            }
        }
        match result {
            DailyResult::Done => {
                let continues = self.current_streak_start.is_some()
                    && matches!(last, Some(Ok(last)) if last + Duration::days(1) == day);
                if !continues {
                    self.current_streak_start = Some(date.to_string());
                }
                self.largest_streak = self.largest_streak.max(
                    u32::try_from(
                        (day - parse_date(self.current_streak_start.as_deref().unwrap_or(date))?)
                            .num_days()
                            + 1,
                    )
                    .unwrap_or(MAX_STREAK),
                );
            }
            DailyResult::Failed => self.current_streak_start = None,
        }
        self.last_streak_checkin = Some(date.to_string());
        Ok(())
    }

    /// A streak of `count` wins ending on `date`, brought from the player's device (e.g. earned as a guest).
    /// Only applies when it ends on the last check-in and beats the one kept here.
    pub fn adopt_streak(&mut self, date: &str, count: u32) {
        if self.last_streak_checkin.as_deref() != Some(date)
            || self.current_streak_start.is_none()
            || count <= self.streak_count()
        {
            return;
        }
        let Ok(day) = parse_date(date) else { return };
        let count = count.min(MAX_STREAK);
        self.current_streak_start = Some(format_date(day - Duration::days(i64::from(count) - 1)));
        self.largest_streak = self.largest_streak.max(count);
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
        assert!(item.contains_key("largestStreak"));
        assert!(!item.contains_key("version"));
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
    fn scores_keep_the_best_of_each_gear() {
        let mut u = user();
        u.driving_high_scores = [4, 0, 0, 0, 0, 0];
        let b = [1, 0, 6, 0, 0, 0];
        assert!(u.merge_scores(&b));
        assert_eq!(u.driving_high_scores, [4, 0, 6, 0, 0, 0]);
        assert_eq!(u.best_score(), 6);
        assert!(!u.merge_scores(&b));
    }

    #[test]
    fn marathon_keeps_the_best() {
        let mut u = user();
        assert!(u.merge_marathon(4));
        assert!(!u.merge_marathon(3));
        assert_eq!(u.marathon_high_score, 4);
    }

    #[test]
    fn streak_grows_on_consecutive_wins() {
        let mut u = user();
        let today = day("2026-03-10");
        u.record_daily("2026-03-09", DailyResult::Done, today)
            .unwrap();
        u.record_daily("2026-03-10", DailyResult::Done, today)
            .unwrap();
        assert_eq!((u.streak_count(), u.largest_streak), (2, 2));
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
        assert_eq!((u.streak_count(), u.largest_streak), (1, 2));
    }

    #[test]
    fn a_loss_ends_the_streak() {
        let mut u = user();
        u.record_daily("2026-03-05", DailyResult::Done, day("2026-03-05"))
            .unwrap();
        u.record_daily("2026-03-06", DailyResult::Failed, day("2026-03-06"))
            .unwrap();
        assert_eq!((u.streak_count(), u.largest_streak), (0, 1));
        assert_eq!(u.last_streak_checkin.as_deref(), Some("2026-03-06"));
    }

    #[test]
    fn the_first_result_of_a_day_wins() {
        let mut u = user();
        let today = day("2026-03-05");
        u.record_daily("2026-03-05", DailyResult::Failed, today)
            .unwrap();
        u.record_daily("2026-03-05", DailyResult::Done, today)
            .unwrap();
        assert_eq!(u.streak_count(), 0);
        // an older day can't overwrite a newer one either
        u.record_daily("2026-03-04", DailyResult::Done, today)
            .unwrap();
        assert_eq!(u.last_streak_checkin.as_deref(), Some("2026-03-05"));
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
        assert_eq!(u.streak_count(), 1);
        u.adopt_streak("2026-03-09", 9);
        assert_eq!((u.streak_count(), u.largest_streak), (9, 9));
        u.adopt_streak("2026-03-09", 3);
        assert_eq!(u.streak_count(), 9);
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
