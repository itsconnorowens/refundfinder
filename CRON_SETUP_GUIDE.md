# Cron Secret Setup Guide

## Generated Cron Secret

Your secure cron secret has been generated:
```
REDACTED_CRON_SECRET
```

## Environment Variable Setup

### 1. Local Development (.env.local)
Create a `.env.local` file in your project root with:
```bash
CRON_SECRET=REDACTED_CRON_SECRET
# ... other environment variables
```

### 2. Vercel Production Environment
Add the cron secret to your Vercel environment variables:

**Via Vercel Dashboard:**
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: `REDACTED_CRON_SECRET`
   - **Environment**: Production (and Preview if needed)

**Via Vercel CLI:**
```bash
vercel env add CRON_SECRET
# Enter: REDACTED_CRON_SECRET
```

## Cron Job Configuration

### Vercel Cron Jobs
Your `vercel.json` is already configured to run the automated refund processing every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-automatic-refunds",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Manual Testing
You can test the cron job manually:

```bash
# Test the cron endpoint
curl -X POST https://your-domain.com/api/cron/process-automatic-refunds \
  -H "Authorization: Bearer REDACTED_CRON_SECRET"

# Health check
curl https://your-domain.com/api/cron/process-automatic-refunds
```

## Security Considerations

### 1. Secret Management
- **Never commit** the cron secret to version control
- **Rotate regularly** (every 3-6 months)
- **Use different secrets** for different environments
- **Store securely** in environment variables only

### 2. Access Control
- The cron secret is required for all POST requests to cron endpoints
- GET requests (health checks) don't require authentication
- Failed authentication returns 401 Unauthorized

### 3. Monitoring
- Monitor cron job execution in Vercel dashboard
- Set up alerts for failed cron executions
- Log all cron job activities for audit trails

## Cron Job Schedule Options

You can modify the schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-automatic-refunds",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

**Common Schedule Patterns:**
- `"0 */6 * * *"` - Every 6 hours
- `"0 */4 * * *"` - Every 4 hours  
- `"0 */2 * * *"` - Every 2 hours
- `"0 0 * * *"` - Daily at midnight
- `"0 0 */2 * *"` - Every 2 days at midnight

## Troubleshooting

### Cron Job Not Running
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test the endpoint manually
4. Check Vercel cron job status in dashboard

### Authentication Errors
1. Verify `CRON_SECRET` environment variable is set
2. Check the Authorization header format: `Bearer <secret>`
3. Ensure the secret matches exactly (no extra spaces)

### Performance Issues
1. Monitor cron job execution time
2. Check for rate limiting in Stripe/Airtable
3. Review batch processing logs
4. Optimize database queries if needed

## Next Steps

1. **Deploy to Vercel** with the cron secret configured
2. **Test the cron job** manually first
3. **Monitor execution** for the first few runs
4. **Set up alerts** for any failures
5. **Review logs** to ensure proper operation

## Support

If you encounter issues with the cron job setup:
- Check Vercel documentation: https://vercel.com/docs/cron-jobs
- Review the automated refund system logs
- Test individual API endpoints manually
- Contact support if authentication issues persist
