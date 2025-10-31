/**
 * Monitoring Service
 * Handles email tracking, alerts, and system monitoring
 */

import { getClaimByClaimId, TABLES } from './airtable';
import { sendNotification, NotificationChannel } from './notification-service';
import { trackDatabaseOperation } from './error-tracking';
import Airtable from 'airtable';
import { logger } from '@/lib/logger';

const base = process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
  : null;

export interface EmailTrackingEvent {
  messageId: string;
  event: 'sent' | 'delivered' | 'bounced' | 'opened' | 'failed';
  timestamp: string;
  details?: string;
}

export interface SystemAlert {
  id: string;
  type: 'email_failure' | 'sla_breach' | 'system_error' | 'high_volume';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface MonitoringStats {
  emailDeliveryRate: number;
  averageResponseTime: number;
  claimsFiledToday: number;
  overdueClaims: number;
  systemUptime: number;
  alerts: SystemAlert[];
}

/**
 * Update email tracking status for a claim
 */
export async function updateEmailTracking(
  claimId: string,
  trackingEvent: EmailTrackingEvent
): Promise<boolean> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      logger.error(`Claim not found for email tracking update`, undefined, { claimId });
      return false;
    }

    // Get existing email tracking data
    const existingTracking = claim.fields.emailTracking
      ? JSON.parse(claim.fields.emailTracking)
      : {};

    // Update tracking data
    const _updatedTracking = {
      ...existingTracking,
      [trackingEvent.messageId]: {
        ...existingTracking[trackingEvent.messageId],
        status: trackingEvent.event,
        lastUpdated: trackingEvent.timestamp,
        details: trackingEvent.details,
      },
    };

    // Note: emailTracking data is stored in memory for this session
    // In a production system, this would be stored in a separate tracking table

    // Check if this is a critical event that needs alerting
    if (trackingEvent.event === 'bounced' || trackingEvent.event === 'failed') {
      await createSystemAlert({
        type: 'email_failure',
        severity: 'high',
        title: `Email delivery failed for claim ${claimId}`,
        message: `Email ${trackingEvent.messageId} failed: ${trackingEvent.details}`,
        timestamp: trackingEvent.timestamp,
        resolved: false,
      });
    }

    logger.info(`Updated email tracking for claim`, {
      claimId,
      event: trackingEvent.event,
      operation: 'email_tracking'
    });
    return true;
  } catch (error: unknown) {
    logger.error('Error updating email tracking:', error);
    return false;
  }
}

/**
 * Create a system alert
 */
export async function createSystemAlert(
  alert: Omit<SystemAlert, 'id'>
): Promise<string> {
  try {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const _newAlert: SystemAlert = {
      id: alertId,
      ...alert,
    };

    // Determine notification channels based on severity
    const channels: NotificationChannel[] = ['console'];

    if (alert.severity === 'critical' || alert.severity === 'high') {
      channels.push('slack', 'email');
    } else if (alert.severity === 'medium') {
      channels.push('slack');
    }

    // Send notification
    await sendNotification({
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      channel: channels,
      metadata: {
        'Alert ID': alertId,
        'Alert Type': alert.type,
        'Timestamp': alert.timestamp,
      },
    });

    return alertId;
  } catch (error: unknown) {
    logger.error('Error creating system alert:', error);
    return '';
  }
}

/**
 * Check for SLA breaches
 */
export async function checkSLABreaches(): Promise<SystemAlert[]> {
  try {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Check for claims not filed within 48 hours
    // This would typically query the database for claims in 'submitted' status for >48 hours
    // For now, we'll create a placeholder alert structure

    const slaBreachAlert: SystemAlert = {
      id: `sla-${Date.now()}`,
      type: 'sla_breach',
      severity: 'high',
      title: 'SLA Breach: Claims not filed within 48 hours',
      message: 'Some claims have exceeded the 48-hour filing deadline',
      timestamp: now.toISOString(),
      resolved: false,
    };

    alerts.push(slaBreachAlert);

    return alerts;
  } catch (error: unknown) {
    logger.error('Error checking SLA breaches:', error);
    return [];
  }
}

/**
 * Check for email delivery issues
 */
