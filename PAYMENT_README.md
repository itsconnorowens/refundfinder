# 💳 Payment System - Quick Reference

## 🎯 What We Built

A complete Stripe payment infrastructure that:
- Collects **$49 upfront** (tax-inclusive) before claim submission
- Provides **100% refund guarantee** if claim unsuccessful
- Automatically refunds rejected claims or claims not filed within 10 days
- Tracks all transactions in Airtable
- Processes payments securely via Stripe

---

## ⚡ Quick Start

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Payment Flow
1. Go to http://localhost:3000
2. Fill out claim form (Steps 1-4)
3. At payment step, use test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/25` (any future date)
   - **CVC**: `123` (any 3 digits)
4. Submit and verify success!

---

## 📁 Key Files

### Components
```
src/components/
├── ClaimSubmissionForm.tsx   # Main form with 5 steps (includes payment)
├── PaymentStep.tsx            # Stripe payment UI
└── StripeProvider.tsx         # Stripe Elements wrapper
```

### API Endpoints
```
src/app/api/
├── create-payment-intent/     # Creates $49 Payment Intent
├── create-claim/              # Verifies payment & saves claim
├── process-refund/            # Issues refunds
└── webhooks/stripe/           # Handles Stripe events
```

### Utilities
```
src/lib/
├── stripe-server.ts           # Stripe operations
└── airtable.ts                # Database operations
```

---

## 🔑 Environment Variables

Already configured in `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...                      # ✅ Set
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...    # ✅ Set
SERVICE_FEE_AMOUNT=4900                            # ✅ $49.00
CLAIM_PROCESSING_DEADLINE_DAYS=10                 # ✅ 10 days

# Add when ready:
STRIPE_WEBHOOK_SECRET=whsec_...                    # For webhooks
AIRTABLE_API_KEY=pat...                            # For database
AIRTABLE_BASE_ID=app...                            # For database
```

---

## 🧪 Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

Any future expiry, any 3-digit CVC

---

## 🔄 How It Works

### Payment Flow
```
1. User completes Steps 1-4
2. Click "Continue" → Payment Intent created ($49)
3. User enters card details
4. Payment processed by Stripe
5. Claim submitted with payment reference
6. Success! User gets confirmation
```

### Refund Flow
```
Automatic:
- Claim rejected → Full refund issued
- Not filed in 10 days → Full refund issued

Manual:
- Support receives request
- Admin calls refund API
- Full refund issued
```

---

## 📊 Airtable Setup (Optional Now)

When ready to use Airtable:

1. **Create base** with 3 tables: Claims, Payments, Refunds
2. **Follow guide**: See `AIRTABLE_SETUP_GUIDE.md`
3. **Add credentials** to `.env.local`
4. **Test connection**

Until then, data is logged to console ✅

---

## 🎯 API Reference

### Create Payment Intent
```bash
POST /api/create-payment-intent
Content-Type: application/json

{
  "email": "user@example.com",
  "claimId": "claim-123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: {
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "amount": 4900,
  "currency": "usd"
}
```

### Process Refund
```bash
POST /api/process-refund
Content-Type: application/json

{
  "claimId": "claim-123",
  "reason": "claim_unsuccessful",
  "processedBy": "support@example.com",
  "internalNotes": "Airline rejected claim"
}

Response: {
  "success": true,
  "message": "Refund processed successfully",
  "refund": {
    "id": "re_xxx",
    "amount": 4900,
    "currency": "usd",
    "status": "succeeded"
  }
}
```

### Check Refund Eligibility
```bash
GET /api/process-refund?claimId=claim-123

Response: {
  "eligible": true,
  "claimStatus": "rejected",
  "paymentStatus": "succeeded",
  "amount": 4900,
  "currency": "usd",
  "reason": "Claim is eligible for refund"
}
```

---

## 🐛 Troubleshooting

### Payment fails with "Invalid API key"
**Fix**: Restart dev server (`npm run dev`)

### "Airtable not configured" warning
**Fix**: This is normal! App works without Airtable.
- Logs to console instead
- Add Airtable when ready

### Payment succeeds but claim not saved
**Check**:
1. Server logs for errors
2. Airtable credentials (if configured)
3. Payment still captured in Stripe

### Webhook not working locally
**Setup Stripe CLI**:
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Replace test Stripe keys with live keys
- [ ] Set up production webhook in Stripe Dashboard
- [ ] Configure Airtable production base
- [ ] Test full flow end-to-end
- [ ] Enable Stripe Tax
- [ ] Set up email notifications
- [ ] Test refund workflow
- [ ] Mobile testing

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| **PAYMENT_QUICK_START.md** | 5-minute setup guide |
| **STRIPE_PAYMENT_SETUP.md** | Complete technical docs |
| **AIRTABLE_SETUP_GUIDE.md** | Database setup |
| **PAYMENT_IMPLEMENTATION_SUMMARY.md** | What was built |

---

## 💡 Common Tasks

### Issue a Manual Refund
```bash
curl -X POST http://localhost:3000/api/process-refund \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "claim-XXXXXXXX",
    "reason": "requested_by_customer"
  }'
```

### Check Stripe Dashboard
- Payments: https://dashboard.stripe.com/test/payments
- Refunds: https://dashboard.stripe.com/test/refunds
- Webhooks: https://dashboard.stripe.com/test/webhooks

### View Logs
```bash
# Development
npm run dev
# Check terminal for logs

# Production (Vercel)
vercel logs
```

---

## ✨ Features

- ✅ Secure payment collection
- ✅ 100% refund guarantee
- ✅ Automatic refund triggers
- ✅ Manual refund support
- ✅ Mobile-responsive UI
- ✅ Real-time webhook updates
- ✅ Transaction tracking
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation
- ✅ Payment verification

---

## 🎉 You're All Set!

Your payment infrastructure is ready to use. Test it out and deploy when ready!

**Questions?** Check the full documentation or review the inline code comments.

**Ready to deploy?** [[memory:9568842]] Commit and push to trigger automatic Vercel deployment.


