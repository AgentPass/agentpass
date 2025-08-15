output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "web_public_sg_id" {
  description = "ID of public web security group"
  value       = module.security.web_public_sg_id
}

output "backend_sg_id" {
  description = "ID of backend security group"
  value       = module.security.backend_sg_id
}

output "database_sg_id" {
  description = "ID of database security group"
  value       = module.security.database_sg_id
}

output "beanstalk_elb_sg_id" {
  description = "ID of Beanstalk ELB security group"
  value       = module.security.beanstalk_elb_sg_id
}

output "vpc_link_sg_id" {
  description = "ID of VPC Link security group"
  value       = module.security.vpc_link_sg_id
}