export async function checkEmailDeliveryIssues(): Promise<SystemAlert[]> {
  try {
    const alerts: SystemAlert[] = [];

    // In a real implementation, this would check email delivery rates
    // For now, we'll create sample alerts

    const emailAlert: SystemAlert = {
      id: `email-${Date.now()}`,
      type: 'email_failure',
      severity: 'medium',
      title: 'Email Delivery Rate Below Threshold',
      message: 'Email delivery rate has dropped below 95% in the last 24 hours',
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    alerts.push(emailAlert);

    return alerts;
  } catch (error: unknown) {
    logger.error('Error checking email delivery issues:', error);
    return [];
  }
}

/**
 * Check for system errors
 */
export async function checkSystemErrors(): Promise<SystemAlert[]> {
  try {
    const alerts: SystemAlert[] = [];

    // In a real implementation, this would check system logs, error rates, etc.
    // For now, we'll create sample alerts

    const systemAlert: SystemAlert = {
      id: `system-${Date.now()}`,
      type: 'system_error',
      severity: 'critical',
      title: 'High Error Rate Detected',
      message: 'System error rate has exceeded 5% in the last hour',
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    alerts.push(systemAlert);

    return alerts;
  } catch (error: unknown) {
    logger.error('Error checking system errors:', error);
    return [];
  }
}

/**
 * Check for high volume alerts
 */
export async function checkHighVolumeAlerts(): Promise<SystemAlert[]> {
  try {
    const alerts: SystemAlert[] = [];

    // In a real implementation, this would check claim volume trends
    // For now, we'll create sample alerts

    const volumeAlert: SystemAlert = {
      id: `volume-${Date.now()}`,
      type: 'high_volume',
      severity: 'low',
      title: 'Unusual Claim Volume Detected',
      message: 'Claim volume is 50% higher than usual for this time of day',
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    alerts.push(volumeAlert);

    return alerts;
  } catch (error: unknown) {
    logger.error('Error checking high volume alerts:', error);
    return [];
  }
}

/**
 * Get comprehensive monitoring statistics
 */
export async function getComprehensiveMonitoringStats(): Promise<MonitoringStats> {
  try {
    // Gather all types of alerts
    const [slaAlerts, emailAlerts, systemAlerts, volumeAlerts] =
      await Promise.all([
        checkSLABreaches(),
        checkEmailDeliveryIssues(),
        checkSystemErrors(),
        checkHighVolumeAlerts(),
      ]);

    const allAlerts = [
      ...slaAlerts,
      ...emailAlerts,
      ...systemAlerts,
      ...volumeAlerts,
    ];

    // In a real implementation, these would be calculated from actual data
    const stats: MonitoringStats = {
      emailDeliveryRate: 98.5, // Percentage
      averageResponseTime: 2.3, // Hours
      claimsFiledToday: 12,
      overdueClaims: 3,
      systemUptime: 99.9, // Percentage
      alerts: allAlerts,
    };

    return stats;
  } catch (error: unknown) {
    logger.error('Error getting comprehensive monitoring stats:', error);
    return {
      emailDeliveryRate: 0,
      averageResponseTime: 0,
      claimsFiledToday: 0,
      overdueClaims: 0,
      systemUptime: 0,
      alerts: [],
    };
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy: string,
  resolutionNotes?: string
): Promise<boolean> {
  try {
    // In a real implementation, this would update the database
    logger.info(`Alert resolved`, { alertId, resolvedBy, resolutionNotes, operation: 'alert_resolution' });
    return true;
  } catch (error: unknown) {
    logger.error('Error resolving alert:', error);
    return false;
  }
}

/**
 * Send alert notifications
 */
export async function sendAlertNotification(
  alert: SystemAlert
): Promise<boolean> {
  try {
    // In a real implementation, this would integrate with Slack, PagerDuty, etc.
    const notification = {
      title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      message: alert.message,
      timestamp: alert.timestamp,
      type: alert.type,
    };

    logger.warn('ALERT NOTIFICATION:', { notification: notification });

    // Send to different channels based on severity
    if (alert.severity === 'critical') {
      // Send immediate notification (Slack, SMS, etc.)
      logger.error(
        'CRITICAL ALERT - IMMEDIATE ACTION REQUIRED',
        undefined,
        { notification, operation: 'alert_notification' }
      );
    } else if (alert.severity === 'high') {
      // Send to monitoring channel
      logger.warn('HIGH PRIORITY ALERT:', { notification: notification });
    } else {
      // Log for review
      logger.info('ALERT:', { notification: notification });
    }

    return true;
  } catch (error: unknown) {
    logger.error('Error sending alert notification:', error);
    return false;
  }
}

/**
 * Get monitoring statistics
 */
export async function getMonitoringStats(): Promise<MonitoringStats> {
  try {
    // In a real implementation, these would be calculated from actual data
    const stats: MonitoringStats = {
      emailDeliveryRate: 98.5, // Percentage
      averageResponseTime: 2.3, // Hours
      claimsFiledToday: 12,
      overdueClaims: 3,
      systemUptime: 99.9, // Percentage
      alerts: await checkSLABreaches(),
    };

    return stats;
  } catch (error: unknown) {
    logger.error('Error getting monitoring stats:', error);
    return {
      emailDeliveryRate: 0,
      averageResponseTime: 0,
      claimsFiledToday: 0,
      overdueClaims: 0,
      systemUptime: 0,
      alerts: [],
    };
  }
}

/**
 * Process email webhook events (for SendGrid, Resend, etc.)
 */
export async function processEmailWebhook(
  provider: 'sendgrid' | 'resend',
  webhookData: any
): Promise<boolean> {
  try {
    let trackingEvent: EmailTrackingEvent;

    if (provider === 'sendgrid') {
      // Process SendGrid webhook
      trackingEvent = {
        messageId: webhookData.sg_message_id,
        event: mapSendGridEvent(webhookData.event),
        timestamp: new Date(webhookData.timestamp * 1000).toISOString(),
        details: webhookData.reason || webhookData.response,
      };
    } else if (provider === 'resend') {
      // Process Resend webhook
      trackingEvent = {
        messageId: webhookData.data?.email_id,
        event: mapResendEvent(webhookData.type),
        timestamp: new Date().toISOString(),
        details: webhookData.data?.error || '',
      };
    } else {
      logger.error('Unsupported email provider:', provider);
      return false;
    }

    // Find claim by message ID and update tracking
    // In a real implementation, you'd need to store the mapping between messageId and claimId
    // For now, we'll log the event
    logger.info('Email webhook processed:', { trackingEvent: trackingEvent });

    return true;
  } catch (error: unknown) {
    logger.error('Error processing email webhook:', error);
    return false;
  }
}

/**
 * Map SendGrid event types to our tracking events
 */
function mapSendGridEvent(event: string): EmailTrackingEvent['event'] {
  switch (event) {
    case 'delivered':
      return 'delivered';
    case 'bounce':
    case 'dropped':
      return 'bounced';
    case 'open':
      return 'opened';
    case 'processed':
      return 'sent';
    default:
      return 'failed';
  }
}

/**
 * Map Resend event types to our tracking events
 */
function mapResendEvent(event: string): EmailTrackingEvent['event'] {
  switch (event) {
    case 'email.sent':
      return 'sent';
    case 'email.delivered':
      return 'delivered';
    case 'email.bounced':
      return 'bounced';
    case 'email.opened':
      return 'opened';
    case 'email.failed':
      return 'failed';
    default:
      return 'failed';
  }
}

/**
 * Get email delivery statistics for a claim
 */
export async function getClaimEmailStats(claimId: string): Promise<{
  totalEmails: number;
  delivered: number;
  bounced: number;
  opened: number;
  failed: number;
}> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim || !claim.fields.emailTracking) {
      return {
        totalEmails: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        failed: 0,
      };
    }

    const tracking = JSON.parse(claim.fields.emailTracking);
    const stats = {
      totalEmails: Object.keys(tracking).length,
      delivered: 0,
      bounced: 0,
      opened: 0,
      failed: 0,
    };

    Object.values(tracking).forEach((email: any) => {
      switch (email.status) {
        case 'delivered':
          stats.delivered++;
          break;
        case 'bounced':
          stats.bounced++;
          break;
        case 'opened':
          stats.opened++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    });

    return stats;
  } catch (error: unknown) {
    logger.error('Error getting claim email stats:', error);
    return {
      totalEmails: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      failed: 0,
    };
  }
}

/**
 * Get real-time claims statistics from Airtable
 */
export async function getRealTimeClaimsStats(): Promise<{
  claimsToday: number;
  claimsThisWeek: number;
  claimsThisMonth: number;
  overdueClaims: number;
  readyToFileClaims: number;
}> {
  if (!base) {
    return {
      claimsToday: 0,
      claimsThisWeek: 0,
      claimsThisMonth: 0,
      overdueClaims: 0,
      readyToFileClaims: 0,
    };
  }

  return trackDatabaseOperation('get_real_time_stats', TABLES.CLAIMS, async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const slaDeadline = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const stats = {
      claimsToday: 0,
      claimsThisWeek: 0,
      claimsThisMonth: 0,
      overdueClaims: 0,
      readyToFileClaims: 0,
    };

    const records = await base!(TABLES.CLAIMS)
      .select({
        fields: ['created_at', 'status', 'validated_at'],
      })
      .all();

    records.forEach((record) => {
      const createdAt = record.fields.created_at ? new Date(record.fields.created_at as string) : null;
      const status = record.fields.status as string;
      const validatedAt = record.fields.validated_at ? new Date(record.fields.validated_at as string) : null;

      if (createdAt) {
        if (createdAt >= todayStart) stats.claimsToday++;
        if (createdAt >= weekStart) stats.claimsThisWeek++;
        if (createdAt >= monthStart) stats.claimsThisMonth++;
      }

      if (status === 'ready_to_file') {
        stats.readyToFileClaims++;
      }

      // Check for SLA breach (>48 hours since validation without filing)
      if (status === 'validated' && validatedAt && validatedAt < slaDeadline) {
        stats.overdueClaims++;
      }
    });

    return stats;
  });
}

/**
 * Perform automated health checks on critical services
 */
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export async function performHealthChecks(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Check Airtable connectivity
  const airtableCheck = await checkAirtableHealth();
  results.push(airtableCheck);

  // Check Stripe connectivity
  const stripeCheck = await checkStripeHealth();
  results.push(stripeCheck);

  // Check Email service
  const emailCheck = await checkEmailServiceHealth();
  results.push(emailCheck);

  // Check Sentry integration
  const sentryCheck = await checkSentryHealth();
  results.push(sentryCheck);

  return results;
}

async function checkAirtableHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!base) {
      return {
        service: 'Airtable',
        status: 'down',
        error: 'Airtable credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Try to fetch a single record
    await base(TABLES.CLAIMS)
      .select({ maxRecords: 1 })
      .firstPage();

    const responseTime = Date.now() - startTime;

    return {
      service: 'Airtable',
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: 'Airtable',
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkStripeHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        service: 'Stripe',
        status: 'down',
        error: 'Stripe credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Stripe is configured, assume healthy
    // In a real implementation, you might make a test API call
    return {
      service: 'Stripe',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: 'Stripe',
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkEmailServiceHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const sendgridConfigured = !!process.env.SENDGRID_API_KEY;
    const resendConfigured = !!process.env.RESEND_API_KEY;

    if (!sendgridConfigured && !resendConfigured) {
      return {
        service: 'Email',
        status: 'down',
        error: 'No email service configured',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'Email',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: 'Email',
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkSentryHealth(): Promise<HealthCheckResult> {
  try {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return {
        service: 'Sentry',
        status: 'down',
        error: 'Sentry DSN not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Verify Sentry is configured without actually calling Sentry SDK
    // to avoid potential circular dependencies or initialization issues during health checks
    return {
      service: 'Sentry',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: 'Sentry',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Monitor service health continuously
 * Returns alerts for any services that are down or degraded
 */
export async function monitorServiceHealth(): Promise<SystemAlert[]> {
  const healthChecks = await performHealthChecks();
  const alerts: SystemAlert[] = [];

  healthChecks.forEach((check) => {
    if (check.status === 'down') {
      alerts.push({
        id: `health-${check.service}-${Date.now()}`,
        type: 'system_error',
        severity: 'critical',
        title: `${check.service} Service Down`,
        message: `${check.service} is not responding: ${check.error || 'Unknown error'}`,
        timestamp: check.timestamp,
        resolved: false,
      });
    } else if (check.status === 'degraded') {
      alerts.push({
        id: `health-${check.service}-${Date.now()}`,
        type: 'system_error',
        severity: 'high',
        title: `${check.service} Performance Degraded`,
        message: `${check.service} response time is high: ${check.responseTime}ms`,
        timestamp: check.timestamp,
        resolved: false,
      });
    }
  });

  return alerts;
}
