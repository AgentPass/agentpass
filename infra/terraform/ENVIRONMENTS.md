# Environment Architecture Summary

## Design Philosophy

The staging environment is a **complete copy** of production with:
- **Identical architecture** (modules are 100% reused)
- **Complete isolation** (separate VPCs, no cross-environment access)
- **Cost optimization** (smaller instances, reduced redundancy)

## Environment Isolation

```
Production VPC (10.0.0.0/16)          Staging VPC (10.2.0.0/16)
├── Public Subnets                    ├── Public Subnets
│   ├── 10.0.1.0/24                   │   ├── 10.2.1.0/24
│   └── 10.0.2.0/24                   │   └── 10.2.2.0/24
├── Private Subnets                   ├── Private Subnets
│   ├── 10.0.10.0/24                  │   ├── 10.2.10.0/24
│   └── 10.0.11.0/24                  │   └── 10.2.11.0/24
└── No Connection ←────────────────→  └── Complete Isolation
```

## Module Reusability

All modules are **shared** between environments:

```
shared/modules/
├── vpc/            # Used by both staging and production
├── security/       # Used by both staging and production
└── api-gateway/    # Used by both staging and production

projects/backend/modules/
├── beanstalk/      # Used by both staging and production
└── rds/            # Used by both staging and production

projects/console/modules/
└── beanstalk/      # Used by both staging and production
```

## Resource Differences

| Aspect | Production | Staging | Rationale |
|--------|------------|---------|-----------|
| **VPC CIDR** | 10.0.0.0/16 | 10.2.0.0/16 | Avoid IP conflicts |
| **Backend Instances** | t3.small (1-2) | t3.micro (1) | Cost reduction |
| **Frontend Instances** | t3.micro (1-2) | t3.micro (1) | Cost reduction |
| **RDS Storage** | 20 GB | 10 GB | Less test data |
| **RDS Backups** | 7 days | 3 days | Less retention needed |
| **Auto-scaling** | Enabled (1-2) | Disabled (1) | Predictable costs |
| **API Gateway** | Separate | Separate | Environment isolation |
| **Load Balancers** | Separate ALBs | Separate ALBs | No sharing |

## State File Organization

```
s3://agentpass-terraform-state/
├── shared/
│   ├── production/terraform.tfstate
│   └── staging/terraform.tfstate
├── backend/
│   ├── production/terraform.tfstate
│   └── staging/terraform.tfstate
└── console/
    ├── production/terraform.tfstate
    └── staging/terraform.tfstate
```

## Deployment Commands

### Quick Deploy Staging
```bash
# All staging infrastructure
cd shared/staging && terraform apply -auto-approve
cd ../../projects/backend/staging && terraform apply -auto-approve -var="db_password=staging123"
cd ../../console/staging && terraform apply -auto-approve
```

### Quick Deploy Production
```bash
# All production infrastructure
cd shared/production && terraform apply
cd ../../projects/backend/production && terraform apply -var="db_password=prod_secure_pass"
cd ../../console/production && terraform apply
```

### Destroy Staging (Save Costs)
```bash
# Destroy in reverse order
cd projects/console/staging && terraform destroy -auto-approve
cd ../../backend/staging && terraform destroy -auto-approve
cd ../../../shared/staging && terraform destroy -auto-approve
```

## Cost Management Tips

1. **Destroy staging when not in use** - Save ~$160/month
2. **Use staging for development** - Test all changes here first
3. **Schedule staging resources** - Use AWS Lambda to start/stop on schedule
4. **Monitor costs** - Set up AWS Cost Explorer alerts

## Environment URLs

### Staging
- Frontend: `https://staging.us-east-2.elasticbeanstalk.com`
- API Gateway: `https://[api-id].execute-api.us-east-2.amazonaws.com/staging`
- Backend: Internal only (via API Gateway)

### Production
- Frontend: `https://production.us-east-2.elasticbeanstalk.com`
- API Gateway: `https://[api-id].execute-api.us-east-2.amazonaws.com/production`
- Backend: Internal only (via API Gateway)

## Security Considerations

1. **Separate Passwords**: Never use production passwords in staging
2. **No Cross-Environment Access**: VPCs are completely isolated
3. **Different API Keys**: Use separate API Gateway keys per environment
4. **Separate IAM Roles**: Although similar, roles are environment-specific
5. **Independent Monitoring**: Separate CloudWatch dashboards and alarms

## Why This Architecture?

✅ **Complete Isolation**: No risk of staging affecting production
✅ **Cost Effective**: Staging uses minimal resources
✅ **Easy Testing**: Identical architecture makes testing reliable
✅ **Module Reuse**: No code duplication, just configuration differences
✅ **Simple Promotion**: Test in staging, apply same changes to production
✅ **Disaster Recovery**: Staging can be quickly scaled up if needed