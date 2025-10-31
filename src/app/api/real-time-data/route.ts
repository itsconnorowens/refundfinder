/**
 * API Endpoint for Real-Time Flight and Airport Data
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeRealTimeServices } from '../../../lib/real-time-services-config';
import { logger } from '@/lib/logger';

// Initialize services
const { factory, monitor } = initializeRealTimeServices();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'flight' or 'airport'
    const flightNumber = searchParams.get('flightNumber');
    const flightDate = searchParams.get('flightDate');
    const airportCode = searchParams.get('airportCode');

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required (flight or airport)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    if (type === 'flight') {
      if (!flightNumber || !flightDate) {
        return NextResponse.json(
          { error: 'flightNumber and flightDate are required for flight data' },
          { status: 400 }
        );
      }

      const flightStatusManager = factory.createFlightStatusManager();
      const flightStatus = await flightStatusManager.getFlightStatus(
        flightNumber,
        new Date(flightDate)
      );

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('flight-status', 'api', true, responseTime);

      return NextResponse.json({
        success: true,
        data: flightStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
          type: 'flight',
        },
      });
    }

    if (type === 'airport') {
      if (!airportCode) {
        return NextResponse.json(
          { error: 'airportCode is required for airport data' },
          { status: 400 }
        );
      }

      const airportStatusManager = factory.createAirportStatusManager();
      const airportStatus =
        await airportStatusManager.getAirportStatus(airportCode);

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('airport-status', 'api', true, responseTime);

      return NextResponse.json({
        success: true,
        data: airportStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
          type: 'airport',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use "flight" or "airport"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    logger.error('Real-time data API error:', error);

    monitor.recordApiCall('real-time-data', 'api', false, 0);
    monitor.recordError('real-time-data', 'api', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to fetch real-time data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, flightNumber, flightDate, airportCode } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required (flight or airport)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    if (type === 'flight') {
      if (!flightNumber || !flightDate) {
        return NextResponse.json(
          { error: 'flightNumber and flightDate are required for flight data' },
          { status: 400 }
        );
      }

      const flightStatusManager = factory.createFlightStatusManager();
      const flightStatus = await flightStatusManager.getFlightStatus(
        flightNumber,
        new Date(flightDate)
      );

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('flight-status', 'api', true, responseTime);

      return NextResponse.json({
        success: true,
        data: flightStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
          type: 'flight',
        },
      });
    }

    if (type === 'airport') {
      if (!airportCode) {
        return NextResponse.json(
          { error: 'airportCode is required for airport data' },
          { status: 400 }
        );
      }

      const airportStatusManager = factory.createAirportStatusManager();
      const airportStatus =
        await airportStatusManager.getAirportStatus(airportCode);

      const responseTime = Date.now() - startTime;
      monitor.recordApiCall('airport-status', 'api', true, responseTime);

      return NextResponse.json({
        success: true,
        data: airportStatus,
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
          type: 'airport',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "flight" or "airport"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    logger.error('Real-time data POST API error:', error);

    monitor.recordApiCall('real-time-data', 'api', false, 0);
    monitor.recordError('real-time-data', 'api', error as Error);

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
    // Basic health check
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
