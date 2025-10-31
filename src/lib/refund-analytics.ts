import { logger } from '@/lib/logger';

import { ClaimStatus, PaymentStatus } from './airtable';

// Analytics time periods
export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

// Refund analytics interfaces
export interface RefundAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;

  // Overall metrics
  totalClaims: number;
  totalPayments: number;
  totalRefunds: number;
  refundRate: number; // percentage

  // Revenue metrics
  totalRevenue: number; // in cents
  totalRefunded: number; // in cents
  netRevenue: number; // in cents

  // Refund breakdown by trigger
  refundsByTrigger: Record<
    string,
    {
      count: number;
      amount: number;
      percentage: number;
    }
  >;

  // Time-based metrics
  averageRefundTime: number; // hours from submission to refund
  refundsByHour: Record<number, number>; // refunds by hour of day

  // Status breakdown
  claimsByStatus: Record<ClaimStatus, number>;
  paymentsByStatus: Record<PaymentStatus, number>;

  // Trends
  dailyRefundRate: Array<{
    date: string;
    refundRate: number;
    refundCount: number;
    claimCount: number;
  }>;
}

export interface RefundAlert {
  id: string;
  type:
    | 'high_refund_rate'
    | 'unusual_pattern'
    | 'system_error'
    | 'threshold_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface RefundMonitoringConfig {
  // Alert thresholds
  HIGH_REFUND_RATE_THRESHOLD: number; // percentage
  UNUSUAL_PATTERN_THRESHOLD: number; // standard deviations
  DAILY_REFUND_LIMIT: number; // maximum refunds per day

  // Monitoring intervals
  ANALYTICS_UPDATE_INTERVAL: number; // minutes
  ALERT_CHECK_INTERVAL: number; // minutes

  // Data retention
  ANALYTICS_RETENTION_DAYS: number;
  ALERT_RETENTION_DAYS: number;
}

export const REFUND_MONITORING_CONFIG: RefundMonitoringConfig = {
  HIGH_REFUND_RATE_THRESHOLD: 25, // 25% refund rate triggers alert
  UNUSUAL_PATTERN_THRESHOLD: 2, // 2 standard deviations from mean
  DAILY_REFUND_LIMIT: 100, // Max 100 refunds per day

  ANALYTICS_UPDATE_INTERVAL: 60, // Update analytics every hour
  ALERT_CHECK_INTERVAL: 15, // Check for alerts every 15 minutes

  ANALYTICS_RETENTION_DAYS: 365, // Keep analytics for 1 year
  ALERT_RETENTION_DAYS: 90, // Keep alerts for 90 days
};

/**
 * Calculate refund analytics for a given period
 */
export async function calculateRefundAnalytics(
  period: AnalyticsPeriod,
  startDate: Date,
  endDate: Date
): Promise<RefundAnalytics> {
  try {
    // This would typically query your database/Airtable for the time period
    // For now, we'll create a mock implementation

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Mock data - in production, this would query your actual data
    const mockData = generateMockAnalyticsData(period, totalDays);

    return mockData;
  } catch (error) {
    logger.error('Error calculating refund analytics:', error);
    throw error;
  }
}

/**
 * Generate mock analytics data for development/testing
 */
