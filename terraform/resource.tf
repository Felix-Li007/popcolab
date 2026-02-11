module "supabase" {
  source = "./supabase"

  organization_id = var.supabase_organization_id
  project_name    = var.supabase_project_name
  db_password     = var.supabase_db_password
  access_token    = var.supabase_access_token
  region_id       = "ca-central-1"
  environment     = var.environment
}
