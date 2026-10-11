module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = local.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access       = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # Whoever runs `terraform apply` becomes cluster admin via an access entry.
  enable_cluster_creator_admin_permissions = true

  # EKS-managed add-ons. The EBS CSI driver is declared separately in iam.tf
  # because it needs an IAM role that depends on this module's OIDC provider
  # (declaring it here would create a dependency cycle).
  cluster_addons = {
    coredns        = { most_recent = true }
    kube-proxy     = { most_recent = true }
    vpc-cni        = { most_recent = true }
    metrics-server = { most_recent = true } # needed by the HPAs
  }

  eks_managed_node_groups = {
    default = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = [var.nodegroup.instance_type]
      min_size       = var.nodegroup.min_size
      desired_size   = var.nodegroup.desired_size
      max_size       = var.nodegroup.max_size
      disk_size      = var.nodegroup.vol_size_gb
    }
  }

  # Optional: let the Jenkins deploy identity run helm/kubectl (CI/CD phase).
  access_entries = var.jenkins_role_arn == "" ? {} : {
    jenkins = {
      principal_arn = var.jenkins_role_arn
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }
}
