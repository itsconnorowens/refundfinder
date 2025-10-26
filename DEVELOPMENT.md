# Development Guide

## Testing the Complete User Journey

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Eligibility Checker

1. Go to `http://localhost:3000`
2. You should see the eligibility checker form
3. Test with sample data:

**EU Flight (Should be eligible):**
- Flight Number: `LH123`
- Airline: `Lufthansa`
- Departure Date: `2024-03-15`
- Departure Airport: `FRA`
- Arrival Airport: `LHR`
- Delay Duration: `4 hours`
- Delay Reason: `Technical issues`

**US Flight (May be eligible):**
- Flight Number: `UA1234`
- Airline: `United Airlines`
- Departure Date: `2024-03-15`
- Departure Airport: `SFO`
- Arrival Airport: `JFK`
- Delay Duration: `5 hours`
- Delay Reason: `Mechanical issues`

**Short Delay (Should not be eligible):**
- Flight Number: `BA456`
- Airline: `British Airways`
- Departure Date: `2024-03-15`
- Departure Airport: `LHR`
- Arrival Airport: `CDG`
- Delay Duration: `2 hours`
- Delay Reason: `Weather`

### 3. Test Email Parser

1. In the eligibility form, click "Or paste your flight confirmation email"
2. Test with sample email content:

```
Subject: Your Flight Confirmation - LH123

Dear Passenger,

Your flight LH123 from Frankfurt (FRA) to London Heathrow (LHR) on March 15, 2024 has been delayed.

Scheduled departure: 10:00 AM
Actual departure: 2:00 PM
Delay: 4 hours
Reason: Technical issues

We apologize for the inconvenience.

Best regards,
Lufthansa Customer Service
```

### 4. Test Results Page

1. After submitting the eligibility form, you should be redirected to `/results`
2. Check that the results display correctly:
   - Eligible flights show compensation amount
   - Non-eligible flights show explanation
   - "Submit Claim" button is present for eligible flights

### 5. Test Claim Submission

1. Click "Submit Claim" on the results page
2. Fill out the claim form with test data
3. Upload test files (boarding pass, delay proof)
4. Submit the form

### 6. Test Payment Flow

1. After claim submission, you should be redirected to Stripe Checkout
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete the payment

### 7. Test Success Page

1. After successful payment, you should be redirected to `/success`
2. Check that the success message displays correctly
3. Verify that the claim ID is shown

## API Testing

### Test Eligibility API Directly

```bash
curl -X POST http://localhost:3000/api/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "flightNumber": "LH123",
    "airline": "Lufthansa",
    "departureDate": "2024-03-15",
    "departureAirport": "FRA",
    "arrivalAirport": "LHR",
    "delayDuration": "4 hours",
    "delayReason": "Technical issues"
  }'
```

### Test Email Parser API

```bash
curl -X POST http://localhost:3000/api/parse-flight-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Your flight LH123 from FRA to LHR on March 15, 2024 has been delayed by 4 hours due to technical issues."
  }'
```

## Common Issues

### 1. Environment Variables Missing

Make sure all required environment variables are set in `.env.local`:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

### 2. Airtable Connection Issues

- Verify your Airtable API key and Base ID
- Check that the "Claims" table exists in your Airtable base
- Ensure the table has the required fields

### 3. Stripe Configuration

- Use test keys for development
- Set up webhook endpoints for local development
- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 4. Claude API Issues

- Verify your Anthropic API key
- Check API usage limits
- Ensure the API key has the correct permissions

## Debugging

### Check Console Logs

1. Open browser developer tools
2. Check the Console tab for errors
3. Check the Network tab for failed API requests

### Check Server Logs

1. Look at the terminal where you ran `npm run dev`
2. Check for error messages and stack traces

### Test Individual Components

1. Test API routes directly with curl or Postman
2. Test individual React components in isolation
3. Use browser dev tools to inspect component state
