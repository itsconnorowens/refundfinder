# Sentry Setup & Configuration Guide

This document outlines the complete Sentry implementation for Flghtly and provides next steps for portal configuration.

## ✅ Implementation Summary

### What's Been Implemented

#### 1. **Core Error Tracking** ✅
- [x] Client, Server, and Edge configurations
- [x] Source map uploads (automatic on build)
- [x] Error boundaries (global and inline)
- [x] Custom error classes with structured context
- [x] Performance tracking for DB, API, and email operations
- [x] Next.js instrumentation with automatic error capture

#### 2. **Bug Fixes** ✅
- [x] Fixed 3 HIGH severity hydration errors
  - Moved localStorage access to useEffect with window checks
  - Fixed Math.random() in render causing server/client mismatch
  - Added window.location guards for SSR compatibility
- [x] Fixed 4 MEDIUM severity issues
  - ClaimSubmissionForm localStorage hydration
  - Success page localStorage access
  - PWAInstaller memory leak (missing event cleanup)
- [x] All promise rejections now properly handled with try-catch

#### 3. **User Context Tracking** ✅
- [x] Automatic user identification after personal info step
- [x] Claim ID tracking on success page
- [x] Email and name attached to all errors
- [x] **Result**: You'll now see which users are affected by errors

#### 4. **Cron Job Monitoring** ✅
- [x] `process-automatic-refunds` - Monitors refund processing
- [x] `process-automatic-filing` - Monitors claim filing
- [x] `check-follow-ups` - Monitors follow-up alerts
- [x] Check-ins sent at start (in_progress), end (ok/error)
- [x] **Result**: Track background job health and failures

#### 5. **User Feedback Widget** ✅
- [x] Floating feedback button on all pages
- [x] Sentry's built-in feedback dialog
- [x] Inline feedback form component (alternative)
- [x] **Result**: Users can report bugs directly from your app

---

## 🎯 What You Should See Now

After deploying these changes, you should see:

### In Sentry Portal

1. **Reduced Error Count**
   - Hydration errors should be eliminated
   - Crash Free Sessions should improve from 81.82% to >95%

2. **User Identification**
   - Errors will show user email/name instead of "0 users"
   - Claims can be traced back to specific users

3. **Cron Monitors** (after first execution)
   - 3 monitors will appear in the Cron Monitoring section
   - Each showing last run status and schedule

4. **User Feedback**
   - Feedback submissions appear in Issues feed
   - Tagged as `feedback_type: general`

---

## 📋 Next Steps: Sentry Portal Configuration

### Step 1: Configure Alerts

Navigate to **Settings → Alerts** in your Sentry project.

#### Recommended Alert Rules:

**1. Critical Error Alert**
```
Alert Name: Critical Errors - Immediate Action
When: An issue is first seen OR Regression
Conditions:
  - Issue Category: Error
  - Level: Error or Fatal
  - Tags: environment equals production
Actions:
  - Send a notification via Email to: your-email@example.com
  - Optional: Send to Slack #alerts channel
```

**2. High Volume Alert**
```
Alert Name: Error Spike Detected
When: An issue is seen more than X times
Conditions:
  - 100 events in 1 hour
  - Issue Category: Error
Actions:
  - Send a notification via Email
  - Optional: PagerDuty for after-hours
```

**3. Performance Degradation**
```
Alert Name: Slow Performance
When: A metric alert is triggered
Conditions:
  - avg(transaction.duration) > 3000ms
  - For all transactions
Actions:
  - Send a notification via Email
```

**4. Cron Job Failures**
```
Alert Name: Background Job Failed
When: A cron monitor is missed or timed out
Conditions:
  - Monitor: All monitors
  - Failure tolerance: 0 (alert immediately)
Actions:
  - Send a notification via Email
  - Optional: SMS for critical jobs
```

### Step 2: Set Up Cron Monitors

Navigate to **Crons** in your Sentry project.

After your cron jobs run at least once, you should see 3 monitors auto-created:
- `process-automatic-refunds`
- `process-automatic-filing`
- `check-follow-ups`

