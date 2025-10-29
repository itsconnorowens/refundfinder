# End-to-End Email Testing Guide

## Overview
This guide walks through testing the complete email flow from claim submission to resolution.

**Estimated time:** 20-30 minutes  
**Prerequisites:** Dev server running, Stripe test mode enabled

---

## Test Flow Sequence

```
User Submits Claim → Payment → Confirmation Email
                                      ↓
                              Admin Reviews Claim
                                      ↓
                              Files with Airline → Filed Email
                                      ↓
                              Airline Acknowledges → Acknowledged Email
                                      ↓
                              Status Updates → Update Emails
                                      ↓
                      Airline Approves/Rejects → Resolution Email
```

---

## Phase 1: Claim Submission & Payment (Customer Flow)

### Step 1: Submit a Test Claim

**URL:** http://localhost:3000

**Test Data:**
```
Passenger Information:
- First Name: Test
- Last Name: User
- Email: itsconnorowens@gmail.com
- Phone: +1 555-0123

Flight Information:
- Flight Number: AA123
- Airline: American Airlines
- Departure Date: [Yesterday's date]
- Departure Airport: JFK
- Arrival Airport: LAX
- Delay Reason: Technical Issues
- Delay Duration: 4 hours
```

**Expected:** Form validation passes, proceeds to payment

### Step 2: Complete Payment

**Payment Details (Stripe Test Mode):**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Expected:** 
- Payment succeeds
- Redirects to success page
- Claim ID displayed

### Step 3: Verify Payment Confirmation Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: "Claim Submitted Successfully - AA123"
- ✅ Flight details (AA123, JFK → LAX)
- ✅ Estimated compensation amount
- ✅ Service fee ($49)
- ✅ Next steps explained
- ✅ "We will file within 48 hours" promise

**Checklist:**
- [ ] Email received within 2 minutes
- [ ] Not in spam folder
- [ ] All details correct
- [ ] Links work (if any)
- [ ] Looks good on mobile
- [ ] Reply-to is claims@flghtly.com

**Status:** ⏳ Awaiting test

---

## Phase 2: Admin Filing (Admin Flow)

### Step 4: Access Admin Dashboard

**URL:** http://localhost:3000/admin/login

**Credentials:** (Check your .env.local for ADMIN_EMAIL)

**Expected:** Successfully logged in to admin dashboard

### Step 5: Find the Test Claim

**Navigate to:** Claims list
**Find:** The AA123 claim you just created
**Status:** Should be "Pending" or "Ready to File"

### Step 6: File Claim with Airline

**Actions:**
1. Click on the claim
2. Review generated submission materials
3. Change status to "Filed"
4. Add airline reference number (e.g., "AA-REF-12345")
5. Save

**Expected:** 
- Status updates to "Filed"
- System triggers filed notification email

### Step 7: Verify Filed Notification Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: "Your claim has been filed with American Airlines"
- ✅ Claim ID
- ✅ Airline reference: AA-REF-12345
- ✅ Filing method
- ✅ Expected response time
- ✅ "We'll handle all follow-ups" message

**Checklist:**
- [ ] Email received within 2 minutes of status change
- [ ] Correct airline reference shown
- [ ] Professional tone
- [ ] No errors or placeholders

**Status:** ⏳ Awaiting test

---

## Phase 3: Status Updates

### Step 8: Airline Acknowledges Claim

**In Admin Dashboard:**
1. Open the same claim
2. Change status to "Acknowledged"
3. Update notes: "Airline confirmed receipt via email"
4. Save

**Expected:** Triggers acknowledgment email

### Step 9: Verify Acknowledgment Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: "American Airlines has acknowledged your claim"
- ✅ Status: Under Review
- ✅ Expected response time
- ✅ Reassurance message

**Checklist:**
- [ ] Email received
- [ ] Timeline is realistic
- [ ] Customer feels informed

**Status:** ⏳ Awaiting test

### Step 10: Test Status Update Email

**In Admin Dashboard:**
1. Open the claim
2. Change status to "Under Review"
3. Add custom message: "Airline is reviewing your documentation. We've provided all necessary evidence."
4. Save

**Expected:** Triggers generic status update email

### Step 11: Verify Status Update Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: "Update: Your claim status has changed"
- ✅ Previous status → New status
- ✅ Custom message displayed
- ✅ Next steps (if any)

**Checklist:**
- [ ] Email received
- [ ] Status change clearly communicated
- [ ] Custom message included

**Status:** ⏳ Awaiting test

---

## Phase 4: Resolution (Happy Path)

### Step 12: Airline Approves Claim

**In Admin Dashboard:**
1. Open the claim
2. Change status to "Approved"
3. Add compensation amount: €400
4. Add notes: "Airline approved compensation per EU261. Payment will be processed within 14 days."
5. Save

**Expected:** Triggers approval email

