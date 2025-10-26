# Trip Refund Finder MVP - Product Requirements Document

Version: 1.1  

Target Launch: 7 days from kickoff  

Author: Connor Owens  

Last Updated: October 25, 2025

---

## Executive Summary

### The Core Bet

Frequent flyers will pay $49 for someone to handle their flight compensation claim if we make submission effortless (< 5 minutes, no document hunting).

### MVP Success Criteria

* 10 paying customers within 30 days of launch

* 60%+ claim submission rate (users who check eligibility actually submit claims)

* < 48 hour turnaround from user submission to airline filing

* Validation of unit economics: $49 revenue - $15 processing cost = $34 gross profit per claim

### What We're NOT Building (Yet)

* Automated email monitoring

* Real-time flight tracking

* Subscription plans

* Payment processing automation

* Admin dashboard (post-MVP only if traction proves it)

* User accounts/authentication (strictly no custom auth for MVP; see Auth principles)

* Mobile app

* API integrations with airlines

* Multi-language support

* Claims tracking portal (post-MVP only if traction proves it)

---

## Part 1: Product Definition

### The Minimum Viable Experience

User Journey (5 steps, < 5 minutes):

1. Landing page → User pastes flight confirmation email or enters flight details manually

2. Eligibility check → Instant feedback: "You're eligible for \~$600 compensation" or "Not eligible"

3. Claim submission → Simple form: passenger details, disruption description, upload boarding pass/delay proof

4. Payment → Stripe Checkout for $49 (hosted by Stripe)

5. Confirmation → "We'll file your claim within 48 hours and email you updates"

Behind the scenes (manual operations):

* You manually review submissions (30 min/claim)

* You manually fill out airline compensation forms (45 min/claim)

* You manually email airlines (15 min/claim)

* You track status in Airtable (source of truth). If Airtable is unavailable, use Google Sheets as an emergency fallback and backfill to Airtable once restored.

* You manually email customers with updates

MVP Authentication stance:

* No user accounts, no custom authentication, and no password management for MVP. All customer touchpoints are via email.

* If claim lookup is needed post-MVP, use passwordless magic links via Clerk or Auth0. Do not build homegrown auth.

* Manual fallback (if lookup is required temporarily): send a one-time code via email to confirm identity.

### Core Value Proposition

"Get up to $700 flight compensation without the paperwork. Just paste your flight confirmation, pay $49, and we handle everything."

### Target Customer (MVP)

* US-based business travelers

* Experienced at least one 3+ hour delay in past 6 months

* Flies 4+ times/year

* Aware compensation exists but hasn't filed because "too much hassle"

* Age 28-45, comfortable with online payments

### Pricing

* Single offer: $49 per claim (flat fee, not commission)

* Why flat vs. commission: Simplifies mental math, faster payment, de-risks customer perception ("what if they lowball the claim to take less commission?")

* Payment: Stripe Checkout (standard integration, no custom flow; manual fallback if Stripe is down: PayPal/Venmo or emailed invoice tracked in Sheets)

---

## Part 2: Technical Architecture (AI-Friendly Stack)

### Guiding Principles

1. Use managed services for everything except core logic

2. No custom databases for MVP. Airtable is the sole operational database and source of truth. Google Sheets is an emergency-only fallback. No database migrations or backend schema changes.

3. No authentication or user accounts for MVP. Do not implement custom auth. If lookup is needed post-MVP, use passwordless magic links via Clerk or Auth0. Temporary manual fallback allowed: send a one-time code via email.

4. Monolith over microservices - single Next.js app

5. AI-parseable over "best practice" - simple, explicit code over abstractions

### Tech Stack

Frontend:

* Framework: Next.js 14 (App Router) with TypeScript

* Styling: Tailwind CSS + shadcn/ui components

* Hosting: Vercel (free tier, instant deploys)

* Why: AI coding tools (Cursor, v0) excel at Next.js; zero config deployment

* Fallback: If Vercel deploys fail, pause intake with a simple status banner and collect interest via a Google Form; process manually.

