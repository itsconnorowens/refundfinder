/**
 * Comprehensive Health Check API
 * Full system health check including URLs, claims, and alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { airlineMonitoringService } from '@/lib/airline-monitoring';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async (request: NextRequest) => {
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
}, { route: '/api/monitoring/health-check', tags: { service: 'monitoring', operation: 'health_check' } });

export const dynamic = 'force-dynamic';
