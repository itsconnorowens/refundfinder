import { NextRequest, NextResponse } from 'next/server';
import { getRefundDashboardData } from '@/lib/refund-analytics';

/**
 * GET /api/refund-analytics/dashboard
 * Get refund analytics dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const dashboardData = await getRefundDashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error getting refund dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
