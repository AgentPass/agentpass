terraform {
  backend "s3" {
    bucket  = "agentpass-terraform-state"
    key     = "console/staging/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}