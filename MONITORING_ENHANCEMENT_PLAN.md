# Production Monitoring Enhancement Plan

**Created:** October 30, 2025
**Status:** Ready for Implementation
**Estimated Total Time:** Week 1 (3 hours) | Week 2 (3 hours) | Month 1 (5.5 hours)

---

## Executive Summary

Your monitoring foundation is solid with Sentry fully operational and PostHog configured. The main opportunity is **converting this infrastructure from partial implementation to full operational visibility**.

**Current State:**
- ✅ Sentry: Smart sampling (5-80%), error tracking on 24/29 API routes
- ✅ PostHog: Configured with reverse proxy, but only 1 manual event
- ✅ Infrastructure: Well-architected error-tracking and monitoring services
- ❌ **Critical Gap:** Missing 15+ conversion funnel events (only 20% funnel visibility)
- ❌ **Critical Gap:** No Sentry alerts configured
- ❌ **Gap:** InlineErrorBoundary has Sentry commented out

**After Week 1 Implementation:** 5x better visibility with ~3 hours of work

---

## Phase 1: Quick Wins (Week 1 - 3 hours)

### Priority 1: Configure Sentry Alerts (30 min) 🚨
**Location:** Sentry Dashboard UI (no code changes)

**Alerts to Create:**

1. **High Error Rate Alert**
   - Condition: Error rate > 5% over 1 hour
   - Action: Slack + Email
   - Why: Catch systemic issues immediately

2. **Critical Payment Errors**
   - Condition: New issue in payment routes
   - Action: Immediate Slack + Email
   - Why: Payment failures = revenue loss

3. **Claim Creation Failures**
   - Condition: New issue in `/api/create-claim`
   - Action: Slack notification
   - Why: Core business function

4. **Performance Degradation**
   - Condition: P95 > 3 seconds
   - Action: Slack notification
   - Why: User experience degradation

5. **Daily Digest**
   - Schedule: Daily at 9 AM
   - Content: Error summary, affected users
   - Action: Email to team

### Priority 2: Enable InlineErrorBoundary (10 min) ✅
**File:** `src/components/ErrorBoundary.tsx`

**Action:** Uncomment lines 191-203 in `InlineErrorBoundary.componentDidCatch()`

**Impact:** Catches UI errors from forms, payment widgets

### Priority 3: Create PostHog Dashboards (30 min) 📊
**Location:** PostHog Dashboard UI (no code changes)

**Dashboards to Create:**

1. **Conversion Funnel**
   - Pageviews → Claim Submitted
   - Alert if conversion < 2%

2. **Error Impact**
   - Sentry errors overlayed with PostHog active users
   - Correlate errors with user impact

3. **Daily Operations**
   - New claims count
   - Unique visitors
   - Average session duration
   - Top pages

### Priority 4: Implement Critical PostHog Events (90 min) 🎯
**Impact:** Go from 20% to 100% funnel visibility

**Events to Implement (in order):**

1. `eligibility_check_completed` (20 min)
   - Location: Eligibility check API
   - Properties: `eligible`, `compensation_amount`, `airline`

2. `claim_form_started` (10 min)
   - Location: `/src/app/claim/page.tsx`
   - Properties: `has_prefill`, `source`

3. `claim_step_completed` (30 min)
   - Location: Claim form steps
   - Properties: `step_number`, `step_name`, `time_spent_seconds`

4. `payment_initiated` (15 min)
   - Location: Payment intent creation
   - Properties: `amount_cents`, `claim_id`

5. `payment_completed` (15 min)
   - Location: Success page/webhook
   - Properties: `claim_id`, `payment_intent_id`

### Priority 5: Audit Environment Variables (15 min) ⚙️
**Location:** Vercel Dashboard → Environment Variables

**Verify These Are Set:**
```bash
# Sentry (required)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=flghtly
SENTRY_AUTH_TOKEN=... # For source maps

# PostHog (required)
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# Notifications (recommended)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ADMIN_EMAIL=admin@flghtly.com
```

---

## Phase 2: Code Enhancements (Week 2 - 3 hours)

### 1. Enhanced Error Context (30 min)
**Create:** `src/lib/errors.ts`

**Custom Error Classes:**
```typescript
export class PaymentError extends Error {
  name = 'PaymentError';
  constructor(message: string, public paymentIntentId?: string) {
    super(message);
  }
}

export class ClaimValidationError extends Error {
  name = 'ClaimValidationError';
  constructor(message: string, public field: string) {
    super(message);
  }
}
```

**Benefits:**
- Better error grouping in Sentry
- Faster root cause identification
- More accurate error rates

### 2. Performance Monitoring (45 min)
**Add to critical operations:**

- Airtable query timing
- Stripe API timing
- Email service timing
- Custom business metrics

**Example:**
```typescript
const startTime = Date.now();
const result = await airtable.query(...);
trackPerformance('airtable.query', startTime, { table: 'Claims' });
```

### 3. Integrate Monitoring Service (60 min)
**File:** `src/lib/monitoring-service.ts`

**Connect to real data:**
- Airtable metrics (claims filed, overdue)
- Sentry API (error rates)
- PostHog API (user stats)

**Create unified dashboard API:**
```typescript
// New route: /api/monitoring/dashboard
```

### 4. Sampling Rate Optimization (30 min)
**Review and adjust based on production data:**

