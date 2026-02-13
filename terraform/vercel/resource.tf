resource "vercel_project" "next-app" {
  name      = var.project_name
  framework = "nextjs"
}

resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.next-app.id
  key        = "DATABASE_URL"
  value      = var.database_url
  target     = [var.environment]
}
resource "vercel_project_environment_variable" "clerk_publishable_key" {
  project_id = vercel_project.next-app.id
  key        = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  value      = var.clerk_publishable_key
  target     = [var.environment]
}
