# Stripe Production Setup Guide

## Current Status

✅ Live Stripe keys are now configured in Vercel production environment:
- `STRIPE_SECRET_KEY` - Live secret key (sk_live_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live publishable key (pk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Live webhook secret (whsec_...)

## Important: Configure Stripe Webhook for Production

To receive payment confirmations and automatically process claims after successful payments, you **must** configure a webhook endpoint in your Stripe dashboard.

### Step 1: Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **LIVE mode** (toggle in the top right corner)
3. Navigate to **Developers** → **Webhooks**

### Step 2: Add Webhook Endpoint

Click **+ Add endpoint** and configure:

**Endpoint URL:**
```
https://www.flghtly.com/api/webhooks/stripe
```

**Events to listen for:**
Select these events (or select "receive all events"):
- `payment_intent.succeeded` - When a payment is successful
- `payment_intent.payment_failed` - When a payment fails
- `charge.refunded` - When a refund is issued

### Step 3: Get Webhook Secret

1. After creating the webhook, Stripe will show you the **Signing secret**
2. It will look like: `whsec_...`
3. Copy this value

### Step 4: Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **flghtly** project
3. Go to **Settings** → **Environment Variables**
4. Find `STRIPE_WEBHOOK_SECRET` and update it with the new live webhook secret
5. Click **Save**
6. Redeploy your application

### Step 5: Test the Webhook

After setting up:

1. Go to your Stripe Dashboard → **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select `payment_intent.succeeded` event
5. Click **Send test webhook**

If configured correctly, you should see a ✅ success response (200 OK).

## Vercel Environment Variables Checklist

Ensure these are configured in **Production** environment:

- [x] `STRIPE_SECRET_KEY` - `sk_live_51SMGz...` (configured ✅)
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - `pk_live_...` (configured ✅)
- [x] `STRIPE_WEBHOOK_SECRET` - `whsec_...` (needs update after webhook creation)
- [ ] `STRIPE_PRICE_ID` - (optional, for tax calculation)
- [ ] `STRIPE_PRODUCT_ID` - (optional, for product metadata)

## Security Best Practices

### ✅ Do's:
- ✅ Use live keys only in production (Vercel)
- ✅ Use test keys for local development
- ✅ Never commit API keys to Git
- ✅ Regularly rotate webhook secrets
- ✅ Monitor webhook events in Stripe Dashboard

### ❌ Don'ts:
- ❌ Never hardcode API keys in source code
- ❌ Never share secret keys publicly
- ❌ Don't use live keys in development
- ❌ Don't expose keys in client-side code (except publishable keys)

## Testing Payments in Production

### 🚨 IMPORTANT: Live Mode vs Test Mode Cards

When using **LIVE API keys** in production, you **cannot** use standard test cards like `4242 4242 4242 4242`. Those only work with TEST API keys.

### Live Mode Test Cards

Use these special test cards that work with **LIVE API keys** (they create charges but don't actually process real money):

**✅ Success - Use This Card:**
- Card: `4000 0566 5566 5556`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any valid ZIP code (e.g., `10001`)

This card will successfully complete the payment flow without charging real money.

**❌ Common Mistake:**
```
Card: 4242 4242 4242 4242  ← DON'T USE IN PRODUCTION
```
This card **only works with TEST keys**. Using it with live keys will cause:
```
Error: No such payment_intent: 'pi_xxx'; a similar object exists
in live mode, but a test mode key was used to make this request.
```

### Test vs Live Mode Summary

| Environment | API Keys | Test Cards to Use |
|-------------|----------|-------------------|
| **Local Development** | `sk_test_...`, `pk_test_...` | `4242 4242 4242 4242` |
| **Production (Vercel)** | `sk_live_...`, `pk_live_...` | `4000 0566 5566 5556` |

### Additional Live Mode Test Scenarios

**Declined Payment:**
- Card: `4000 0000 0000 0341`
- Triggers: Card declined error

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`
- Triggers: Insufficient funds error

**3D Secure Required:**
- Card: `4000 0027 6000 3184`
- Triggers: 3D Secure authentication flow

For more test scenarios, see: https://stripe.com/docs/testing#international-cards

## Monitoring & Troubleshooting

### Check Payment Status
1. Go to Stripe Dashboard → **Payments**
2. View all successful and failed payments
3. Click on a payment to see details and logs

### Check Webhook Delivery
1. Go to Stripe Dashboard → **Webhooks**
2. Click on your endpoint
3. View **Attempts** tab to see delivery history
4. Failed webhooks will show error messages

### Common Issues

**Issue:** "Stripe not configured" error
- **Solution:** Verify environment variables are set in Vercel

**Issue:** Webhook not receiving events
- **Solution:** Check webhook URL is correct and endpoint is accessible

**Issue:** Signature verification failed
- **Solution:** Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook secret from Stripe dashboard

**Issue:** Payment succeeds but claim not updated
- **Solution:** Check webhook logs in Stripe Dashboard and Vercel logs

## Support

If you encounter any issues:

1. Check Vercel deployment logs
2. Check Stripe Dashboard webhook attempts
3. Check Sentry for error reports (if configured)
4. Review BetterStack logs (if configured)

## References

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Best Practices](https://stripe.com/docs/security/guide)
