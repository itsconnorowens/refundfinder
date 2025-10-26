/**
 * Comprehensive Health Check API
 * Full system health check including URLs, claims, and alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { airlineMonitoringService } from '@/lib/airline-monitoring';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeAlerts = searchParams.get('alerts') === 'true';
    const severity = searchParams.get('severity');

    // Perform comprehensive health check
    const report = await airlineMonitoringService.performHealthCheck();

    // Filter alerts if severity specified
    let alerts = report.alerts;
    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        alerts: includeAlerts ? alerts : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error performing health check:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform health check',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