Backend:

* API Routes: Next.js API routes (co-located with frontend)

* Operational Database: Airtable (free tier, source of truth)

  * Claims (claim_id, user_email, user_name, user_phone, user_address, flight_number, airline, flight_date, delay_hours, delay_reason, eligible_amount, status, boarding_pass_url, delay_proof_url, receipts_url, stripe_session_id, created_at, updated_at)

  * Eligibility_Checks (check_id, flight_number, airline, flight_date, eligible, amount, confidence, created_at, ip_address)

  * Fallback: If Airtable is unavailable, log new entries into Google Sheets (emergency fallback) and backfill Airtable later. No migrations or schema changes in MVP.

* File Storage: Vercel Blob Storage (for boarding passes/proof documents)

  * Fallback: If file upload fails, instruct users to email attachments to ops@\[domain\] and log files via links in Airtable; if Airtable is down, track in Google Sheets with file URLs.

* Payments: Stripe Checkout (test mode initially)

  * Fallback: If Stripe is down or blocked, accept PayPal/Venmo/manual invoice and record payment status in Airtable/Sheets.

AI/NLP Processing:

* Flight confirmation parsing: Claude API (Sonnet 4)

  * Prompt: Extract flight number, airline, date, departure/arrival airports from this email

  * Structured output: JSON schema with required fields

  * Fallback: If Claude API fails, guide users to manual entry.

* Eligibility logic: Simple rules engine (hardcoded in TypeScript)

  * No ML initially - just if/else based on EU261/DOT regulations

  * Only support 5 major US airlines + 5 EU airlines for MVP

Why This Stack:

* No DevOps: Vercel handles everything

* No database migrations: Airtable via REST API; Google Sheets as emergency-only backup

* No auth complexity: Email-only communication (no accounts)

* AI-friendly: Claude excels at parsing unstructured text; Next.js is most common in training data

Operational Fallbacks Matrix (MVP):

* Stripe: Switch to PayPal/Venmo/manual invoice; track in Airtable or Google Sheets

* Airtable: Switch to Google Sheets; backfill Airtable once restored

* Vercel Hosting: Show maintenance banner and collect emails via Google Form; fulfill manually

* Vercel Blob (files): Accept documents via email; store links in Airtable/Sheets

* Anthropic/Claude: Fall back to manual entry form

* Resend (email): Send via Gmail manually; note status in Airtable/Sheets

### System Architecture Diagram

User Browser  

↓  

\[Next.js Frontend\] (Vercel hosting)  

↓  

\[Next.js API Routes\]  

↓

* Claude (parse)

* Airtable (store; source of truth)

* Resend (email)

* Stripe (payment)

* Vercel Blob (files)

---

## Part 3: Feature Specifications

### Feature 1: Landing Page

Purpose: Convert traffic → eligibility checks  

Success Metric: 40%+ of visitors enter flight details

Layout:

* Hero Section:

  * Headline: "Get Your Flight Delay Compensation in 3 Minutes"

  * Subhead: "Delayed 3+ hours? You could be owed up to $700. We handle the paperwork."

  * CTA: Large textarea: "Paste your flight confirmation email here" + "Check Eligibility" button

  * Alternative input: "Don't have your email? Enter flight details manually" → expand form

* Social Proof:

  * "We've recovered $147,000 for 320 travelers"

  * Trustpilot stars (placeholder from early testers)

* How It Works (3 steps with icons):

  1. Check if you're eligible (free)

  2. Pay $49 if you want us to file

  3. We handle everything & email updates

* FAQs (5 questions):

  * What delays qualify?

  * How much can I get?

  * How long does it take?

  * What if my claim is denied?

  * Is this legit? (address skepticism)

Technical Implementation:

* Single page Next.js route: app/page.tsx

* Form component: components/EligibilityForm.tsx

* On submit → POST to /api/check-eligibility

* Use shadcn/ui for form components; Tailwind for responsive layout

