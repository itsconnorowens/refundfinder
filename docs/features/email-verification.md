# Email Verification System - Design & Implementation Plan

**Version:** 1.0
**Date:** October 31, 2024
**Status:** Design Phase
**Owner:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Problem Statement](#problem-statement)
4. [Solution Design](#solution-design)
5. [User Flows](#user-flows)
6. [Technical Architecture](#technical-architecture)
7. [Implementation Details](#implementation-details)
8. [Security & Privacy](#security--privacy)
9. [Migration & Rollout Plan](#migration--rollout-plan)
10. [Testing Strategy](#testing-strategy)
11. [Success Metrics](#success-metrics)
12. [Appendices](#appendices)

---

## Executive Summary

### Overview
This document outlines the design and implementation plan for adding email verification to the Flghtly claims submission process. The goal is to ensure users provide valid, accessible email addresses before payment, reducing support burden and preventing payment disputes.

### Key Decisions
- **Verification Timing:** Pre-payment (async during form completion)
- **Verification Method:** Magic link (one-click verification)
- **Status Updates:** Real-time polling (every 3 seconds)
- **User Experience:** Minimal friction through parallel verification

### Benefits
✅ Prevents payments from users with invalid emails
✅ Reduces support burden from undeliverable notifications
✅ Prevents payment disputes and chargebacks
✅ Establishes trust before payment
✅ Industry-standard approach with minimal friction

### Risks Mitigated
❌ Users paying $49 with typo'd email addresses
❌ Users not receiving claim confirmations
❌ Users disputing charges due to lack of communication
❌ Manual intervention required to fix email addresses
❌ Negative reviews from users who feel scammed

---

## Current System Analysis

### Authentication Status
**No Traditional User Authentication:**
- No signup/login system
- No user accounts or dashboards
- Email-based identification only
- Admin authentication exists but separate (cookie-based, protects `/admin/*`)

**Current Email Validation:**
```typescript
// From src/lib/payment.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  if (email.includes("..")) return false; // Prevents consecutive dots
  return true;
}
```
- Format validation only
- No verification of email ownership
- No check if email is deliverable

### Current User Journey
```
1. User lands on homepage
2. Fills out eligibility form (FlightLookupForm):
   - Flight details (flight number, airline, airports, date)
   - Disruption details (type, duration, etc.)
   - Personal info (firstName, lastName, email) ← Email entered here
3. Submits form → API checks eligibility
4. Sees eligibility results (EligibilityResults component)
5. If eligible, proceeds to payment:
   - Payment form appears inline (PaymentForm component)
   - Enters credit card details
   - Pays $49 via Stripe
6. Payment succeeded → Redirected to document upload page
7. Uploads documents (boarding pass, delay proof - optional)
8. Redirected to success page
9. Claim created in Airtable
10. Confirmation email sent (may fail if email invalid)
11. Admin files claim within 48 hours
12. User receives status updates via email throughout process
```

### Payment Flow
- **Provider:** Stripe
- **Amount:** $49 USD (or currency equivalent)
- **Process:**
  1. Payment intent created with metadata (claimId, email, etc.)
  2. User completes payment
  3. Webhook (`payment_intent.succeeded`) creates claim
  4. Confirmation email sent
  5. Claim status set to `validated`

### Email Communication Points
**Critical emails sent during claims process:**
1. Claim confirmation (post-payment)
2. Claim validated notification
3. Claim filed notification
4. Airline acknowledged notification
5. Status update notifications
6. Airline response notification
7. Claim approved/rejected notification
8. Refund notification (if applicable)

**If email is invalid, user receives NONE of these critical communications.**

### Database: Airtable
**Tables:**
- `Claims` - Main claim records
- `Payments` - Payment transactions
- `Refunds` - Refund records
- `Eligibility_Checks` - Pre-submission checks

**Relevant Claim Fields:**
```typescript
interface ClaimRecord {
  id: string;
  claimId: string;
  email: string; // Not verified currently
  firstName: string;
  lastName: string;
  status: ClaimStatus;
  // ... other fields
}
```

### Email Service
- **Providers:** Resend (primary), SendGrid (fallback), SMTP (generic fallback)
- **Templates:** 10+ notification templates
- **Features:** HTML/text formats, variables, attachments

---

## Problem Statement

### Critical Issues

#### 1. Payment Risk
Users can pay $49 with typo'd or invalid email addresses:
- Example: User types "gmial.com" instead of "gmail.com"
- Payment succeeds
- All confirmation and status emails fail
- User thinks they've been scammed
- Potential chargeback

#### 2. Communication Breakdown
Without valid email:
- No confirmation received
- No filing notification
- No status updates
- No approval/rejection notification
- User has no way to track their claim

#### 3. Support Burden
Support team must:
- Manually contact users through alternative channels
- Correct email addresses in Airtable
- Re-send all missed notifications
- Handle refund requests
- Manage negative reviews

#### 4. Trust & Credibility
- Users who pay but don't receive immediate confirmation may:
  - Think it's a scam
  - File chargebacks
  - Leave negative reviews
  - Warn others on social media

#### 5. No Deliverability Checks
Current validation only checks format, not:
- Whether domain exists
- Whether domain accepts email (MX records)
- Whether it's a disposable/temporary email
- Whether mailbox exists
- Whether email can actually be delivered

### Impact Assessment

**Without Email Verification:**
- Estimated 2-5% of users may have typos in email
- Each invalid email = 1-2 hours of support time
- Each dispute = potential chargeback fee ($15-25)
- Negative reviews impact conversion rate
- Manual intervention required for every case

**With Email Verification:**
- Catch 100% of invalid emails before payment
- Reduce support burden by ~90%
- Prevent chargebacks
- Improve user trust
- Small friction offset by massive benefit

---

## Solution Design

### Approach: Async Pre-Payment Verification with Real-Time Polling

#### Core Concept
Verify email ownership **before** payment, but do it **asynchronously** to minimize friction:

1. User enters email in eligibility form → verification email sent immediately
2. User continues filling remaining fields while verification happens in background
3. By the time user submits form and sees payment screen, email is likely already verified
4. If not verified yet, payment page polls status in real-time
5. Payment only enabled once email verified

#### Why This Approach?

**Comparison with Alternatives:**

| Approach | Friction | Safety | UX | Implementation |
|----------|----------|--------|-----|----------------|
| **Pre-payment async (recommended)** | ⚠️ Low-Medium | ✅ Excellent | ✅ Best | Medium |
| Post-payment | ✅ Lowest | ❌ Poor | ❌ Worst | Easy |
| Blocking pre-payment | ❌ High | ✅ Excellent | ⚠️ Okay | Easy |
| Optional with warnings | ✅ Low | ⚠️ Medium | ⚠️ Okay | Easy |

**Benefits of Async Pre-Payment:**
- ✅ Minimal friction - verification happens while user fills form
- ✅ Maximum safety - catches bad emails before payment
- ✅ Cross-device support - verify on phone, pay on desktop
- ✅ Industry standard - used by major platforms
- ✅ Clear UX - user knows email works before paying
- ✅ Prevents all payment-related risks

### Verification Method: Magic Link

**Magic Link vs. OTP Code:**

| Feature | Magic Link | OTP Code |
|---------|------------|----------|
| User steps | 1 click | Type 6 digits |
| Mobile-friendly | ✅ Excellent | ⚠️ Requires switching contexts |
| Security | ✅ Cryptographic token | ✅ Random code |
| Implementation | Medium | Easy |
| User preference | ✅ Preferred (less friction) | ⚠️ More friction |
| Expiry | 24 hours typical | 5-10 minutes typical |

**Decision: Magic Link**
- One-click verification
- Works seamlessly on mobile (click link in email app)
- Less context switching
- More secure (cryptographically secure tokens)
- Better UX

### Real-Time Status Updates: Polling

**Polling vs. Alternatives:**

| Method | Responsiveness | Complexity | Vercel-Compatible | API Calls |
|--------|---------------|------------|-------------------|-----------|
| **Polling (recommended)** | ✅ Good (2-3s delay) | ✅ Simple | ✅ Yes | ~30 per user |
| WebSockets | ✅ Instant | ❌ Complex | ⚠️ Limited | 1 connection |
| Server-Sent Events | ✅ Instant | ⚠️ Medium | ⚠️ Limited | 1 connection |
| Manual refresh | ❌ Poor | ✅ Simple | ✅ Yes | 1-2 per user |

**Decision: Polling**
- Good balance of responsiveness and simplicity
- Works perfectly with Vercel serverless
- Minimal API overhead (~30 requests per user worst case)
- Proven approach used by Stripe, PayPal, etc.

**Polling Strategy:**
- **Frequency:** Every 3 seconds
- **Start:** When user reaches payment page
- **Stop:** When verified OR after 5 minutes (timeout)
- **Timeout behavior:** Show "Still waiting? Resend email" button

---

## User Flows

### Flow 1: Happy Path (User Verifies During Form)

**Timeline:** ~3-5 minutes total

```
┌─────────────────────────────────────────────────────────────────┐
│ FlightLookupForm: Eligibility Form                              │
│ User enters flight details, disruption info, personal info      │
│ When email field is filled → Verification email sent            │
│ → User sees: "Check your email to verify your address"          │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User completes remaining fields (3-5 minutes)                   │
│                                                                  │
│ Meanwhile (in parallel):                                         │
│ → User checks email on phone                                    │
│ → Clicks verification link                                      │
│ → Sees confirmation: "Email verified! Return to Flghtly"        │
│ → Backend updates verification status                           │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Eligibility Results Displayed                                    │
│ → User sees eligibility verdict                                 │
│ → If eligible, payment form appears inline                      │
│ → Polls verification status                                     │
│ → Finds email already verified                                  │
│ → Shows: "✓ Email verified"                                     │
│ → Payment form displayed immediately                            │
│ → User proceeds to payment                                      │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Payment Success                                                  │
│ → Stripe processes payment                                      │
│ → User redirected to document upload page                       │
│ → Uploads documents (or skips)                                  │
│ → Claim created in Airtable                                     │
│ → Confirmation email sent (guaranteed deliverable)              │
│ → User redirected to success page                               │
└─────────────────────────────────────────────────────────────────┘
```

**User Experience:**
- ✅ No waiting - verification happens while user fills form
- ✅ Seamless - user barely notices verification step
- ✅ Confident - user knows email works before paying

---

### Flow 2: Delayed Path (User Doesn't Verify During Form)

**Timeline:** User rushes through form in ~1 minute

```
┌─────────────────────────────────────────────────────────────────┐
│ FlightLookupForm: User enters email                             │
│ Verification email sent                                          │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User rushes through remaining fields (1 minute)                 │
│ Submits form without checking email                             │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Payment Page (appears inline after eligibility check)           │
│                                                                  │
│ ┌──────────────────────────────────────────┐                    │
│ │ ⏳ Waiting for email verification        │                    │
│ │                                          │                    │
│ │ We've sent a verification link to:       │                    │
│ │ user@example.com                         │                    │
│ │                                          │                    │
│ │ Please check your email and click the    │                    │
│ │ verification link to continue.           │                    │
│ │                                          │                    │
│ │ Didn't receive it? [Resend Email]       │                    │
│ └──────────────────────────────────────────┘                    │
│                                                                  │
│ (Payment form is hidden/disabled)                               │
│ (Polling checks status every 3 seconds)                         │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User Actions:                                                    │
│ → Opens email app on phone                                      │
│ → Finds verification email                                      │
│ → Clicks verification link                                      │
│ → Sees confirmation page                                        │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Payment Page (Auto-updates within 3 seconds)                    │
│                                                                  │
│ ┌──────────────────────────────────────────┐                    │
│ │ ✓ Email verified!                        │                    │
│ │                                          │                    │
│ │ Your email has been successfully         │                    │
│ │ verified. You can now proceed with       │                    │
│ │ payment.                                 │                    │
│ └──────────────────────────────────────────┘                    │
│                                                                  │
│ [Payment form appears with smooth animation]                    │
│                                                                  │
│ (Polling stops)                                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User completes payment                                           │
└─────────────────────────────────────────────────────────────────┘
```

**User Experience:**
- ⏳ Brief wait at payment page
- ✅ Clear instructions on what to do
- ✅ Real-time update when verified (no refresh needed)
- ✅ Smooth transition to payment form

---

### Flow 3: Fallback Path (Can't Find Email / Wrong Email)

**Scenario 1: User Can't Find Verification Email**

```
┌─────────────────────────────────────────────────────────────────┐
│ Payment Page - Waiting for Verification                         │
│                                                                  │
│ User can't find email in inbox                                  │
│ → Checks spam folder (not there)                                │
│ → Clicks "Resend Email" button                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ System Actions:                                                  │
│ → Generates new verification token                              │
│ → Sends new email                                               │
│ → Shows confirmation: "Verification email resent!"              │
│ → Continues polling                                             │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User receives email, clicks link, verification succeeds         │
└─────────────────────────────────────────────────────────────────┘
```

**Scenario 2: User Realizes Email is Wrong**

```
┌─────────────────────────────────────────────────────────────────┐
│ Payment Page - Waiting for Verification                         │
│                                                                  │
│ User realizes they typo'd their email                           │
│ → Sees displayed email: "usre@example.com" (typo)               │
│ → Clicks "Change Email" link                                    │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Modal/Dialog:                                                    │
│                                                                  │
│ ┌──────────────────────────────────────────┐                    │
│ │ Update Email Address                     │                    │
│ │                                          │                    │
│ │ Current: usre@example.com               │                    │
│ │                                          │                    │
│ │ New email: [________________]            │                    │
│ │                                          │                    │
│ │ [Cancel]  [Update & Resend]             │                    │
│ └──────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User enters correct email → Clicks "Update & Resend"            │
│ → Backend updates email in form data                            │
│ → Sends verification to new email                               │
│ → Invalidates old token                                         │
│ → Continues polling                                             │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ User verifies new email, payment proceeds                        │
└─────────────────────────────────────────────────────────────────┘
```

**Scenario 3: Timeout (5 Minutes)**

```
┌─────────────────────────────────────────────────────────────────┐
│ Payment Page - After 5 Minutes of Polling                       │
│                                                                  │
│ ┌──────────────────────────────────────────┐                    │
│ │ ⏰ Still waiting for verification        │                    │
│ │                                          │                    │
│ │ We're still waiting for you to verify:   │                    │
│ │ user@example.com                         │                    │
│ │                                          │                    │
│ │ Need help?                               │                    │
│ │ • [Resend verification email]            │                    │
│ │ • [Change email address]                 │                    │
│ │ • [Contact support]                      │                    │
│ └──────────────────────────────────────────┘                    │
│                                                                  │
│ (Polling has stopped)                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 4: Cross-Device Verification

**Common scenario: User fills form on desktop, checks email on phone**

```
Desktop Browser                          Mobile Phone
─────────────────                        ────────────

Step 1: Enter email
→ Verification sent
                                         📧 Email arrives
Steps 2-5: Fill form
                                         Opens email app
                                         Clicks verification link
                                         ✓ "Email verified!"
                                         (Confirmation page)
Step 6: Payment page
→ Polls status
→ Finds verified ✓
→ Shows payment form
→ User completes payment
```

**This works seamlessly because:**
- Verification status stored server-side (Airtable or in-memory store)
- Polling checks server for latest status
- No device-specific storage required
- User can verify on any device

---

## Technical Architecture

### System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                                                                  │
│  ┌─────────────────┐     ┌──────────────────┐                   │
│  │ FlightLookupForm│─────│  PaymentForm     │                   │
│  │ (Homepage)      │     │  (Inline)        │                   │
│  │                 │     │                  │                   │
│  │ - Email input   │     │  - Polling logic │                   │
│  │ - Send verify   │     │  - Status UI     │                   │
│  │ - All form data │     │  - Stripe form   │                   │
│  └─────────────────┘     └──────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
           ↓                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/send-verification-email                        │   │
│  │ - Generate unique token                                  │   │
│  │ - Store token + email in verification store             │   │
│  │ - Send magic link email                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ GET /api/verify-email?token=xxx                          │   │
│  │ - Validate token                                         │   │
│  │ - Check expiry                                           │   │
│  │ - Mark email as verified                                │   │
│  │ - Show confirmation page                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ GET /api/verify-email/status?email=xxx                   │   │
│  │ - Check verification status for email                    │   │
│  │ - Return { verified: boolean, verifiedAt: Date | null } │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/create-payment-intent (existing)               │   │
│  │ - NEW: Check email verification status                   │   │
│  │ - Require verified=true before creating intent          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Verification Storage                          │
│                                                                  │
│  Option 1: In-Memory (Simple, requires Redis for production)    │
│  Option 2: Airtable Table (Consistent with existing setup)      │
│  Option 3: Vercel KV (Serverless-native, recommended)           │
│                                                                  │
│  Schema:                                                         │
│  {                                                               │
│    email: string (indexed)                                       │
│    token: string (indexed, unique)                               │
│    verified: boolean                                             │
│    verifiedAt: Date | null                                       │
│    sentAt: Date                                                  │
│    expiresAt: Date                                               │
│    attempts: number (for rate limiting)                          │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Email Service                               │
│                                                                  │
│  Existing: src/lib/email-service.ts                             │
│  → Add new template: emailVerification                          │
│  → Send magic link with verification URL                        │
└──────────────────────────────────────────────────────────────────┘
```

---

### Database Schema

#### Option 1: Airtable Table (Recommended for MVP)

**New Table: `Email_Verifications`**

| Field Name | Type | Description | Indexed | Required |
|------------|------|-------------|---------|----------|
| `id` | Auto-increment | Unique record ID | Yes | Yes |
| `email` | Email | User email address | Yes | Yes |
| `token` | Single line text | Verification token (UUID) | Yes | Yes |
| `verified` | Checkbox | Verification status | No | Yes |
| `verifiedAt` | Date/Time | When verified | No | No |
| `sentAt` | Date/Time | When email sent | No | Yes |
| `expiresAt` | Date/Time | Token expiry (24h from sentAt) | Yes | Yes |
| `attempts` | Number | Resend attempts (rate limiting) | No | Yes |
| `ipAddress` | Single line text | Requester IP (security) | No | No |
| `userAgent` | Long text | Requester UA (security) | No | No |

**Indexes:**
- `email` (for quick status lookups)
- `token` (for verification link lookups)
- `expiresAt` (for cleanup queries)

**Pros:**
- ✅ Consistent with existing Airtable setup
- ✅ No additional infrastructure
- ✅ Easy to query and debug
- ✅ Persists across server restarts
- ✅ Admin can view verification status

**Cons:**
- ⚠️ Airtable API rate limits (5 req/sec)
- ⚠️ Slightly slower than in-memory
- ⚠️ Requires cleanup job for expired tokens

---

#### Option 2: Vercel KV (Recommended for Scale)

**Using Vercel KV (Redis):**

```typescript
// Verification record stored as JSON
interface VerificationRecord {
  email: string;
  token: string;
  verified: boolean;
  verifiedAt: number | null; // Unix timestamp
  sentAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  attempts: number;
}

// Storage keys
const EMAIL_KEY = `verify:email:${email}`;
const TOKEN_KEY = `verify:token:${token}`;

// TTL: 24 hours (auto-cleanup)
```

**Pros:**
- ✅ Extremely fast (<10ms lookups)
- ✅ Serverless-native (Vercel platform)
- ✅ Auto-cleanup via TTL
- ✅ Handles high traffic
- ✅ No manual cleanup required

**Cons:**
- ⚠️ Requires Vercel KV setup
- ⚠️ Additional service dependency
- ⚠️ Not visible in Airtable admin

---

#### Claim Record Updates

**Existing Airtable `Claims` Table - Add Fields:**

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `emailVerified` | Checkbox | Email verification status | Yes |
| `emailVerifiedAt` | Date/Time | When email was verified | No |

**Update on claim creation:**
```typescript
// In POST /api/create-claim
const verificationStatus = await getVerificationStatus(email);

await createClaimInAirtable({
  // ... existing fields
  emailVerified: verificationStatus.verified,
  emailVerifiedAt: verificationStatus.verifiedAt,
});
```

---

### API Endpoints

#### 1. Send Verification Email

**Endpoint:** `POST /api/send-verification-email`

**Request:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  sentAt?: Date;
}
```

**Logic:**
```typescript
export async function POST(request: Request) {
  const { email } = await request.json();

  // 1. Validate email format
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: 'Invalid email format' },
      { status: 400 }
    );
  }

  // 2. Check rate limiting (max 3 attempts per hour)
  const existingRecord = await getVerificationRecord(email);
  if (existingRecord && existingRecord.attempts >= 3) {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (existingRecord.sentAt > hourAgo) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // 3. Generate verification token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // 4. Store verification record
  await createVerificationRecord({
    email,
    token,
    verified: false,
    verifiedAt: null,
    sentAt: new Date(),
    expiresAt,
    attempts: (existingRecord?.attempts || 0) + 1,
  });

  // 5. Generate verification URL
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`;

  // 6. Send email
  await sendEmail({
    to: email,
    template: 'emailVerification',
    variables: {
      verificationUrl,
      expiryHours: 24,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Verification email sent',
    sentAt: new Date(),
  });
}
```

**Rate Limiting:**
- Max 3 verification emails per hour per email address
- Returns 429 if exceeded

**Security:**
- Validate email format
- Use cryptographically secure tokens (UUID v4)
- Set expiry (24 hours)
- Log IP address (optional, for abuse detection)

---

#### 2. Verify Email (Magic Link Handler)

**Endpoint:** `GET /api/verify-email?token=xxx`

**Query Params:**
```typescript
{
  token: string;
}
```

**Response:** HTML page (confirmation or error)

**Logic:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(renderErrorPage('Missing token'), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  // 1. Lookup verification record by token
  const record = await getVerificationRecordByToken(token);

  if (!record) {
    return new Response(renderErrorPage('Invalid or expired token'), {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }

  // 2. Check expiry
  if (new Date() > record.expiresAt) {
    return new Response(renderErrorPage('Token has expired. Please request a new one.'), {
      headers: { 'Content-Type': 'text/html' },
      status: 410,
    });
  }

  // 3. Check if already verified
  if (record.verified) {
    return new Response(renderSuccessPage('Email already verified!'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // 4. Mark as verified
  await updateVerificationRecord(token, {
    verified: true,
    verifiedAt: new Date(),
  });

  // 5. Return success page
  return new Response(
    renderSuccessPage('Email verified successfully! You can now return to Flghtly to complete your payment.'),
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
```

**Success Page:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Email Verified - Flghtly</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>/* Tailwind-based styling */</style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>Email Verified!</h1>
    <p>Your email has been successfully verified.</p>
    <p>You can now return to Flghtly to complete your payment.</p>
    <a href="/" class="button">Return to Flghtly</a>
  </div>
</body>
</html>
```

---

#### 3. Check Verification Status (Polling)

**Endpoint:** `GET /api/verify-email/status?email=xxx`

**Query Params:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  verified: boolean;
  verifiedAt: Date | null;
}
```

**Logic:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    );
  }

  // 1. Get verification record
  const record = await getVerificationRecord(email);

  if (!record) {
    return NextResponse.json({
      verified: false,
      verifiedAt: null,
    });
  }

  // 2. Check expiry
  if (new Date() > record.expiresAt) {
    return NextResponse.json({
      verified: false,
      verifiedAt: null,
    });
  }

  // 3. Return status
  return NextResponse.json({
    verified: record.verified,
    verifiedAt: record.verifiedAt,
  });
}
```

**Rate Limiting:**
- Max 30 requests per minute per email (to prevent polling abuse)
- Use middleware or edge config for rate limiting

**Security Considerations:**
- **Option A:** Pass email in query (simpler, less secure)
- **Option B:** Pass temporary polling token instead of raw email (more secure)

**Recommended: Option B**
```typescript
// When user reaches payment page, generate polling token
const pollingToken = crypto.randomUUID();
await storePollingToken(pollingToken, email, { expiresIn: '10m' });

// Frontend polls with token instead of email
GET /api/verify-email/status?pollToken=xxx
```

---

#### 4. Update Payment Intent Creation

**Endpoint:** `POST /api/create-payment-intent` (existing, needs update)

**Add verification check:**
```typescript
export async function POST(request: Request) {
  const { email, /* ...other fields */ } = await request.json();

  // NEW: Check email verification status
  const verificationStatus = await getVerificationStatus(email);

  if (!verificationStatus.verified) {
    return NextResponse.json(
      {
        error: 'Email not verified',
        message: 'Please verify your email before proceeding with payment.',
      },
      { status: 403 }
    );
  }

  // Existing payment intent creation logic...
  const paymentIntent = await stripe.paymentIntents.create({
    // ...
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    claimId,
  });
}
```

**This ensures payment cannot proceed without verification, even if user bypasses frontend.**

---

### Frontend Components

#### 1. FlightLookupForm: Email Input

**Component:** `src/components/FlightLookupForm.tsx`

**Changes:**
```typescript
// Add state for verification status
const [emailVerificationSent, setEmailVerificationSent] = useState(false);
const [emailVerified, setEmailVerified] = useState(false);

// When user enters email (onBlur or after typing)
const handleEmailVerification = async (email: string) => {
  // Validate email format
  if (!isValidEmail(email)) {
    return;
  }

  // Send verification email
  const response = await fetch('/api/send-verification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    setEmailVerificationSent(true);
    // Show banner: "Check your email to verify your address"
  }
};
```

**UI Addition:**
```tsx
{emailVerificationSent && !emailVerified && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          {/* Mail icon */}
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-blue-800">
          Check your email
        </h3>
        <div className="mt-2 text-sm text-blue-700">
          <p>
            We've sent a verification link to <strong>{formData.email}</strong>.
            Please click the link to verify your email address.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

---

#### 2. PaymentForm: Payment Page (Verification Check + Polling)

**Component:** `src/components/PaymentForm.tsx`

**Add verification logic:**
```typescript
import { useEffect, useState, useCallback } from 'react';

export default function PaymentForm({ formData, eligibilityResults, onSuccess, onCancel }) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/verify-email/status?email=${encodeURIComponent(formData.email)}`
      );
      const data = await response.json();

      if (data.verified) {
        setEmailVerified(true);
        setPollingActive(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  }, [formData.email]);

  // Initial check on mount
  useEffect(() => {
    const initialCheck = async () => {
      setCheckingVerification(true);
      const verified = await checkVerificationStatus();
      setCheckingVerification(false);

      if (!verified) {
        // Start polling
        setPollingActive(true);
      }
    };

    initialCheck();
  }, [checkVerificationStatus]);

  // Polling effect
  useEffect(() => {
    if (!pollingActive || emailVerified) return;

    const pollInterval = setInterval(async () => {
      const verified = await checkVerificationStatus();
      if (verified) {
        setPollingActive(false);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setPollingActive(false);
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [pollingActive, emailVerified, checkVerificationStatus]);

  // Resend verification email
  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        // Show success toast
        toast.success('Verification email resent!');
        // Restart polling
        setPollingActive(true);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to resend email');
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
    }
  };

  // Render states
  if (checkingVerification) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Checking verification status...</p>
      </div>
    );
  }

  if (!emailVerified) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  We've sent a verification link to:
                </p>
                <p className="font-semibold mt-1">{formData.email}</p>
                <p className="mt-3">
                  Please check your email and click the verification link to continue with payment.
                </p>
              </div>

              {pollingActive && (
                <div className="mt-4 flex items-center text-sm text-yellow-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  Waiting for verification...
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleResendVerification}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Resend verification email
                </button>
                <button
                  onClick={onBack}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Change email address
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Email verified - show payment form
  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Email verified successfully!
            </p>
          </div>
        </div>
      </div>

      {/* Existing payment form */}
      <PaymentForm formData={formData} onSuccess={onSuccess} />
    </div>
  );
}
```

---

### Email Template

**Template ID:** `emailVerification`

**Subject:** Verify your email for Flghtly

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Flghtly" style="height: 40px;">
  </div>

  <!-- Main Content -->
  <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">
      Verify Your Email Address
    </h1>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
      Thank you for starting your flight compensation claim with Flghtly.
      Please verify your email address to continue with payment.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{{verificationUrl}}"
         style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verify Email Address
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
      This link will expire in {{expiryHours}} hours.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #2563eb; word-break: break-all; background: #fff; padding: 12px; border-radius: 4px; margin-top: 8px;">
      {{verificationUrl}}
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 30px;">
    <p>
      If you didn't request this email, you can safely ignore it.
    </p>
    <p style="margin-top: 16px;">
      © {{currentYear}} Flghtly. All rights reserved.
    </p>
  </div>

</body>
</html>
```

**Plain Text Template:**
```
Verify Your Email Address

Thank you for starting your flight compensation claim with Flghtly.

Please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in {{expiryHours}} hours.

If you didn't request this email, you can safely ignore it.

---
© {{currentYear}} Flghtly. All rights reserved.
```

**Variables:**
- `{{verificationUrl}}` - The magic link URL
- `{{expiryHours}}` - Hours until expiry (24)
- `{{logoUrl}}` - Flghtly logo URL
- `{{currentYear}}` - Current year

---

## Implementation Details

### Polling Strategy Details

**When to Poll:**
- Start: User reaches payment page (Step 6)
- Stop: Email verified OR 5 minutes elapsed

**Polling Frequency:**
- Every 3 seconds (balance between responsiveness and API load)
- Total polls in 5 minutes: ~100 requests
- Average polls (if user verifies in 30s): ~10 requests

**Timeout Behavior:**
```typescript
// After 5 minutes of polling
if (pollingElapsed >= 5 * 60 * 1000) {
  setPollingActive(false);
  // Show message: "Still waiting? Resend email or contact support"
}
```

**API Load Estimation:**
- If 100 users/day reach payment page unverified
- Each polls for average 30 seconds = 10 requests
- Total: 1,000 API requests/day
- Vercel Edge Functions: Free tier = 100k requests/month
- Cost: Negligible

---

### Security Measures

#### 1. Token Security
```typescript
// Generate cryptographically secure tokens
import { randomUUID } from 'crypto';

const token = randomUUID(); // UUIDv4
// Example: "550e8400-e29b-41d4-a716-446655440000"
```

**Properties:**
- Cryptographically random (not guessable)
- 128-bit entropy
- URL-safe
- Unique (collision probability: ~10^-18)

#### 2. Token Expiry
- **Duration:** 24 hours
- **Checked on:** Every verification attempt
- **Cleanup:** Expired tokens deleted automatically (if using KV) or via cron (if using Airtable)

#### 3. Rate Limiting

**Verification Email Sending:**
```typescript
// Max 3 attempts per hour per email
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

if (existingRecord.attempts >= MAX_ATTEMPTS) {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW;
  if (existingRecord.sentAt > windowStart) {
    throw new Error('Rate limit exceeded');
  }
}
```

**Status Polling:**
```typescript
// Max 30 requests per minute per email
// Implement using Vercel Edge Config or middleware
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
});

const { success } = await ratelimit.limit(email);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

#### 4. Email Validation Enhancements

**Beyond format validation:**
```typescript
import { validateEmail } from '@/lib/email-validation';

async function validateEmailDeep(email: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  // 1. Format validation
  if (!isValidEmail(email)) {
    return { valid: false, reason: 'Invalid format' };
  }

  // 2. Disposable email detection
  if (isDisposableEmail(email)) {
    return { valid: false, reason: 'Disposable email not allowed' };
  }

  // 3. MX record check (optional, adds latency)
  const hasMX = await checkMXRecords(email.split('@')[1]);
  if (!hasMX) {
    return { valid: false, reason: 'Domain does not accept email' };
  }

  // 4. Common typo detection
  const suggestion = detectTypo(email);
  if (suggestion) {
    return { valid: true, suggestion }; // Allow but suggest correction
  }

  return { valid: true };
}
```

**Typo Detection Examples:**
```typescript
const COMMON_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  // ... more
};

function detectTypo(email: string): string | null {
  const domain = email.split('@')[1];
  return COMMON_TYPOS[domain] || null;
}
```

#### 5. IP & User Agent Logging
```typescript
// Store IP and UA for abuse detection
await createVerificationRecord({
  // ... other fields
  ipAddress: request.headers.get('x-forwarded-for') || request.ip,
  userAgent: request.headers.get('user-agent'),
});
```

**Use cases:**
- Detect automated abuse
- Identify bot traffic
- Block malicious IPs

---

### Error Handling

#### Frontend Error States

**1. Verification Email Send Failed**
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-800">
    Failed to send verification email. Please try again or contact support.
  </p>
  <button onClick={handleResend} className="mt-2 text-red-600 underline">
    Retry
  </button>
</div>
```

**2. Token Expired**
```html
<!-- Shown on verification page -->
<div class="error-state">
  <h1>Verification Link Expired</h1>
  <p>This link has expired. Please request a new verification email.</p>
  <a href="/">Return to Flghtly</a>
</div>
```

**3. Rate Limit Exceeded**
```tsx
<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
  <p className="text-orange-800">
    Too many verification attempts. Please wait an hour before trying again.
  </p>
</div>
```

**4. Network Error During Polling**
```typescript
// Graceful degradation
try {
  const status = await checkVerificationStatus(email);
  setEmailVerified(status.verified);
} catch (error) {
  console.error('Polling error:', error);
  // Don't stop polling completely
  // Continue polling (will retry next interval)
}
```

#### Backend Error Handling

**Verification Email Send Failure:**
```typescript
try {
  await sendEmail({
    to: email,
    template: 'emailVerification',
    variables: { verificationUrl, expiryHours: 24 },
  });
} catch (error) {
  console.error('Failed to send verification email:', error);

  // Log to monitoring service
  await logError('verification_email_failed', { email, error });

  // Return error to frontend
  return NextResponse.json(
    {
      success: false,
      message: 'Failed to send verification email. Please try again.',
    },
    { status: 500 }
  );
}
```

**Database Write Failure:**
```typescript
try {
  await createVerificationRecord({...});
} catch (error) {
  console.error('Failed to create verification record:', error);

  // Retry once
  try {
    await createVerificationRecord({...});
  } catch (retryError) {
    // Log and return error
    await logError('verification_db_failed', { email, error: retryError });
    return NextResponse.json(
      { success: false, message: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
```

---

### UX Considerations

#### 1. Clear Messaging
**Always tell users:**
- ✅ What action is required ("Check your email and click the verification link")
- ✅ What email address was used (show it)
- ✅ What to do if email not received ("Resend" button)
- ✅ How long the link is valid (24 hours)

#### 2. Visual Feedback
**Loading states:**
```tsx
{checkingVerification && <Spinner message="Checking verification status..." />}
{pollingActive && <PulsingIcon message="Waiting for verification..." />}
```

**Success states:**
```tsx
<SuccessBanner message="✓ Email verified successfully!" />
```

**Error states:**
```tsx
<ErrorBanner message="Failed to send email. Please try again." />
```

#### 3. Smooth Transitions
**When email becomes verified:**
```tsx
// Animate payment form appearing
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <PaymentForm />
</motion.div>
```

#### 4. Mobile Optimization
**Cross-device flow:**
- User fills form on desktop
- Checks email on phone
- Clicks verification link on phone
- Returns to desktop to complete payment
- ✅ Works seamlessly (polling detects verification)

**Mobile-specific considerations:**
- Large, tappable "Verify Email" button in email
- Mobile-optimized confirmation page
- Clear "Return to Flghtly" button

#### 5. Accessibility
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {pollingActive && "Waiting for email verification"}
  {emailVerified && "Email verified successfully"}
</div>
```

**Screen reader announcements:**
- When verification email sent
- When verification completed
- When errors occur

---

## Security & Privacy

### Data Privacy

#### Personal Data Stored
**Verification records contain:**
- Email address (PII)
- IP address (optional, for abuse detection)
- User agent (optional, for abuse detection)
- Timestamps

**Retention Policy:**
- Verified records: 30 days (for debugging)
- Unverified records: 7 days
- Expired tokens: Delete immediately

**GDPR Compliance:**
```typescript
// User can request deletion of verification data
export async function deleteVerificationData(email: string) {
  await deleteVerificationRecord(email);
  await logDataDeletion(email, 'email_verification');
}
```

**Privacy Policy Update:**
Add section explaining:
- Email verification is required
- Verification link expires in 24 hours
- Data is stored temporarily for verification purposes
- User can request deletion at any time

---

### Security Best Practices

#### 1. Token Generation
✅ Use `crypto.randomUUID()` (cryptographically secure)
❌ Don't use `Math.random()` or sequential IDs

#### 2. HTTPS Only
✅ All verification links use HTTPS
✅ Set `Secure` flag on cookies (if using sessions)

#### 3. No Sensitive Data in URLs
✅ Token is random, reveals nothing about user
❌ Don't include email or user ID in verification URL

#### 4. Rate Limiting
✅ Limit verification email sends (3/hour)
✅ Limit status polling (30/minute)
❌ Don't allow unlimited requests (abuse vector)

#### 5. Expiry
✅ Tokens expire after 24 hours
✅ Check expiry on every verification attempt
❌ Don't allow expired tokens to work

#### 6. Single Use (Optional Enhancement)
```typescript
// Invalidate token after successful verification
await updateVerificationRecord(token, {
  verified: true,
  verifiedAt: new Date(),
  tokenUsed: true, // Prevent reuse
});
```

---

## Migration & Rollout Plan

### Phase 1: Database Setup (Week 1)

**Tasks:**
1. Create `Email_Verifications` table in Airtable (or setup Vercel KV)
2. Add `emailVerified` and `emailVerifiedAt` fields to `Claims` table
3. Test database operations (CRUD)
4. Setup cleanup cron job (if using Airtable)

**Success Criteria:**
- ✅ Can create verification records
- ✅ Can query by email and token
- ✅ Can update verification status
- ✅ Cleanup job runs successfully

---

### Phase 2: Backend Implementation (Week 1-2)

**Tasks:**
1. Create `/api/send-verification-email` endpoint
2. Create `/api/verify-email` endpoint (magic link handler)
3. Create `/api/verify-email/status` endpoint (polling)
4. Add email template: `emailVerification`
5. Update `/api/create-payment-intent` to check verification
6. Add rate limiting middleware
7. Add error handling and logging

**Success Criteria:**
- ✅ Can send verification emails
- ✅ Can verify emails via magic link
- ✅ Polling returns correct status
- ✅ Payment blocked if not verified
- ✅ Rate limiting works
- ✅ All errors logged properly

**Testing:**
- Unit tests for all endpoints
- Integration tests for full flow
- Manual testing with real emails

---

### Phase 3: Frontend Implementation (Week 2)

**Tasks:**
1. Update Step 1 to send verification email
2. Add verification banner to Steps 2-5
3. Update Step 6 (Payment) with verification check + polling
4. Add "Resend email" functionality
5. Add "Change email" functionality
6. Add loading states and error handling
7. Add success/error toasts
8. Test polling behavior

**Success Criteria:**
- ✅ Verification email sent on Step 1 completion
- ✅ Polling works on Step 6
- ✅ Payment form appears when verified
- ✅ Resend email works
- ✅ Change email works
- ✅ Mobile-friendly UI
- ✅ Accessible (ARIA labels, keyboard navigation)

**Testing:**
- E2E tests for all flows (happy, delayed, fallback)
- Cross-device testing (desktop form, mobile verification)
- Browser compatibility testing

---

### Phase 4: Testing & QA (Week 2-3)

**Test Scenarios:**

1. **Happy Path**
   - User enters email
   - Receives verification email within 1 minute
   - Clicks link while filling form
   - Reaches payment page, form appears immediately

2. **Delayed Verification**
   - User enters email
   - Rushes through form without verifying
   - Reaches payment page, sees waiting message
   - Verifies email, page updates within 3 seconds

3. **Resend Email**
   - User doesn't receive initial email
   - Clicks "Resend"
   - Receives new email, verifies successfully

4. **Change Email**
   - User enters wrong email
   - Reaches payment page
   - Clicks "Change email"
   - Updates email, receives new verification
   - Verifies and proceeds

5. **Expired Token**
   - User waits >24 hours
   - Clicks old verification link
   - Sees "expired" message
   - Requests new link, verifies successfully

6. **Rate Limiting**
   - User clicks "Resend" 4 times
   - Fourth attempt returns 429 error
   - User sees rate limit message

7. **Cross-Device**
   - User fills form on desktop
   - Checks email on phone
   - Clicks link on phone
   - Returns to desktop, payment form appears

**Performance Testing:**
- Verify polling doesn't cause performance issues
- Test with 100+ concurrent users
- Monitor API response times
- Check email delivery times

**Security Testing:**
- Test token guessing protection
- Verify rate limiting works
- Test expired token handling
- Check for XSS vulnerabilities in email templates

---

### Phase 5: Soft Launch (Week 3)

**Gradual Rollout:**
1. **10% of users** - Monitor closely
2. **25% of users** - Check metrics
3. **50% of users** - Validate stability
4. **100% of users** - Full rollout

**Feature Flag:**
```typescript
const EMAIL_VERIFICATION_ENABLED = process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION === 'true';

if (EMAIL_VERIFICATION_ENABLED) {
  // Show verification flow
} else {
  // Skip to payment (old behavior)
}
```

**Monitoring:**
- Verification email send success rate
- Verification completion rate
- Time to verify (average)
- Polling API load
- Payment conversion rate (before vs after)
- Support ticket volume

**Success Metrics:**
- >95% verification email delivery
- >90% users verify within 5 minutes
- <1% support tickets related to verification
- Payment conversion rate unchanged or improved

---

### Phase 6: Full Launch (Week 4)

**Actions:**
1. Remove feature flag
2. Make verification mandatory for all users
3. Update documentation
4. Monitor for 1 week
5. Gather user feedback

**Communication:**
- No user-facing announcement needed (seamless)
- Internal team briefing on new flow
- Support team training on troubleshooting

---

### Rollback Plan

**If critical issues occur:**

1. **Immediate:** Disable feature flag (revert to no verification)
2. **Within 1 hour:** Identify and fix issue
3. **Within 24 hours:** Re-enable feature flag at 10%
4. **Monitor:** Gradual rollout again

**Rollback Trigger Criteria:**
- Verification email delivery <85%
- Payment conversion rate drops >20%
- Support tickets increase >5x
- Critical bug preventing payments

---

## Testing Strategy

### Unit Tests

**Backend:**
```typescript
describe('Email Verification API', () => {
  describe('POST /api/send-verification-email', () => {
    it('sends verification email for valid email', async () => {
      const response = await POST({ email: 'test@example.com' });
      expect(response.status).toBe(200);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('rejects invalid email format', async () => {
      const response = await POST({ email: 'invalid' });
      expect(response.status).toBe(400);
    });

    it('enforces rate limiting', async () => {
      // Send 3 emails
      await POST({ email: 'test@example.com' });
      await POST({ email: 'test@example.com' });
      await POST({ email: 'test@example.com' });

      // 4th should fail
      const response = await POST({ email: 'test@example.com' });
      expect(response.status).toBe(429);
    });
  });

  describe('GET /api/verify-email', () => {
    it('verifies valid token', async () => {
      const token = await createVerificationToken('test@example.com');
      const response = await GET({ token });
      expect(response.status).toBe(200);

      const record = await getVerificationRecord('test@example.com');
      expect(record.verified).toBe(true);
    });

    it('rejects expired token', async () => {
      const token = await createExpiredToken('test@example.com');
      const response = await GET({ token });
      expect(response.status).toBe(410);
    });

    it('rejects invalid token', async () => {
      const response = await GET({ token: 'invalid' });
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/verify-email/status', () => {
    it('returns verified status', async () => {
      await createVerifiedRecord('test@example.com');
      const response = await GET({ email: 'test@example.com' });
      const data = await response.json();

      expect(data.verified).toBe(true);
      expect(data.verifiedAt).toBeDefined();
    });

    it('returns unverified status', async () => {
      await createUnverifiedRecord('test@example.com');
      const response = await GET({ email: 'test@example.com' });
      const data = await response.json();

      expect(data.verified).toBe(false);
      expect(data.verifiedAt).toBeNull();
    });
  });
});
```

**Frontend:**
```typescript
describe('PaymentStep', () => {
  it('shows payment form if email verified', async () => {
    mockVerificationStatus({ verified: true });
    render(<PaymentStep formData={{ email: 'test@example.com' }} />);

    await waitFor(() => {
      expect(screen.getByText('Email verified')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
    });
  });

  it('shows waiting message if email not verified', async () => {
    mockVerificationStatus({ verified: false });
    render(<PaymentStep formData={{ email: 'test@example.com' }} />);

    await waitFor(() => {
      expect(screen.getByText(/waiting for verification/i)).toBeInTheDocument();
    });
  });

  it('polls verification status every 3 seconds', async () => {
    mockVerificationStatus({ verified: false });
    render(<PaymentStep formData={{ email: 'test@example.com' }} />);

    await waitFor(() => {
      expect(checkVerificationStatus).toHaveBeenCalledTimes(1);
    });

    await wait(3000);
    expect(checkVerificationStatus).toHaveBeenCalledTimes(2);
  });

  it('updates UI when verification completes', async () => {
    const { rerender } = render(<PaymentStep formData={{ email: 'test@example.com' }} />);

    // Initially unverified
    mockVerificationStatus({ verified: false });
    await waitFor(() => {
      expect(screen.getByText(/waiting for verification/i)).toBeInTheDocument();
    });

    // Becomes verified
    mockVerificationStatus({ verified: true });
    rerender(<PaymentStep formData={{ email: 'test@example.com' }} />);

    await waitFor(() => {
      expect(screen.getByText('Email verified')).toBeInTheDocument();
    });
  });
});
```

---

### Integration Tests

```typescript
describe('Email Verification Flow', () => {
  it('completes full verification flow', async () => {
    // 1. User enters email
    const { user } = renderClaimForm();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // 2. Verification email sent
    await waitFor(() => {
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          template: 'emailVerification',
        })
      );
    });

    // 3. User clicks verification link
    const email = emailService.sendEmail.mock.calls[0][0];
    const verificationUrl = email.variables.verificationUrl;
    const response = await fetch(verificationUrl);
    expect(response.status).toBe(200);

    // 4. User reaches payment page
    await user.click(screen.getByRole('button', { name: /next/i })); // Multiple times

    // 5. Payment form appears
    await waitFor(() => {
      expect(screen.getByText('Email verified')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
    });
  });
});
```

---

### E2E Tests (Playwright)

```typescript
test('email verification flow', async ({ page }) => {
  // 1. Start claim
  await page.goto('/');
  await page.click('text=Start Claim');

  // 2. Enter email
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Continue")');

  // 3. See verification banner
  await expect(page.locator('text=Check your email')).toBeVisible();

  // 4. Complete rest of form
  // ... (fill flight details, upload docs, etc.)

  // 5. Reach payment page
  await page.click('button:has-text("Continue to Payment")');

  // 6. See waiting message
  await expect(page.locator('text=Waiting for verification')).toBeVisible();

  // 7. Verify email (simulate clicking link in new tab)
  const verificationUrl = await getVerificationUrlFromEmail('test@example.com');
  await page.goto(verificationUrl);
  await expect(page.locator('text=Email verified')).toBeVisible();

  // 8. Return to payment page
  await page.goBack();

  // 9. Payment form appears
  await expect(page.locator('button:has-text("Pay")')).toBeVisible({ timeout: 5000 });
});

test('resend verification email', async ({ page }) => {
  // ... navigate to payment page without verifying

  await page.click('button:has-text("Resend")');
  await expect(page.locator('text=Verification email resent')).toBeVisible();

  // Verify new email sent
  const emailCount = await getEmailCount('test@example.com');
  expect(emailCount).toBe(2);
});
```

---

## Success Metrics

### Primary Metrics

**1. Verification Completion Rate**
- **Target:** >90% of users verify within 5 minutes
- **Formula:** (Users verified / Users who received email) × 100
- **Tracking:** Log verification events

**2. Email Delivery Success Rate**
- **Target:** >95% emails delivered
- **Formula:** (Emails delivered / Emails sent) × 100
- **Tracking:** Monitor email service webhooks

**3. Payment Conversion Rate**
- **Target:** No decrease (or slight increase)
- **Formula:** (Payments completed / Users reached Step 6) × 100
- **Tracking:** Compare before/after implementation

**4. Support Ticket Reduction**
- **Target:** <1% tickets related to email verification
- **Formula:** (Verification tickets / Total tickets) × 100
- **Tracking:** Tag support tickets by category

---

### Secondary Metrics

**5. Average Time to Verify**
- **Target:** <2 minutes
- **Formula:** Average(verifiedAt - sentAt)
- **Tracking:** Calculate from verification records

**6. Resend Email Rate**
- **Target:** <10% of users need to resend
- **Formula:** (Users who resend / Total users) × 100
- **Tracking:** Log resend events

**7. Polling API Load**
- **Target:** <30 requests per user
- **Formula:** Average(polling requests per user)
- **Tracking:** API analytics

**8. Typo Detection Effectiveness**
- **Target:** >5% of emails have typos caught
- **Formula:** (Typos detected / Total emails) × 100
- **Tracking:** Log typo suggestions shown

---

### Monitoring Dashboard

**Real-Time Metrics:**
```
┌─────────────────────────────────────────────────┐
│ Email Verification Dashboard                    │
├─────────────────────────────────────────────────┤
│ Today's Stats:                                  │
│ • Verification emails sent: 143                 │
│ • Emails verified: 128 (89.5%)                  │
│ • Avg time to verify: 2m 14s                    │
│ • Resend requests: 12 (8.4%)                    │
│ • Failed deliveries: 2 (1.4%)                   │
│                                                 │
│ Last 7 Days:                                    │
│ • Total verifications: 892                      │
│ • Verification rate: 91.2%                      │
│ • Support tickets: 3 (0.3%)                     │
│                                                 │
│ Alert Thresholds:                               │
│ ✅ Verification rate: >90% (target: 90%)        │
│ ✅ Delivery rate: 98.6% (target: 95%)           │
│ ⚠️  Avg verify time: 2m 14s (target: <2m)      │
└─────────────────────────────────────────────────┘
```

---

## Appendices

### Appendix A: Alternative Approaches Considered

#### Approach 1: Post-Payment Verification
**How it works:** User pays first, then must verify email to receive updates

**Pros:**
- Lowest friction
- Fastest time to payment

**Cons:**
- User already paid if email invalid
- Payment disputes likely
- Support burden high
- User experience poor

**Decision:** Rejected due to high risk

---

#### Approach 2: OTP Code Verification
**How it works:** Email contains 6-digit code, user enters in form

**Pros:**
- Familiar pattern
- No URL clicking required

**Cons:**
- More friction (context switching)
- Mobile unfriendly (requires typing)
- Higher error rate (typos in code)

**Decision:** Rejected in favor of magic link

---

#### Approach 3: Optional Verification with Warnings
**How it works:** Strongly encourage verification but allow payment without it

**Pros:**
- User choice
- Low friction for confident users

**Cons:**
- Some users ignore warnings
- Doesn't solve core problem
- Support burden still exists

**Decision:** Rejected - doesn't fully solve problem

---

### Appendix B: Email Service Configuration

**Resend (Primary):**
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=claims@flghtly.com
RESEND_FROM_NAME=Flghtly
```

**SendGrid (Fallback):**
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=claims@flghtly.com
SENDGRID_FROM_NAME=Flghtly
```

**Domain Setup:**
- Add SPF record: `v=spf1 include:_spf.resend.com ~all`
- Add DKIM records (provided by Resend)
- Verify domain in Resend dashboard

---

### Appendix C: Database Cleanup Job

**For Airtable Implementation:**

```typescript
// cron job: daily at 2am
import { deleteExpiredVerifications } from '@/lib/verification-service';

export async function cleanupExpiredVerifications() {
  const now = new Date();

  // Delete records older than 30 days
  const cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const deleted = await airtable('Email_Verifications')
    .select({
      filterByFormula: `IS_BEFORE({expiresAt}, '${cutoffDate.toISOString()}')`,
    })
    .all()
    .then(records => {
      return Promise.all(records.map(r => airtable('Email_Verifications').destroy(r.id)));
    });

  console.log(`Cleaned up ${deleted.length} expired verification records`);
}
```

**Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-verifications",
    "schedule": "0 2 * * *"
  }]
}
```

---

### Appendix D: Monitoring & Alerts

**Sentry Alerts:**
```typescript
import * as Sentry from '@sentry/nextjs';

// Alert if verification email delivery rate drops below 90%
if (deliveryRate < 0.90) {
  Sentry.captureMessage('Low email delivery rate', {
    level: 'warning',
    tags: { metric: 'email_delivery' },
    extra: { deliveryRate, totalSent },
  });
}

// Alert if verification rate drops below 85%
if (verificationRate < 0.85) {
  Sentry.captureMessage('Low verification completion rate', {
    level: 'warning',
    tags: { metric: 'verification_rate' },
    extra: { verificationRate, totalEmails },
  });
}
```

**Email Alerts to Team:**
```typescript
// If critical threshold breached, email team
if (verificationRate < 0.75) {
  await sendEmail({
    to: 'team@flghtly.com',
    subject: '🚨 Alert: Email verification rate critically low',
    template: 'adminAlert',
    variables: {
      metric: 'Verification Rate',
      value: `${verificationRate * 100}%`,
      threshold: '75%',
      action: 'Investigate email deliverability and user friction',
    },
  });
}
```

---

### Appendix E: FAQ

**Q: What if user never receives verification email?**
A: They can click "Resend email" button. If still not received, they can click "Change email" to use a different address.

**Q: What if user verifies on phone but payment page on desktop doesn't update?**
A: Polling should detect verification within 3 seconds. If not, user can manually refresh page.

**Q: Can user change email after verification?**
A: Yes, in Step 1 they can edit email. This invalidates old verification and requires new verification.

**Q: What if verification link expires?**
A: User sees "expired" message with link to request new verification email.

**Q: Does this work if user has multiple tabs open?**
A: Yes, both tabs poll status independently. Both will update when verification completes.

**Q: What if user closes browser before verifying?**
A: Verification record persists (24 hours). User can return later, click link, and continue.

**Q: How do we handle international users?**
A: Email service supports international email addresses. Verification page can be translated if needed.

---

### Appendix F: Future Enhancements

**Phase 2 Features (Post-MVP):**

1. **Email Deliverability Checks**
   - Real-time MX record validation
   - Disposable email detection
   - Mailbox existence verification (via API like ZeroBounce)

2. **SMS Backup Verification**
   - If email verification fails repeatedly
   - Offer phone number as backup
   - Send SMS code for verification

3. **Social Login**
   - "Sign in with Google" (auto-verifies email)
   - Reduces friction for users with Gmail

4. **Verification Status Dashboard**
   - Admin view of verification metrics
   - Real-time verification events
   - Debugging tools for support team

5. **Progressive Enhancement**
   - WebSocket for instant updates (instead of polling)
   - Push notifications when email verified (if user grants permission)

6. **A/B Testing**
   - Test different verification methods (magic link vs OTP)
   - Test different polling frequencies
   - Optimize for conversion rate

---

## Conclusion

This email verification system balances security, user experience, and implementation complexity. By verifying emails before payment using an async approach with real-time polling, we:

✅ Prevent payments from users with invalid emails
✅ Minimize friction through parallel verification
✅ Reduce support burden significantly
✅ Improve user trust and credibility
✅ Establish industry-standard best practices

The implementation plan is phased to allow for testing and gradual rollout, with clear success metrics and rollback procedures. The system is designed to be maintainable, scalable, and extensible for future enhancements.

---

**Next Steps:**
1. Review and approve this design document
2. Create implementation tickets for each phase
3. Setup development environment
4. Begin Phase 1: Database setup
5. Proceed through phases with testing at each stage

**Questions or feedback? Contact the engineering team.**
