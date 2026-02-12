variable "organization_id" {
  description = "Supabase organization ID"
  type        = string
  sensitive   = true
}
variable "access_token" {
  description = "Supabase access token for authentication"
  type        = string
  sensitive   = true
}


variable "project_name" {
  description = "Supabase project name"
  type        = string
  validation {
    condition     = length(var.project_name) >= 3 && length(var.project_name) <= 50
    error_message = "Project name must be between 3 and 50 characters."
  }
}

variable "db_password" {
  description = "Supabase database password (minimum 8 characters)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters."
  }
}

variable "region_id" {
  description = "Supabase region"
  type        = string
  default     = "ca-central-1"
}
