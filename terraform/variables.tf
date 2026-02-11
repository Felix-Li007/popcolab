variable "supabase_access_token" {
  description = "Supabase access token for API authentication"
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "Supabase organization ID"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (development or production)"
  type        = string
  validation {
    condition     = contains(["development", "production"], var.environment)
    error_message = "Environment must be 'development' or 'production'."
  }
}

variable "supabase_project_name" {
  description = "Supabase project name"
  type        = string
  validation {
    condition     = length(var.supabase_project_name) >= 3 && length(var.supabase_project_name) <= 50
    error_message = "Project name must be between 3 and 50 characters."
  }
}

variable "supabase_db_password" {
  description = "Supabase database password (minimum 8 characters)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.supabase_db_password) >= 8
    error_message = "Database password must be at least 8 characters."
  }
}
