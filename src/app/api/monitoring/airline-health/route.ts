/**
 * Airline Health Monitoring API
 * Endpoints for monitoring airline URL health and claim success rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { airlineMonitoringService } from '@/lib/airline-monitoring';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const airlineCode = searchParams.get('airlineCode');

  if (airlineCode) {
    // Get health for specific airline
    const health =
      await airlineMonitoringService.getAirlineHealth(airlineCode);

    return NextResponse.json({
      success: true,
      data: health,
    });
  }

  // Get overall statistics
  const statistics = airlineMonitoringService.getStatistics();

  return NextResponse.json({
    success: true,
    data: statistics,
  });
}, { route: '/api/monitoring/airline-health', tags: { service: 'monitoring', operation: 'airline_health' } });

export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();
  const { airlineCode, success, submissionMethod, statusCode, error } = body;

  if (!airlineCode) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing airlineCode',
      },
      { status: 400 }
    );
  }

  // Track claim submission result
  airlineMonitoringService.trackClaim(
    airlineCode,
    success,
    submissionMethod,
    statusCode,
    error
  );

  return NextResponse.json({
    success: true,
    message: 'Claim tracked successfully',
  });
}, { route: '/api/monitoring/airline-health', tags: { service: 'monitoring', operation: 'track_claim' } });
