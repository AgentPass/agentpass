# GitHub Workflows for AWS Elastic Beanstalk Deployment

This directory contains GitHub Actions workflows for automatically deploying the `agentbridge-be` backend application to AWS Elastic Beanstalk.

## Available Workflows

### `deploy-backend-staging.yml` - AWS CLI Approach (Recommended)
Uses AWS CLI directly for deployment. More reliable and doesn't require SSH keys.

## Prerequisites

### Required GitHub Secrets

You need to add these secrets to your GitHub repository:

1. **AWS Credentials:**
   - `AWS_ACCESS_KEY_ID` - AWS access key with Elastic Beanstalk permissions
   - `AWS_SECRET_ACCESS_KEY` - AWS secret access key

2. **For AWS CLI workflow:**
   - `EB_S3_BUCKET` - S3 bucket name for storing deployment packages

### AWS IAM Permissions

The AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "ec2:*",
        "s3:*",
        "cloudwatch:*",
        "autoscaling:*",
        "elasticloadbalancing:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## How It Works

### Trigger
- **Automatic:** Triggers on every push to the `develop` branch
- **Manual:** Can be triggered manually via GitHub Actions UI
- **Path filtering:** Only triggers when relevant files change

### Build Process
1. Checkout code
2. Setup Node.js 20 and Yarn
3. Install dependencies
4. Build application using Nx (`yarn nx build @agentbridge/be -c production`)
5. Create deployment package (ZIP file)

### Deployment Process
1. Configure AWS credentials
2. Create Elastic Beanstalk application version
3. Update environment with new version
4. Wait for deployment to complete
5. Verify deployment status

## Environment Configuration

The workflow automatically creates `.ebextensions/environment.config` with:

- **Environment variables:** NODE_ENV, DD_ENV, DD_SERVICE, etc.
- **Single instance mode:** For staging (faster deployment)
- **Autoscaling:** Min/Max instances set to 1 for staging

## Customization

### Change Target Environment
Update these environment variables in the workflow:

```yaml
env:
  EB_APPLICATION_NAME: backend
  EB_ENVIRONMENT_NAME: staging  # Change to production, etc.
  AWS_REGION: us-east-2
```

### Add Environment Variables
Modify the `.ebextensions` section in the deployment step:

```yaml
cat > .ebextensions/environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: staging
    CUSTOM_VAR: value
    ANOTHER_VAR: another_value
EOF
```

### Change Build Configuration
Modify the build step:

```yaml
- name: Build application
  run: yarn nx build @agentbridge/be -c staging  # Change from production
```

## Troubleshooting

### Common Issues

1. **Permission Denied:**
   - Check AWS IAM permissions
   - Verify GitHub secrets are correct

2. **Environment Not Found:**
   - Ensure Elastic Beanstalk environment exists
   - Check environment name spelling

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

4. **Deployment Timeout:**
   - The workflow includes built-in waiting and verification
   - Check AWS Elastic Beanstalk console for detailed logs

### Debug Mode

Add this step to any workflow for debugging:

```yaml
- name: Debug Info
  run: |
    echo "Current directory: $(pwd)"
    echo "Files in dist: $(ls -la dist/apps/agentbridge-be/)"
    echo "AWS region: ${{ env.AWS_REGION }}"
    echo "EB app: ${{ env.EB_APPLICATION_NAME }}"
    echo "EB env: ${{ env.EB_ENVIRONMENT_NAME }}"
```

## Monitoring

### GitHub Actions
- Check the Actions tab in your repository
- View detailed logs for each step
- Monitor deployment status

### AWS Console
- Elastic Beanstalk console for environment status
- CloudWatch for logs and metrics
- S3 for deployment packages

## Best Practices

1. **Use staging workflow first:** Test deployments on staging before production
2. **Monitor deployments:** Check both GitHub Actions and AWS console
3. **Rollback capability:** Keep previous versions for quick rollback
4. **Environment parity:** Keep staging and production configurations similar
5. **Security:** Use least-privilege IAM policies
6. **Cost optimization:** Use single instance for staging, autoscaling for production
