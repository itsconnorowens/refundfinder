# Vercel Environment Variables Setup Guide

## Critical Understanding: Build-Time vs Runtime Variables

### NEXT_PUBLIC_* Variables (Build-Time)

Variables prefixed with `NEXT_PUBLIC_` are **embedded into the frontend bundle at BUILD TIME**:

```javascript
// This value is baked into the JavaScript bundle during build
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

**Important:** Even if you update these in Vercel settings, they won't take effect until you trigger a **new build**.

### Regular Variables (Runtime - Server-Side Only)

Regular environment variables (without `NEXT_PUBLIC_`) are loaded at runtime and only available on the server:

```javascript
// This is loaded from Vercel environment at runtime
const stripeSecret = process.env.STRIPE_SECRET_KEY;
```

## Required Stripe Environment Variables

### For All Environments (Production, Preview, Development)

You **must** set these for **each environment** in Vercel:

| Variable Name | Value | Environment | Type |
|---------------|-------|-------------|------|
| `STRIPE_SECRET_KEY` | `sk_live_51SMGz...` | Production | Runtime (Server) |
| `STRIPE_SECRET_KEY` | `sk_test_51SMGz...` | Preview & Development | Runtime (Server) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production | **Build-Time** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Preview & Development | **Build-Time** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_MXqcXM...` | Production | Runtime (Server) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | Preview & Development | Runtime (Server) |

## How to Update Environment Variables in Vercel

### Step 1: Access Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your **flghtly** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Set Variables for Correct Environments

When adding/updating a variable, you'll see checkboxes:
- ☐ Production
- ☐ Preview
- ☐ Development

**For Production Live Keys:**
```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_51SMGz4B15Y260GV9CfZ37vbb0UV2zlzxVJBMDnuLNModePDvFYIEZnD27IdhAHGkrdyB5zZYPRDLIcVhP1rdUBV600wyJDaxvs
☑ Production
☐ Preview
☐ Development
```

**For Preview/Development Test Keys:**
```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51SMGz4B15Y260GV9CfZ37vbb0UV2zlzxVJBMDnuLNModePDvFYIEZnD27IdhAHGkrdyB5zZYPRDLIcVhP1rdUBV600wyJDaxvs
☐ Production
☑ Preview
☑ Development
```

### Step 3: Trigger New Build

After updating `NEXT_PUBLIC_*` variables, you **MUST** trigger a new build:

**Option A: Push to GitHub (Recommended)**
```bash
git commit --allow-empty -m "chore: rebuild with updated env vars"
git push origin main
```

**Option B: Manual Redeploy in Vercel**
1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy**
4. ⚠️ Make sure "Use existing Build Cache" is **UNCHECKED**

## Common Issues

### Issue: "Similar object exists in live mode, but test mode key was used"

**Cause:** Frontend bundle has `pk_test_` key baked in, but server is using `sk_live_` key.

**Solution:**
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set to `pk_live_...` for Production environment
2. Trigger a new build (not just redeploy)
3. Clear Vercel build cache if needed

### Issue: Changes to NEXT_PUBLIC_ variables not taking effect

**Cause:** The new values aren't being used during build.

**Solution:**
1. Double-check the variable is set for the correct environment (Production)
2. Redeploy **without** build cache
3. Check deployment logs to see what value was used during build

### Issue: Different values in Production vs Preview

**Cause:** Variables not set for both environments.

**Solution:**
- Set live keys ONLY for Production
- Set test keys for Preview and Development
- Use the environment checkboxes correctly

## Verification

### Verify Server-Side Keys (Runtime)

Check Vercel deployment logs - they should show:
```
✓ STRIPE_SECRET_KEY is configured
✓ Using Stripe API version: 2025-09-30.clover
```

### Verify Client-Side Keys (Build-Time)

After deployment, check browser console:
```javascript
// In browser console on flghtly.com
// Open DevTools → Sources → Search for "pk_"
// You should see pk_live_ (not pk_test_)
```

Or check the build logs in Vercel - look for:
```
info  - Loaded env from .env.production
```

## Best Practices

1. ✅ **Never commit API keys to Git**
2. ✅ **Use live keys only in Production environment**
3. ✅ **Use test keys for Preview and Development**
4. ✅ **Set NEXT_PUBLIC_ vars for each environment separately**
5. ✅ **Trigger new build after changing NEXT_PUBLIC_ vars**
6. ⚠️ **Don't enable build cache when changing env vars**
7. ⚠️ **Verify keys in deployment logs**

## Current Setup Status

Last verified: November 1, 2025

- [x] `STRIPE_SECRET_KEY` set for Production (live)
- [x] `STRIPE_WEBHOOK_SECRET` set for Production (live)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - **Needs verification for Production**

⚠️ **Action Required:** Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set to **pk_live_...** specifically for **Production** environment, then trigger a fresh build.
