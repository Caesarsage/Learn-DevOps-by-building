output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "web_server_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_eip.web.public_ip
}

output "web_server_url" {
  description = "URL to access the web server"
  value       = "http://${aws_eip.web.public_ip}"
}

output "database_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.default.endpoint
}

output "database_name" {
  description = "Name of the database"
  value       = aws_db_instance.default.db_name
}

# output "private_key" {
#   value = tls_private_key.web_key.private_key_pem
#   sensitive = true
# }