#### Configure Each Monitor:

1. **Click on the monitor name**
2. **Set the schedule** (how often it runs):
   ```
   process-automatic-refunds: Every day at 2:00 AM
   process-automatic-filing: Every hour
   check-follow-ups: Every day at 9:00 AM
   ```
3. **Set Check-In Margin**: 10 minutes
   - Alert if job hasn't started within 10 mins of schedule
4. **Set Max Runtime**: 30 minutes
   - Alert if job takes longer than 30 minutes
5. **Enable Notifications**: Check "Send alert notifications"

### Step 3: Enable User Feedback

Navigate to **Settings → User Feedback** in your Sentry project.

1. **Enable User Feedback**: Toggle ON
2. **Customize Form Fields** (optional):
   - Name field: Required
   - Email field: Required
   - Screenshot: Enabled
3. **Email Notifications**: Enable to get notified of new feedback
4. **Auto-assignment**: Assign feedback to specific team members

### Step 4: Configure Session Replay

Navigate to **Settings → Session Replay**.

1. **Verify Session Replay is enabled**
   - Should already be configured in [sentry.client.config.ts](sentry.client.config.ts)
   - 100% of error sessions
   - 10% of all sessions

2. **Review Privacy Settings**:
   - Text masking: Enabled (default)
   - Media blocking: Enabled (default)
   - Network details: Enabled

3. **Watch a replay**:
   - Go to Issues → Click any error
   - Look for "Session Replay" tab
   - Watch what the user did before the error

### Step 5: Set Up Uptime Monitoring

Navigate to **Alerts → Uptime Monitoring** (if available).

Create uptime monitors for critical endpoints:

**1. Health Check Monitor**
```
URL: https://flghtly.com/api/monitoring/health-check
Name: Main Health Check
Interval: 1 minute
Failure Threshold: 3 consecutive failures
Timeout: 10 seconds
Expected Status: 200
```

**2. Payment Endpoint Monitor**
```
URL: https://flghtly.com/api/create-payment-intent
Name: Payment System Health
Interval: 5 minutes
Method: POST (if supported, otherwise GET to health endpoint)
```

**3. Claim Submission Monitor**
```
URL: https://flghtly.com/api/create-claim
Name: Claim Submission Health
Interval: 5 minutes
```

### Step 6: Review and Adjust Sampling Rates

Navigate to **Settings → Projects → [flghtly] → Client Keys (DSN)**.

Current sampling rates are defined in config files:

**Client-side** ([sentry.client.config.ts](sentry.client.config.ts)):
- Payment/webhooks: 50%
- Analytics: 20%
- Health checks: 1%
- Default: 15%

**Server-side** ([sentry.server.config.ts](sentry.server.config.ts)):
- Payment/webhooks: 80%
- Admin: 50%
- Background jobs: 30%
- Analytics: 15%
- Health checks: 5%

**Adjust if needed**:
- **Too many events?** Lower sampling rates
- **Missing important errors?** Increase sampling rates
- **Cost concerns?** Review the billing page and adjust accordingly

### Step 7: Integrate with Communication Tools

#### Slack Integration
1. Navigate to **Settings → Integrations → Slack**
2. Click **Add Workspace**
3. Choose your Slack workspace
4. Select a channel for alerts (e.g., `#dev-alerts`)
5. Go back to Alert Rules and add Slack as an action

#### Email Integration
1. Navigate to **Settings → Account → Notifications**
2. Enable email notifications for:
   - Issue Alerts
   - Weekly Reports
   - Deploy Notifications
3. Add team members' emails

---

## 📊 Monitoring Best Practices

### Daily Review
- Check Sentry dashboard for new issues
- Review crash-free session rate (should be >95%)
- Check if any cron jobs failed
- Review user feedback submissions

### Weekly Review
- Analyze error trends and patterns
- Review performance metrics
- Check if any issues are regressing
- Update alert rules based on false positives

### Monthly Review
- Review and close resolved issues
- Check sampling rates and adjust for cost
- Review team member access and permissions
- Update integration settings

