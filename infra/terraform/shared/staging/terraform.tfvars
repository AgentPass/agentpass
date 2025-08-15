aws_region           = "us-east-2"
environment          = "staging"
project_name         = "agentpass"
availability_zones   = ["us-east-2a", "us-east-2b"]

# Staging uses different CIDR blocks to avoid conflicts with production
vpc_cidr            = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]