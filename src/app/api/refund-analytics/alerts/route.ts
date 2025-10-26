import { NextRequest, NextResponse } from 'next/server';
import { getRefundDashboardData } from '@/lib/refund-analytics';

/**
 * GET /api/refund-analytics/alerts
 * Get current refund alerts
 */
export async function GET(request: NextRequest) {
  try {
    const dashboardData = await getRefundDashboardData();
    const alerts = dashboardData.alerts;

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error getting refund alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
