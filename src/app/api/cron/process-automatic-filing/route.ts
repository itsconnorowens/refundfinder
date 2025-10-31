import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import {
  processAutomaticClaimFiling,
} from '@/lib/claim-filing-service';
import { processAutomatedFollowUps } from '@/lib/follow-up-service';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/process-automatic-filing
 * Cron job endpoint to process automatic claim filing and follow-ups
 * This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const monitorSlug = 'process-automatic-filing';
  const checkInId = Sentry.captureCheckIn({
    monitorSlug,
    status: 'in_progress',
  });

  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug,
        status: 'error',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    addBreadcrumb('Starting automatic filing cron job', 'cron');

  const results = {
    processedAt: new Date().toISOString(),
    summary: {
      claimsFiled: 0,
      claimsFailed: 0,
      followUpsProcessed: 0,
      followUpsFailed: 0,
    },
    details: {
      filing: [] as any[],
      followUps: [] as any[],
    },
  };

  // Process automatic claim filing
  logger.info('Processing automatic claim filing...');
  const filingResults = await processAutomaticClaimFiling();

    results.summary.claimsFiled = filingResults.filter((r) => r.success).length;
    results.summary.claimsFailed = filingResults.filter(
      (r) => !r.success
    ).length;
    results.details.filing = filingResults;

    // Process automated follow-ups
    logger.info('Processing automated follow-ups...');
    const followUpResults = await processAutomatedFollowUps();

    results.summary.followUpsProcessed = followUpResults.filter(
      (r) => r.success
    ).length;
    results.summary.followUpsFailed = followUpResults.filter(
      (r) => !r.success
    ).length;
    results.details.followUps = followUpResults;

    logger.info('Automatic filing cron job completed:', { summary: results.summary });

    // Mark cron job as successful
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug,
      status: 'ok',
    });

    return NextResponse.json({
      success: true,
      message: 'Automatic filing processing completed',
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
}, { route: '/api/cron/process-automatic-filing', tags: { service: 'cron', operation: 'automatic_filing' } });

/**
 * GET /api/cron/process-automatic-filing
 * Health check endpoint for the cron job
 */
export async function GET() {
  try {
    // This would typically check the status of claims ready to file
    // For now, return a simple health check
    return NextResponse.json({
      success: true,
      message: 'Automatic filing cron job health check passed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('Error in automatic filing cron job health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
