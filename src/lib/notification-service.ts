/**
 * Notification Service
 * Sends alerts via Slack, email, and other channels
 */

import { sendEmail } from './email-service';
import { logger } from '@/lib/logger';

export type NotificationChannel = 'slack' | 'email' | 'console';

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channel: NotificationChannel[];
  metadata?: Record<string, any>;
}

/**
 * Send a Slack notification via webhook
 */
async function sendSlackNotification(
  title: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Slack webhook URL not configured, skipping Slack notification');
    return false;
  }

  // Map severity to Slack color
  const colorMap = {
    low: '#36a64f', // Green
    medium: '#ff9800', // Orange
    high: '#ff5722', // Red
    critical: '#d32f2f', // Dark red
  };

  const color = colorMap[severity];

  // Format metadata for display
  const fields = metadata
    ? Object.entries(metadata).map(([key, value]) => ({
        title: key,
        value: String(value),
        short: true,
      }))
    : [];

  const payload = {
    attachments: [
      {
        color,
        title: `[${severity.toUpperCase()}] ${title}`,
        text: message,
        fields,
        footer: 'Flghtly Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Failed to send Slack notification:', response.statusText);
      return false;
    }

    logger.info('Slack notification sent successfully');
    return true;
  } catch (error: unknown) {
    logger.error('Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Send an email notification
 */
async function sendEmailNotification(
  title: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    logger.warn('Admin email not configured, skipping email notification');
    return false;
  }

  const emailContent = `
    <h2>${title}</h2>
    <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
    <p>${message}</p>
    ${
      metadata
        ? `
      <h3>Details:</h3>
      <ul>
        ${Object.entries(metadata)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join('\n')}
      </ul>
    `
        : ''
    }
    <hr>
    <p style="color: #666; font-size: 12px;">
      This is an automated alert from Flghtly Monitoring System
    </p>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `[${severity.toUpperCase()}] ${title}`,
      html: emailContent,
      category: 'alert',
    });

    logger.info('Email notification sent successfully');
    return true;
  } catch (error: unknown) {
    logger.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Send notification to console
 */
function sendConsoleNotification(
  title: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): boolean {
  const logFn = severity === 'critical' || severity === 'high' ? logger.error : logger.warn;

  logFn(`[${severity.toUpperCase()}] ${title}`, undefined, { message, ...metadata });

  return true;
}

/**
 * Send a notification through specified channels
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; channels: Record<NotificationChannel, boolean> }> {
  const results: Record<NotificationChannel, boolean> = {
    slack: false,
    email: false,
    console: false,
  };

  // Send to each requested channel
  for (const channel of payload.channel) {
    switch (channel) {
      case 'slack':
        results.slack = await sendSlackNotification(
          payload.title,
          payload.message,
          payload.severity,
          payload.metadata
        );
        break;

      case 'email':
        results.email = await sendEmailNotification(
          payload.title,
          payload.message,
          payload.severity,
          payload.metadata
        );
        break;

      case 'console':
        results.console = sendConsoleNotification(
          payload.title,
          payload.message,
          payload.severity,
          payload.metadata
        );
        break;
    }
  }

  // Consider it a success if at least one channel succeeded
  const success = Object.values(results).some((result) => result);

  return { success, channels: results };
}

/**
 * Quick notification helpers for common scenarios
 */
export async function notifyNewClaim(claimData: {
  claimId: string;
  email: string;
  airline: string;
  flightNumber: string;
  estimatedCompensation: string;
}) {
  return sendNotification({
    title: '🆕 New Claim Submitted',
    message: `A new claim has been submitted by ${claimData.email}`,
    severity: 'low',
    channel: ['slack', 'console'],
    metadata: {
      'Claim ID': claimData.claimId,
      'Email': claimData.email,
      'Airline': claimData.airline,
      'Flight': claimData.flightNumber,
      'Est. Compensation': claimData.estimatedCompensation,
    },
  });
}

export async function notifyError(errorData: {
  operation: string;
  message: string;
  claimId?: string;
  userId?: string;
}) {
  return sendNotification({
    title: '⚠️ System Error',
    message: `Error in ${errorData.operation}: ${errorData.message}`,
    severity: 'high',
    channel: ['slack', 'email', 'console'],
    metadata: {
      'Operation': errorData.operation,
      'Claim ID': errorData.claimId || 'N/A',
      'User ID': errorData.userId || 'N/A',
      'Timestamp': new Date().toISOString(),
    },
  });
}

export async function notifySLABreach(claimData: {
  claimId: string;
  email: string;
  hoursPending: number;
}) {
  return sendNotification({
    title: '🚨 SLA Breach Alert',
    message: `Claim ${claimData.claimId} has been pending for ${claimData.hoursPending} hours`,
    severity: 'critical',
    channel: ['slack', 'email', 'console'],
    metadata: {
      'Claim ID': claimData.claimId,
      'Email': claimData.email,
      'Hours Pending': claimData.hoursPending,
      'SLA Threshold': '48 hours',
    },
  });
}

export async function notifyNewVisitor(visitorData: {
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page: string;
}) {
  return sendNotification({
    title: '👤 New Visitor',
    message: `New visitor arrived at ${visitorData.page}`,
    severity: 'low',
    channel: ['console'], // Only log to console for visitors, would be too noisy otherwise
    metadata: {
      'Page': visitorData.page,
      'Referrer': visitorData.referrer || 'Direct',
      'User Agent': visitorData.userAgent || 'Unknown',
      'Timestamp': new Date().toISOString(),
    },
  });
}
