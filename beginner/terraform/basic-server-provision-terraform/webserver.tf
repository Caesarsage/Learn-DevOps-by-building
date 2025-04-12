# Get the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create key-pair for web server
resource "aws_key_pair" "web_key" {
  key_name   = "my-key-pair"
  public_key = tls_private_key.web_key.public_key_openssh
}

resource "tls_private_key" "web_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Create EC2 instance for web server
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.web_key.key_name

  user_data = <<-EOF
    #!/bin/bash
    # Update system packages
    yum update -y

    # Install Apache web server and PHP
    yum install -y httpd mysql php php-mysql

    # Start and enable Apache
    systemctl start httpd
    systemctl enable httpd

    # Create a simple info page
    cat > /var/www/html/index.php << 'HEREDOC'
    <!DOCTYPE html>
    <html>
    <head>
      <title>Terraform AWS Project</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
        }
        h1 {
          color: #333366;
        }
        .info {
          background-color: #f0f0f0;
          padding: 20px;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <h1>Hello from Terraform!</h1>
      <div class="info">
        <h2>Server Information:</h2>
        <p>Server IP: <?php echo $_SERVER['SERVER_ADDR']; ?></p>
        <p>Client IP: <?php echo $_SERVER['REMOTE_ADDR']; ?></p>
        <p>Server Software: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Date/Time: <?php echo date('Y-m-d H:i:s'); ?></p>
      </div>
      <h2>Environment: ${var.environment}</h2>
    </body>
    </html>
    HEREDOC

    # Set proper permissions
    chown apache:apache /var/www/html/index.php

    # Create a test connection file
    cat > /var/www/html/dbtest.php << 'HEREDOC'
    <?php
    $host = '${aws_db_instance.default.address}';
    $username = '${var.db_username}';
    $password = '${var.db_password}';
    $database = '${var.db_name}';

    try {
      $conn = new PDO("mysql:host=$host;dbname=$database", $username, $password);
      $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      echo "Connected to the database successfully!";
    } catch(PDOException $e) {
      echo "Connection failed: " . $e->getMessage();
    }
    ?>
    HEREDOC

    # Set proper permissions
    chown apache:apache /var/www/html/dbtest.php
  EOF

  root_block_device {
    volume_size = 10
    volume_type = "gp2"
    encrypted   = true

    tags = {
      Name = "${var.environment}-web-server-volume"
    }
  }

  tags = {
    Name = "${var.environment}-web-server"
  }

  depends_on = [aws_db_instance.default]
}

# Create Elastic IP for web server
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  vpc      = true

  tags = {
    Name = "${var.environment}-web-eip"
  }
}
