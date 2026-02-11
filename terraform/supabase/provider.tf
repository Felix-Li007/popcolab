terraform {
  required_version = ">= 1.2.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }

  #   backend "local" {
  #  path = "terraform.tfstate"
  #   }
}

provider "supabase" {
  access_token = var.access_token
}
