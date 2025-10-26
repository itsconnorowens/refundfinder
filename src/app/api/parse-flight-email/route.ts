import { NextRequest, NextResponse } from 'next/server';
import {
  parseFlightEmail,
  isAnthropicConfigured,
} from '@/lib/parse-flight-email';

/**
 * POST /api/parse-flight-email
 *
 * Parse flight details from a raw email string using Claude AI
 *
 * Request body:
 * {
 *   "emailText": "Your flight confirmation email content..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "flight_number": "UA1234",
 *     "airline": "United Airlines",
 *     "date": "2024-03-15",
 *     "departure_airport": "SFO",
 *     "arrival_airport": "JFK",
 *     "scheduled_departure": "08:00 PST",
 *     "scheduled_arrival": "16:30 EST"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Anthropic is configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Claude API is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { emailText } = body;

    // Validate input
    if (!emailText || typeof emailText !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email text is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (emailText.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email text is too short to contain flight details',
        },
        { status: 400 }
      );
    }

    if (emailText.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email text is too long (max 50,000 characters)',
        },
        { status: 400 }
      );
    }

    // Parse the email using Claude
    console.log('📧 Email parsing - Input email length:', emailText.length);
    const flightData = await parseFlightEmail(emailText);
    console.log('📧 Email parsing - Raw result:', JSON.stringify(flightData, null, 2));

    // Check if parsing was successful
    if (!flightData || !flightData.success) {
      console.log('❌ Email parsing failed:', flightData?.error);
      return NextResponse.json(
        {
          success: false,
          error: flightData?.error || 'Could not extract flight details from the provided email. Please verify the email contains flight information and try again, or enter the details manually.',
        },
        { status: 200 } // 200 because parsing failure isn't a server error
      );
    }

    console.log('✅ Email parsing successful - Data:', JSON.stringify(flightData.data, null, 2));

    // Return successful response
    return NextResponse.json({
      success: true,
      data: flightData.data,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error in parse-flight-email API route:', error);

    // Return generic error to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while parsing the email',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/parse-flight-email
 *
 * Check if the Claude API is configured and ready to use
 */
export async function GET() {
  const configured = isAnthropicConfigured();

  return NextResponse.json({
    configured,
    message: configured
      ? 'Claude API is configured and ready to use'
      : 'Claude API is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
  });
}
