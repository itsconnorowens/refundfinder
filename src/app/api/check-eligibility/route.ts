import { NextRequest, NextResponse } from 'next/server';
import { checkEligibility, FlightDetails } from '@/lib/eligibility';
import { createEligibilityCheck, EligibilityCheckRecord } from '@/lib/airtable';
import {
  checkRateLimit,
  getClientIdentifier,
  ELIGIBILITY_RATE_LIMIT,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  console.log('🔍 Eligibility Check API - Request received');

  try {
    // Check rate limit
    const clientId = getClientIdentifier(request);
    console.log('📊 Rate limit check for client:', clientId);

    const rateLimitResult = checkRateLimit(clientId, ELIGIBILITY_RATE_LIMIT);
    console.log('📊 Rate limit result:', rateLimitResult);

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded');
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
    console.log('📝 Request body received:', JSON.stringify(body, null, 2));

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

    console.log('🔍 Field validation:');
    console.log('  flightNumber:', flightNumber, typeof flightNumber);
    console.log('  airline:', airline, typeof airline);
    console.log('  departureDate:', departureDate, typeof departureDate);
    console.log(
      '  departureAirport:',
      departureAirport,
      typeof departureAirport
    );
    console.log('  arrivalAirport:', arrivalAirport, typeof arrivalAirport);
    console.log('  delayDuration:', delayDuration, typeof delayDuration);
    console.log('  delayReason:', delayReason, typeof delayReason);

    // Validate required fields with better error messages
    const missingFields = [];
    if (!flightNumber?.trim()) missingFields.push('flightNumber');
    if (!airline?.trim()) missingFields.push('airline');
    if (!departureDate?.trim()) missingFields.push('departureDate');
    if (!departureAirport?.trim()) missingFields.push('departureAirport');
    if (!arrivalAirport?.trim()) missingFields.push('arrivalAirport');
    if (!delayDuration?.trim()) missingFields.push('delayDuration');

    console.log('❌ Missing fields:', missingFields);

    if (missingFields.length > 0) {
      console.log('❌ Validation failed - returning error');
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: missingFields,
          message: `The following fields are required: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log('✅ All fields validated successfully');

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

    console.log(
      '✈️ Flight details created:',
      JSON.stringify(flightDetails, null, 2)
    );

    // Check eligibility
    console.log('🔍 Checking eligibility...');
    const result = await checkEligibility(flightDetails);
    console.log('📊 Eligibility result:', JSON.stringify(result, null, 2));

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
        data: {
          flightData: {
            flightNumber: flightDetails.flightNumber,
            departureDate: flightDetails.departureDate,
            departureAirport: flightDetails.departureAirport,
            arrivalAirport: flightDetails.arrivalAirport,
            status: 'Delayed',
          },
          eligibility: {
            isEligible: result.eligible,
            compensationAmount: result.amount,
            reason: result.reason || result.message,
          },
          validation: {
            isValid: true,
          },
        },
        method: 'flight_lookup',
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
