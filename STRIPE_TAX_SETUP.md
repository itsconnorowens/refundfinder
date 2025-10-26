# Stripe Tax Setup Guide

## Overview

Your payment system is configured to work with Stripe Tax, which automatically calculates and collects sales tax based on customer location. You have:

- **Product ID**: `prod_TItxZyQjnhz46Q`
- **Price ID**: `price_1SMI9GBm8UEEGTfqCQqe8k8T` ($49.00)

## What is Stripe Tax?

Stripe Tax automatically:
- Calculates sales tax, VAT, GST based on customer location
- Handles tax registration thresholds
- Files tax returns (with Stripe Tax + Automated Filing)
- Generates compliant invoices

## Current Setup

Your `.env.local` now includes:
```bash
STRIPE_PRICE_ID=price_1SMI9GBm8UEEGTfqCQqe8k8T
STRIPE_PRODUCT_ID=prod_TItxZyQjnhz46Q
SERVICE_FEE_AMOUNT=4900  # $49.00 backup
```

## How Tax Works with Your $49 Price

### Option 1: Tax-Inclusive Pricing (Current - Recommended)
- Customer pays exactly **$49.00** total
- Tax is included in the $49 price
- Simple, predictable pricing
- You pay the tax out of the $49

**Setup in Stripe Dashboard:**
1. Go to your Price: https://dashboard.stripe.com/test/prices/price_1SMI9GBm8UEEGTfqCQqe8k8T
2. Click "Edit price"
3. Under "Tax behavior" → Select **"Inclusive of tax"**
4. Save

### Option 2: Tax-Exclusive Pricing (Alternative)
- Customer pays **$49 + tax**
- Final amount varies by location (e.g., $49 + $3.92 = $52.92 in CA)
- Customer sees tax breakdown
- You receive full $49 + collect tax separately

**Setup in Stripe Dashboard:**
1. Go to your Price
2. Under "Tax behavior" → Select **"Exclusive of tax"**
3. Save
4. Update your UI to show "Starting at $49 + tax"

## Recommended: Tax-Inclusive Setup

Since you mentioned "tax should be included in that (not added on top)", here's how to ensure tax-inclusive pricing:

### 1. Configure Price in Stripe

```
1. Go to: https://dashboard.stripe.com/test/prices
2. Click on price_1SMI9GBm8UEEGTfqCQqe8k8T
3. Edit → Tax behavior → "Inclusive of tax"
4. Save
```

### 2. Enable Stripe Tax

```
1. Go to: https://dashboard.stripe.com/test/tax/registrations
2. Click "Start collecting tax"
3. Add your business location
4. Add where you want to collect tax (e.g., "United States")
5. Stripe will auto-calculate thresholds
```

### 3. Set Product Tax Category

```
1. Go to your product: prod_TItxZyQjnhz46Q
2. Under "Tax category" → Select appropriate category
   - "Digital services" if you consider this a digital service
   - "General - Tangible Goods" for physical service
   - "Service - General" for service business
3. Save
```

### 4. Test Tax Calculation

Test with different addresses:

**No tax (most states):**
- Address: Any state without economic nexus
- Total: $49.00

**With tax (CA example):**
- Address: California
- If tax-inclusive: Total = $49.00 (includes ~$3.92 CA tax)
- If tax-exclusive: Total = $52.92 ($49 + $3.92 tax)

## Test Tax Calculation

Use these test addresses in Stripe test mode:

```javascript
// California (sales tax)
{
  line1: "123 Main St",
  city: "San Francisco",
  state: "CA",
  postal_code: "94102",
  country: "US"
}

// New York (sales tax)
{
  line1: "123 Broadway",
  city: "New York",
  state: "NY",
  postal_code: "10007",
  country: "US"
}

// UK (VAT 20%)
{
  line1: "123 Oxford St",
  city: "London",
  postal_code: "W1D 1AN",
  country: "GB"
}
```

## Verification Checklist

