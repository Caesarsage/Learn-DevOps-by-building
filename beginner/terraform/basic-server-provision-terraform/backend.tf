terraform {
  backend "s3" {
    bucket         = "infra-c-terraform-state"
    key            = "terraform-aws-project/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
