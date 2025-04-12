terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  required_version = ">= 1.0.0"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Terraform-AWS-Project"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