- [ ] Price set to "Tax inclusive" in Stripe Dashboard
- [ ] Stripe Tax enabled for your business location
- [ ] Product tax category assigned
- [ ] Test payment with CA address shows $49.00 total
- [ ] Receipt shows tax breakdown
- [ ] Tax appears in Stripe Dashboard → Tax → Tax collected

## How It Works in Your Code

Your payment system now includes Price ID in metadata:

```typescript
// When creating payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 4900,
  currency: 'usd',
  metadata: {
    priceId: 'price_1SMI9GBm8UEEGTfqCQqe8k8T',
    claimId: 'claim-123',
  },
  // Stripe Tax will automatically calculate based on customer location
});
```

## Stripe Tax Dashboard

Monitor tax collection:

**Test Mode:**
https://dashboard.stripe.com/test/tax/tax-collected

**Live Mode (when ready):**
https://dashboard.stripe.com/tax/tax-collected

View:
- Total tax collected
- Tax by region
- Tax reports
- Filing status

## Tax Reporting & Filing

### Manual Reporting (Free)
- Download tax reports from Stripe Dashboard
- File with your accountant or tax service
- Report quarterly or annually

### Automated Filing (Stripe Tax + AutoFile)
- Stripe files tax returns automatically
- Available in US states and some international regions
- Additional fee: ~$25/month per jurisdiction
- Info: https://stripe.com/tax

## Production Setup

When going live:

1. **Replace with Live Price ID**
   - Create production price in live mode
   - Update `STRIPE_PRICE_ID` in Vercel environment variables

2. **Enable Live Stripe Tax**
   - Go to: https://dashboard.stripe.com/tax/registrations
   - Add your actual business registration
   - Select where you're collecting tax

3. **Update Tax Settings**
   - Ensure price is tax-inclusive
   - Verify product tax category
   - Test with real address

4. **Monitor Tax Collection**
   - Review collected tax in dashboard
   - Set up monthly review process
   - Prepare for tax filing

## Common Questions

### Q: Do I need to register for tax in every state?
**A:** Only if you exceed economic nexus thresholds ($100k-200k in sales per state). Stripe Tax tracks this automatically.

### Q: What if I'm registered in multiple states?
**A:** Add each registration in Stripe Dashboard → Tax → Registrations. Stripe will automatically apply the correct rates.

### Q: Can I change from inclusive to exclusive later?
**A:** Yes, but you'll need to:
1. Update the price in Stripe
2. Update your marketing materials
3. Communicate change to customers
4. Update UI to show "+ tax" if exclusive

### Q: How do refunds work with tax?
**A:** When you refund via the API, Stripe automatically refunds both the amount and the tax. No additional work needed!

### Q: Do I pay Stripe's fees on the tax amount?
**A:** No! Stripe only charges fees on your portion, not on the tax collected.

## Summary

**Current Setup:**
- ✅ Price ID configured: `price_1SMI9GBm8UEEGTfqCQqe8k8T`
- ✅ Product ID configured: `prod_TItxZyQjnhz46Q`
- ✅ Amount: $49.00
- ✅ Code updated to use Price ID

**Next Steps:**
1. Set price to "Tax inclusive" in Stripe Dashboard
2. Enable Stripe Tax
3. Set product tax category
4. Test with CA/NY addresses
5. Verify $49.00 total in test mode

**Result:**
- Customers see exactly $49.00 at checkout
- Tax automatically calculated and included
- You handle tax remittance based on your registrations
- Stripe provides reports for tax filing

## Resources

- [Stripe Tax Documentation](https://stripe.com/docs/tax)
- [Price Configuration](https://stripe.com/docs/billing/prices-guide)
- [Tax-Inclusive Pricing](https://stripe.com/docs/tax/tax-behavior)
- [Product Tax Categories](https://stripe.com/docs/tax/tax-categories)

---

**Need Help?** Check the Stripe Dashboard or contact Stripe Support for tax-specific questions.

