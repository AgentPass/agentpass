output "beanstalk_environment_endpoint" {
  description = "Elastic Beanstalk environment endpoint"
  value       = module.beanstalk.environment_endpoint
}

output "beanstalk_environment_name" {
  description = "Elastic Beanstalk environment name"
  value       = module.beanstalk.environment_name
}

output "beanstalk_environment_cname" {
  description = "Elastic Beanstalk environment CNAME"
  value       = module.beanstalk.environment_cname
}

output "beanstalk_application_name" {
  description = "Elastic Beanstalk application name"
  value       = module.beanstalk.application_name
}