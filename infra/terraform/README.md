# AgentPass Infrastructure

Terraform infrastructure for AgentPass applications with complete backend isolation and API Gateway.

## Architecture Overview

```
Internet → API Gateway → VPC Link → Private ALB → Backend (Private Subnets)
                                          ↓
                                    PostgreSQL (Private Subnets)
                           
Internet → Public ALB → Frontend (Public/Private Subnets)
```

## Security Features

### Backend Isolation
- **Private ALB**: Backend load balancer is internal-only (not internet-facing)
- **VPC Link**: API Gateway connects to backend via secure VPC Link
- **Security Groups**: Backend only accepts traffic from VPC Link security group
- **Private Subnets**: Backend and database are in private subnets with no direct internet route
- **No Public IPs**: Backend instances have no public IP addresses

### API Gateway Benefits
- **DDoS Protection**: AWS Shield Standard included
- **Rate Limiting**: Configure throttling per API key
- **Authentication**: Support for Cognito, Lambda authorizers, API keys
- **Request Validation**: Validate requests before they reach backend
- **Monitoring**: CloudWatch metrics and X-Ray tracing enabled
- **WAF Integration**: Can add AWS WAF for additional protection

## Directory Structure

```
terraform/
├── projects/
│   ├── backend/
│   │   ├── production/       # Production backend
│   │   ├── staging/          # Staging backend
│   │   └── modules/          # Reusable modules
│   └── console/
│       ├── production/       # Production frontend
│       ├── staging/          # Staging frontend
│       └── modules/          # Reusable modules
├── shared/
│   ├── production/           # Production VPC and security
│   ├── staging/              # Staging VPC and security
│   └── modules/
│       ├── vpc/              # Network infrastructure
│       ├── security/         # Security groups
│       └── api-gateway/      # API Gateway with VPC Link
└── global/
    └── providers.tf
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0
3. S3 bucket for state storage: `agentpass-terraform-state` (see setup instructions at the bottom)

## Deployment Order

### Production Deployment

Deploy production infrastructure in this order:

1. **Shared Infrastructure** (VPC, Security Groups)
   ```bash
   cd shared/production
   terraform init
   terraform plan
   terraform apply
   ```

2. **Backend Application** (backend with RDS)
   ```bash
   cd projects/backend/production
   terraform init
   terraform plan -var="db_password=YOUR_SECURE_PASSWORD"
   terraform apply -var="db_password=YOUR_SECURE_PASSWORD"
   ```

3. **Frontend Application** (console)
   ```bash
   cd projects/console/production
   terraform init
   terraform plan
   terraform apply
   ```

### Staging Deployment

Deploy staging infrastructure (completely isolated from production):

1. **Shared Infrastructure** (Separate VPC with different CIDR)
   ```bash
   cd shared/staging
   terraform init
   terraform plan
   terraform apply
   ```

2. **Backend Application** (Smaller instances for cost savings)
   ```bash
   cd projects/backend/staging
   terraform init
   terraform plan -var="db_password=YOUR_STAGING_PASSWORD"
   terraform apply -var="db_password=YOUR_STAGING_PASSWORD"
   ```

3. **Frontend Application** (Single instance configuration)
   ```bash
   cd projects/console/staging
   terraform init
   terraform plan
   terraform apply
   ```

## Network Architecture

### Production VPC
- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24 (NAT Gateways, Public ALBs)
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24 (Backend, Database)

### Staging VPC (Completely Isolated)
- **VPC CIDR**: 10.2.0.0/16 (different from production)
- **Public Subnets**: 10.2.1.0/24, 10.2.2.0/24
- **Private Subnets**: 10.2.10.0/24, 10.2.11.0/24
- **Complete isolation**: No peering or connection to production

### Traffic Flow
1. **API Requests**: Client → API Gateway → VPC Link → Private ALB → Backend
2. **Frontend**: Client → Public ALB → Frontend instances
3. **Outbound**: Private instances → NAT Gateway → Internet

## Applications

### console (Frontend)
- **Deployment**: Elastic Beanstalk
- **Load Balancer**: Public-facing ALB
- **Subnets**: Deployed across public and private subnets
- **Instance Type**: t3.micro
- **Auto-scaling**: 1-2 instances

### backend (Backend API)
- **Deployment**: Elastic Beanstalk with Docker
- **Load Balancer**: Internal ALB (not internet-facing)
- **Subnets**: Private subnets only
- **Instance Type**: t3.small
- **Auto-scaling**: 1-2 instances
- **Access**: Only via API Gateway VPC Link

### PostgreSQL RDS
- **Deployment**: Multi-AZ capable
- **Subnets**: Private subnets only
- **Instance Type**: db.t3.micro
- **Access**: Only from backend security group
- **Features**: Automated backups, encryption enabled

### API Gateway
- **Type**: Regional REST API
- **Connection**: VPC Link to private ALB
- **Features**: Request validation, throttling, monitoring
- **Authentication**: Ready for Cognito/Lambda authorizers

## Security Groups

### VPC Link Security Group
- **Ingress**: Managed by AWS for API Gateway
- **Egress**: All traffic allowed

### Backend Security Group
- **Ingress**: Port 80/8080 from VPC Link SG only
- **Egress**: All traffic allowed

### Database Security Group
- **Ingress**: Port 5432 from Backend SG only
- **Egress**: All traffic allowed

### Frontend Security Group
- **Ingress**: Port 80/443 from internet
- **Egress**: All traffic allowed

## Testing Backend Isolation

```bash
# This will FAIL (backend is isolated)
curl http://internal-backend-alb-xxxxx.us-east-2.elb.amazonaws.com

