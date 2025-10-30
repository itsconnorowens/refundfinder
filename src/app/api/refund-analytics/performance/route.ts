import { NextRequest, NextResponse } from 'next/server';
import { getRefundPerformanceMetrics } from '@/lib/refund-analytics';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/refund-analytics/performance
 * Get refund performance metrics
 */
export const GET = withErrorTracking(async (_request: NextRequest) => {
  const metrics = await getRefundPerformanceMetrics();

  return NextResponse.json({
    success: true,
    data: metrics,
  });
}, { route: '/api/refund-analytics/performance', tags: { service: 'analytics', operation: 'performance_metrics' } });
