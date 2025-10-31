import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { trackServerEvent } from '@/lib/posthog';
import { withErrorTracking } from '@/lib/error-tracking';
import {
  parseFlightEmail,
  isAnthropicConfigured,
} from '@/lib/parse-flight-email';
import {
  checkRateLimit,
  getClientIdentifier,
  EMAIL_PARSE_RATE_LIMIT,
} from '@/lib/rate-limit';

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
export const POST = withErrorTracking(async (request: NextRequest) => {
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

    // Check rate limit (before parsing body to save resources)
    const clientId = getClientIdentifier(request);
    logger.info('Rate limit check for email parsing', { clientId, route: '/api/parse-flight-email' });

    const rateLimitResult = checkRateLimit(clientId, EMAIL_PARSE_RATE_LIMIT);
    logger.info('Rate limit result', { rateLimitResult, route: '/api/parse-flight-email' });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for email parsing', { clientId, route: '/api/parse-flight-email' });

      // Track rate limit event
      trackServerEvent('anonymous', 'email_parse_rate_limited', {
        clientId,
        retryAfter: rateLimitResult.retryAfter,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': EMAIL_PARSE_RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            'Retry-After': (rateLimitResult.retryAfter || 3600).toString(),
          },
        }
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
    logger.info('Email parsing - Input email length', { length: emailText.length, route: '/api/parse-flight-email' });

    // Track email parse initiation
    trackServerEvent('anonymous', 'email_parse_initiated', {
      emailLength: emailText.length,
      timestamp: new Date().toISOString(),
    });

    const flightData = await parseFlightEmail(emailText);
    logger.info('Email parsing - Raw result', { flightData, route: '/api/parse-flight-email' });

    // Check if parsing was successful
    if (!flightData || !flightData.success) {
      logger.info('Email parsing failed', { error: flightData?.error, route: '/api/parse-flight-email' });

      // Track email parse failure
      trackServerEvent('anonymous', 'email_parse_failure', {
        reason: flightData?.error || 'unknown',
        emailLength: emailText.length,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            flightData?.error ||
            'Could not extract flight details from the provided email. Please verify the email contains flight information and try again, or enter the details manually.',
        },
        { status: 200 } // 200 because parsing failure isn't a server error
      );
    }

    logger.info('Email parsing successful', { data: flightData.data, route: '/api/parse-flight-email' });

    // Track email parse success
    trackServerEvent('anonymous', 'email_parse_success', {
      airline: flightData.data?.airline || '',
      hasFlightNumber: !!flightData.data?.flightNumber,
      hasDate: !!flightData.data?.departureDate,
      hasAirports: !!(flightData.data?.departureAirport && flightData.data?.arrivalAirport),
      fieldsExtracted: flightData.data ? Object.keys(flightData.data).length : 0,
    });

    // Return successful response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        data: flightData.data,
      },
      {
        headers: {
          'X-RateLimit-Limit': EMAIL_PARSE_RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
        },
      }
    );
  } catch (error: unknown) {
    // Log error for debugging
    logger.error('Error in parse-flight-email API route:', error);

    // Return generic error to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while parsing the email',
      },
      { status: 500 }
    );
  }
}, {
  route: '/api/parse-flight-email',
  tags: { service: 'email', operation: 'parse_email' }
});

/**
 * GET /api/parse-flight-email
 *
 * Check if the Claude API is configured and ready to use
 */
export const GET = withErrorTracking(async () => {
  const configured = isAnthropicConfigured();

  return NextResponse.json({
    configured,
    message: configured
      ? 'Claude API is configured and ready to use'
      : 'Claude API is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
  });
}, {
  route: '/api/parse-flight-email',
  tags: { service: 'email', operation: 'check_config' }
});