### Step 13: Verify Approval Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: Contains "approved" or "success"
- ✅ Compensation amount: €400
- ✅ Payment timeline
- ✅ What to expect next
- ✅ Celebration tone (it's good news!)

**Checklist:**
- [ ] Email received
- [ ] Amount is clearly stated
- [ ] Timeline is clear
- [ ] Positive, congratulatory tone

**Status:** ⏳ Awaiting test

---

## Phase 5: Resolution (Rejection Path)

### Step 14: Test Rejection Email

**Create another test claim** (repeat Steps 1-6 with flight BA456)

**In Admin Dashboard:**
1. Open the new BA456 claim
2. Change status to "Rejected"
3. Add rejection reason: "Airline claims delay was due to extraordinary circumstances (severe weather)"
4. Add notes: "We disagree with this assessment and recommend appealing. Contact us for next steps."
5. Save

**Expected:** Triggers rejection email

### Step 15: Verify Rejection Email

**Check:** itsconnorowens@gmail.com

**Email Should Include:**
- ✅ From: Claims @ Flghtly.com <claims@flghtly.com>
- ✅ Subject: Contains "rejected" or status update
- ✅ Rejection reason clearly stated
- ✅ Appeal options explained
- ✅ Next steps
- ✅ Empathetic tone

**Checklist:**
- [ ] Email received
- [ ] Rejection reason explained
- [ ] Appeal process outlined
- [ ] Contact information provided
- [ ] Professional, empathetic tone

**Status:** ⏳ Awaiting test

---

## Phase 6: Admin Alerts

### Step 16: Test Admin Ready-to-File Alert

**Trigger:** This is typically a cron job, but you can test manually

**Option A: Via API**
```bash
curl -X GET "http://localhost:3000/api/cron/check-ready-claims?secret=[CRON_SECRET]"
```

**Option B: Create 3+ claims and leave them in "Pending" status for 24+ hours** (not practical for immediate testing)

**Expected:** Admin receives alert email

**Email Should Include:**
- ✅ List of claims ready to file
- ✅ Flight details for each
- ✅ Links to admin dashboard
- ✅ Reminder of 48-hour promise

**Status:** ⚠️ Optional (requires cron setup or manual trigger)

---

## Email Quality Checklist

For **EACH** email received, verify:

### Content
- [ ] No placeholder text ({{variable}} not replaced)
- [ ] No "RefundFinder" references
- [ ] All "Flghtly" branding correct
- [ ] Correct email addresses (support@flghtly.com, claims@flghtly.com)
- [ ] Grammar and spelling perfect
- [ ] Professional tone appropriate for context

### Technical
- [ ] From: Claims @ Flghtly.com <claims@flghtly.com>
- [ ] Reply-to: claims@flghtly.com
- [ ] Subject line clear and specific
- [ ] Not in spam folder
- [ ] Received within 2 minutes of trigger

### Design
- [ ] HTML version renders correctly
- [ ] Responsive (looks good on mobile)
- [ ] Colors/branding consistent
- [ ] Links are clickable and work
- [ ] Footer includes contact info

### Deliverability
- [ ] SPF: PASS (check email headers)
- [ ] DKIM: PASS (check email headers)
- [ ] DMARC: PASS (check email headers)
- [ ] Not marked as spam

---

## How to Check Email Headers (Gmail)

1. Open the email
2. Click three dots (⋮) → "Show original"
3. Look for:
   ```
   SPF: PASS
   DKIM: PASS with d=flghtly.com
   DMARC: PASS
   ```

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Payment Confirmation Email | ⏳ | |
| Claim Filed Email | ⏳ | |
| Airline Acknowledged Email | ⏳ | |
| Status Update Email | ⏳ | |
| Claim Approved Email | ⏳ | |
| Claim Rejected Email | ⏳ | |
| Admin Alert Email | ⏳ | |

**Legend:**
- ⏳ Not tested yet
- ✅ Passed
- ❌ Failed (describe issue)
- ⚠️ Needs attention

---

## Common Issues & Fixes

### Email Not Received
1. Check spam folder
2. Wait 5 minutes (delayed delivery)
3. Check Resend dashboard for errors: https://resend.com/emails
4. Check console logs for errors
5. Verify RESEND_API_KEY is correct

### Email Has Placeholder Text
1. Check the email template in `email-service.ts`
2. Verify all variables are being passed correctly
3. Check console for template processing errors

### Email in Spam
1. Check SPF/DKIM/DMARC in email headers
2. Update SPF record if needed
3. Check content for spam triggers (excessive caps, etc.)
4. Test at mail-tester.com

### Wrong Email Address
1. Verify env variables are set correctly
2. Check email-service.ts for hardcoded addresses
3. Restart dev server after env changes

---

## After Testing

### ✅ All Tests Pass
You're ready for production! Next steps:
1. Set up Vercel environment variables
2. Deploy to production
3. Test on production domain
4. Monitor first 10 claims closely

### ⚠️ Some Tests Fail
1. Document issues in this file
2. Fix issues
3. Re-test failed scenarios
4. Don't deploy until all critical emails work

### Priority Levels
- **Critical:** Payment confirmation, filed notification
- **Important:** Status updates, resolution emails
- **Nice to have:** Admin alerts

---

## Quick Start Command

To start testing right now:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Submit test claim**
   - Use Stripe test card: 4242 4242 4242 4242
   - Use your email: itsconnorowens@gmail.com

4. **Check inbox** (including spam folder)

5. **Login to admin:**
   ```
   http://localhost:3000/admin/login
   ```

6. **Update claim status** and verify emails

---

## Notes Section

Use this space to document issues, observations, or improvements:

```
Test Date: __________
Tester: __________

Issues Found:
1. 
2. 
3. 

Observations:
1. 
2. 

Improvements Needed:
1. 
2. 
```

---

**Last Updated:** $(date)
**Status:** Ready for testing

