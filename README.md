This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Airtable credentials:
   - Get your API key from [https://airtable.com/account](https://airtable.com/account)
   - Get your Base ID from [https://airtable.com/api](https://airtable.com/api)

### Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API Routes

### Claims API

Manage flight delay claims in Airtable.

**Create Claim:** `POST /api/create-dummy-claim`

**Get All Claims:** `GET /api/create-dummy-claim`

**Request Body (POST):**
```json
{
  "user_name": "John Doe",
  "flight_number": "AA123",
  "flight_date": "2024-01-15",
  "airline": "American Airlines",
  "delay_minutes": 180,
  "status": "pending"
}
```

**Status Values:** `pending`, `paid`, `filed`, or `archived`

**Response (POST):**
```json
{
  "success": true,
  "claim_id": "recXXXXXXXXXXXXXX"
}
```

*Note: `claim_id` is the Airtable record ID*

**Response (GET):**
```json
{
  "success": true,
  "count": 5,
  "claims": [...]
}
```

For detailed documentation, see [API README](src/app/api/create-dummy-claim/README.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
