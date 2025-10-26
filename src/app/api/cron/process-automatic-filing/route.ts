import { NextRequest, NextResponse } from 'next/server';
import {
  processAutomaticClaimFiling,
  processClaimFollowUps,
} from '@/lib/claim-filing-service';
import { processAutomatedFollowUps } from '@/lib/follow-up-service';

/**
 * POST /api/cron/process-automatic-filing
 * Cron job endpoint to process automatic claim filing and follow-ups
 * This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.log('Processing automatic claim filing...');
    const filingResults = await processAutomaticClaimFiling();

    results.summary.claimsFiled = filingResults.filter((r) => r.success).length;
    results.summary.claimsFailed = filingResults.filter(
      (r) => !r.success
    ).length;
    results.details.filing = filingResults;

    // Process automated follow-ups
    console.log('Processing automated follow-ups...');
    const followUpResults = await processAutomatedFollowUps();

    results.summary.followUpsProcessed = followUpResults.filter(
      (r) => r.success
    ).length;
    results.summary.followUpsFailed = followUpResults.filter(
      (r) => !r.success
    ).length;
    results.details.followUps = followUpResults;

    console.log('Automatic filing cron job completed:', results.summary);

    return NextResponse.json({
      success: true,
      message: 'Automatic filing processing completed',
      results,
    });
  } catch (error) {
    console.error('Error in automatic filing cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-automatic-filing
 * Health check endpoint for the cron job
 */
export async function GET(request: NextRequest) {
  try {
    // This would typically check the status of claims ready to file
    // For now, return a simple health check
    return NextResponse.json({
      success: true,
      message: 'Automatic filing cron job health check passed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in automatic filing cron job health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
