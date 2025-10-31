/**
 * API Route: Verify Flight Status
 *
 * POST /api/verify-flight
 *
 * Verifies flight status using external APIs with caching and cost controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { flightValidationService } from '@/lib/flight-validation';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();
    const {
      flightNumber,
      flightDate,
      userReportedDelay,
      userReportedType,
      departureAirport,
      arrivalAirport,
    } = body;

    // Validate required fields
    if (
      !flightNumber ||
      !flightDate ||
      userReportedDelay === undefined ||
      !userReportedType
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: flightNumber, flightDate, userReportedDelay, userReportedType',
        },
        { status: 400 }
      );
    }

    // Validate disruption type
    if (!['delay', 'cancellation'].includes(userReportedType)) {
      return NextResponse.json(
        { error: 'Invalid disruption type. Must be "delay" or "cancellation"' },
        { status: 400 }
      );
    }

    // Validate delay is a number
    const delayHours = parseFloat(userReportedDelay);
    if (isNaN(delayHours) || delayHours < 0) {
      return NextResponse.json(
        { error: 'Invalid delay duration. Must be a positive number' },
        { status: 400 }
      );
    }

    // Check if validation service is available
    if (!flightValidationService.isValidationAvailable()) {
      return NextResponse.json({
        verified: false,
        confidence: 0,
        status: 'unavailable',
        message: 'Flight verification service is currently unavailable',
        userReportedMatch: true,
      });
    }

  // Perform flight validation
  addBreadcrumb('Validating flight', 'flight_validation', { flightNumber: flightNumber.trim().toUpperCase(), flightDate });
  const validationResult = await flightValidationService.validateFlight({
    flightNumber: flightNumber.trim().toUpperCase(),
    flightDate,
    userReportedDelay: delayHours,
    userReportedType,
    departureAirport,
    arrivalAirport,
  });

  return NextResponse.json(validationResult);
}, { route: '/api/verify-flight', tags: { service: 'flight_validation' } });

export async function GET(_request: NextRequest) {
  try {
    // Return service status and usage information
    const serviceStatus = flightValidationService.getServiceStatus();
    const stats = flightValidationService.getValidationStats();

    return NextResponse.json({
      service: serviceStatus,
      stats,
    });
  } catch (error: unknown) {
    logger.error('Flight verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