function generateMockAnalyticsData(
  period: AnalyticsPeriod,
  totalDays: number
): RefundAnalytics {
  const baseClaims = Math.floor(Math.random() * 100) + 50; // 50-150 claims
  const refundRate = Math.random() * 0.3 + 0.1; // 10-40% refund rate
  const totalRefunds = Math.floor(baseClaims * refundRate);

  const refundsByTrigger = {
    claim_not_filed_deadline: {
      count: Math.floor(totalRefunds * 0.4),
      amount: Math.floor(totalRefunds * 0.4) * 4900,
      percentage: 40,
    },
    claim_rejected_by_airline: {
      count: Math.floor(totalRefunds * 0.3),
      amount: Math.floor(totalRefunds * 0.3) * 4900,
      percentage: 30,
    },
    insufficient_documentation: {
      count: Math.floor(totalRefunds * 0.2),
      amount: Math.floor(totalRefunds * 0.2) * 4900,
      percentage: 20,
    },
    customer_request: {
      count: Math.floor(totalRefunds * 0.1),
      amount: Math.floor(totalRefunds * 0.1) * 4900,
      percentage: 10,
    },
  };

  const dailyRefundRate = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (totalDays - i - 1));

    return {
      date: date.toISOString().split('T')[0],
      refundRate: Math.random() * 0.4 + 0.1,
      refundCount: Math.floor(Math.random() * 10) + 1,
      claimCount: Math.floor(Math.random() * 20) + 5,
    };
  });

  return {
    period,
    startDate: new Date(),
    endDate: new Date(),
    totalClaims: baseClaims,
    totalPayments: baseClaims,
    totalRefunds,
    refundRate: refundRate * 100,
    totalRevenue: baseClaims * 4900,
    totalRefunded: totalRefunds * 4900,
    netRevenue: (baseClaims - totalRefunds) * 4900,
    refundsByTrigger,
    averageRefundTime: Math.random() * 48 + 24, // 24-72 hours
    refundsByHour: generateHourlyDistribution(),
    claimsByStatus: {
      submitted: Math.floor(baseClaims * 0.2),
      validated: Math.floor(baseClaims * 0.15),
      documents_prepared: Math.floor(baseClaims * 0.1),
      ready_to_file: Math.floor(baseClaims * 0.1),
      filed: Math.floor(baseClaims * 0.15),
      airline_acknowledged: Math.floor(baseClaims * 0.1),
      monitoring: Math.floor(baseClaims * 0.05),
      airline_responded: Math.floor(baseClaims * 0.05),
      approved: Math.floor(baseClaims * 0.03),
      rejected: Math.floor(baseClaims * 0.02),
      completed: Math.floor(baseClaims * 0.03),
      refunded: Math.floor(baseClaims * 0.02),
    },
    paymentsByStatus: {
      pending: Math.floor(baseClaims * 0.05),
      succeeded: baseClaims - totalRefunds,
      failed: Math.floor(baseClaims * 0.02),
      refunded: totalRefunds,
      partially_refunded: 0,
    },
    dailyRefundRate,
  };
}

/**
 * Generate hourly distribution of refunds
 */
function generateHourlyDistribution(): Record<number, number> {
  const distribution: Record<number, number> = {};

  for (let hour = 0; hour < 24; hour++) {
    // Business hours (9-17) have higher activity
    if (hour >= 9 && hour <= 17) {
      distribution[hour] = Math.floor(Math.random() * 10) + 5;
    } else {
      distribution[hour] = Math.floor(Math.random() * 3) + 1;
    }
  }

  return distribution;
}

/**
 * Check for refund alerts based on current analytics
 */
