variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "agentpass"
}

variable "vpc_id" {
  description = "VPC ID for VPC Link"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC Link"
  type        = list(string)
}

variable "backend_alb_arn" {
  description = "ARN of the backend Application Load Balancer"
  type        = string
}

variable "backend_alb_dns" {
  description = "DNS name of the backend Application Load Balancer"
  type        = string
}

variable "domain_name" {
  description = "Domain name for API Gateway (optional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = ""
}