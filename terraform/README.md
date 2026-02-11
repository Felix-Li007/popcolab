# Terraform Setup and Usage Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- Git
- Your preferred CLI/Terminal
- Admin/sudo privileges (for installation)

## Installation

### Windows (using Chocolatey)

If you have Chocolatey installed, run:

```bash
choco install terraform -y
```

If you prefer manual installation:

1. Download Terraform from [terraform.io/downloads](https://www.terraform.io/downloads)
2. Extract the executable to a folder
3. Add the folder to your system PATH

### macOS (using Homebrew)

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

### Linux (Ubuntu/Debian)

```bash
wget https://apt.releases.hashicorp.com/gpg
sudo apt-key add gpg
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

### Verify Installation

```bash
terraform version
```

You should see the Terraform version number displayed.

---

## Project Setup

### 1. Initialize Terraform

Navigate to the `terraform/` directory and initialize it:

```bash
cd terraform/
terraform init
```

This downloads the necessary provider plugins and sets up the backend.

### 2. Create Workspaces

Terraform workspaces allow you to manage multiple environments (dev, prod) separately:

```bash
# Create and select the dev workspace
terraform workspace new dev
terraform workspace select dev

# Create the prod workspace (optional)
terraform workspace new prod
```

### 3. List Available Workspaces

```bash
terraform workspace list
```

---

## Deploying Infrastructure

### Development Environment

Navigate to the `terraform/` directory and run:

```bash
# Switch to dev workspace
terraform workspace select dev

# Preview changes
terraform plan -var-file="dev.tfvars"

# Apply changes
terraform apply -var-file="dev.tfvars"
```

### Production Environment

```bash
# Switch to prod workspace
terraform workspace select prod

# Preview changes
terraform plan -var-file="prod.tfvars"

# Apply changes
terraform apply -var-file="prod.tfvars"
```

---

## Common Commands

### Plan

Review what Terraform will create/modify without applying:

```bash
terraform plan -var-file="dev.tfvars"
```

### Apply

Create or update infrastructure:

```bash
terraform apply -var-file="dev.tfvars"
```

### Destroy

Remove all infrastructure:

```bash
terraform destroy -var-file="dev.tfvars"
```

### Destroy Specific Resources

To destroy only specific resources:

```bash
terraform destroy -target=resource_type.resource_name -var-file="dev.tfvars"
```

Example (Supabase project):

```bash
terraform destroy -target=supabase_project.main -var-file="dev.tfvars"
```

### View State

```bash
terraform state list
terraform state show <resource_name>
```

---

## Workspace Management

### Switch Between Workspaces

```bash
terraform workspace select dev
terraform workspace select prod
```

### Delete a Workspace

```bash
terraform workspace delete <workspace_name>
```

---

## Best Practices

1. **Always plan before apply**: Run `terraform plan` to review changes first
2. **Use separate var files**: Keep `dev.tfvars` and `prod.tfvars` distinct
3. **Commit state backups**: Check `.tfstate.backup` files into version control
4. **Document changes**: Include context when committing Terraform files
5. **Review state files**: Regular reviews help catch drift between expected and actual state

---

## Troubleshooting

### "terraform: command not found"

- Verify installation: `terraform version`
- Add Terraform to your PATH if it's not recognized

### "Error: No configuration files"

- Ensure you're in the `terraform/` directory
- Check that `.tf` files exist in the directory

### "Error: workspace already exists"

- The workspace already exists, use `terraform workspace select` instead of `new`

### "No changes. Infrastructure is up to date"

- Your infrastructure matches the Terraform configuration, no updates needed

### State Lock Issues

- If Terraform gets stuck, check `.terraform.lock.hcl` file
- Use `terraform force-unlock` if necessary (use with caution)

---

## Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform CLI Reference](https://www.terraform.io/cli)
- [Provider Documentation](https://registry.terraform.io)
