# Integration Example: Using Claude Email Parser with Create Claim

This document shows how to integrate the `parseFlightEmail` function into your existing claim submission workflow.

## Scenario 1: Parse Email Before Manual Entry

Allow users to paste their flight confirmation email, auto-fill the form, then submit.

### Frontend Component Example

```typescript
// In your FlightLookupForm.tsx component (homepage eligibility form)
import { useState } from 'react';

function FlightLookupForm() {
  const [emailText, setEmailText] = useState('');
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    departureDate: '',
    departureAirport: '',
    arrivalAirport: '',
    // ... other fields
  });
  const [parsing, setParsing] = useState(false);

  const handleParseEmail = async () => {
    setParsing(true);
    try {
      const response = await fetch('/api/parse-flight-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Auto-fill form with parsed data
        setFormData({
          flightNumber: result.data.flight_number,
          airline: result.data.airline,
          departureDate: result.data.date,
          departureAirport: result.data.departure_airport,
          arrivalAirport: result.data.arrival_airport,
          // Map other fields as needed
        });
        alert('Flight details extracted successfully!');
      } else {
        alert('Could not parse email. Please enter details manually.');
      }
    } catch (error) {
      console.error('Error parsing email:', error);
      alert('Error parsing email. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div>
      {/* Email parser section */}
      <div className="mb-8">
        <label>Paste your flight confirmation email (optional)</label>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste your email here to auto-fill flight details..."
          rows={8}
        />
        <button onClick={handleParseEmail} disabled={parsing}>
          {parsing ? 'Parsing...' : 'Auto-Fill from Email'}
        </button>
      </div>

      {/* Rest of your form */}
      <div>
        <label>Flight Number</label>
        <input
          value={formData.flightNumber}
          onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
        />
        {/* ... other form fields */}
      </div>
    </div>
  );
}
```

## Scenario 2: Enhanced Create Claim API Route

Modify the existing `/api/create-claim/route.ts` to accept optional email text and auto-parse it.

