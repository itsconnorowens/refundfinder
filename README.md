# RefundFinder - Flight Delay Compensation Platform

A Next.js application that helps users check their eligibility for flight delay compensation and submit claims. Built with TypeScript, Tailwind CSS, and integrated with Airtable, Stripe, and Claude AI.

## Features

- **Eligibility Checker**: AI-powered flight delay compensation eligibility assessment
- **Email Parser**: Extract flight details from confirmation emails using Claude AI
- **Smart Form Interface**: Airport autocomplete with 200+ airports worldwide
- **Multi-Regulation Support**: EU261, UK CAA, and US DOT compliance
- **Claim Submission**: Multi-step form for submitting compensation claims
- **Payment Processing**: Stripe integration for processing claim fees
- **Results Display**: Clear eligibility results with compensation amounts
- **Legal Pages**: Terms of Service and Privacy Policy

## Current Status

### ✅ **Recent Improvements (December 2024)**
- **Code Quality**: Comprehensive ESLint and TypeScript setup
- **Build Process**: Stable and reliable build pipeline
- **Quality Safeguards**: Pre-commit hooks and CI/CD pipeline
- **Deployment**: Successfully deployed to Vercel
- **Documentation**: Complete developer guides and troubleshooting docs

### ✅ **What Works Well**
- Basic EU261/UK CAA/US DOT scenarios
- AI-powered email parsing with Claude
- Smart form interface with validation
- Airport autocomplete functionality
- Delay duration parsing (fixed)
- Extraordinary circumstances detection

### ⚠️ **Known Limitations**
- Limited airline/airport coverage (missing major carriers)
- Inaccurate distance calculations for many routes
- Missing cancellation scenarios
- No flight validation (doesn't check if flights exist)
- Limited regulatory coverage (missing Swiss, Norwegian, Canadian)

### 📋 **Development Status**
- **MVP Ready**: ✅ Basic functionality works for common scenarios
- **Production Ready**: ⚠️ Needs airline/airport expansion and distance fixes
- **Enterprise Ready**: ❌ Needs comprehensive coverage and validation

See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for detailed improvement plans.

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

## 📚 Documentation

### **Development & Quality**
- [Developer Guide](./DEVELOPER_GUIDE.md) - Complete developer onboarding and workflow
- [Code Quality Safeguards](./CODE_QUALITY_SAFEGUARDS.md) - Prevention strategies and best practices
- [Session Summary](./SESSION_SUMMARY_CODE_QUALITY_CLEANUP.md) - Recent improvements and fixes

### **Project Documentation**
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Current implementation status
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md) - Future development plans
- [API Strategy](./API_STRATEGY_UPDATE.md) - API design and integration strategy

### **Feature Documentation**
- [Payment Implementation](./PAYMENT_IMPLEMENTATION_SUMMARY.md) - Stripe integration details
- [Email System](./EMAIL_SYSTEM_README.md) - Email parsing and notification system
- [Flight Validation](./FLIGHT_VALIDATION_IMPLEMENTATION_SUMMARY.md) - Flight verification system

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
