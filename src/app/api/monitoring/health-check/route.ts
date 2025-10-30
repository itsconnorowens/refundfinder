/**
 * Comprehensive Health Check API
 * Checks all critical services and returns their health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { performHealthChecks, monitorServiceHealth } from '@/lib/monitoring-service';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const includeAlerts = searchParams.get('alerts') === 'true';

  // Perform health checks on all services
  const healthChecks = await performHealthChecks();

  // Get alerts for any degraded/down services
  const alerts = await monitorServiceHealth();

  // Determine overall health status
  const hasDownServices = healthChecks.some(check => check.status === 'down');
  const hasDegradedServices = healthChecks.some(check => check.status === 'degraded');

  let overallStatus = 'healthy';
  if (hasDownServices) {
    overallStatus = 'down';
  } else if (hasDegradedServices) {
    overallStatus = 'degraded';
  }

  return NextResponse.json({
    success: true,
    status: overallStatus,
    services: healthChecks,
    ...(includeAlerts && { alerts }),
    timestamp: new Date().toISOString(),
  });
}, { route: '/api/monitoring/health-check', tags: { service: 'monitoring', operation: 'health_check' } });

export const dynamic = 'force-dynamic';
