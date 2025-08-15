terraform {
  backend "s3" {
    bucket  = "agentpass-terraform-state"
    key     = "shared/staging/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}