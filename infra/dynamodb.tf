# One item per player, keyed by the lower-cased name (names are unique
# regardless of case). Holds infinite driving records, the last daily
# challenge result and the streaks. The scoreboard scans it, which is fine
# for a table this small; add a GSI before it grows past a few thousand rows.
resource "aws_dynamodb_table" "users" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "name_key"

  attribute {
    name = "name_key"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  deletion_protection_enabled = var.stage == "prod"
}
