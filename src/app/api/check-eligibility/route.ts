import { NextRequest, NextResponse } from 'next/server';
import { checkEligibility, FlightDetails } from '@/lib/eligibility';
import { createEligibilityCheck, EligibilityCheckRecord } from '@/lib/airtable';
import {
  checkRateLimit,
  getClientIdentifier,
  ELIGIBILITY_RATE_LIMIT,
} from '@/lib/rate-limit';
import { withErrorTracking, addBreadcrumb, captureError } from '@/lib/error-tracking';
import { missingFieldsResponse, rateLimitResponse } from '@/lib/api-response';
import { trackServerEvent, trackServerError } from '@/lib/posthog';
import { logger } from '@/lib/logger';

export const POST = withErrorTracking(async (request: NextRequest) => {
  const startTime = Date.now();
  logger.info('🔍 Eligibility Check API - Request received', {
    timestamp: new Date().toISOString(),
  });

  // Check rate limit
    const clientId = getClientIdentifier(request);
    logger.info('📊 Rate limit check for client:', { clientId: clientId });

    const rateLimitResult = checkRateLimit(clientId, ELIGIBILITY_RATE_LIMIT);
    logger.info('📊 Rate limit result:', { rateLimitResult: rateLimitResult });

    if (!rateLimitResult.allowed) {
      logger.info('❌ Rate limit exceeded');
      return rateLimitResponse(
        rateLimitResult.retryAfter || 3600,
        rateLimitResult.remaining
      );
    }

  const body = await request.json();
  logger.info('📝 Request body received:', { body: JSON.stringify(body, null, 2) });

    // Extract all fields from body (with backward compatibility defaults)
    const {
      flightNumber,
      airline,
      departureDate,
      departureAirport,
      arrivalAirport,
      delayDuration,
      delayReason,
      // Disruption type (defaults to 'delay' for backward compatibility)
      disruptionType = 'delay',
      // Cancellation-specific fields
      noticeGiven,
      alternativeOffered,
      alternativeTiming,
      // Denied boarding-specific fields
      deniedBoardingType,
      compensationOffered,
      // Downgrade-specific fields
      bookedClass,
      actualClass,
      ticketPrice,
      fareDifference,
    } = body;

    logger.info('🔍 Field validation:');
    logger.info('  flightNumber:', { flightNumber, type: typeof flightNumber });
    logger.info('  airline:', { airline, type: typeof airline });
    logger.info('  departureDate:', { departureDate, type: typeof departureDate });
    logger.info('  departureAirport:', { departureAirport, type: typeof departureAirport });
    logger.info('  arrivalAirport:', { arrivalAirport, type: typeof arrivalAirport });
    logger.info('  delayDuration:', { delayDuration, type: typeof delayDuration });
    logger.info('  delayReason:', { delayReason, type: typeof delayReason });
    logger.info('  disruptionType:', { disruptionType, type: typeof disruptionType });

    // Validate required fields with better error messages
    const missingFields = [];
    if (!flightNumber?.trim()) missingFields.push('flightNumber');
    if (!airline?.trim()) missingFields.push('airline');
    if (!departureDate?.trim()) missingFields.push('departureDate');
    if (!departureAirport?.trim()) missingFields.push('departureAirport');
    if (!arrivalAirport?.trim()) missingFields.push('arrivalAirport');

    // Only require delayDuration for delay disruption type (backward compatibility)
    if (disruptionType === 'delay' && !delayDuration?.trim()) {
      missingFields.push('delayDuration');
    }

    logger.info('❌ Missing fields:', { missingFields: missingFields });

    if (missingFields.length > 0) {
      logger.info('❌ Validation failed - returning error');
      return missingFieldsResponse(missingFields);
    }

    logger.info('✅ All fields validated successfully');

    // Create flight details object with all fields
    const flightDetails: FlightDetails = {
      flightNumber: flightNumber.trim(),
      airline: airline.trim(),
      departureDate,
      departureAirport: departureAirport.trim().toUpperCase(),
      arrivalAirport: arrivalAirport.trim().toUpperCase(),
      delayDuration: delayDuration?.trim() || '0',
      delayReason: delayReason?.trim(),
      // Disruption type
      disruptionType: disruptionType as
        | 'delay'
        | 'cancellation'
        | 'downgrading'
        | 'denied_boarding',
      // Cancellation fields (only include if provided)
      ...(noticeGiven && { noticeGiven }),
      ...(alternativeOffered !== undefined && { alternativeOffered }),
      ...(alternativeTiming && { alternativeTiming }),
      // Denied boarding fields (only include if provided)
      ...(deniedBoardingType && { deniedBoardingType }),
      ...(compensationOffered !== undefined && { compensationOffered }),
      // Downgrade fields (only include if provided)
      ...(bookedClass && { bookedClass }),
      ...(actualClass && { actualClass }),
      ...(ticketPrice !== undefined && { ticketPrice }),
    };

    logger.info('Flight details created', { flightDetails });

  // Check eligibility
  addBreadcrumb('Checking flight eligibility', 'eligibility', {
    flightNumber: flightDetails.flightNumber,
    disruptionType: flightDetails.disruptionType
  });
  logger.info('🔍 Checking eligibility...');
  const result = await checkEligibility(flightDetails);
  logger.info('📊 Eligibility result:', { result: JSON.stringify(result, null, 2) });

  // Track eligibility check completion in PostHog
  trackServerEvent(
    clientId,
    'eligibility_check_completed',
    {
      eligible: result.eligible,
      compensation_amount: result.amount,
      airline: flightDetails.airline,
      disruption_type: flightDetails.disruptionType,
      flight_number: flightDetails.flightNumber,
      confidence: result.confidence,
    }
  );

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
    logger.info('Eligibility check  stored successfully', { checkId: checkId });
  } catch (error: unknown) {
    captureError(error, { level: 'warning', tags: { service: 'airtable', operation: 'eligibility_check_storage' } });
    logger.error('Error storing eligibility check:', error);

    // Track error in PostHog for analytics
    trackServerError('airtable_storage_error', error, {
      userId: body.passengerEmail,
      endpoint: '/api/check-eligibility',
      method: 'POST',
      operation: 'eligibility_check_storage',
      flightNumber: flightDetails.flightNumber,
      airline: flightDetails.airline,
    });

    // Continue even if storage fails
  }

    const duration = Date.now() - startTime;
    logger.info('✅ Eligibility check completed successfully', {
      duration,
      eligible: result.eligible,
      compensationAmount: result.amount,
    });

    // Log warning if request took too long (potential timeout risk)
    if (duration > 25000) {
      logger.warn('⚠️ Eligibility check took longer than 25 seconds', {
        duration,
        flightNumber: flightDetails.flightNumber,
        airline: flightDetails.airline,
      });
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
            status:
              disruptionType === 'cancellation'
                ? 'Cancelled'
                : disruptionType === 'denied_boarding'
                  ? 'Denied Boarding'
                  : disruptionType === 'downgrading'
                    ? 'Downgraded'
                    : 'Delayed',
          },
          eligibility: {
            isEligible: result.eligible,
            compensationAmount: result.amount,
            reason: result.reason || result.message,
            message: result.message,
            regulation: result.regulation,
            confidence: result.confidence,
            disruptionType: flightDetails.disruptionType,
            // Include scenario-specific fields in response
            ...(noticeGiven && { noticeGiven }),
            ...(alternativeOffered !== undefined && { alternativeOffered }),
            ...(alternativeTiming && { alternativeTiming }),
            ...(deniedBoardingType && { deniedBoardingType }),
            ...(compensationOffered !== undefined && { compensationOffered }),
            ...(bookedClass && { bookedClass }),
            ...(actualClass && { actualClass }),
            ...(fareDifference !== undefined && { fareDifference }),
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
          'X-Response-Time': duration.toString(),
        },
      }
    );
}, { route: '/api/check-eligibility', tags: { service: 'eligibility' } });

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
