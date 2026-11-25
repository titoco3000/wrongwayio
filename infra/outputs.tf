output "api_url" {
  description = "Public HTTP API base URL."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  description = "Lambda the backend deploy pushes code to."
  value       = aws_lambda_function.api.function_name
}

output "table_name" {
  description = "DynamoDB table holding the players."
  value       = aws_dynamodb_table.users.name
}

output "region" {
  description = "AWS region the stack lives in."
  value       = var.region
}

output "backend_env_file" {
  description = "Contents of backend/.env.<stage> (make output writes it)."
  value       = <<-EOT
    LAMBDA_FUNCTION_NAME=${aws_lambda_function.api.function_name}
    API_URL=${aws_apigatewayv2_stage.default.invoke_url}
    TABLE_NAME=${aws_dynamodb_table.users.name}
  EOT
}

output "frontend_bucket" {
  description = "S3 bucket the frontend deploy syncs the built site into."
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_distribution_id" {
  description = "CloudFront distribution the frontend deploy invalidates."
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_url" {
  description = "Public URL of the website."
  value       = local.frontend_url
}

output "frontend_env_file" {
  description = "Contents of frontend/.env.<stage> (make output writes it)."
  value       = <<-EOT
    API_URL=${aws_apigatewayv2_stage.default.invoke_url}
    FRONTEND_BUCKET=${aws_s3_bucket.frontend.bucket}
    FRONTEND_DISTRIBUTION_ID=${aws_cloudfront_distribution.frontend.id}
    FRONTEND_URL=${local.frontend_url}
  EOT
}
