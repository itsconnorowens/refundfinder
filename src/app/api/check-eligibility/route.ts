import { NextRequest, NextResponse } from 'next/server';
import { checkEligibility, FlightDetails } from '@/lib/eligibility';
import { createEligibilityCheck, EligibilityCheckRecord } from '@/lib/airtable';
import {
  checkRateLimit,
  getClientIdentifier,
  ELIGIBILITY_RATE_LIMIT,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, ELIGIBILITY_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': ELIGIBILITY_RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(
              rateLimitResult.resetTime / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      flightNumber,
      airline,
      departureDate,
      departureAirport,
      arrivalAirport,
      delayDuration,
      delayReason,
    } = body;

    // Validate required fields with better error messages
    const missingFields = [];
    if (!flightNumber?.trim()) missingFields.push('flightNumber');
    if (!airline?.trim()) missingFields.push('airline');
    if (!departureDate?.trim()) missingFields.push('departureDate');
    if (!departureAirport?.trim()) missingFields.push('departureAirport');
    if (!arrivalAirport?.trim()) missingFields.push('arrivalAirport');
    if (!delayDuration?.trim()) missingFields.push('delayDuration');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: missingFields,
          message: `The following fields are required: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create flight details object
    const flightDetails: FlightDetails = {
      flightNumber: flightNumber.trim(),
      airline: airline.trim(),
      departureDate,
      departureAirport: departureAirport.trim().toUpperCase(),
      arrivalAirport: arrivalAirport.trim().toUpperCase(),
      delayDuration: delayDuration.trim(),
      delayReason: delayReason?.trim(),
    };

    // Check eligibility
    const result = checkEligibility(flightDetails);

    // Store check in Airtable
    try {
      const checkId = `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eligibilityCheck: EligibilityCheckRecord = {
        checkId,
        flightNumber: flightDetails.flightNumber,
        airline: flightDetails.airline,
        departureDate: flightDetails.departureDate,
        departureAirport: flightDetails.departureAirport,
        arrivalAirport: flightDetails.arrivalAirport,
        delayDuration: flightDetails.delayDuration,
        delayReason: flightDetails.delayReason || '',
        eligible: result.eligible,
        amount: result.amount,
        confidence: result.confidence,
        message: result.message,
        regulation: result.regulation,
        reason: result.reason || '',
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        createdAt: new Date().toISOString(),
      };

      await createEligibilityCheck(eligibilityCheck);
      console.log(`Eligibility check ${checkId} stored successfully`);
    } catch (error) {
      console.error('Error storing eligibility check:', error);
      // Continue even if storage fails
    }

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        headers: {
          'X-RateLimit-Limit': ELIGIBILITY_RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(
            rateLimitResult.resetTime / 1000
          ).toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Eligibility checker API is running',
    endpoints: {
      'POST /api/check-eligibility':
        'Check flight eligibility for compensation',
    },
  });
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
