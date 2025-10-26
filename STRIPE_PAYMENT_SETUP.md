# Stripe Payment Infrastructure - Setup Guide

## Overview

This document describes the complete Stripe payment infrastructure for the Refund Finder application. The system collects a $49 upfront payment (tax-inclusive) from users and provides a 100% refund guarantee if we're unable to successfully file their claim.

## Architecture

### Components

1. **Frontend Components**
   - `ClaimSubmissionForm.tsx` - 5-step form with integrated payment
   - `PaymentStep.tsx` - Stripe payment UI with card element
   - `StripeProvider.tsx` - Stripe Elements wrapper

2. **Backend API Endpoints**
   - `/api/create-payment-intent` - Creates Stripe Payment Intent
   - `/api/create-claim` - Processes claim with payment verification
   - `/api/process-refund` - Issues refunds (manual/automatic)
   - `/api/webhooks/stripe` - Handles Stripe webhook events

3. **Database Layer (Airtable)**
   - Claims table - Stores claim information
   - Payments table - Tracks payment status
   - Refunds table - Logs refund transactions

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Generated after webhook setup

# Service Configuration
SERVICE_FEE_AMOUNT=4900  # $49.00 in cents
SERVICE_FEE_CURRENCY=usd
CLAIM_PROCESSING_DEADLINE_DAYS=10

# Airtable (when ready)
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
```

## Payment Flow

### 1. User Journey

```
Step 1: Personal Info
  ↓
Step 2: Flight Details
  ↓
Step 3: Documentation Upload
  ↓
Step 4: Review Claim
  ↓
Step 5: Payment (Stripe)
  ↓
Claim Submission
  ↓
Success Confirmation
```

### 2. Technical Flow

```
Frontend: Click "Continue" from Review
  ↓
API: POST /api/create-payment-intent
  ↓
Stripe: Create Payment Intent ($49)
  ↓
Frontend: Display Stripe Payment Element
  ↓
User: Enter card details
  ↓
Stripe: Process payment
  ↓
Frontend: handlePaymentSuccess
  ↓
API: POST /api/create-claim (with paymentIntentId)
  ↓
Backend: Verify payment status
  ↓
Backend: Save to Airtable (Claims + Payments)
  ↓
Response: Success with claim ID
```

## Refund System

### Automatic Refund Triggers

Refunds are issued automatically when:
1. Claim is marked as "rejected" by airline
2. Claim is not filed within 10 business days (configurable)

### Manual Refund Process

For manual refunds (support requests):

```bash
POST /api/process-refund
{
  "claimId": "claim-123456",
  "reason": "requested_by_customer",
  "processedBy": "support@example.com",
  "internalNotes": "Customer requested refund"
}
```

### Check Refund Eligibility

```bash
GET /api/process-refund?claimId=claim-123456
```

Response:
```json
{
  "eligible": true,
  "claimStatus": "rejected",
  "paymentStatus": "succeeded",
  "amount": 4900,
  "currency": "usd",
  "reason": "Claim is eligible for refund"
}
```

## Webhook Setup

### 1. Configure Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `refund.created`
   - `refund.updated`
5. Copy the webhook signing secret
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 2. Test Webhook Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook
stripe trigger payment_intent.succeeded
```

## Airtable Schema

### Claims Table

| Field Name | Type | Description |
|------------|------|-------------|
| Claim ID | Single line text | Unique claim identifier |
| First Name | Single line text | Customer first name |
| Last Name | Single line text | Customer last name |
| Email | Email | Customer email |
| Flight Number | Single line text | Flight number |
| Airline | Single line text | Airline name |
| Departure Date | Date | Flight departure date |
| Departure Airport | Single line text | Origin airport code |
| Arrival Airport | Single line text | Destination airport code |
| Delay Duration | Single line text | Delay length |
| Delay Reason | Long text | Reason for delay |
| Status | Single select | submitted, processing, filed, approved, rejected, refunded, completed |
| Estimated Compensation | Single line text | Estimated payout |
| Actual Compensation | Currency | Actual payout amount |
| Payment ID | Single line text | Link to payment record |
| Submitted At | Date & time | Submission timestamp |
| Filed At | Date & time | Filing timestamp |
| Completed At | Date & time | Completion timestamp |
| Boarding Pass Filename | Single line text | Boarding pass file name |
| Delay Proof Filename | Single line text | Delay proof file name |
| Internal Notes | Long text | Admin notes |
| Rejection Reason | Long text | Reason if rejected |

### Payments Table

| Field Name | Type | Description |
|------------|------|-------------|
| Payment ID | Single line text | Unique payment identifier |
| Stripe Payment Intent ID | Single line text | Stripe reference |
| Stripe Customer ID | Single line text | Stripe customer reference |
| Amount | Number | Amount in cents |
| Currency | Single line text | Currency code (usd) |
| Status | Single select | pending, succeeded, failed, refunded, partially_refunded |
| Email | Email | Customer email |
| Card Brand | Single line text | Visa, Mastercard, etc. |
| Card Last 4 | Single line text | Last 4 digits |
| Claim ID | Single line text | Link to claim |
| Created At | Date & time | Payment creation time |
| Succeeded At | Date & time | Payment success time |
| Refunded At | Date & time | Refund time |
| Refund Amount | Number | Refunded amount in cents |
| Refund Reason | Long text | Reason for refund |
| Refund Processed By | Single line text | Who processed refund |