* No login required; do not prompt for accounts

Fallbacks:

* If parser fails, immediately offer manual entry

* If hosting issues occur, show banner and link to a Google Form to collect emails for manual follow-up

Copy Tone:

* Confident but not aggressive

* Emphasize effort saved, not money

* "We do the annoying paperwork so you don't have to"

### Feature 2: Eligibility Checker

Purpose: Instant gratification → builds commitment to submit claim  

Success Metric: 60%+ of eligible users click "File My Claim"

Input Processing:

* Option A: Email paste

  1. User pastes full email into textarea

  2. Send to Claude API: "Extract flight details from this confirmation email"

  3. Claude returns structured JSON fields (flight_number, airline, date, departure, arrival, times)

  4. Pre-fill manual form fields with extracted data

  5. User confirms/corrects

* Option B: Manual entry

  * Flight number (required)

  * Airline (dropdown: United, Delta, American, Southwest, JetBlue, Lufthansa, British Airways, Air France, KLM, Ryanair)

  * Flight date (date picker)

  * Delay duration (dropdown: <1hr, 1-2hrs, 2-3hrs, 3-4hrs, 4-5hrs, 5+hrs)

  * Reason for delay (dropdown: Weather, Technical, Crew, Air traffic, Other)

Eligibility Rules (Hardcoded Logic):

* US flights (DOT regulations):

  * If flight is a US flight and delay_hours >= 3 and reason is not weather → eligible may be true with amount set to 0 and message indicates airline-specific compensation; otherwise not eligible.

* EU flights (EU261):

  * If covered by EU261, delay_hours >= 3, and not extraordinary circumstances:

    * Calculate amount (distance-based, €250-600)

    * Eligible with high confidence and explanatory message

* Otherwise: Not eligible with brief explanation

Results Page:

* If Eligible:

  * ✅ Great news! You're likely owed \~$600

  * Flight summary (number, date, route), delay, regulation

  * What happens next:

    * Pay $49 to file your claim

    * We submit within 48 hours

    * You get compensation in 4-8 weeks

  * Primary CTA: File My Claim - $49

* If Not Eligible:

  * ❌ Unfortunately, this flight doesn't qualify

  * Reason summary

  * Offer to check another flight

  * Optional feedback textarea for edge cases

Technical Implementation:

* Results page: app/results/page.tsx (pass data via URL params)

* Eligibility API: app/api/check-eligibility/route.ts

* Store all checks in Airtable (including non-eligible) for marketing insights

* Use Zod for input validation

Fallbacks:

* If Claude API fails → Show a clear path to manual entry

* Airtable write failure → Log minimal data to Google Sheets and continue the flow; backfill later

Authentication Note:

* No login or user accounts; do not implement any auth or password flows in MVP

### Feature 3: Claim Submission Form

Purpose: Collect everything needed to file claim  

Success Metric: 90%+ completion rate (if user starts, they finish)

Form Fields:

* Personal Information:

  * Full name (as on passport) \*

  * Email address \*

  * Phone number (optional)

  * Mailing address (for check delivery) \*

* Flight Information (pre-filled from eligibility check):

  * Flight number ✓

  * Airline ✓

  * Flight date ✓

  * Delay duration ✓

* Disruption Details:

  * What was announced? (delay, cancellation, missed connection)

  * Did you accept alternative flight? (yes/no)

  * Additional details (textarea, optional)

* Documentation:

  * Boarding pass (file upload, required)

  * Proof of delay (file upload, required)

  * Receipts for expenses (file upload, optional)

* Agreement (checkboxes):

  * I authorize Trip Refund Finder to file this claim on my behalf

  * I agree to the Terms of Service

* Submit:

  * Pay $49 & Submit Claim

UX Principles:

* Progress bar (3 steps: Info → Documents → Payment)

* Autosave to localStorage every 30 seconds (recovery if browser closes)

* Inline validation

* File uploads: drag-drop or click; thumbnail preview

* Mobile-friendly file picker (camera access)

Technical Implementation:

