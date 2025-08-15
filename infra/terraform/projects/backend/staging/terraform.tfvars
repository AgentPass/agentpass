aws_region        = "us-east-2"
environment       = "staging"
project_name      = "backend"

# Smaller resources for staging to save costs
db_instance_class = "db.t3.micro"
instance_type     = "t3.micro"  # Smaller than production
min_instances     = 1
max_instances     = 1            # Single instance for staging