### Refunds Table

| Field Name | Type | Description |
|------------|------|-------------|
| Refund ID | Single line text | Unique refund identifier |
| Payment ID | Single line text | Link to payment |
| Claim ID | Single line text | Link to claim |
| Stripe Refund ID | Single line text | Stripe refund reference |
| Amount | Number | Refund amount in cents |
| Reason | Single line text | Refund reason |
| Status | Single select | pending, succeeded, failed |
| Processed By | Single select | automatic, manual |
| Processed By User | Single line text | User who processed (if manual) |
| Created At | Date & time | Refund initiation time |
| Succeeded At | Date & time | Refund completion time |
| Internal Notes | Long text | Admin notes |

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

| Scenario | Card Number | Details |
|----------|-------------|---------|
| Success | 4242 4242 4242 4242 | Any future expiry, any CVC |
| Declined | 4000 0000 0000 0002 | Card declined |
| Insufficient funds | 4000 0000 0000 9995 | Insufficient funds |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

### Test Payment Flow

1. Fill out claim form with test data
2. Upload dummy documents
3. Review claim
4. Enter test card: `4242 4242 4242 4242`
5. Expiry: any future date
6. CVC: any 3 digits
7. Submit payment
8. Verify claim submission success

### Test Refund Flow

```bash
# Get claim ID from submission
CLAIM_ID="claim-123456"

# Check refund eligibility
curl http://localhost:3000/api/process-refund?claimId=$CLAIM_ID

# Process refund
curl -X POST http://localhost:3000/api/process-refund \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "'$CLAIM_ID'",
    "reason": "claim_unsuccessful",
    "processedBy": "support@example.com"
  }'
```

## Security Best Practices

### ✅ Implemented

- ✅ Stripe keys stored in environment variables
- ✅ Webhook signature verification
- ✅ Payment verification before claim submission
- ✅ PCI compliance (Stripe Elements handles card data)
- ✅ HTTPS enforced (via Vercel)
- ✅ Server-side payment validation

### 🔄 Recommended Next Steps

1. **Rate Limiting** - Add rate limiting to payment endpoints
2. **Idempotency Keys** - Prevent duplicate charges
3. **Fraud Detection** - Use Stripe Radar
4. **Email Notifications** - Send payment confirmations
5. **Admin Dashboard** - Build refund management UI
6. **Logging** - Implement structured logging for payments
7. **Monitoring** - Set up alerts for failed payments/refunds

## Production Checklist

Before going live:

- [ ] Replace test Stripe keys with live keys
- [ ] Set up production webhook endpoint
- [ ] Configure Stripe Tax for your business location
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email notifications (payment receipts, refunds)
- [ ] Test full payment flow in production
- [ ] Test refund flow in production
- [ ] Configure Airtable with production credentials
- [ ] Set up monitoring and alerts
- [ ] Review and test error handling
- [ ] Ensure HTTPS is enforced
- [ ] Add terms of service and privacy policy links
- [ ] Test on mobile devices
- [ ] Load test payment endpoints

## Troubleshooting

### Payment Intent Creation Fails

**Symptom**: Error when clicking "Continue" to payment step

**Solution**:
1. Check `STRIPE_SECRET_KEY` is set correctly
2. Verify network connectivity
3. Check browser console for errors
4. Ensure email is valid format

### Payment Succeeds but Claim Not Submitted

**Symptom**: Payment processed but no claim record

**Solution**:
1. Check Airtable credentials
2. Verify file upload succeeded
3. Check API logs for errors
4. Payment is captured - refund if needed

### Webhook Not Receiving Events

**Symptom**: Payment succeeds but database not updated

**Solution**:
1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` matches dashboard
3. Test webhook signature verification
4. Check webhook logs in Stripe dashboard

### Refund Fails

**Symptom**: Refund API returns error

**Solution**:
1. Check payment is in correct status
2. Verify payment hasn't already been refunded
3. Check Stripe account has sufficient balance
4. Review error message in response

## Support

For questions or issues:
- Check Stripe documentation: https://stripe.com/docs
- Review webhook logs in Stripe Dashboard
- Check server logs for detailed error messages
- Test in Stripe test mode first

## Future Enhancements

1. **Partial Refunds** - Deduct processing fee for partially successful claims
2. **Installment Plans** - Allow split payments for higher-value claims
3. **Multiple Payment Methods** - Add Apple Pay, Google Pay, etc.
4. **Dispute Management** - Handle chargeback disputes
5. **Analytics Dashboard** - Track payment metrics and revenue
6. **Automatic Retry** - Retry failed payments
7. **Save Payment Methods** - Store cards for repeat customers
8. **Subscription Model** - Monthly membership option

