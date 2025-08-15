variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "application_name" {
  description = "Elastic Beanstalk application name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for deployment"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for EC2 instances"
  type        = list(string)
}

variable "elb_subnet_ids" {
  description = "Subnet IDs for load balancer"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "elb_security_group_id" {
  description = "Security group ID for load balancer"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 2
}

variable "solution_stack_name" {
  description = "Elastic Beanstalk solution stack name"
  type        = string
  default     = "64bit Amazon Linux 2023 v4.6.3 running Docker"
}

variable "environment_variables" {
  description = "Environment variables for the application"
  type        = map(string)
  default     = {}
}

variable "is_public_facing" {
  description = "Whether the load balancer should be internet-facing (should be false for backend isolation)"
  type        = bool
  default     = false
}

variable "single_instance_mode" {
  description = "Whether to deploy as a single instance without load balancer (faster for staging)"
  type        = bool
  default     = false
}