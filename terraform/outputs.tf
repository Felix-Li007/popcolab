output "supabase_project_id" {
  description = "Supabase project ID"
  value       = module.supabase.project_id
}


output "environment" {
  description = "Environment name"
  value       = var.environment
}