export async function checkRefundAlerts(
  analytics: RefundAnalytics
): Promise<RefundAlert[]> {
  const alerts: RefundAlert[] = [];

  // Check high refund rate
  if (
    analytics.refundRate > REFUND_MONITORING_CONFIG.HIGH_REFUND_RATE_THRESHOLD
  ) {
    alerts.push({
      id: `high-refund-rate-${Date.now()}`,
      type: 'high_refund_rate',
      severity: analytics.refundRate > 50 ? 'critical' : 'high',
      title: 'High Refund Rate Detected',
      message: `Refund rate is ${analytics.refundRate.toFixed(1)}%, exceeding threshold of ${REFUND_MONITORING_CONFIG.HIGH_REFUND_RATE_THRESHOLD}%`,
      metadata: {
        refundRate: analytics.refundRate,
        threshold: REFUND_MONITORING_CONFIG.HIGH_REFUND_RATE_THRESHOLD,
        totalRefunds: analytics.totalRefunds,
        totalClaims: analytics.totalClaims,
      },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  // Check daily refund limit
  const todayRefunds =
    analytics.dailyRefundRate[analytics.dailyRefundRate.length - 1];
  if (todayRefunds.refundCount > REFUND_MONITORING_CONFIG.DAILY_REFUND_LIMIT) {
    alerts.push({
      id: `daily-limit-exceeded-${Date.now()}`,
      type: 'threshold_exceeded',
      severity: 'critical',
      title: 'Daily Refund Limit Exceeded',
      message: `${todayRefunds.refundCount} refunds processed today, exceeding limit of ${REFUND_MONITORING_CONFIG.DAILY_REFUND_LIMIT}`,
      metadata: {
        refundCount: todayRefunds.refundCount,
        limit: REFUND_MONITORING_CONFIG.DAILY_REFUND_LIMIT,
        date: todayRefunds.date,
      },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  // Check for unusual patterns
  const recentDays = analytics.dailyRefundRate.slice(-7); // Last 7 days
  const avgRefundRate =
    recentDays.reduce((sum, day) => sum + day.refundRate, 0) /
    recentDays.length;
  const variance =
    recentDays.reduce(
      (sum, day) => sum + Math.pow(day.refundRate - avgRefundRate, 2),
      0
    ) / recentDays.length;
  const standardDeviation = Math.sqrt(variance);

  const latestRefundRate = recentDays[recentDays.length - 1].refundRate;
  const zScore = Math.abs(latestRefundRate - avgRefundRate) / standardDeviation;

  if (zScore > REFUND_MONITORING_CONFIG.UNUSUAL_PATTERN_THRESHOLD) {
    alerts.push({
      id: `unusual-pattern-${Date.now()}`,
      type: 'unusual_pattern',
      severity: zScore > 3 ? 'high' : 'medium',
      title: 'Unusual Refund Pattern Detected',
      message: `Today's refund rate (${latestRefundRate.toFixed(1)}%) is ${zScore.toFixed(1)} standard deviations from the 7-day average (${avgRefundRate.toFixed(1)}%)`,
      metadata: {
        latestRefundRate,
        averageRefundRate: avgRefundRate,
        standardDeviation,
        zScore,
        threshold: REFUND_MONITORING_CONFIG.UNUSUAL_PATTERN_THRESHOLD,
      },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  return alerts;
}

/**
 * Get refund analytics dashboard data
 */
export async function getRefundDashboardData(): Promise<{
  currentPeriod: RefundAnalytics;
  previousPeriod: RefundAnalytics;
  alerts: RefundAlert[];
  trends: {
    refundRateTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
    volumeTrend: 'up' | 'down' | 'stable';
  };
}> {
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  const previousPeriodStart = new Date(
    now.getTime() - 14 * 24 * 60 * 60 * 1000
  ); // 7-14 days ago

  const [currentPeriod, previousPeriod] = await Promise.all([
    calculateRefundAnalytics('day', currentPeriodStart, now),
    calculateRefundAnalytics('day', previousPeriodStart, currentPeriodStart),
  ]);

  const alerts = await checkRefundAlerts(currentPeriod);

  // Calculate trends
  const refundRateTrend =
    currentPeriod.refundRate > previousPeriod.refundRate
      ? 'up'
      : currentPeriod.refundRate < previousPeriod.refundRate
        ? 'down'
        : 'stable';

  const revenueTrend =
    currentPeriod.netRevenue > previousPeriod.netRevenue
      ? 'up'
      : currentPeriod.netRevenue < previousPeriod.netRevenue
        ? 'down'
        : 'stable';

  const volumeTrend =
    currentPeriod.totalClaims > previousPeriod.totalClaims
      ? 'up'
      : currentPeriod.totalClaims < previousPeriod.totalClaims
        ? 'down'
        : 'stable';

  return {
    currentPeriod,
    previousPeriod,
    alerts,
    trends: {
      refundRateTrend,
      revenueTrend,
      volumeTrend,
    },
  };
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(
  alert: RefundAlert,
  acknowledgedBy: string
): RefundAlert {
  return {
    ...alert,
    acknowledged: true,
    acknowledgedAt: new Date(),
    acknowledgedBy,
  };
}

/**
 * Get refund performance metrics
 */
export async function getRefundPerformanceMetrics(): Promise<{
  overall: {
    refundRate: number;
    averageRefundTime: number;
    customerSatisfaction: number; // Mock metric
  };
  byTrigger: Record<
    string,
    {
      count: number;
      rate: number;
      averageTime: number;
    }
  >;
  recommendations: string[];
}> {
  const dashboardData = await getRefundDashboardData();
  const analytics = dashboardData.currentPeriod;

  const byTrigger = Object.entries(analytics.refundsByTrigger).reduce(
    (acc, [trigger, data]) => {
      acc[trigger] = {
        count: data.count,
        rate: data.percentage,
        averageTime: Math.random() * 48 + 24, // Mock data
      };
      return acc;
    },
    {} as Record<string, { count: number; rate: number; averageTime: number }>
  );

  const recommendations: string[] = [];

  // Generate recommendations based on analytics
  if (analytics.refundRate > 30) {
    recommendations.push(
      'Consider improving claim filing process to reduce deadline-related refunds'
    );
  }

  if (
    analytics.refundsByTrigger['insufficient_documentation'].percentage > 15
  ) {
    recommendations.push(
      'Enhance document upload validation and user guidance'
    );
  }

  if (analytics.refundsByTrigger['ineligible_flight'].percentage > 10) {
    recommendations.push(
      'Improve eligibility checking before payment collection'
    );
  }

  return {
    overall: {
      refundRate: analytics.refundRate,
      averageRefundTime: analytics.averageRefundTime,
      customerSatisfaction: Math.random() * 20 + 80, // Mock: 80-100%
    },
    byTrigger,
    recommendations,
  };
}
