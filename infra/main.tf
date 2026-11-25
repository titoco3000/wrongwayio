locals {
  suffix      = "-${var.stage}"
  api_name    = "${var.project}${local.suffix}"
  lambda_name = "${var.project}-api${local.suffix}"
  role_name   = "${var.project}-api-role${local.suffix}"
  table_name  = "${var.project}-users${local.suffix}"
}

# Placeholder code package. The real Rust binary is pushed by
# `cd backend && make deploy <stage>`, so terraform ignores code changes below.
data "archive_file" "placeholder" {
  type             = "zip"
  source_file      = "${path.module}/placeholder/bootstrap"
  output_file_mode = "0755"
  output_path      = "${path.module}/placeholder/bootstrap.zip"
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# The account only lets this user create roles under /app/ that carry the
# tito-boundary permissions boundary (IAM policy tito-roles).
resource "aws_iam_role" "lambda" {
  name                 = local.role_name
  path                 = "/app/"
  permissions_boundary = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/tito-boundary"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "users_table" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Scan"]
    resources = [aws_dynamodb_table.users.arn]
  }
}

resource "aws_iam_role_policy" "api_users_table" {
  name   = "users-table"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.users_table.json
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.lambda_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name = local.lambda_name
  role          = aws_iam_role.lambda.arn
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  architectures = [var.lambda_architecture]
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_s

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  environment {
    variables = {
      STAGE          = var.stage
      RUST_LOG       = "info"
      RUST_BACKTRACE = "1"
      TABLE_NAME     = aws_dynamodb_table.users.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.api_users_table,
  ]

  # Code is owned by the backend deploy, not terraform.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.api_name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId  = "$context.requestId"
      httpMethod = "$context.httpMethod"
      path       = "$context.path"
      status     = "$context.status"
      latency    = "$context.responseLatency"
    })
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway${local.suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