- Payment routes: Consider 100% for first month
- Background jobs: Increase from 30% to 50%
- Health checks: Decrease from 5% to 1%

**Add dynamic sampling:**
```typescript
// If route has recent errors, sample at 100%
```

---

## Phase 3: Advanced Features (Month 1 - 5.5 hours)

### 1. Session Replay Verification (30 min)
- Verify Sentry session replay working
- Adjust rates based on quota usage
- Consider enabling PostHog session replay

### 2. Custom Admin Dashboard (2 hours)
**Create:** `/admin/monitoring` page

**Features:**
- Real-time error rate chart
- Active users count
- Recent claims table
- System health indicators
- Alert history

### 3. Automated Reporting (1 hour)
**Weekly email report:**
- Claims filed, errors, user growth
- Week-over-week trends
- Top errors to fix

### 4. Feature Flags Setup (2 hours)
**PostHog feature flags for:**
- Gradual feature rollouts
- Kill switches
- A/B testing

---

## Success Metrics

### After Week 1, You Can Answer:

**Conversion Funnel:**
- ✅ Eligibility check success rate
- ✅ Eligibility → Claim start rate
- ✅ Step-by-step drop-off points
- ✅ Time to convert

**Error Metrics:**
- ✅ Error rate by route
- ✅ User impact percentage
- ✅ Mean time to resolution
- ✅ Error categories

**Business Metrics:**
- ✅ Daily active users
- ✅ Conversion rate
- ✅ Claims filed today
- ✅ Overdue claims

---

## Cost Analysis

### Current
- **Sentry:** Free tier or $26/month
- **PostHog:** Free tier (1M events/month)

### After Implementation
- **Sentry:** May need $80/month if >50K events
  - Smart sampling keeps you under
- **PostHog:** Still free (estimate 225K/month)
- **No new services required**

---

## Implementation Order

### This Week (Must Do)
1. ⏱️ 30 min - Configure Sentry alerts in UI
2. ⏱️ 10 min - Enable InlineErrorBoundary
3. ⏱️ 15 min - Audit Vercel env vars
4. ⏱️ 30 min - Create PostHog dashboards
5. ⏱️ 90 min - Implement 5 PostHog events

**Total: ~3 hours | Impact: 5x visibility improvement**

### Next Week (Should Do)
6. ⏱️ 30 min - Custom error classes
7. ⏱️ 45 min - Performance monitoring
8. ⏱️ 60 min - Connect monitoring service
9. ⏱️ 30 min - Optimize sampling rates

**Total: ~3 hours | Impact: Better debugging & operations**

### This Month (Nice to Have)
10. ⏱️ 30 min - Session replay verification
11. ⏱️ 2 hours - Custom admin dashboard
12. ⏱️ 1 hour - Automated reporting
13. ⏱️ 2 hours - Feature flags

**Total: ~5.5 hours | Impact: Advanced capabilities**

---

## Risk Assessment

### Low Risk ✅
- Sentry alerts (UI only)
- PostHog events (fail silently)
- InlineErrorBoundary (tested code)

### Medium Risk ⚠️
- Sampling rate changes (test in preview)
- Custom error classes (thorough testing)
- Performance tracking (monitor overhead)

### Mitigation Strategy
1. Deploy to preview branch first
2. Monitor quota usage daily for first week
3. Have rollback plan ready
4. Test error scenarios in development

---

## Files to Modify

### Week 1 (Phase 1)
- `src/components/ErrorBoundary.tsx` - Uncomment InlineErrorBoundary
- Eligibility check component - Add event
- `src/app/claim/page.tsx` - Add form start event
- Claim form component - Add step events
- Payment handlers - Add payment events

### Week 2 (Phase 2)
- `src/lib/errors.ts` - NEW: Custom error classes
- `src/lib/error-tracking.ts` - Enhanced context
- Critical operations - Add performance tracking
- `src/lib/monitoring-service.ts` - Real data integration
- `sentry.server.config.ts` - Optimize sampling

### Month 1 (Phase 3)
- `src/app/admin/monitoring/page.tsx` - NEW: Dashboard
- `src/app/api/monitoring/dashboard/route.ts` - NEW: API
- Cron job - NEW: Weekly reports

---

## Next Steps

Choose one:

**Option A: Full Week 1 Implementation** (~3 hours)
- Complete all 5 Priority items
- Maximum immediate impact
- Deploy to production by end of week

**Option B: Phased Approach**
- Day 1: Sentry alerts + env audit (45 min)
- Day 2: PostHog dashboards + InlineErrorBoundary (40 min)
- Day 3-4: Implement PostHog events (90 min)
- Deploy Friday

**Option C: Start with UI-Only Changes** (~1 hour)
- Sentry alerts
- PostHog dashboards
- Env audit
- No code changes, zero risk

---

## Questions to Decide

1. **Slack Integration:** Do you have a Slack workspace for alerts?
2. **Sentry Plan:** Are you on free tier or paid? Need to check quota?
3. **PostHog Events:** Should we implement all 5 or start with top 3?
4. **Deployment:** Deploy Friday or wait until Monday?
5. **Monitoring:** Who will monitor dashboards daily during first week?

---

**Recommendation:** Start with Option B (Phased Approach) to de-risk and validate each enhancement before moving to the next.
