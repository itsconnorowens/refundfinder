import { NextRequest, NextResponse } from 'next/server';
import { getRefundDashboardData } from '@/lib/refund-analytics';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/refund-analytics/dashboard
 * Get refund analytics dashboard data
 */
export const GET = withErrorTracking(async (request: NextRequest) => {
  const dashboardData = await getRefundDashboardData();

  return NextResponse.json({
    success: true,
    data: dashboardData,
  });
}, { route: '/api/refund-analytics/dashboard', tags: { service: 'analytics', operation: 'dashboard' } });
