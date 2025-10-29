# Email Infrastructure Testing Guide

## Pre-Test Checklist

### ✅ Environment Variables

Make sure your `.env.local` has these email settings:

```bash
# Email Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_resend_api_key
RESEND_FROM_EMAIL=claims@flghtly.com
FROM_NAME=Flghtly

# Optional: SendGrid as fallback
SENDGRID_API_KEY=your_sendgrid_key (if you have one)
```

### ✅ DNS Records (in Namecheap)

Verify these are set up correctly:

```
✓ MX Records - Namecheap's email forwarding MX servers (automatic)
✓ SPF (TXT) @ - v=spf1 include:amazonses.com include:spf.efwd.registrar-servers.com ~all
✓ DKIM (CNAME) resend._domainkey - [from Resend dashboard]
✓ DKIM (CNAME) resend2._domainkey - [from Resend dashboard]
✓ DKIM (CNAME) resend3._domainkey - [from Resend dashboard]
✓ DMARC (TXT) _dmarc - v=DMARC1; p=none;
```

### ✅ Email Forwarding (in Namecheap)

```
✓ Catch-all set up → your-personal@gmail.com
OR
✓ Individual forwards for claims@, support@, etc.
```

### ✅ Gmail "Send As" Setup

```
✓ Added claims@flghtly.com to Gmail
✓ SMTP: smtp.resend.com
✓ Port: 587
✓ Username: resend
✓ Password: [your Resend API key]
✓ Verified the address
```

---

## Test Suite

### Test 1: Sending from App (Resend API)

**Purpose:** Verify your app can send emails via Resend

**Steps:**
1. Start your dev server: `npm run dev`
2. Navigate to: http://localhost:3000/api/email?test=true
3. Or use this test script:

```bash
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "to": "your-email@gmail.com"
  }'
```

**Expected Result:**
- ✅ Email arrives in your Gmail inbox
- ✅ From: claims@flghtly.com
- ✅ Subject: Test Email from Flghtly
- ✅ Not in spam folder

---

### Test 2: Receiving Emails (Forwarding)

**Purpose:** Verify emails sent TO Flghtly addresses are forwarded to your Gmail

**Steps:**
1. From another email account (or Gmail), send an email TO: `claims@flghtly.com`
2. Wait 30-60 seconds
3. Check your Gmail inbox

**Expected Result:**
- ✅ Email arrives in your Gmail
- ✅ Shows as forwarded from claims@flghtly.com
- ✅ Arrives within 1-2 minutes

**Also test these addresses:**
- support@flghtly.com
- privacy@flghtly.com
- legal@flghtly.com
- any-random-name@flghtly.com (if using catch-all)

---

### Test 3: Gmail "Send As" (SMTP)

**Purpose:** Verify you can send emails AS claims@flghtly.com from Gmail

**Steps:**
1. In Gmail, click "Compose"
2. Click "From" dropdown
3. Select "claims@flghtly.com"
4. Send a test email to yourself
5. Check the email headers (Show original)

**Expected Result:**
- ✅ Email shows From: claims@flghtly.com
- ✅ Passes SPF/DKIM checks
- ✅ Not marked as spam
- ✅ Reply-to works correctly

---

### Test 4: Complete User Flow

**Purpose:** Test the full claim submission email flow

**Steps:**
1. Go through your claim submission flow on localhost
2. Submit a test claim
3. Enter your email address as the customer email
4. Complete payment (use Stripe test mode)
5. Check your email

**Expected Result:**
- ✅ Payment confirmation email arrives
- ✅ From: claims@flghtly.com
- ✅ Contains correct claim details
- ✅ Links work correctly
- ✅ Branding shows "Flghtly" everywhere

---

### Test 5: Email Templates

**Purpose:** Verify all email templates use correct branding and sender

**Test these email types:**

#### A. Payment Confirmation
- Trigger: Complete a claim payment
- Expected From: claims@flghtly.com
- Check: "Flghtly" branding throughout

#### B. Status Update
- Trigger: Update a claim status in admin
- Expected From: claims@flghtly.com
- Check: No "RefundFinder" references

#### C. Refund Notification
- Trigger: Process a refund
- Expected From: claims@flghtly.com
- Check: Email footer, signature, links

#### D. Follow-up Emails
- Trigger: Automated follow-up cron job
- Expected From: claims@flghtly.com
- Check: Support contact info correct

---

### Test 6: Email Deliverability

**Purpose:** Check email deliverability and spam scores

**Tools:**
1. **Mail-Tester**: https://www.mail-tester.com/
   - Send email to the provided address
   - Check your spam score (should be 8+/10)

2. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
   - Check: `flghtly.com`
   - Verify: MX, SPF, DKIM, DMARC all pass

3. **Gmail Header Check**:
   - Open any received email in Gmail
   - Click three dots → "Show original"
   - Check SPF, DKIM, DMARC all say "PASS"

