variable "project" {
  description = "Project name, used as a resource name prefix."
  type        = string
  default     = "wrongwayio"
}

variable "stage" {
  description = "Deployment stage. Must match the terraform workspace."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.stage)
    error_message = "stage must be one of: dev, prod."
  }
}

variable "region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "lambda_memory_mb" {
  description = "Lambda memory size in MB."
  type        = number
  default     = 128
}

variable "lambda_timeout_s" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 10
}

variable "lambda_architecture" {
  description = "Lambda CPU architecture. Must match what the backend builds."
  type        = string
  default     = "arm64"

  validation {
    condition     = contains(["arm64", "x86_64"], var.lambda_architecture)
    error_message = "lambda_architecture must be arm64 or x86_64."
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention for the lambda and the API."
  type        = number
  default     = 14
}

variable "point_in_time_recovery" {
  description = "Enable DynamoDB point-in-time recovery on the users table."
  type        = bool
  default     = false
}