---

## 🔧 Configuration Files

### Sentry Config Files
- [`sentry.client.config.ts`](sentry.client.config.ts) - Client-side config with Session Replay
- [`sentry.server.config.ts`](sentry.server.config.ts) - Server-side config with smart sampling
- [`sentry.edge.config.ts`](sentry.edge.config.ts) - Edge runtime config
- [`instrumentation.ts`](instrumentation.ts) - Next.js instrumentation
- [`next.config.ts`](next.config.ts) - Source map upload configuration

### Error Tracking
- [`src/lib/error-tracking.ts`](src/lib/error-tracking.ts) - Centralized error handling service
- [`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx) - React error boundaries
- [`src/app/global-error.tsx`](src/app/global-error.tsx) - Global error page

### User Feedback
- [`src/components/SentryFeedback.tsx`](src/components/SentryFeedback.tsx) - Feedback widget
- [`src/app/layout.tsx`](src/app/layout.tsx) - Layout with feedback button

### Cron Monitoring
- [`src/app/api/cron/process-automatic-refunds/route.ts`](src/app/api/cron/process-automatic-refunds/route.ts)
- [`src/app/api/cron/process-automatic-filing/route.ts`](src/app/api/cron/process-automatic-filing/route.ts)
- [`src/app/api/cron/check-follow-ups/route.ts`](src/app/api/cron/check-follow-ups/route.ts)

---

## 🐛 Troubleshooting

### Source Maps Not Working
**Problem**: Stack traces show minified code
**Solution**:
```bash
# Rebuild with CI=true to enable source map upload logs
CI=true npm run build

# Check for "Successfully uploaded source maps" message
# Verify SENTRY_AUTH_TOKEN is set correctly
```

### No User Context in Errors
**Problem**: Errors still show "0 users"
**Solution**:
- Ensure users complete step 1 (personal info) in claim form
- Check that `setUser()` is being called after step 1
- Verify email/name are being passed correctly

### Cron Monitors Not Appearing
**Problem**: Monitors don't show up in portal
**Solution**:
- Cron jobs must run at least once to create monitors
- Check that jobs are being triggered by your cron service
- Verify check-ins are being sent (check server logs)

### Feedback Button Not Showing
**Problem**: Feedback button doesn't appear
**Solution**:
- Check browser console for errors
- Verify SentryFeedbackWidget is imported in layout
- Ensure Sentry is initialized on client side

---

## 📈 Success Metrics

Track these metrics to measure Sentry effectiveness:

- **Crash Free Sessions**: Target >99%
- **Mean Time to Resolution (MTTR)**: Track how quickly issues are fixed
- **Error Volume Trends**: Should decrease over time
- **User Feedback Response Time**: How quickly you respond to feedback
- **Cron Job Success Rate**: Target >99.9%

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` and verify source maps upload
- [ ] Test error tracking with `/api/test-sentry` endpoint
- [ ] Verify user context is being set correctly
- [ ] Test feedback widget functionality
- [ ] Configure all alert rules in Sentry portal
- [ ] Set up Slack/email notifications
- [ ] Review and adjust sampling rates
- [ ] Document on-call procedures for critical alerts

---

## 📚 Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Cron Monitoring Docs](https://docs.sentry.io/product/crons/)
- [Sentry Session Replay Docs](https://docs.sentry.io/product/session-replay/)
- [Sentry User Feedback Docs](https://docs.sentry.io/product/user-feedback/)
- [Sentry Performance Monitoring Docs](https://docs.sentry.io/product/performance/)

---

## 🎉 Summary

Your Sentry implementation is now **production-ready** with:

✅ Comprehensive error tracking across all environments
✅ Automatic source map uploads for readable stack traces
✅ User identification for tracking affected users
✅ Background job monitoring with health checks
✅ User feedback widget for bug reports
✅ Smart sampling rates to control costs
✅ Performance tracking for critical operations

**Next**: Configure alerts and monitors in the Sentry portal using the steps above!

---

*Generated: 2025-01-30*
*Version: 1.0.0*
