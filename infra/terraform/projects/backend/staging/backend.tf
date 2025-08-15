terraform {
  backend "s3" {
    bucket  = "agentpass-terraform-state"
    key     = "backend/staging/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}