### Modified API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseFlightEmail } from '@/lib/parse-flight-email';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // NEW: Check if email text was provided
    const emailText = formData.get('emailText') as string | null;
    let parsedFlightData = null;

    if (emailText) {
      console.log('Attempting to parse flight email...');
      parsedFlightData = await parseFlightEmail(emailText);
      
      if (parsedFlightData) {
        console.log('Successfully parsed flight data from email');
      } else {
        console.log('Email parsing failed, using manual entry');
      }
    }

    // Extract form fields (use parsed data as fallback if available)
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    
    // Use parsed data if available, otherwise use manual entry
    const flightNumber = parsedFlightData?.flight_number || (formData.get('flightNumber') as string);
    const airline = parsedFlightData?.airline || (formData.get('airline') as string);
    const departureDate = parsedFlightData?.date || (formData.get('departureDate') as string);
    const departureAirport = parsedFlightData?.departure_airport || (formData.get('departureAirport') as string);
    const arrivalAirport = parsedFlightData?.arrival_airport || (formData.get('arrivalAirport') as string);
    const delayDuration = formData.get('delayDuration') as string;
    const delayReason = formData.get('delayReason') as string;

    // Extract files
    const boardingPass = formData.get('boardingPass') as File;
    const delayProof = formData.get('delayProof') as File;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !flightNumber ||
      !airline ||
      !departureDate ||
      !departureAirport ||
      !arrivalAirport ||
      !delayDuration
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ... rest of your existing code for file handling, validation, etc.
    
    // Create claim data object
    const claimData = {
      id: `claim-${Date.now()}`,
      personalInfo: {
        firstName,
        lastName,
        email,
      },
      flightDetails: {
        flightNumber,
        airline,
        departureDate,
        departureAirport,
        arrivalAirport,
        delayDuration,
        delayReason: delayReason || null,
        // NEW: Track if data was auto-parsed
        autoParsed: !!parsedFlightData,
      },
      // ... rest of claim data
    };

    console.log('New claim submitted:', claimData);

    return NextResponse.json({
      success: true,
      claimId: claimData.id,
      message: "Claim submitted successfully. We'll file your claim within 48 hours.",
      autoParsed: !!parsedFlightData,
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Scenario 3: Separate Eligibility Check API Route

Create a new route that checks eligibility using auto-parsed or manual data.

```typescript
// src/app/api/check-eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseFlightEmail } from "@/lib/parse-flight-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailText, manualFlightData } = body;

    let flightData;

    // Try to parse email first if provided
    if (emailText) {
      console.log('Attempting to parse flight email for eligibility check...');
      const data = await parseFlightEmail(emailText);
      
      if (data) {
        flightData = data;
        console.log('Successfully parsed flight data from email');
      } else {
        console.log('Email parsing failed, using manual data');
        flightData = manualFlightData;
      }
    } else {
      // No email provided, use manual data
      flightData = manualFlightData;
    }

    if (!flightData) {
      return NextResponse.json(
        { error: 'No flight data provided' },
        { status: 400 }
      );
    }

    // Check eligibility based on flight data
    const eligible = checkEligibility(flightData);

    return NextResponse.json({
      success: true,
      eligible,
      flightData,
      message: eligible
        ? 'Your flight may be eligible for compensation!'
        : 'Based on the information provided, this flight does not appear eligible for compensation.',
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkEligibility(flightData: any): boolean {
  // Implement your eligibility logic here
  // For example: check if flight is within EU jurisdiction, delay > 3 hours, etc.
  return true;
}
```

## Usage from Your Code

### Simple Function Call

```typescript
import { parseFlightEmail } from '@/lib/parse-flight-email';

// In any server-side API route or function
const emailText = `
  Booking Confirmation
  
  Flight: AA1234
  Airline: American Airlines
  Date: March 15, 2024
  Route: LAX (Los Angeles) to JFK (New York)
  Departure: 10:00 AM PST
  Arrival: 6:30 PM EST
`;

const data = await parseFlightEmail(emailText);

if (data) {
  console.log('Parsed flight details:', data);
  // {
  //   flight_number: 'AA1234',
  //   airline: 'American Airlines',
  //   date: '2024-03-15',
  //   departure_airport: 'LAX',
  //   arrival_airport: 'JFK',
  //   scheduled_departure: '10:00 AM PST',
  //   scheduled_arrival: '6:30 PM EST'
  // }
} else {
  console.log('Failed to parse - use manual entry');
}
```

## Best Practices

1. **Always provide fallback to manual entry** - Auto-parsing may not always work
2. **Show users what was parsed** - Let them verify and correct if needed
3. **Don't block submission** - If parsing fails, allow manual entry
4. **Log parsing success rate** - Track how often parsing succeeds for monitoring
5. **Handle long emails** - Truncate or validate email length before sending to API
6. **Show loading states** - Parsing can take 1-2 seconds, show feedback

## Error Handling

```typescript
// Robust error handling example
async function safeParseEmail(emailText: string) {
  try {
    const response = await fetch('/api/parse-flight-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailText }),
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Network error parsing email:', error);
    return null;
  }
}
```

## Testing

Test with various email formats:

```typescript
// Test cases
const testEmails = [
  'Confirmation for flight UA1234...',
  'Your booking reference is ABC123...',
  'E-ticket: Delta Airlines DL5678...',
];

for (const email of testEmails) {
  const result = await parseFlightEmail(email);
  console.log(result ? 'SUCCESS' : 'FAILED', email.substring(0, 50));
}
```

## Summary

The `parseFlightEmail` function can be integrated at multiple points:

1. ✅ **Pre-form fill** - Parse email, auto-fill form, user reviews and submits
2. ✅ **API route enhancement** - Accept email in existing routes, parse as fallback
3. ✅ **Separate eligibility check** - Parse email to quickly check if eligible
4. ✅ **Batch processing** - Parse multiple emails for administrative purposes

Choose the integration point that best fits your UX flow!

