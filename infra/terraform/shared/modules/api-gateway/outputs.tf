output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_gateway_invoke_url" {
  description = "Invoke URL for the API Gateway stage"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "vpc_link_id" {
  description = "ID of the VPC Link"
  value       = aws_api_gateway_vpc_link.main.id
}

output "api_gateway_domain_name" {
  description = "Custom domain name for API Gateway"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].domain_name : ""
}

output "api_gateway_cloudfront_domain_name" {
  description = "CloudFront domain name for API Gateway custom domain"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].regional_domain_name : ""
}

output "api_gateway_cloudfront_zone_id" {
  description = "CloudFront zone ID for API Gateway custom domain"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].regional_zone_id : ""
}