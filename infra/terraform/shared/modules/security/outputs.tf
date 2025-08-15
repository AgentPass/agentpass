output "web_public_sg_id" {
  description = "ID of public web security group"
  value       = aws_security_group.web_public.id
}

output "backend_sg_id" {
  description = "ID of backend security group"
  value       = aws_security_group.backend.id
}

output "database_sg_id" {
  description = "ID of database security group"
  value       = aws_security_group.database.id
}

output "beanstalk_elb_sg_id" {
  description = "ID of Beanstalk ELB security group"
  value       = aws_security_group.beanstalk_elb.id
}

output "vpc_link_sg_id" {
  description = "ID of VPC Link security group"
  value       = aws_security_group.vpc_link.id
}