* Multi-step form: components/ClaimForm.tsx

* File upload: Vercel Blob Storage API

* Form state: React Hook Form + Zod validation

* On submit → create Stripe Checkout session → redirect to payment

* Record draft claim in Airtable upon start; update with file URLs and status throughout

Fallbacks:

* If file upload fails → Prompt to email attachments to ops@\[domain\]; store emailed file links in Airtable; if Airtable fails, log in Google Sheets

* If Airtable is down → Temporarily cache locally and capture minimal data in Google Sheets; backfill to Airtable

Authentication Note:

* No accounts; the claim is linked by email only

### Feature 4: Payment Flow

Purpose: Collect $49 before we work on claim  

Success Metric: 95%+ payment completion (Stripe handles most friction)

Flow:

1. User clicks "Pay $49 & Submit Claim"

2. Form validated → POST to /api/create-checkout-session

3. Redirect to Stripe Checkout (hosted by Stripe; no custom UI)

4. After payment → redirect to /success?session_id={id}

5. Success page: "Payment received! We'll file your claim within 48 hours."

Stripe Checkout Configuration:

* Create a session for a single line item:

  * Name: Flight Compensation Claim Filing

  * Description: \[flight_number\] - \[airline\]

  * Unit amount: 4900 (USD cents)

* mode: payment

* success_url: NEXT_PUBLIC_URL/success?session_id={CHECKOUT_SESSION_ID}

* cancel_url: NEXT_PUBLIC_URL/claim

* customer_email: user_email

* metadata: claim_id

Webhook Handling:

* Endpoint: /api/webhooks/stripe

* On checkout.session.completed:

  * Update Airtable claim status to "Paid"

  * Send confirmation email via Resend

Technical Implementation:

* Stripe API routes: /api/create-checkout-session, /api/webhooks/stripe

* Stripe Node SDK

* Test mode initially (use 4242 4242 4242 4242)

Fallbacks:

* If Stripe fails: Present PayPal/Venmo/manual invoice options and update Airtable/Sheets with payment status; proceed to filing once payment is confirmed

Authentication Note:

* No account creation or login; strictly hosted checkout via Stripe

### Feature 5: Confirmation & Status Updates

Purpose: Reassure customer their money is well spent  

Success Metric: < 5% refund requests

