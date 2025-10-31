# PostHog Implementation - Manual Testing Checklist

Complete this checklist before launch to verify all PostHog analytics features are working correctly.

## Pre-Testing Setup

### Environment Preparation

- [ ] PostHog API key is configured in `.env.local`
- [ ] Development server is running (`npm run dev`)
- [ ] PostHog dashboard is open (https://app.posthog.com or your instance)
- [ ] Browser DevTools is open (Console + Network tabs)
- [ ] You're using a real email address (not a test one) for identification

### Test Data Preparation

- [ ] Have a valid flight number ready (e.g., AA100, BA200)
- [ ] Have test UTM parameters ready: `?utm_source=test&utm_medium=manual&utm_campaign=pre-launch`
- [ ] Have Stripe test card ready: `4242 4242 4242 4242` (success) and `4000 0000 0000 0002` (decline)

---

## Phase 1: Critical Features Testing

### ✅ Error & Exception Tracking

**Test ID**: P1-ERROR-001

**Steps**:
1. Open browser console
2. Type: `throw new Error("Test PostHog Exception Tracking")`
3. Press Enter
4. Wait 30 seconds

**Verify in PostHog**:
- [ ] Go to Error Tracking dashboard
- [ ] See the exception "Test PostHog Exception Tracking"
- [ ] Verify it includes stack trace
- [ ] Verify timestamp is correct

**Expected**: Exception appears in Error Tracking with full details

---

### ✅ Marketing Attribution

**Test ID**: P1-ATTR-001

**Steps**:
1. Visit: `http://localhost:3000/?utm_source=test&utm_medium=manual_test&utm_campaign=pre_launch_2024`
2. Wait 10 seconds
3. Complete any form interaction

**Verify in PostHog**:
- [ ] Go to Events → Search for `marketing_attribution_captured`
- [ ] Verify event has properties:
  - `utm_source = test`
  - `utm_medium = manual_test`
  - `utm_campaign = pre_launch_2024`
- [ ] Go to Web Analytics → Traffic Sources
- [ ] Verify "test" appears as a source (not "Direct")

**Expected**: Attribution is captured and persists across all subsequent events

---

### ✅ User Identification

**Test ID**: P1-USER-001

**Steps**:
1. Go to eligibility form
2. Enter your real email: `your.email@example.com`
3. Fill in name: `Test User`
4. Complete and submit form
5. Wait 30 seconds

**Verify in PostHog**:
- [ ] Go to Persons page
- [ ] Search for your email
- [ ] Verify person exists with:
  - Email: `your.email@example.com`
  - First name: `Test`
  - Last name: `User`
  - Property: `identified_at`
  - Property: `first_seen_via = eligibility_check`

**Expected**: User profile created and subsequent events tied to this user

---

### ✅ PII Masking in Session Recordings

**Test ID**: P1-PII-001

**Steps**:
1. Go to eligibility form
2. Enter email: `sensitive@example.com`
3. Enter name: `John Doe`
4. Wait for recording to process (2-3 minutes)

**Verify in PostHog**:
- [ ] Go to Session Recordings
- [ ] Find your session (filter by last 10 minutes)
- [ ] Play the recording
- [ ] Verify email field is BLURRED/MASKED
- [ ] Verify name fields are BLURRED/MASKED
- [ ] Verify other fields (airline, airports) are visible

**Expected**: Sensitive fields (email, name) are masked; non-sensitive fields are visible

---

### ✅ Form Validation Error Tracking

**Test ID**: P1-VALID-001

**Steps**:
1. Go to eligibility form
2. Leave all fields empty
3. Click "Check Eligibility"
4. Note the validation errors shown

**Verify in PostHog**:
- [ ] Go to Events → Search for `form_validation_error`
- [ ] Verify multiple events captured (one per field)
- [ ] Check each event has:
  - `form_name = eligibility_check`
  - `field` (e.g., `flightNumber`, `airline`)
  - `error_message` (the actual error text)

**Expected**: Each validation error generates a separate event with field details

---

### ✅ Payment Error Tracking

**Test ID**: P1-PAY-001

**Steps**:
1. Complete eligibility form (must be eligible)
2. Click "File Claim"
3. Complete all claim form steps
4. At payment step, use card: `4000 0000 0000 0002` (card declined)
5. Submit payment

**Verify in PostHog**:
- [ ] Go to Events → Search for `payment_failed`
- [ ] Verify event has:
  - `error_type = stripe_error`
  - `error_code` (Stripe error code)
  - `error_message` (human-readable message)
  - `amount_cents`
  - `currency`

**Expected**: Payment failure tracked with full error details

---

### ✅ Email Parsing Events

**Test ID**: P1-EMAIL-001

**Steps**:
1. Go to eligibility form
2. Click "Email Parsing" tab
3. Paste invalid email content: "This is not a flight email"
4. Fill in email and name
5. Submit

**Verify in PostHog**:
- [ ] Go to Events → Search for:
  - `email_parsing_started` (should exist)
  - `email_parsing_failed` (should exist)
- [ ] Verify `email_parsing_failed` has:
  - `content_length`
  - `error` (message about parsing failure)
  - `disruption_type`

**Expected**: Both started and failed events captured with error details

---

## Phase 2: Enhanced Tracking Testing

### ✅ Form Abandonment Tracking

**Test ID**: P2-ABANDON-001

**Steps**:
1. Go to eligibility form
2. Start filling out form:
   - Enter airline: `AA`
   - Enter flight number: `AA100`
   - Leave other fields empty
3. Wait 5 seconds
4. Close the browser tab (or navigate away)
5. Wait 30 seconds

**Verify in PostHog**:
- [ ] Go to Events → Search for `eligibility_check_abandoned`
- [ ] Verify event has:
  - `time_spent_seconds` (around 5+)
  - `fields_completed` (around 2)
  - `total_fields` (total form fields)
  - `completion_percentage` (calculated %)

**Expected**: Abandonment tracked with accurate metrics

**Repeat for**:
- [ ] Email parsing form (`email_parsing_abandoned`)
- [ ] Claim submission form (`claim_submission_abandoned`)

---

### ✅ Time-on-Step Tracking

**Test ID**: P2-TIME-001

**Steps**:
1. Start a new claim (File Claim flow)
2. Step 1 (Personal Info): Fill out, wait 10 seconds, click Next
3. Step 2 (Flight Details): Fill out, wait 15 seconds, click Next
4. Step 3 (Verification): Wait 5 seconds, click Next
5. Continue through all steps

**Verify in PostHog**:
- [ ] Go to Events → Search for `claim_form_step_time`
- [ ] Verify events for each step:
  - Step 1: `time_spent_seconds ≈ 10`
  - Step 2: `time_spent_seconds ≈ 15`
  - Step 3: `time_spent_seconds ≈ 5`
- [ ] Each event has:
  - `step_number`
  - `step_name` (personal_info, flight_details, etc.)
  - `next_step`

**Expected**: Accurate time tracking for each form step

---

### ✅ API Error Tracking (Server-Side)

**Test ID**: P2-API-001

**Steps**:
1. This test requires breaking Airtable temporarily
2. Alternative: Check historical errors

**Verify in PostHog**:
- [ ] Go to Events → Search for `api_error`
- [ ] If any exist, verify they have:
  - `error_name`
  - `error_message`
  - `endpoint` (e.g., `/api/check-eligibility`)
  - `method` (POST/GET)
  - `userId` (if available)

**Expected**: Server errors tracked with full context

**Note**: This is passively tested. Check periodically post-launch.

---

## Phase 3: Advanced Features Testing

### ✅ Feature Flags - CTA Button Text

**Test ID**: P3-FLAG-001

**Steps**:
1. Visit homepage: `http://localhost:3000/`
2. Note the CTA button text
3. Open PostHog → Feature Flags
4. Find `hero-cta-text` flag
5. Override for your user: Set to "claim-now"
6. Refresh homepage
7. Verify button now says "Claim Now"

**Verify in PostHog**:
- [ ] Go to Events → Search for `feature_flag_called`
- [ ] Verify event has:
  - `flag_key = hero-cta-text`
  - `flag_value` (your override value)
  - `flag_type = string`

**Expected**: Button text changes based on flag; exposure tracked

**Repeat for**:
- [ ] Override to "get-started" → Button says "Get Started"
- [ ] Override to "check-eligibility" → Button says "Check Eligibility"

---

### ✅ Group Analytics - Airlines

**Test ID**: P3-GROUP-001

**Steps**:
1. Complete eligibility check with airline: `AA`
2. Note the departure and arrival airports
3. Wait 30 seconds

**Verify in PostHog**:
- [ ] Go to Persons & Groups → Groups → Airlines
- [ ] Find airline `AA`
- [ ] Verify it has:
  - `airline_code = AA`
  - Events associated with it
- [ ] Click into the airline
- [ ] See `eligibility_check_completed` event

**Expected**: Events are grouped by airline code

---

### ✅ Group Analytics - Routes

**Test ID**: P3-GROUP-002

**Steps**:
1. Same test as above
2. Note the route (e.g., `LAX-JFK`)

**Verify in PostHog**:
- [ ] Go to Persons & Groups → Groups → Routes
- [ ] Find route (e.g., `LAX-JFK`)
- [ ] Verify it has:
  - `route_id = LAX-JFK`
  - `origin_airport = LAX`
  - `destination_airport = JFK`
- [ ] Click into route
- [ ] See associated events

**Expected**: Events grouped by route with proper properties

---

## Full User Journey Tests

### 🎯 Complete Happy Path

**Test ID**: JOURNEY-001

**Steps**:
1. Visit with UTM: `http://localhost:3000/?utm_source=reddit&utm_medium=organic&utm_campaign=launch_week`
2. Complete eligibility form (use eligible flight)
3. Click "File Claim"
4. Complete all claim form steps
5. Complete payment (use `4242 4242 4242 4242`)

**Verify in PostHog**:
- [ ] Go to Events → Filter by your user
- [ ] Verify this sequence exists:
  1. `$pageview`
  2. `marketing_attribution_captured`
  3. `eligibility_check_started`
  4. `eligibility_check_completed`
  5. `file_claim_clicked`
  6. `claim_step_completed` (x5 for each step)
  7. `payment_initiated`
  8. `payment_completed`
- [ ] All events have UTM properties (`utm_source = reddit`)
- [ ] User is identified
- [ ] Airline and route groups are set

**Expected**: Full funnel tracked with attribution across all events

---

### 🎯 Abandonment Journey

**Test ID**: JOURNEY-002

**Steps**:
1. Visit homepage
2. Start eligibility form, fill 50% of fields
3. Close tab (abandon)
4. Return, start claim form, fill first step only
5. Close tab (abandon)

**Verify in PostHog**:
- [ ] `eligibility_check_interaction_started` exists
- [ ] `eligibility_check_abandoned` exists with ~50% completion
- [ ] `claim_submission_interaction_started` exists
- [ ] `claim_submission_abandoned` exists

**Expected**: Both abandonment events tracked at different stages

---

### 🎯 Error Journey

**Test ID**: JOURNEY-003

**Steps**:
1. Complete eligibility form with validation errors
2. Fix errors, submit successfully
3. Try payment with declined card
4. Retry with successful card

**Verify in PostHog**:
- [ ] Multiple `form_validation_error` events
- [ ] `eligibility_check_completed` (success)
- [ ] `payment_failed` event
- [ ] `payment_completed` event

**Expected**: Errors tracked, then successful completion tracked

---

## PostHog Dashboard Verification

### Check Core Dashboards

- [ ] **Main Conversion Funnel**: Shows steps with data
- [ ] **Form Analytics**: Shows abandonment and time metrics
- [ ] **Marketing Performance**: Shows UTM data
- [ ] **Error Monitoring**: Shows any errors encountered
- [ ] **Business Metrics**: Shows claims and compensation data

### Check Insights Load

- [ ] All dashboards load without errors
- [ ] Charts display data correctly
- [ ] No "No data" errors (if you've generated test data)
- [ ] Filters work (date range, breakdowns)

---

## Performance & Quality Checks

### Browser Performance

- [ ] PostHog doesn't slow down page load significantly
- [ ] No console errors related to PostHog
- [ ] Session recordings don't cause lag

### Data Quality

- [ ] Event properties are accurate (timestamps, values)
- [ ] User identification works consistently
- [ ] Attribution persists across sessions
- [ ] No duplicate events

### Privacy & Compliance

- [ ] PII masking works in recordings
- [ ] Error stack traces don't expose secrets
- [ ] API keys not visible in events
- [ ] User emails properly masked in UI

---

## Post-Testing Cleanup

### After Testing

- [ ] Clear test data from PostHog (optional)
- [ ] Remove any test feature flag overrides
- [ ] Document any issues found
- [ ] Create tickets for any bugs
- [ ] Update this checklist if new tests needed

### Before Launch

- [ ] All tests passing ✅
- [ ] Dashboards configured
- [ ] Alerts set up
- [ ] Team trained on PostHog usage
- [ ] Documentation reviewed

---

## Test Results Summary

**Tester Name**: ________________
**Date**: ________________
**Environment**: □ Local   □ Staging   □ Production

### Phase 1 Tests
- Total: 7 tests
- Passed: ___ / 7
- Failed: ___
- Notes: ________________

### Phase 2 Tests
- Total: 3 tests
- Passed: ___ / 3
- Failed: ___
- Notes: ________________

### Phase 3 Tests
- Total: 3 tests
- Passed: ___ / 3
- Failed: ___
- Notes: ________________

### Journey Tests
- Total: 3 tests
- Passed: ___ / 3
- Failed: ___
- Notes: ________________

### Overall Status
- [ ] All critical tests passed
- [ ] Ready for launch
- [ ] Issues need resolution

**Blockers**: ________________

**Next Steps**: ________________

---

## Troubleshooting Guide

### Events Not Appearing

**Problem**: Events not showing up in PostHog

**Solutions**:
1. Check browser console for errors
2. Verify PostHog API key in `.env.local`
3. Check network tab for failed POST requests to `/ingest`
4. Wait 1-2 minutes (events are batched)
5. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Feature Flags Not Working

**Problem**: Feature flag not changing behavior

**Solutions**:
1. Check flag exists in PostHog UI
2. Verify flag key matches exactly (case-sensitive)
3. Clear browser cache
4. Check for JavaScript errors
5. Verify `/decide` API call in network tab

### Session Recordings Missing

**Problem**: No recordings appear

**Solutions**:
1. Check PostHog project settings → Recordings enabled
2. Verify ad blocker isn't blocking PostHog
3. Check console for recording errors
4. Wait 2-3 minutes for processing
5. Try incognito mode

### Group Analytics Not Working

**Problem**: Groups not appearing

**Solutions**:
1. Verify `posthog.group()` called before events
2. Check group type exists in PostHog settings
3. Ensure `$groups` in event properties
4. Wait for data to process
5. Check for typos in group keys

---

## Support Resources

- **PostHog Docs**: https://posthog.com/docs
- **Setup Guide**: See `POSTHOG_SETUP_GUIDE.md`
- **Issue Tracker**: [Create GitHub issue]
- **Team Contact**: [Your support contact]

---

## Appendix: Test Data Examples

### Valid Flight Numbers
- `AA100` - American Airlines
- `BA200` - British Airways
- `LH400` - Lufthansa
- `UA500` - United Airlines

### Valid Airport Codes
- `LAX` - Los Angeles
- `JFK` - New York JFK
- `LHR` - London Heathrow
- `FRA` - Frankfurt

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Require 3DS: `4000 0025 0000 3155`

### Sample Email for Email Parsing
```
Subject: Flight Delay Notification - AA100

Dear Passenger,

Your flight AA100 from LAX to JFK on 2024-11-15 has been delayed by 4 hours due to technical issues.

American Airlines
```
