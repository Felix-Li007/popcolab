terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "vercel" {
  api_token = var.api_token
}
