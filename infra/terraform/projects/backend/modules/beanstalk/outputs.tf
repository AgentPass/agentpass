output "application_name" {
  description = "Elastic Beanstalk application name"
  value       = aws_elastic_beanstalk_application.app.name
}

output "environment_name" {
  description = "Elastic Beanstalk environment name"
  value       = aws_elastic_beanstalk_environment.env.name
}

output "environment_id" {
  description = "Elastic Beanstalk environment ID"
  value       = aws_elastic_beanstalk_environment.env.id
}

output "environment_endpoint" {
  description = "Elastic Beanstalk environment endpoint URL"
  value       = aws_elastic_beanstalk_environment.env.endpoint_url
}

output "environment_cname" {
  description = "Elastic Beanstalk environment CNAME"
  value       = aws_elastic_beanstalk_environment.env.cname
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_elastic_beanstalk_environment.env.load_balancers[0]
}