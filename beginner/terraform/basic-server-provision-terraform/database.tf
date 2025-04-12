# Create DB subnet group
resource "aws_db_subnet_group" "default" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.environment}-db-subnet-group"
  }
}

# Create RDS parameter group
resource "aws_db_parameter_group" "default" {
  name   = "${var.environment}-mysql-params"
  family = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8"
  }

  parameter {
    name  = "character_set_client"
    value = "utf8"
  }

  tags = {
    Name = "${var.environment}-mysql-params"
  }
}

# Create RDS instance
resource "aws_db_instance" "default" {
  allocated_storage       = 10
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"  # Change from db.t2.micro to db.t3.micro
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  parameter_group_name    = aws_db_parameter_group.default.name
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  multi_az                = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  skip_final_snapshot     = true
  storage_encrypted       = false

  tags = {
    Name = "${var.environment}-mysql-rds"
  }
}
