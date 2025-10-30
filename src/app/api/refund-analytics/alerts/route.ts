import { NextRequest, NextResponse } from 'next/server';
import { getRefundDashboardData } from '@/lib/refund-analytics';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/refund-analytics/alerts
 * Get current refund alerts
 */
export const GET = withErrorTracking(async (request: NextRequest) => {
  const dashboardData = await getRefundDashboardData();
  const alerts = dashboardData.alerts;

  return NextResponse.json({
    success: true,
    data: alerts,
  });
}, { route: '/api/refund-analytics/alerts', tags: { service: 'analytics', operation: 'refund_alerts' } });
