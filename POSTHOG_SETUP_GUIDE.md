# PostHog Setup & Configuration Guide

This guide walks you through setting up PostHog analytics for Flghtly after the implementation of Phases 1-3.

## Table of Contents

1. [Initial Configuration](#initial-configuration)
2. [Feature Flags Setup](#feature-flags-setup)
3. [Dashboard Creation](#dashboard-creation)
4. [Group Analytics Setup](#group-analytics-setup)
5. [Alerts Configuration](#alerts-configuration)
6. [Testing & Verification](#testing--verification)

---

## Initial Configuration

### Verify PostHog is Running

1. **Check Events are Being Captured**
   - Go to PostHog → Events
   - Filter by "Last hour"
   - You should see events like `$pageview`, `eligibility_check_started`, etc.

2. **Verify Session Recordings**
   - Go to PostHog → Session Recordings
   - Should see recordings with masked PII fields
   - Play a recording to confirm masking works

3. **Check Error Tracking**
   - Go to PostHog → Error Tracking
   - Should show "No Exception events" if everything is working
   - If you see exceptions, review them

---

## Feature Flags Setup

### Create Feature Flags for A/B Testing

Navigate to **PostHog → Feature Flags** and create these flags:

#### 1. **hero-cta-text** (String Variant Flag)
   - **Key**: `hero-cta-text`
   - **Description**: A/B test for CTA button text on homepage
   - **Type**: Multivariate
   - **Variants**:
     - `check-eligibility` (Control - 33%)
     - `get-started` (Variant A - 33%)
     - `claim-now` (Variant B - 34%)
   - **Rollout**: 100% of users
   - **Targeting**: All users

#### 2. **new-homepage-hero** (Boolean Flag)
   - **Key**: `new-homepage-hero`
   - **Description**: Test new hero section design
   - **Type**: Boolean
   - **Rollout**: Start at 0%, increase to 50% after testing
   - **Targeting**: All users

#### 3. **simplified-eligibility-form** (Boolean Flag)
   - **Key**: `simplified-eligibility-form`
   - **Description**: Reduced fields version of eligibility form
   - **Type**: Boolean
   - **Rollout**: 0% (enable for testing only)
   - **Targeting**: Can target specific users by email

#### 4. **show-service-fee-upfront** (Boolean Flag)
   - **Key**: `show-service-fee-upfront`
   - **Description**: Display service fee prominently vs at checkout
   - **Type**: Boolean
   - **Rollout**: 100% (current behavior)

### Create Experiments

For each A/B test flag, create an **Experiment**:

1. Go to **Feature Flags → [Flag Name] → Create Experiment**
2. **Primary metric**: Conversion rate (eligibility_check_started → payment_completed)
3. **Secondary metrics**:
   - Click-through rate on CTA
   - Form completion time
   - Form abandonment rate
4. **Sample size**: Let run until statistical significance
5. **Duration**: 2-4 weeks per experiment

---

## Dashboard Creation

### Dashboard 1: Main Conversion Funnel

**Create**: Insights → New Dashboard → "Main Conversion Funnel"

**Add these insights**:

#### Insight 1: Homepage to Payment Funnel
- **Type**: Funnel
- **Steps**:
  1. `$pageview` where URL contains `/`
  2. `eligibility_check_started`
  3. `eligibility_check_completed` where `eligible = true`
  4. `file_claim_clicked`
  5. `claim_step_completed` where `step_name = review`
  6. `payment_initiated`
  7. `payment_completed`
- **Breakdown**: By `utm_source`
- **Time range**: Last 30 days

#### Insight 2: Conversion Rate Trend
- **Type**: Trend
- **Event**: `payment_completed`
- **Formula**: (payment_completed / eligibility_check_started) * 100
- **Chart type**: Line
- **Time range**: Last 90 days

#### Insight 3: Drop-off Points
- **Type**: Funnel
- **Display**: Drop-off %
- **Same steps as Insight 1**
- **Highlight**: Steps with >40% drop-off

---

### Dashboard 2: Form Analytics

**Create**: Insights → New Dashboard → "Form Analytics"

**Add these insights**:

#### Insight 1: Form Abandonment by Form Type
- **Type**: Trend
- **Events**:
  - `eligibility_check_abandoned`
  - `email_parsing_abandoned`
  - `claim_submission_abandoned`
- **Breakdown**: By `form_name`
- **Chart type**: Stacked bar

#### Insight 2: Average Time to Abandon
- **Type**: Trend
- **Event**: `*_abandoned`
- **Property**: Average of `time_spent_seconds`
- **Breakdown**: By `form_name`

#### Insight 3: Form Completion Percentage at Abandonment
- **Type**: Trend
- **Event**: `*_abandoned`
- **Property**: Average of `completion_percentage`
- **Filter**: Where `fields_completed > 0`

#### Insight 4: Validation Errors by Field
- **Type**: Trend
- **Event**: `form_validation_error`
- **Breakdown**: By `field`
- **Chart type**: Table
- **Sort**: By count descending

#### Insight 5: Time per Claim Form Step
- **Type**: Trend
- **Event**: `claim_form_step_time`
- **Property**: Average of `time_spent_seconds`
- **Breakdown**: By `step_name`
- **Chart type**: Bar

---

### Dashboard 3: Marketing Performance

**Create**: Insights → New Dashboard → "Marketing Performance"

**Add these insights**:

#### Insight 1: Traffic Sources
- **Type**: Trend
- **Event**: `$pageview`
- **Breakdown**: By `utm_source`
- **Chart type**: Pie chart
- **Time range**: Last 30 days

#### Insight 2: Conversion Rate by Source
- **Type**: Funnel
- **Steps**: eligibility_check_started → payment_completed
- **Breakdown**: By `utm_source`
- **Display**: Conversion rate %

#### Insight 3: Campaign Performance
- **Type**: Table
- **Metrics**:
  - Unique users (group by `utm_campaign`)
  - Eligibility checks started
  - Claims filed
  - Payments completed
  - Conversion rate %
- **Sort**: By conversion rate descending

#### Insight 4: Attribution Breakdown
- **Type**: Sankey diagram
- **Flow**: `utm_source` → `utm_medium` → `payment_completed`

---

### Dashboard 4: Business Metrics

**Create**: Insights → New Dashboard → "Business Metrics"

**Add these insights**:

#### Insight 1: Total Claims Filed
- **Type**: Number
- **Event**: `payment_completed`
- **Time range**: All time

#### Insight 2: Average Compensation Amount
- **Type**: Number
- **Event**: `eligibility_check_completed`
- **Property**: Average of `compensation_amount`
- **Filter**: Where `eligible = true`

#### Insight 3: Eligible Claims by Airline
- **Type**: Table
- **Event**: `eligibility_check_completed`
- **Filter**: Where `eligible = true`
- **Breakdown**: By `airline`
- **Metrics**:
  - Count
  - Avg compensation_amount
  - % filed claims

#### Insight 4: Most Common Routes
- **Type**: Table
- **Event**: `eligibility_check_completed`
- **Properties**: Group by `route` (from $groups)
- **Sort**: By count descending

#### Insight 5: Revenue Trend
- **Type**: Trend
- **Event**: `payment_completed`
- **Property**: Sum of `amount_cents` / 100
- **Chart type**: Line
- **Time range**: Last 90 days

---

### Dashboard 5: Error Monitoring

**Create**: Insights → New Dashboard → "Error Monitoring"

**Add these insights**:

#### Insight 1: Error Rate
- **Type**: Trend
- **Events**:
  - `api_error`
  - `payment_failed`
  - `email_parsing_failed`
- **Chart type**: Stacked area

#### Insight 2: Errors by Endpoint
- **Type**: Table
- **Event**: `api_error`
- **Breakdown**: By `endpoint`
- **Sort**: By count descending

#### Insight 3: Payment Failure Reasons
- **Type**: Pie chart
- **Event**: `payment_failed`
- **Breakdown**: By `error_type`

#### Insight 4: Users Affected by Errors
- **Type**: Number
- **Event**: `api_error` OR `payment_failed`
- **Property**: Unique users
- **Time range**: Last 7 days

---

## Group Analytics Setup

### Configure Groups in PostHog

1. Go to **Settings → Project Settings → Group Analytics**
2. Add these group types:
   - **airline**: Track metrics by airline
   - **route**: Track metrics by flight route

### Create Group-Based Insights

#### Airlines Dashboard

**Create**: Insights → New Dashboard → "Airline Analytics"

**Add insights**:

1. **Claims by Airline**
   - Event: `eligibility_check_completed`
   - Group by: `airline`
   - Show: Count, conversion rate, avg compensation

2. **Airline Success Rate**
   - Event: `payment_completed`
   - Group by: `airline`
   - Formula: payment_completed / eligibility_check_started

3. **Top Problem Airlines**
   - Event: `eligibility_check_completed`
   - Filter: `eligible = true`
   - Group by: `airline`
   - Sort by: Count descending

#### Routes Dashboard

**Create**: Insights → New Dashboard → "Route Analytics"

**Add insights**:

1. **Most Claimed Routes**
   - Event: `eligibility_check_completed`
   - Group by: `route`
   - Show: Count, eligible %

2. **Highest Compensation Routes**
   - Event: `eligibility_check_completed`
   - Group by: `route`
   - Property: Avg `compensation_amount`
   - Sort: Descending

---

## Alerts Configuration

### Critical Alerts

Navigate to **Insights → [Insight] → Set up Alert**

#### 1. Conversion Rate Drop Alert
- **Insight**: Main Conversion Funnel → Conversion Rate
- **Condition**: Drops below 10%
- **Time period**: Last 24 hours vs previous 7 days
- **Notify**: Email + Slack
- **Frequency**: Immediately

#### 2. Error Spike Alert
- **Insight**: Error Rate
- **Condition**: Increases by >50%
- **Time period**: Last hour vs previous day
- **Notify**: Email + Slack
- **Frequency**: Every hour while condition is true

#### 3. Payment Failure Rate Alert
- **Insight**: Payment failures / Payment attempts
- **Condition**: Exceeds 5%
- **Time period**: Last 4 hours
- **Notify**: Email
- **Frequency**: Every 4 hours

#### 4. Form Abandonment Spike
- **Insight**: Form abandonment rate
- **Condition**: Increases by >25%
- **Time period**: Last 24 hours vs previous week
- **Notify**: Email
- **Frequency**: Daily

---

## Testing & Verification

### 1. Test Feature Flags

```bash
# Visit homepage with different feature flag overrides
https://flghtly.com/?feature-flag-override=hero-cta-text:get-started
https://flghtly.com/?feature-flag-override=hero-cta-text:claim-now
```

Verify:
- Button text changes
- `feature_flag_called` event fires
- Correct variant tracked

### 2. Test Group Analytics

1. Complete eligibility check
2. Go to PostHog → Groups → Airlines
3. Find the airline you tested
4. Verify events appear under that airline group

### 3. Test Dashboards

1. Generate test data by completing user flows
2. Check each dashboard
3. Verify charts populate
4. Ensure no errors in console

### 4. Test Alerts

1. Set a test alert with easy-to-trigger condition
2. Trigger the condition
3. Verify notification received
4. Remove test alert

---

## Best Practices

### 1. Regular Dashboard Reviews
- Review conversion funnel weekly
- Check error monitoring daily
- Analyze A/B tests bi-weekly

### 2. Feature Flag Hygiene
- Remove flags after experiments conclude
- Document flag decisions
- Archive unused flags

### 3. Data Quality
- Monitor for unusual patterns
- Validate events are firing correctly
- Check for missing data

### 4. Performance
- Keep dashboards lightweight (<10 insights)
- Use appropriate time ranges
- Archive old dashboards

---

## Troubleshooting

### Events Not Appearing

1. Check browser console for errors
2. Verify PostHog API key in .env
3. Check rate limits in PostHog
4. Verify proxy middleware is working

### Session Recordings Not Working

1. Check `session_recording` config in layout.tsx
2. Verify recordings aren't being blocked by ad blockers
3. Check PostHog project settings → Recordings enabled

### Feature Flags Not Loading

1. Check network tab for `/decide` API call
2. Verify flags exist in PostHog UI
3. Clear browser cache
4. Check for JavaScript errors

### Groups Not Working

1. Verify `posthog.group()` is called before events
2. Check group type is configured in PostHog settings
3. Ensure `$groups` property is in event payload

---

## Next Steps

After setup:

1. **Run for 2 weeks** - Let data accumulate
2. **Review dashboards** - Identify initial insights
3. **Start A/B tests** - Enable first feature flag experiment
4. **Set up alerts** - Configure critical notifications
5. **Iterate** - Refine dashboards based on usage

---

## Support

- PostHog Docs: https://posthog.com/docs
- Flghtly Internal: See MANUAL_TESTING_CHECKLIST.md
- Issues: Check Error Tracking dashboard first

---

## Appendix: Event Reference

### Core Events
- `$pageview` - Page views
- `eligibility_check_started` - User starts eligibility form
- `eligibility_check_completed` - Results received
- `file_claim_clicked` - User clicks to file claim
- `payment_completed` - Successful payment

### Form Events
- `{form}_interaction_started` - User starts interacting
- `{form}_abandoned` - User leaves without completing
- `form_validation_error` - Validation fails
- `claim_form_step_time` - Time per step
- `claim_step_completed` - Step completed

### Error Events
- `api_error` - Server-side errors
- `payment_failed` - Payment failures
- `email_parsing_failed` - Email parsing errors

### Feature Flag Events
- `feature_flag_called` - Flag accessed in code

### Properties Reference
- `utm_source`, `utm_medium`, `utm_campaign` - Attribution
- `airline`, `route` - Business dimensions
- `compensation_amount` - Claim value
- `disruption_type` - delay/cancellation/etc
