/**
 * API Endpoint for Enhanced Claim Processing with Real-Time Data
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeRealTimeServices } from '../../../lib/real-time-services-config';

// Initialize services
const { factory, monitor } = initializeRealTimeServices();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      emailContent,
      flightNumber,
      flightDate,
      departureAirport,
      arrivalAirport,
    } = body;

    if (!emailContent && !flightNumber) {
      return NextResponse.json(
        { error: 'Either emailContent or flightNumber is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Create enhanced claim processing service
    const claimProcessingService =
      factory.createEnhancedClaimProcessingService();

    let result;

    if (emailContent) {
      // Process email content
      result = await claimProcessingService.processClaim(emailContent);
    } else {
      // Process specific flight
      result = await claimProcessingService.processClaim(
        `Flight ${flightNumber} from ${departureAirport} to ${arrivalAirport} on ${flightDate}`
      );
    }

    const responseTime = Date.now() - startTime;

    // Record metrics
    monitor.recordApiCall('claim-processing', 'enhanced', true, responseTime);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime: responseTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Enhanced claim processing error:', error);

    // Record error metrics
    monitor.recordApiCall('claim-processing', 'enhanced', false, 0);
    monitor.recordError('claim-processing', 'enhanced', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to process claim',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flightNumber = searchParams.get('flightNumber');
    const flightDate = searchParams.get('flightDate');
    const airportCode = searchParams.get('airportCode');

    if (!flightNumber && !airportCode) {
      return NextResponse.json(
        { error: 'Either flightNumber or airportCode is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    if (flightNumber && flightDate) {
      // Get flight status
      const flightStatusManager = factory.createFlightStatusManager();
      const flightStatus = await flightStatusManager.getFlightStatus(
        flightNumber,
        new Date(flightDate)
      );

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('flight-status', 'enhanced', true, responseTime);

      return NextResponse.json({
        success: true,
        data: flightStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (airportCode) {
      // Get airport status
      const airportStatus =
        await factory.createAirportStatusManager().getAirportStatus(airportCode);

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('airport-status', 'enhanced', true, responseTime);

      return NextResponse.json({
        success: true,
        data: airportStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Real-time data fetch error:', error);

    monitor.recordApiCall('real-time-data', 'enhanced', false, 0);
    monitor.recordError('real-time-data', 'enhanced', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to fetch real-time data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
