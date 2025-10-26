# Claude API Integration for Flight Email Parsing

This document describes how to use the Claude AI integration to automatically parse flight details from confirmation emails.

## Overview

The `parseFlightEmail` function uses Anthropic's Claude AI to extract structured flight information from raw email text. This eliminates the need for manual data entry and improves the user experience.

## Setup

### 1. Install Dependencies

The Anthropic SDK is already installed:

```bash
npm install @anthropic-ai/sdk
```

### 2. Configure API Key

Add your Anthropic API key to your `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key from: https://console.anthropic.com/settings/keys

> **Security Note**: The API key is only accessed server-side and never exposed to the browser.

### 3. Verify Configuration (Optional)

You can check if the API is configured before using it:

```typescript
import { isAnthropicConfigured } from "@/lib/parse-flight-email";

if (isAnthropicConfigured()) {
  console.log("Claude API is ready to use");
}
```

## Usage

### Basic Example

```typescript
import { parseFlightEmail } from "@/lib/parse-flight-email";

const emailText = `
  Your flight is confirmed!
  
  Flight: UA1234
  Airline: United Airlines
  Date: March 15, 2024
  From: San Francisco (SFO) to New York (JFK)
  Departure: 8:00 AM PST
  Arrival: 4:30 PM EST
`;

const data = await parseFlightEmail(emailText);

if (data) {
  console.log(`Flight ${data.flight_number} on ${data.date}`);
  console.log(`${data.departure_airport} → ${data.arrival_airport}`);
} else {
  console.log("Failed to parse flight details - fallback to manual entry");
}
```

### Integration with API Routes

Here's how to use the function in your existing API routes:

#### Example: Adding to Eligibility Check Route

```typescript
// src/app/api/check-eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseFlightEmail } from "@/lib/parse-flight-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailText, manualFlightData } = body;

    let flightData;

    // Try to parse email first
    if (emailText) {
      flightData = await parseFlightEmail(emailText);
      
      if (!flightData) {
        console.log("Auto-parse failed, using manual data");
        flightData = manualFlightData;
      }
    } else {
      // No email provided, use manual data
      flightData = manualFlightData;
    }

    if (!flightData) {
      return NextResponse.json(
        { error: "No flight data provided" },
        { status: 400 }
      );
    }

    // Continue with eligibility check using flightData
    // ...

    return NextResponse.json({
      success: true,
      flightData,
    });
  } catch (error) {
    console.error("Error in eligibility check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Example: Creating a Dedicated Parse Endpoint

```typescript
// src/app/api/parse-flight-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseFlightEmail } from "@/lib/parse-flight-email";

export async function POST(request: NextRequest) {
  try {
    const { emailText } = await request.json();

    if (!emailText || typeof emailText !== "string") {
      return NextResponse.json(
        { error: "Email text is required" },
        { status: 400 }
      );
    }

    const flightData = await parseFlightEmail(emailText);

    if (!flightData) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Could not parse flight details from email" 
        },
        { status: 200 } // Still 200 because parsing failure isn't a server error
      );
    }

    return NextResponse.json({
      success: true,
      data: flightData,
    });
  } catch (error) {
    console.error("Error parsing flight email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Frontend Integration

From your React components, you can call the API:

```typescript
// In your component or form handler
async function handleEmailPaste(emailText: string) {
  try {
    const response = await fetch("/api/parse-flight-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailText }),
    });

    const result = await response.json();

    if (result.success && result.data) {
      // Auto-fill form with parsed data
      setFormData({
        flightNumber: result.data.flight_number,
        airline: result.data.airline,
        date: result.data.date,
        departureAirport: result.data.departure_airport,
        arrivalAirport: result.data.arrival_airport,
        scheduledDeparture: result.data.scheduled_departure,
        scheduledArrival: result.data.scheduled_arrival,
      });
    } else {
      // Show error or prompt for manual entry
      console.warn("Could not auto-parse email, please enter details manually");
    }
  } catch (error) {
    console.error("Error parsing email:", error);
  }
}
```

## Response Format

The function returns structured flight details or `null` if parsing fails:

```typescript
interface FlightDetails {
  flight_number: string;      // e.g., "UA1234"
  airline: string;             // e.g., "United Airlines"
  date: string;                // e.g., "2024-03-15"
  departure_airport: string;   // e.g., "SFO"
  arrival_airport: string;     // e.g., "JFK"
  scheduled_departure: string; // e.g., "08:00 PST"
  scheduled_arrival: string;   // e.g., "16:30 EST"
}
```

## Error Handling

The function handles errors gracefully:

- **Missing API Key**: Logs error and returns `null`
- **API Errors**: Logs error details and returns `null`
- **Invalid JSON**: Logs parsing error and returns `null`
- **Missing Fields**: Validates all required fields are present

When `null` is returned, you should fall back to manual data entry.

## Model Information

The function uses **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`), which provides:
- High accuracy for structured data extraction
- Fast response times (~1-2 seconds)
- Cost-effective pricing
- Support for long email texts

## Cost Considerations

- Input: ~$3 per million tokens
- Output: ~$15 per million tokens
- Typical email: ~500 tokens (input) + ~100 tokens (output) = ~$0.003 per parse

For high-volume applications, consider:
- Caching parsed results
- Using Claude Haiku for lower costs
- Rate limiting API calls

## Troubleshooting

### API Key Not Found
```
Error: ANTHROPIC_API_KEY is not set in environment variables
```
**Solution**: Add the key to your `.env.local` file and restart the dev server.

### Parsing Always Returns Null
1. Check that your email contains flight information
2. Verify the API key is valid
3. Check server logs for detailed error messages
4. Ensure your Anthropic account has available credits

### Incorrect Data Extracted
- Try providing more complete email content
- Check that the email is in a standard format
- Consider adding custom validation logic

## Advanced Usage

### Custom Prompt Modification

If you need to extract additional fields, modify the function:

```typescript
const prompt = `Extract the following from this flight confirmation email:
- flight_number
- airline
- date
- departure_airport
- arrival_airport  
- scheduled_departure
- scheduled_arrival
- booking_reference (add this)
- passenger_name (add this)

Return only JSON format...`;
```

### Using Different Claude Models

Change the model in the function:

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-haiku-20240307", // Faster and cheaper
  // or
  model: "claude-3-opus-20240229",  // More accurate
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
});
```

## Security Best Practices

1. ✅ API key stored in environment variables (server-side only)
2. ✅ Never expose API key to client-side code
3. ✅ Validate user input before sending to Claude
4. ✅ Implement rate limiting for production
5. ✅ Log errors without exposing sensitive details

## Next Steps

- Add rate limiting to prevent API abuse
- Implement caching for repeated requests
- Add user feedback mechanism for incorrect parses
- Track parsing accuracy metrics
- Consider adding support for multiple email formats

