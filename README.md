# RefundFinder - Flight Delay Compensation Platform

A Next.js application that helps users check their eligibility for flight delay compensation and submit claims. Built with TypeScript, Tailwind CSS, and integrated with Airtable, Stripe, and Claude AI.

## Features

- **Eligibility Checker**: AI-powered flight delay compensation eligibility assessment
- **Email Parser**: Extract flight details from confirmation emails using Claude AI
- **Claim Submission**: Multi-step form for submitting compensation claims
- **Payment Processing**: Stripe integration for processing claim fees
- **Results Display**: Clear eligibility results with compensation amounts
- **Legal Pages**: Terms of Service and Privacy Policy

## Getting Started

### Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your credentials:
   - **Airtable**: Get your API key from [https://airtable.com/account](https://airtable.com/account) and Base ID from [https://airtable.com/api](https://airtable.com/api)
   - **Anthropic (Claude)**: Get your API key from [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - **Stripe**: Get your secret key from [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - **Resend**: Get your API key from [https://resend.com/api-keys](https://resend.com/api-keys)

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## User Journey

1. **Landing Page**: Users start with the eligibility checker form
2. **Eligibility Check**: Enter flight details or paste email confirmation
3. **Results Page**: View eligibility status and compensation amount
4. **Claim Submission**: Submit claim with personal details and documents
5. **Payment**: Process claim fee via Stripe
6. **Success Page**: Confirmation of claim submission

## API Routes

### Eligibility Check

**Check Eligibility:** `POST /api/check-eligibility`

**Request Body:**
```json
{
  "flightNumber": "UA1234",
  "airline": "United Airlines",
  "departureDate": "2024-03-15",
  "departureAirport": "SFO",
  "arrivalAirport": "JFK",
  "delayDuration": "4 hours",
  "delayReason": "Technical issues"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "eligible": true,
    "amount": "€600",
    "message": "You're likely entitled to €600 compensation under EU261",
    "confidence": 95,
    "regulation": "EU261",
    "reason": "Flight delayed 4 hours, distance 1000km"
  }
}
```

### Flight Email Parser

**Parse Flight Email:** `POST /api/parse-flight-email`

**Request Body:**
```json
{
  "emailText": "Your flight confirmation email content here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flightNumber": "UA1234",
    "airline": "United Airlines",
    "departureDate": "2024-03-15",
    "departureAirport": "SFO",
    "arrivalAirport": "JFK",
    "scheduledDeparture": "08:00 PST",
    "scheduledArrival": "16:30 EST"
  }
}
```

### Claim Management

**Create Claim:** `POST /api/create-claim`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "flightNumber": "UA1234",
  "airline": "United Airlines",
  "departureDate": "2024-03-15",
  "departureAirport": "SFO",
  "arrivalAirport": "JFK",
  "delayDuration": "4 hours",
  "delayReason": "Technical issues"
}
```

### Payment Processing

**Create Payment Intent:** `POST /api/create-payment-intent`

**Process Refund:** `POST /api/process-refund`

**Stripe Webhooks:** `POST /api/webhooks/stripe`

## Pages

- `/` - Landing page with eligibility checker
- `/check-eligibility` - Dedicated eligibility checker page
- `/results` - Eligibility results display
- `/success` - Payment and claim success confirmation
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Airtable
- **Payments**: Stripe
- **AI**: Claude API (Anthropic)
- **Email**: Resend
- **Storage**: Vercel Blob (planned)
- **Testing**: Vitest, Playwright

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