Immediate Confirmation (Email #1):

* Subject: ✅ Your claim for flight \[UA2847\] is confirmed

* Body:

  * Thanks and claim details (flight, estimated compensation, fee)

  * What happens next: file within 48 hours, airline acknowledgment in \~2 weeks, payout in 4-8 weeks

  * Reply to email for questions

Status Update Emails (Manual for MVP):

* Email #2 (48 hours): "We've filed your claim with \[Airline\]"

* Email #3 (when airline responds): "\[Airline\] has acknowledged your claim"

* Email #4 (when paid): "\[Airline\] has approved your claim - check arriving in 7-10 days"

Technical Implementation:

* Email templates: lib/email-templates.ts

* Resend API integration: lib/email.ts

* Manual triggering initially (OK to send from Gmail)

* Fallback: If Resend fails, send from Gmail and note status in Airtable/Sheets

Authentication Note:

* All updates via email; no portal or login for MVP

---

## Part 4: User Experience Flow Diagram

Landing Page  

→ Paste Email OR Enter Details Manually  

→ Parsing via Claude API (if email; otherwise skip)  

→ Eligibility Results  

→ Not Eligible → Try Another Flight  

→ Eligible → Claim Submission Form  

→ Upload Documents  

→ Stripe Checkout  

→ Success Page  

→ Confirmation Email  

→ Manual claim filing by operator  

→ Status update emails (manual)

Fallbacks embedded:

* Parser down → manual entry

* Uploads failing → email attachments

* Stripe down → PayPal/Venmo/manual invoice

* Airtable down → Google Sheets capture

---

## Part 5: AI-Assisted Development Plan

Phase 1: Project Setup (Day 1 - 2 hours)

* Create a Next.js 14 project with:

  * TypeScript, Tailwind CSS, shadcn/ui components, App Router

  * Environment variables: ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, RESEND_API_KEY, NEXT_PUBLIC_SITE_URL

* Initialize with a clean landing page component

* Steps:

  * Run create-next-app

  * Install shadcn/ui

  * Create .env.local with API keys

  * Create GitHub repo

  * Deploy to Vercel

Phase 2: Landing Page (Day 1 - 3 hours)

* Build hero, eligibility input, manual entry, how-it-works, social proof, FAQs

* Use Tailwind/shadcn/ui; mobile-responsive

* No login prompts of any kind

Phase 3: Eligibility Checker (Day 2 - 4 hours)

* API route /api/check-eligibility:

  * Accept POST with flight details JSON

  * Validate input (Zod)

  * Compute eligibility for EU261 and US DOT

  * Return JSON: eligible, amount, message, confidence

  * Store check in Airtable (Eligibility_Checks)

  * Rate limit: max 10 requests/IP/hour

* Parser function lib/parse-flight-email.ts:

  * Input: raw email text

  * Send to Claude with schema for flight_number, airline, date, departure_airport, arrival_airport

  * Return parsed data or null on failure

* Results page shows outcome and CTA

Phase 4: Claim Form (Day 3 - 4 hours)

* Multi-step form:

  * Step 1: Personal info (validated)

  * Step 2: Flight details (pre-filled, editable)

  * Step 3: Documentation uploads

* Features:

  * Progress bar, localStorage persistence

  * File upload to Vercel Blob; show previews

  * Validate size (≤ 5MB/file) and types (JPG, PNG, PDF)

* Fallback for uploads: show email alternative and record links in Airtable/Sheets

Phase 5: Payment Integration (Day 3-4 - 3 hours)

* /api/create-checkout-session:

  * Accept claim_id, get claim details from Airtable, create Stripe session for $49, include metadata, return session URL

* Webhook /api/webhooks/stripe:

  * Verify signature

  * On checkout.session.completed: update Airtable status to "Paid", send confirmation email

* Success page:

  * Read session_id, show confirmation and next steps

  * Delight: optional confetti

Phase 6: Email System (Day 4 - 2 hours)

* Email templates with React Email:

  * Confirmation, claim filed, claim approved

* sendEmail wrapper using Resend

* Fallback: Gmail manual send

Phase 7: Airtable Integration (Ongoing - 1 hour)

* Schema setup in Airtable for Claims and Eligibility_Checks (as defined)

* lib/airtable.ts helpers:

  * createClaim, updateClaimStatus, getClaim, logEligibilityCheck, getChecksByIP

Phase 8: Testing & Debugging (Day 5-6 - 6 hours)

* User journey tests across devices

* Error handling (parser fail, invalid inputs, payment fail, upload too large, timeouts)

* Edge cases (back button, refresh during checkout, rate limiting, mobile camera)

* Tools: Vercel logs, Stripe test event inspector, mobile device testing, friend beta tests

Phase 9: Launch Prep (Day 7 - 3 hours)

* Technical: remove console logs, switch Stripe to live, set webhook, set env vars, add security headers, Vercel Analytics, custom domain

* Content: Terms of Service, Privacy Policy, legal pages (/terms, /privacy), FAQ polish

* Monitoring: Sentry, create Google Sheet dashboards (optional, Airtable remains source of truth)

* Marketing: meta tags, GSC, share in communities, email 10 frequent flyers

Authentication Reminder:

* Do not add user accounts, login, or dashboards during these phases. Any such request is post-MVP and requires traction.

---

## Part 6: What NOT to Build (Anti-Scope Creep)

Tempting Features to Resist

User Accounts & Authentication:

* Not needed for MVP; email-only flow is sufficient

* No passwords, no sessions, no verification flows

* Post-MVP only if >50 customers ask for claim lookup; if built, use passwordless magic links via Clerk or Auth0 (no homegrown auth). Manual one-time code via email is acceptable as a temporary fallback.

Automated Email Monitoring:

* Not needed for MVP; paste/manual entry is enough

* Complex OAuth/IMAP scope

* Post-MVP

Real-Time Flight Tracking:

* Not needed; users already know their delay

* Expensive APIs

* Post-MVP

Claims Status Dashboard:

* Not needed for MVP; email updates suffice

* Requires auth and more UI

* Post-MVP only if active claims volume makes manual updates painful

Refund Calculator with Precise Amounts:

* Not needed; estimates are fine

* Complex rules/route databases

* Post-MVP

Multi-Currency Support:

* Not needed; charge USD, pay USD

* Post-MVP

Admin Dashboard:

* Not needed; Airtable serves as the admin ops tool

* Post-MVP if hiring ops staff or claims volume requires it

Mobile App:

* Not needed; mobile web works

* Post-MVP

"But What If..." Responses

* Fraudulent claim? Manual review for all claims in MVP; add fraud checks in month 2

* Stripe rejects model? Switch to PayPal (day-1 integration)

* Airline forms change? Manual filing allows quick process updates

* Claude API down? Fallback to manual entry

* 1000 claims on day 1? Raise SLAs and add capacity; MVP expects lower volume

* Refund demand? Stripe supports refunds; issue quickly, learn, iterate

---

## Part 7: Success Metrics & Validation

North Star Metric

* Paid claims per week (goal: 10 in first month, 50 by month 3)

Acquisition Funnel

* Landing Page Views

  * 40% convert → Eligibility Checks Started

  * 70% convert → Eligibility Checks Completed

  * 40% eligible → Eligible Results Shown

  * 60% convert → Claim Forms Started

  * 90% convert → Claim Forms Completed

  * 95% convert → Successful Payments

  * 100% fulfilled → Claims Filed with Airlines

Key Conversion Points to Monitor:

1. Landing → Eligibility Check: < 40% = landing page problem

2. Eligible → Form Started: < 60% = trust problem

3. Form Started → Completed: < 90% = form friction

4. Form Completed → Payment: < 95% = payment friction or pricing problem

Weekly Dashboard (Google Sheet)

* Track manually for first month (supplemental). Airtable remains the source of truth.

Qualitative Validation

* After first 5 customers:

  * How did you hear about us?

  * What almost stopped you from signing up?

  * What would make this even easier?

  * Would you recommend us? (NPS)

  * Other travel pain points?

* After first 10 customers:

  * Patterns by region/airline

  * Channel performance

  * ICP refinement

Kill Criteria (When to Pivot or Quit)

* After 30 days, if:

  * < 5 paid claims → demand problem

  * < 30% eligible rate → targeting problem

  * 

  > 30% refund rate → fulfillment problem

  * 

  > 10 hours/claim → ops problem

* Before quitting, try: $29 pricing; 30% commission model; focus on a single airline; B2B offers

---

## Part 8: Manual Operations Playbook

Daily Workflow (Until Automated)

Morning (30 min):

1. Check Airtable for new "Paid" claims (source of truth)

2. Review submitted documents in Vercel Blob Storage

3. Identify incomplete submissions → email customer for clarification

4. Add to processing queue in Airtable. If Airtable is down, log in Google Sheets (emergency) and backfill later.

Claim Filing Process (45 min per claim):

1. Research Airline Process:

  * Google: "\[Airline\] EU261 claim form" or "\[Airline\] flight delay compensation"

  * Save direct links in ops doc

  * Note required fields/documents

2. Fill Out Claim Form:

  * Use customer data from Airtable

  * Attach boarding pass + delay proof from Vercel Blob (or emailed attachments)

  * Narrative example:

    * On behalf of passenger \[Name\], filing an EU261 claim for flight \[Number\] on \[Date\] delayed \[X\] hours due to \[Reason\]. Entitled to €\[Amount\]. Supporting documentation attached. Please confirm receipt and provide a claim reference number.

3. Submit & Track:

  * Submit via airline portal or email

  * Screenshot confirmation / save confirmation email

  * Update Airtable: Status → "Filed", add airline reference number

  * Email customer: "We've filed your claim with \[Airline\]"

4. Follow Up (Every 2 Weeks):

  * Email airline for status; update customer

  * Escalate to regulator after 6 weeks if ignored

Email Templates (Copy-Paste)

To Customer - Claim Filed:

* Subject: We've filed your claim with \[Airline\]

* Body: Confirmation, reference number, amount claimed, expected timelines, reply-to support

To Airline - Initial Claim:

* Subject: EU261 Compensation Claim - Flight \[Number\] on \[Date\]

* Body: Passenger details, flight details, delay, regulation entitlement, attachments, request for reference number

To Airline - Follow-Up (After 2 Weeks):

* Subject: Follow-Up: EU261 Claim \[Ref Number\]

* Body: Original submission date, reference, request for status, intent to escalate if no response

Operations Tracking

* Airtable is the operational system. Optional Google Sheets dashboard (via Zapier) for daily metrics.

* If any third-party service fails (Stripe, Vercel Blob, Resend), switch to manual alternatives and note actions in Airtable/Sheets.

Authentication & Admin Reminder

* Do not build an admin portal or any authentication for MVP. Airtable is the admin.

---

## Part 9: Launch Strategy

Week 1: Soft Launch (Friends & Family)

* Goal: 3-5 test customers; refund if needed

* Outreach email to 20 frequent flyers with product link and ask for feedback

Week 2-3: Niche Launch (Reddit/Forums)

* Goal: 10-20 paying customers from organic discovery

* Post to r/TravelHacks, r/Flights, FlyerTalk, Facebook groups, Indie Hackers

* Answer questions, collect feedback

Week 4: Paid Acquisition Test (Small Budget)

* Goal: Validate paid performance

* Google Ads: $20/day for 7 days (\~$140)

* Keywords: "flight delay compensation", "eu261 compensation", "airline refund service", "flight compensation claim"

* Success: 2+ conversions at < $70 CAC

* If not viable → focus on SEO/content

---

## Part 10: Risks & Mitigations

Technical Risks

* Claude API rate limits/costs

  * Mitigation: Budget caps; fallback to manual entry

* Vercel/Stripe/Airtable outages

  * Mitigation: Status banner and manual fallback (PayPal/Venmo, Google Sheets, email uploads)

* Security vulnerability (data breach)

  * Mitigation:

    * No passwords or accounts stored

    * Vercel security headers

    * Private blob storage with signed URLs

    * PCI via Stripe (no card data handled)

    * Snyk scan pre-launch

Business Risks

* Airlines reject claims

  * Mitigation: Focus EU carriers first; pivot model if needed

* Slow payouts cause refunds

  * Mitigation: Set expectations; refund if not filed within 48 hours; dispute handling ready

* Market too small

  * Mitigation: Expand cases (cancellations/missed connections); monitor; pivot as needed

Legal Risks

* Operating as unlicensed travel agent

  * Mitigation: Filing paperwork on behalf; consult counsel if revenue > $10K/month

* GDPR compliance

  * Mitigation:

    * Use GDPR-compliant vendors (Vercel, Airtable, Stripe)

    * Privacy policy with deletion clause

    * Manual deletion policy enforced (see Data Privacy & Retention)

* Terms of Service disputes

  * Mitigation: Clear ToS; "best efforts" clause; arbitration clause

Data Privacy & Retention (MVP)

* Scope: Customer PII (name, email, address, phone) and documents (boarding pass, proof of delay, receipts)

* Sharing: Customer documents are used solely for claim fulfillment and are never shared outside fulfillment parties (airlines/regulators as required by the claim).

* Retention:

  * Files and personal data are deleted manually 90 days after claim closure, or sooner upon verified customer request.

  * If a claim is refunded and not filed, delete within 14 days.

* Deletion Process:

  * Operator deletes files from Vercel Blob and records from Airtable.

  * If data was temporarily tracked in Google Sheets during an outage, delete those rows and any local copies at the same time.

* Requests:

  * Provide an email address for deletion requests; respond within 7 days.

* Backups/Logs:

  * Do not export customer data into local files unless needed for filing; if created, delete alongside Airtable/Blob cleanup.

---

## Part 11: Next Steps After MVP

Month 2: Automation & Efficiency (Only if MVP validates with 10+ paid customers)

1. Automated Email Monitoring (OAuth with Gmail; daily scans; proactive outreach)

2. Admin Dashboard (replace Airtable with Postgres; simple ops UI; consider Clerk/Auth0 passwordless magic links if claim lookup is requested repeatedly)

3. Subscription Tier ($99/year unlimited claims; monitoring; priority filing)

Month 3: Growth & Scale (If 50+ paid customers)

1. SEO Content Strategy (airline guides; long-tail pages)

2. Partnerships (card issuers, travel management, insurance)

3. International Expansion (UK/EU regs; multi-currency; localization)

Strict Post-MVP Items:

* Any user authentication, admin portal, or customer dashboard is strictly post-MVP and contingent on traction. If prioritized later, use passwordless magic links via Clerk/Auth0; do not build custom auth.

---

## Appendix: Tech Stack Quick Reference

Core Dependencies

* next ^14.0.0

* react ^18.2.0

* react-dom ^18.2.0

* @anthropic-ai/sdk ^0.9.0

* stripe ^14.0.0

* airtable ^0.12.0

* resend ^2.0.0

* @vercel/blob ^0.15.0

* react-hook-form ^7.48.0

* zod ^3.22.0

* @radix-ui/react-accordion ^1.1.2

* @radix-ui/react-dialog ^1.0.5

* react-dropzone ^14.2.3

* date-fns ^2.30.0

* typescript ^5.2.0

* tailwindcss ^3.3.5

* @types/node ^20.8.0

* @types/react ^18.2.0

Environment Variables (.env.local)

* 

* ANTHROPIC_API_KEY=sk-ant-xxx

* STRIPE_SECRET_KEY=sk_test_xxx

* STRIPE_WEBHOOK_SECRET=whsec_xxx

* AIRTABLE_API_KEY=patxxx

* AIRTABLE_BASE_ID=appxxx

* RESEND_API_KEY=re_xxx

* 

File Structure

* app/

  * page.tsx (Landing page)

  * results/page.tsx (Eligibility results)

  * claim/page.tsx (Claim submission form)

  * success/page.tsx (Payment confirmation)

  * terms/page.tsx (ToS)

  * privacy/page.tsx (Privacy policy)

  * api/

    * check-eligibility/route.ts

    * create-checkout-session/route.ts

    * webhooks/stripe/route.ts

* components/

  * EligibilityForm.tsx

  * ClaimForm.tsx

  * FileUpload.tsx

  * ui/ (shadcn/ui components)

* lib/

  * parse-flight-email.ts

  * eligibility.ts

  * airtable.ts

  * email.ts

  * stripe.ts

  * upload-file.ts

* public/images/

* .env.local

Final Checklist: Are You Ready to Build?

* Clear on core value proposition (simplify claim filing)

* Committed to manual ops for first 10 customers

* Stripe, Anthropic, Airtable, Resend accounts ready

* Calendar cleared for 5-7 days

* 3-5 testers lined up

* Understand this is an experiment

* Ready to iterate based on feedback

* Know when to quit (< 5 customers after 30 days)

* Excited to learn

* Auth/Admin discipline: no accounts, no dashboard, no custom auth in MVP

* Airtable is the operational database; Sheets only as emergency fallback

* Data deletion process defined and owned by operator

One Last Thing: The biggest risk isn't building the wrong thing - it's building too much of the right thing. Stay laser-focused on the core loop: eligibility check → claim submission → payment → manual fulfillment. Everything else (auth, dashboards, migrations) is a distraction until you have 10 paying customers.