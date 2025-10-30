---
last_updated: 2025-10-29
status: current
owner: @connorowens
---

# Monitoring & Alerting Setup Guide

This guide will help you set up comprehensive monitoring and alerting for Flghtly using Sentry (error tracking), PostHog (user analytics), and Slack (real-time notifications).

## Overview

The monitoring system tracks three key events:

1. **New Users/Visitors** - Track when users visit the site and complete claims
2. **Filed Claims** - Get notified when new claims are submitted
3. **Errors & Issues** - Monitor and get alerted about system errors

## Prerequisites

- A Sentry account ([sentry.io](https://sentry.io))
- A PostHog account ([posthog.com](https://posthog.com))
- A Slack workspace with webhook access (optional but recommended)

---

## 1. Sentry Setup (Error Tracking)

### Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select "Next.js" as the platform
3. Copy your DSN (Data Source Name)

### Configure Sentry

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
```

### Set Up Alerts in Sentry

1. Go to **Alerts** → **Create Alert**
2. Configure alert rules for:
   - New issues (errors)
   - Error rate increases
   - Performance degradation

### What Sentry Tracks

- ✅ API route errors
- ✅ Client-side errors
- ✅ Payment processing failures
- ✅ Claim creation failures
- ✅ Email delivery issues
- ✅ Performance metrics

---

## 2. PostHog Setup (User Analytics)

### Create a PostHog Account

1. Go to [posthog.com](https://posthog.com) and create an account
2. Create a new project
3. Copy your Project API Key

### Configure PostHog

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Set Up Dashboards

1. Create a dashboard in PostHog
2. Add widgets for:
   - **Pageviews** - Track site visits
   - **Custom Events** - Track `claim_submitted` events
   - **Funnels** - Track conversion from visit → claim submission
   - **User Properties** - Track user attributes (email, claim count, etc.)

### What PostHog Tracks

- ✅ Page views and visitor traffic
- ✅ Claim submissions
- ✅ User identification (email-based)
- ✅ Custom events (claim status changes)
- ✅ User journeys and funnels

---

## 3. Slack Setup (Real-Time Notifications)

### Create a Slack Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose a channel (e.g., `#flghtly-alerts`)
5. Copy the Webhook URL

### Configure Slack

Add the following to your `.env.local` file:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ADMIN_EMAIL=your-email@example.com
```

### What You'll Receive in Slack

- 🆕 **New Claim Alerts** - Instant notification when a claim is submitted
- ⚠️ **System Errors** - High/critical errors from Sentry
- 🚨 **SLA Breaches** - Claims pending > 48 hours
- 📧 **Email Failures** - Bounced or failed email deliveries

### Notification Severity Levels

| Severity | Channels | Example |
|----------|----------|---------|
| **Low** | Console, Slack | New claim submitted |
| **Medium** | Slack, Console | Email delivery rate drop |
| **High** | Slack, Email, Console | Payment processing error |
| **Critical** | Slack, Email, Console | SLA breach, system down |

---

## 4. Testing Your Setup

### Test Sentry

1. Run the application: `npm run dev`
2. Trigger a test error by navigating to a non-existent API route
3. Check Sentry dashboard for the error

### Test PostHog

1. Visit your application homepage
2. Submit a test claim
3. Check PostHog dashboard for:
   - Pageview event
   - `claim_submitted` event
   - User identification

### Test Slack Notifications

1. Submit a test claim through the application
2. Check your Slack channel for the "New Claim Submitted" notification

Or manually test the webhook:

```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "attachments": [{
      "color": "#36a64f",
      "title": "[TEST] Monitoring System Online",
      "text": "Slack notifications are working!",
      "footer": "Flghtly Monitoring"
    }]
  }'
```

---

## 5. Monitoring in Production

### Deploy to Vercel

1. Add all environment variables to Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_SENTRY_DSN
   vercel env add NEXT_PUBLIC_POSTHOG_KEY
   vercel env add SLACK_WEBHOOK_URL
   # ... add all other variables
   ```

2. Redeploy your application:
   ```bash
   vercel --prod
   ```

### Enable Source Maps Upload (Sentry)

For better error tracking, configure Sentry to upload source maps:

1. Generate a Sentry auth token: [Sentry Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Add to your environment:
   ```bash
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

### Set Up Cron Jobs

Ensure your Vercel cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-follow-ups",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/process-automatic-filing",
      "schedule": "0 9 * * *"
    }
  ]
}
```

These cron jobs will check for:
- Claims needing follow-up
- SLA breaches
- Overdue claims

---

## 6. Alert Configuration Recommendations

### Sentry Alerts

Configure these alert rules:

1. **High Error Rate**
   - Condition: Error rate > 5% in 1 hour
   - Action: Send to Slack + Email

2. **New Critical Error**
   - Condition: New error with severity "fatal"
   - Action: Send to Slack immediately

3. **Performance Degradation**
   - Condition: P95 response time > 2 seconds
   - Action: Send to Slack

### PostHog Insights

Set up these insights:

1. **Daily Active Users**
   - Track unique visitors per day
   - Set alert if DAU drops by 50%

2. **Claim Conversion Rate**
   - Track visits → claim submissions
   - Set alert if conversion drops below 10%

3. **Abandoned Claims**
   - Track users who start but don't complete claims
   - Set alert if abandonment > 30%

### Slack Alert Routing

You can create different Slack channels for different alert types:

- `#flghtly-claims` - New claim notifications
- `#flghtly-errors` - Error and system alerts
- `#flghtly-analytics` - Daily/weekly analytics summaries

Create multiple webhooks and configure in your code:

```typescript
const SLACK_WEBHOOKS = {
  claims: process.env.SLACK_WEBHOOK_CLAIMS,
  errors: process.env.SLACK_WEBHOOK_ERRORS,
  analytics: process.env.SLACK_WEBHOOK_ANALYTICS,
};
```

---

## 7. Monitoring Dashboard

### Sentry Dashboard

Access at: `https://sentry.io/organizations/your-org/projects/your-project/`

Key metrics to watch:
- Error count
- Users affected
- Error frequency
- Performance metrics

### PostHog Dashboard

Access at: `https://app.posthog.com/project/your-project/`

Key metrics to watch:
- Daily active users
- Claim submission rate
- Conversion funnel
- User retention

---

## 8. Troubleshooting

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check browser console for Sentry initialization
3. Verify Next.js instrumentation is configured
4. Check Sentry project status

### PostHog Not Tracking Events

1. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
2. Check browser console for PostHog initialization
3. Disable ad blockers that might block PostHog
4. Verify events in PostHog Activity tab

### Slack Notifications Not Working

1. Verify `SLACK_WEBHOOK_URL` is correct
2. Test webhook directly with curl
3. Check Slack app permissions
4. Verify channel exists and bot has access

### Environment Variables Not Loading

1. Restart dev server after adding new variables
2. Verify `.env.local` exists (not `.env.example`)
3. Check variable names match exactly
4. For Vercel, verify variables are added to project settings

---

## 9. Cost Optimization

### Sentry

- Free tier: 5,000 events/month
- Upgrade if you exceed limits
- Use sampling in production to reduce events:
  ```typescript
  tracesSampleRate: 0.1, // Sample 10% of transactions
  ```

### PostHog

- Free tier: 1M events/month
- Disable autocapture if needed to reduce events
- Use session recording sparingly

### Slack

- Free for webhook usage
- No limits on incoming webhooks

---

## 10. Next Steps

Once monitoring is set up:

1. ✅ Monitor daily for the first week
2. ✅ Adjust alert thresholds based on normal traffic
3. ✅ Create custom dashboards for your team
4. ✅ Set up weekly analytics reports
5. ✅ Document incident response procedures

## Support

For issues with:
- **Sentry**: [Sentry Docs](https://docs.sentry.io/)
- **PostHog**: [PostHog Docs](https://posthog.com/docs)
- **Slack**: [Slack API Docs](https://api.slack.com/)

For Flghtly-specific monitoring issues, check the following files:
- `/src/lib/error-tracking.ts` - Sentry integration
- `/src/lib/posthog.ts` - PostHog server integration
- `/src/components/PostHogProvider.tsx` - PostHog client integration
- `/src/lib/notification-service.ts` - Slack integration
- `/src/lib/monitoring-service.ts` - Alert management
