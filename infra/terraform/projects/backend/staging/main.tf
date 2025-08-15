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
    key    = "shared/staging/terraform.tfstate"  # Points to staging shared infrastructure
    region = var.aws_region
  }
}

module "rds" {
  source = "../modules/rds"
  
  environment       = var.environment
  project_name      = var.project_name
  vpc_id            = data.terraform_remote_state.shared.outputs.vpc_id
  subnet_ids        = data.terraform_remote_state.shared.outputs.private_subnet_ids
  security_group_id = data.terraform_remote_state.shared.outputs.database_sg_id
  
  db_instance_class = var.db_instance_class
  db_password       = var.db_password
  
  # Staging-specific settings
  backup_retention_period = 3  # Less retention for staging
  allocated_storage       = 20 # Minimum for gp3 storage type
}

module "beanstalk" {
  source = "../modules/beanstalk"
  
  environment      = var.environment
  project_name     = var.project_name
  application_name = var.project_name
  
  vpc_id                = data.terraform_remote_state.shared.outputs.vpc_id
  subnet_ids            = data.terraform_remote_state.shared.outputs.private_subnet_ids
  elb_subnet_ids        = data.terraform_remote_state.shared.outputs.private_subnet_ids  # ALB in private subnets
  security_group_id     = data.terraform_remote_state.shared.outputs.backend_sg_id
  elb_security_group_id = data.terraform_remote_state.shared.outputs.backend_sg_id     # Use backend SG for internal ALB
  
  instance_type = var.instance_type
  min_instances = var.min_instances
  max_instances = var.max_instances
  
  is_public_facing = false  # CRITICAL: Must be false for isolation
  single_instance_mode = true  # Use single instance for staging (faster deployment)
  
  environment_variables = {
    DB_HOST     = module.rds.db_instance_address
    DB_PORT     = tostring(module.rds.db_instance_port)
    DB_NAME     = module.rds.db_name
    DB_USERNAME = "agentpass"
    NODE_ENV    = var.environment
    LOG_LEVEL   = "debug"  # More verbose logging for staging
  }
}