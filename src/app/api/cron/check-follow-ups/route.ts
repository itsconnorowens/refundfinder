import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getClaimsNeedingFollowUp, getOverdueClaims } from '@/lib/airtable';
import {
  sendAdminOverdueAlert,
} from '@/lib/email-service';
import { withErrorTracking, addBreadcrumb, captureError } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';
import { ErrorCode, getErrorDetails } from '@/lib/error-codes';

/**
 * POST /api/cron/check-follow-ups
 * Daily cron job to check claims needing follow-up and send alerts
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const monitorSlug = 'check-follow-ups';
  const checkInId = Sentry.captureCheckIn({
    monitorSlug,
    status: 'in_progress',
  });

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug,
        status: 'error',
      });
      const errorCode = ErrorCode.UNAUTHORIZED;
      const errorDetails = getErrorDetails(errorCode);
      return NextResponse.json({ success: false, errorCode, errorDetails }, { status: 401 });
    }

    addBreadcrumb('Starting follow-up check cron job', 'cron');

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.info('No admin email configured, skipping alerts');
    return NextResponse.json({
      success: true,
      message: 'No admin email configured, alerts skipped',
    });
  }

  let alertsSent = 0;
  const results = {
    overdueClaims: 0,
    followUpClaims: 0,
    alertsSent: 0,
    errors: [] as string[],
  };

  // Check for overdue claims (past 48-hour deadline)
  try {
    const overdueClaims = await getOverdueClaims(2); // Claims overdue by 2 days
      results.overdueClaims = overdueClaims.length;

      if (overdueClaims.length > 0) {
        const claimsData = overdueClaims.map((record) => ({
          claimId: record.fields.claim_id,
          firstName: record.fields.user_first_name,
          lastName: record.fields.user_last_name,
          flightNumber: record.fields.flight_number,
          airline: record.fields.airline,
          departureDate: record.fields.departure_date,
          submittedAt: record.fields.submitted_at,
          status: record.fields.status,
        }));

        await sendAdminOverdueAlert(adminEmail, { claims: claimsData });
        alertsSent++;
        logger.info('Sent overdue alert for  claims', { length: overdueClaims.length });
      }
  } catch (error: unknown) {
    captureError(error, { level: 'warning', tags: { cron_task: 'overdue_claims' } });
    logger.error('Error checking overdue claims:', error);
    results.errors.push('Failed to check overdue claims');
  }

    // Check for claims needing follow-up
    try {
      const followUpClaims = await getClaimsNeedingFollowUp();
      results.followUpClaims = followUpClaims.length;

      if (followUpClaims.length > 0) {
        // Group claims by airline for better organization
        const claimsByAirline = followUpClaims.reduce(
          (acc: any, record: any) => {
            const airline = record.fields.airline || 'Unknown';
            if (!acc[airline]) {
              acc[airline] = [];
            }
            acc[airline].push({
              claimId: record.fields.claim_id,
              firstName: record.fields.user_first_name,
              lastName: record.fields.user_last_name,
              flightNumber: record.fields.flight_number,
              departureDate: record.fields.departure_date,
              status: record.fields.status,
              nextFollowUpDate: record.fields.next_follow_up_date,
            });
            return acc;
          },
          {}
        );

        // Send follow-up alert with organized data
        await sendAdminFollowUpAlert(adminEmail, {
          claimsByAirline,
          totalClaims: followUpClaims.length,
        });
        alertsSent++;
        logger.info('Sent follow-up alert for  claims', { length: followUpClaims.length });
      }
  } catch (error: unknown) {
    captureError(error, { level: 'warning', tags: { cron_task: 'follow_up_claims' } });
    logger.error('Error checking follow-up claims:', error);
    results.errors.push('Failed to check follow-up claims');
  }

  results.alertsSent = alertsSent;

    // Mark cron job as successful
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug,
      status: 'ok',
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up check completed. ${alertsSent} alerts sent.`,
      results,
    });
  } catch (error: unknown) {
    // Mark cron job as failed
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug,
      status: 'error',
    });
    throw error; // Re-throw to let withErrorTracking handle it
  }
}, { route: '/api/cron/check-follow-ups', tags: { service: 'cron', operation: 'follow_ups' } });

/**
 * GET /api/cron/check-follow-ups
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Follow-up cron job is running',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send admin follow-up alert email
 */
async function sendAdminFollowUpAlert(adminEmail: string, data: any) {
  const { emailService } = await import('@/lib/email-service');

  const variables = {
    totalClaims: data.totalClaims,
    claimsByAirline: data.claimsByAirline,
    timestamp: new Date().toLocaleString(),
  };

  const template = {
    subject: `Follow-up Required: ${data.totalClaims} claim(s) need attention`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Follow-up Required</h2>
        <p>You have ${data.totalClaims} claim(s) that need follow-up with airlines.</p>
        
        ${Object.entries(data.claimsByAirline)
          .map(
            ([airline, claims]: [string, any]) => `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3>${airline} (${claims.length} claims)</h3>
            <ul>
              ${claims
                .map(
                  (claim: any) => `
                <li>
                  <strong>${claim.claimId}</strong> - ${claim.firstName} ${claim.lastName}<br>
                  Flight: ${claim.flightNumber} - ${claim.departureDate}<br>
                  Status: ${claim.status}<br>
                  Next Follow-up: ${claim.nextFollowUpDate}<br>
                  <a href="/admin/claims/${claim.claimId}" style="color: #00D9B5;">View Details</a>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>
        `
          )
          .join('')}

        <h3>Action Required:</h3>
        <ol>
          <li>Review each claim and current status</li>
          <li>Follow up with respective airlines</li>
          <li>Update claim status and notes</li>
          <li>Schedule next follow-up if needed</li>
        </ol>

        <p><a href="/admin/claims?follow_up=true" style="background-color: #00D9B5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Claims</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly Admin Dashboard<br>
          Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    text: `
Follow-up Required

You have ${data.totalClaims} claim(s) that need follow-up with airlines.

${Object.entries(data.claimsByAirline)
  .map(
    ([airline, claims]: [string, any]) => `
${airline} (${claims.length} claims):
${claims
  .map(
    (claim: any) => `
- ${claim.claimId} - ${claim.firstName} ${claim.lastName}
  Flight: ${claim.flightNumber} - ${claim.departureDate}
  Status: ${claim.status}
  Next Follow-up: ${claim.nextFollowUpDate}
  View: /admin/claims/${claim.claimId}
`
  )
  .join('')}
`
  )
  .join('')}

Action Required:
1. Review each claim and current status
2. Follow up with respective airlines
3. Update claim status and notes
4. Schedule next follow-up if needed

View all claims: /admin/claims?follow_up=true

---
Flghtly Admin Dashboard
Generated: ${new Date().toLocaleString()}
    `,
  };

  return emailService.sendEmail({
    to: adminEmail,
    template,
    variables,
  });
}