# This will SUCCEED (through API Gateway)
curl https://xxx.execute-api.us-east-2.amazonaws.com/production/api/health

# From EC2 in public subnet (will FAIL - security group blocks)
curl http://internal-backend-alb-xxxxx.us-east-2.elb.amazonaws.com
```

## Environment Comparison

### Resource Specifications

| Component | Production | Staging | Cost Difference |
|-----------|------------|---------|-----------------|
| Backend Instances | t3.small (1-2) | t3.micro (1) | ~50% less |
| Frontend Instances | t3.micro (1-2) | t3.micro (1) | ~50% less |
| RDS Instance | db.t3.micro | db.t3.micro | Same |
| RDS Storage | 20 GB | 10 GB | 50% less |
| RDS Backup Retention | 7 days | 3 days | Less storage cost |
| Auto-scaling | 1-2 instances | 1 instance | Fixed single instance |

### Cost Estimates

#### Production Environment
| Component | Monthly Cost |
|-----------|--------------|
| VPC | Free |
| NAT Gateway (2x) | ~$90 |
| API Gateway | ~$3.50/million requests |
| VPC Link | $10 |
| Private ALB | $16 |
| Public ALB | $16 |
| RDS db.t3.micro | ~$15 |
| Beanstalk t3.small (1-2) | ~$15-30 |
| Beanstalk t3.micro (1-2) | ~$8-16 |
| **Total Estimate** | **~$175-200/month** |

#### Staging Environment
| Component | Monthly Cost |
|-----------|--------------|
| VPC | Free |
| NAT Gateway (2x) | ~$90 |
| API Gateway | ~$3.50/million requests |
| VPC Link | $10 |
| Private ALB | $16 |
| Public ALB | $16 |
| RDS db.t3.micro | ~$12 (less storage) |
| Beanstalk t3.micro (1) | ~$8 |
| Beanstalk t3.micro (1) | ~$8 |
| **Total Estimate** | **~$160/month** |

**Total for Both Environments**: ~$335-360/month

## Customization

Edit `terraform.tfvars` files in each environment to customize:
- Instance types and counts
- AWS region
- Database size
- Auto-scaling parameters

## Managing Multiple Environments

### Key Design Decisions

1. **Complete Isolation**: Each environment has its own VPC with different CIDR blocks
   - No VPC peering between staging and production
   - Separate security groups per environment
   - Independent RDS instances

2. **Module Reuse**: All modules are shared between environments
   - Same code, different configurations
   - Ensures consistency in infrastructure patterns
   - Easy to promote changes from staging to production

3. **State Separation**: Each environment has separate state files
   - Production: `s3://agentpass-terraform-state/[component]/production/`
   - Staging: `s3://agentpass-terraform-state/[component]/staging/`

4. **Cost Optimization for Staging**:
   - Single instances instead of auto-scaling groups
   - Smaller instance types where possible
   - Reduced backup retention
   - Less storage allocation

### Environment Promotion Workflow

1. **Test in Staging First**
   ```bash
   cd shared/staging && terraform apply
   cd projects/backend/staging && terraform apply
   cd projects/console/staging && terraform apply
   ```

2. **Validate Changes**
   - Run integration tests against staging
   - Perform load testing if needed
   - Verify security configurations

3. **Apply to Production**
   ```bash
   cd shared/production && terraform apply
   cd projects/backend/production && terraform apply
   cd projects/console/production && terraform apply
   ```

## Important Security Notes

1. **Backend Isolation**: Backend ALB is set to `internal` in both environments
2. **Database Passwords**: 
   - Use different passwords for staging and production
   - Consider AWS Secrets Manager for production
3. **API Keys**: Implement separate API key management per environment
4. **WAF**: Consider adding AWS WAF to production API Gateway
5. **Monitoring**: Enable CloudWatch alarms for security events in both environments
6. **Environment Segregation**: Never share resources between staging and production

## Troubleshooting

### Backend Not Accessible
- Verify API Gateway deployment is active
- Check VPC Link status is AVAILABLE
- Ensure backend ALB target health is healthy
- Verify security group rules

### State Drift Issues
- Always let Terraform operations complete
- Don't modify resources outside Terraform
- Use `terraform refresh` before plan/apply
- Consider state locking with DynamoDB

## Setting Up Terraform State S3 Bucket

Before deploying any infrastructure, create an S3 bucket for storing Terraform state files:

```bash
# Create the S3 bucket
aws s3api create-bucket \
  --bucket agentpass-terraform-state \
  --region us-east-2 \
  --create-bucket-configuration LocationConstraint=us-east-2

# Enable versioning for state file history
aws s3api put-bucket-versioning \
  --bucket agentpass-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket agentpass-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access (security best practice)
aws s3api put-public-access-block \
  --bucket agentpass-terraform-state \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Verify Bucket Creation

```bash
# List the bucket
aws s3 ls | grep agentpass-terraform-state

# Check versioning status
aws s3api get-bucket-versioning --bucket agentpass-terraform-state

# Check encryption status
aws s3api get-bucket-encryption --bucket agentpass-terraform-state
```