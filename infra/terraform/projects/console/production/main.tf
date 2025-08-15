terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "agentpass-terraform-state"
    key    = "shared/production/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "agentpass-terraform-state"
    key    = "backend/production/terraform.tfstate"
    region = var.aws_region
  }
}

module "beanstalk" {
  source = "../modules/beanstalk"
  
  environment      = var.environment
  project_name     = var.project_name
  application_name = var.project_name
  
  vpc_id                = data.terraform_remote_state.shared.outputs.vpc_id
  public_subnet_ids     = data.terraform_remote_state.shared.outputs.public_subnet_ids
  private_subnet_ids    = data.terraform_remote_state.shared.outputs.private_subnet_ids
  security_group_id     = data.terraform_remote_state.shared.outputs.web_public_sg_id
  elb_security_group_id = data.terraform_remote_state.shared.outputs.beanstalk_elb_sg_id
  
  instance_type = var.instance_type
  min_instances = var.min_instances
  max_instances = var.max_instances
  
  backend_endpoint = data.terraform_remote_state.backend.outputs.beanstalk_environment_endpoint
  
  environment_variables = {
    REACT_APP_ENV = var.environment
  }
}