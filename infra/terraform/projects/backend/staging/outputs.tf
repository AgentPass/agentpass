output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "db_instance_address" {
  description = "RDS instance address"
  value       = module.rds.db_instance_address
}

output "beanstalk_environment_endpoint" {
  description = "Elastic Beanstalk environment endpoint"
  value       = module.beanstalk.environment_endpoint
}

output "beanstalk_environment_name" {
  description = "Elastic Beanstalk environment name"
  value       = module.beanstalk.environment_name
}

output "beanstalk_application_name" {
  description = "Elastic Beanstalk application name"
  value       = module.beanstalk.application_name
}