import { NextRequest, NextResponse } from 'next/server';
import {
  calculateRefundAnalytics,
  getRefundDashboardData,
  getRefundPerformanceMetrics,
  checkRefundAlerts,
  acknowledgeAlert,
  RefundAlert,
  AnalyticsPeriod,
} from '@/lib/refund-analytics';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/refund-analytics
 * Get refund analytics data based on query parameters
 */
export const GET = withErrorTracking(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'performance') {
      const metrics = await getRefundPerformanceMetrics();
      return NextResponse.json({
        success: true,
        data: metrics,
      });
    } else if (type === 'alerts') {
      const dashboardData = await getRefundDashboardData();
      const alerts = dashboardData.alerts;
      return NextResponse.json({
        success: true,
        data: alerts,
      });
    } else if (type === 'period') {
      const period = (searchParams.get('period') as AnalyticsPeriod) || 'day';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Missing required parameters: startDate, endDate' },
          { status: 400 }
        );
      }

      const analytics = await calculateRefundAnalytics(
        period,
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({
        success: true,
        data: analytics,
      });
    } else {
      // Default: return dashboard data
      const dashboardData = await getRefundDashboardData();
      return NextResponse.json({
        success: true,
        data: dashboardData,
      });
    }
}, { route: '/api/refund-analytics', tags: { service: 'analytics', operation: 'refund_analytics' } });

/**
 * POST /api/refund-analytics/alerts/acknowledge
 * Acknowledge a refund alert
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
    const body = await request.json();
    const { alertId, acknowledgedBy } = body;

    if (!alertId || !acknowledgedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, acknowledgedBy' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd fetch the alert from your database
    // For now, we'll create a mock alert
    const mockAlert: RefundAlert = {
      id: alertId,
      type: 'high_refund_rate',
      severity: 'high',
      title: 'High Refund Rate Detected',
      message: 'Refund rate is 30%, exceeding threshold of 25%',
      metadata: {},
      createdAt: new Date(),
      acknowledged: false,
    };

    const acknowledgedAlert = acknowledgeAlert(mockAlert, acknowledgedBy);

  return NextResponse.json({
    success: true,
    data: acknowledgedAlert,
  });
}, { route: '/api/refund-analytics', tags: { service: 'analytics', operation: 'acknowledge_alert' } });
