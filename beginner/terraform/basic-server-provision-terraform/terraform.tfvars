aws_region          = "us-east-1"
vpc_cidr            = "10.0.0.0/16"
public_subnet_cidr  = "10.0.1.0/24"
private_subnet_cidr = "10.0.2.0/24"
availability_zone   = "us-east-1a"
additional_az       = "us-east-1b"
instance_type       = "t2.micro"
db_instance_class   = "db.t2.micro"
db_name             = "mydb"
db_username         = "admin"
db_password         = "YourSecurePassword123!" # Use a strong password
environment         = "dev"
