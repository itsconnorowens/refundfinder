/**
 * API Route: Verify Flight Status
 *
 * POST /api/verify-flight
 *
 * Verifies flight status using external APIs with caching and cost controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { flightValidationService } from '@/lib/flight-validation';

export async function POST(request: NextRequest) {
  try {
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
    const validationResult = await flightValidationService.validateFlight({
      flightNumber: flightNumber.trim().toUpperCase(),
      flightDate,
      userReportedDelay: delayHours,
      userReportedType,
      departureAirport,
      arrivalAirport,
    });

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Flight verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during flight verification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return service status and usage information
    const serviceStatus = flightValidationService.getServiceStatus();
    const stats = flightValidationService.getValidationStats();

    return NextResponse.json({
      service: serviceStatus,
      stats,
    });
  } catch (error) {
    console.error('Flight verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
