aws_region    = "us-east-2"
environment   = "staging"
project_name  = "console"

# Single instance for staging to save costs
instance_type = "t3.micro"
min_instances = 1
max_instances = 1