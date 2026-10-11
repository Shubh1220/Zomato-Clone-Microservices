variable "region" {
  description = "AWS region to deploy this."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for resource names. Also the ECR namespace: repositories are named <project_name>/<service>, matching the Helm chart's image names."
  type        = string
  default     = "tastygo"
}

variable "environment" {
  description = "Environment label, used in names and tags."
  type        = string
  default     = "dev"
}

variable "cluster_version" {
  description = "EKS Kubernetes version. Check which versions EKS currently supports before applying; old versions are retired by AWS."
  type        = string
  default     = "1.36"
}

variable "vpc_cidr" {
  description = "VPC CIDR Subnet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to spread across (2 or 3)."
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "One shared NAT gateway (cheaper, single point of failure) vs one per AZ (resilient, ~2x the NAT cost)."
  type        = bool
  default     = true
}

variable "nodegroup" {
  description = "Settings for the EKS managed node group"

  type = object({
    instance_type = string
    min_size      = number
    max_size      = number
    desired_size  = number
    vol_size_gb   = number
  })

  default = {
    instance_type = "m7i-flex.large"
    min_size      = 2
    max_size      = 4
    desired_size  = 2
    vol_size_gb   = 30
  }
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDRs allowed to reach the public Kubernetes API endpoint. Default is open to the internet (still IAM-authenticated); restrict to your IP or CI egress range, e.g. [\"203.0.113.10/32\"]."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "jenkins_role_arn" {
  description = "Optional IAM role/user ARN that Jenkins will use to deploy. If set, it is granted cluster-admin through an EKS access entry. Leave empty until the CI/CD phase."
  type        = string
  default     = ""
}

variable "ecr_service_names" {
  description = "One ECR repository is created per name."
  type        = list(string)
  default     = ["gateway", "user-service", "product-service", "order-service", "frontend"]
}

variable "ecr_image_tag_mutability" {
  description = "MUTABLE allows re-pushing a tag such as latest. Switch to IMMUTABLE once the pipeline only pushes unique tags (build number / git SHA)."
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.ecr_image_tag_mutability)
    error_message = "Must be MUTABLE or IMMUTABLE."
  }
}

variable "ecr_keep_last_images" {
  description = "Lifecycle policy: keep only this many most recent images per repository."
  type        = number
  default     = 20
}

variable "ecr_force_delete" {
  description = "Allow terraform destroy to delete repositories that still contain images."
  type        = bool
  default     = false
}
