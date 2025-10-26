import { NextRequest, NextResponse } from 'next/server';
import { getRefundPerformanceMetrics } from '@/lib/refund-analytics';

/**
 * GET /api/refund-analytics/performance
 * Get refund performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await getRefundPerformanceMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting refund performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
