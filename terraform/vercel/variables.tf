
variable "api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}


variable "project_name" {
  description = "Vercel project name"
  type        = string
  validation {
    condition     = length(var.project_name) >= 3 && length(var.project_name) <= 50
    error_message = "Project name must be between 3 and 50 characters."
  }
}

variable "database_url" {
  description = "Database URL for the project"
  type        = string
  sensitive   = true
}


variable "clerk_publishable_key" {
  description = "Clerk publishable key for the project"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment for the project (e.g., development, preview, production)"
  type        = string
  validation {
    condition     = contains(["development", "preview", "production"], var.environment)
    error_message = "Environment must be 'development', 'preview', or 'production'."
  }
}
