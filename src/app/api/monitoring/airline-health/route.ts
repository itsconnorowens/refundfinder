/**
 * Airline Health Monitoring API
 * Endpoints for monitoring airline URL health and claim success rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { airlineMonitoringService } from '@/lib/airline-monitoring';

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error fetching airline health:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch airline health data',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error tracking claim:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track claim',
      },
      { status: 500 }
    );
  }
}