**Expected Results:**
```
SPF: PASS
DKIM: PASS with d=flghtly.com
DMARC: PASS
Spam Score: 8+/10
```

---

### Test 7: Reply-To Functionality

**Purpose:** Verify customers can reply to your emails

**Steps:**
1. Send a test email from your app to your personal email
2. Reply to that email
3. Check where the reply goes

**Expected Result:**
- ✅ Reply goes to claims@flghtly.com
- ✅ Forwarded to your Gmail
- ✅ You can continue the conversation

---

### Test 8: Error Handling

**Purpose:** Verify bounces and errors are handled correctly

**Test Scenarios:**

#### A. Invalid Email Address
```bash
# Send to invalid address
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "invalid-email-that-does-not-exist@fakeasdasdasd.com",
    "subject": "Test Bounce"
  }'
```

**Expected:**
- ✅ Error logged in console
- ✅ Bounce notification in Resend dashboard
- ✅ App handles gracefully (doesn't crash)

#### B. Rate Limiting
- Send multiple emails rapidly
- Check Resend dashboard for rate limit warnings
- Verify app handles rate limits properly

---

## Troubleshooting

### Email Not Sending

**Check:**
1. RESEND_API_KEY is correct in .env.local
2. Resend domain is verified (green checkmark)
3. Console logs for errors
4. Resend dashboard → Logs for failed sends

**Common Issues:**
- API key expired or incorrect
- Domain not verified
- Rate limit exceeded
- Invalid email format

### Email Not Receiving

**Check:**
1. MX records are set correctly
2. Email forwarding is active in Namecheap
3. Check spam folder in Gmail
4. Verify catch-all or specific forwarder exists
5. DNS propagation complete (use mxtoolbox.com)

**Common Issues:**
- DNS not propagated (wait 30-60 min)
- Forwarding not enabled
- Gmail blocking forwarded emails
- MX records point to wrong servers

### Gmail "Send As" Not Working

**Check:**
1. SMTP credentials are correct
2. Port 587 (not 465)
3. Username is exactly "resend"
4. Password is your Resend API key
5. "Treat as alias" is UNCHECKED
6. Address is verified

**Common Issues:**
- Wrong SMTP settings
- API key has typo
- Not verified
- Gmail security blocking

### Spam Issues

**Check:**
1. SPF record includes amazonses.com
2. All 3 DKIM records present
3. DMARC record exists
4. Sending domain matches
5. Content not spammy

**Fix:**
- Add proper SPF/DKIM/DMARC
- Warm up domain (send gradually)
- Avoid spam trigger words
- Include unsubscribe link
- Use proper HTML formatting

---

## DNS Verification Commands

Run these to verify your DNS setup:

```bash
# Check MX records
dig MX flghtly.com +short

# Check SPF
dig TXT flghtly.com +short | grep spf1

# Check DKIM
dig TXT resend._domainkey.flghtly.com +short

# Check DMARC
dig TXT _dmarc.flghtly.com +short
```

**Expected outputs:**
```
MX: [Namecheap's email forwarding servers]
SPF: "v=spf1 include:amazonses.com include:spf.efwd.registrar-servers.com ~all"
DKIM: "p=MIGfMA..." (long key from Resend)
DMARC: "v=DMARC1; p=none;"
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Check Resend dashboard for failed sends
- [ ] Monitor bounce rate (<5% is good)
- [ ] Check spam complaints (<0.1%)

### Weekly Checks
- [ ] Review email logs in Resend
- [ ] Test sending/receiving still works
- [ ] Check deliverability score at mail-tester.com

### Monthly Checks
- [ ] Review and update email templates
- [ ] Check DNS records still correct
- [ ] Test all email flows end-to-end
- [ ] Update documentation if needed

---

## Success Criteria

✅ **All tests pass:**
- Sending from app works
- Receiving via forwarding works  
- Gmail "Send As" works
- All templates show "Flghtly" branding
- Deliverability score 8+/10
- No spam folder issues
- Reply-to works correctly
- Error handling works

✅ **Ready for production:**
- Update Vercel environment variables
- Test on production domain
- Monitor for first 24 hours
- Set up alerts for failures

---

## Quick Test Script

Save this as `test-email.js` in your project root:

```javascript
// Test email sending
async function testEmail() {
  const response = await fetch('http://localhost:3000/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'your-email@gmail.com',
      subject: 'Flghtly Email Test',
      type: 'test'
    })
  });
  
  const result = await response.json();
  console.log('✅ Email sent:', result);
}

testEmail();
```

Run with: `node test-email.js`

---

## Contact for Issues

If emails aren't working after following this guide:

1. Check Resend Status: https://resend.com/status
2. Check Namecheap Status: https://status.namecheap.com/
3. Verify DNS propagation: https://dnschecker.org/
4. Test deliverability: https://www.mail-tester.com/

---

**Last Updated:** $(date)
**Next Review:** [Schedule next review date]

