import { NextRequest, NextResponse } from 'next/server';
import {
  getClaimsNeedingAutomaticRefunds,
  processBatchAutomaticRefunds,
  RefundTrigger,
} from '@/lib/automated-refund';
import { checkRefundAlerts, getRefundDashboardData } from '@/lib/refund-analytics';

/**
 * POST /api/cron/process-automatic-refunds
 * Cron job endpoint to process automatic refunds
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
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalAmount: 0,
      },
      details: [] as any[],
    };

    // Get claims needing automatic refunds
    const claimsNeedingRefunds = await getClaimsNeedingAutomaticRefunds();

    // Process overdue claims (not filed within deadline)
    if (claimsNeedingRefunds.overdueClaims.length > 0) {
      const overdueClaimIds = claimsNeedingRefunds.overdueClaims.map(
        (claim) => claim.get('claim_id') as string
      );

      const overdueResult = await processBatchAutomaticRefunds(
        overdueClaimIds,
        'claim_not_filed_deadline',
        'cron-job'
      );

      results.summary.totalProcessed += overdueResult.summary.total;
      results.summary.totalSuccessful += overdueResult.summary.successful;
      results.summary.totalFailed += overdueResult.summary.failed;
      results.summary.totalAmount += overdueResult.summary.totalAmount;

      results.details.push({
        trigger: 'claim_not_filed_deadline',
        ...overdueResult.summary,
      });
    }

    // Process rejected claims
    const rejectedClaims = claimsNeedingRefunds.rejectedClaims.filter(
      (claim) => claim.get('status') === 'rejected'
    );

    if (rejectedClaims.length > 0) {
      const rejectedClaimIds = rejectedClaims.map(
        (claim) => claim.get('claim_id') as string
      );

      const rejectedResult = await processBatchAutomaticRefunds(
        rejectedClaimIds,
        'claim_rejected_by_airline',
        'cron-job'
      );

      results.summary.totalProcessed += rejectedResult.summary.total;
      results.summary.totalSuccessful += rejectedResult.summary.successful;
      results.summary.totalFailed += rejectedResult.summary.failed;
      results.summary.totalAmount += rejectedResult.summary.totalAmount;

      results.details.push({
        trigger: 'claim_rejected_by_airline',
        ...rejectedResult.summary,
      });
    }

    // Process claims with insufficient documentation
    if (claimsNeedingRefunds.insufficientDocClaims.length > 0) {
      const insufficientDocClaimIds =
        claimsNeedingRefunds.insufficientDocClaims.map(
          (claim) => claim.get('claim_id') as string
        );

      const insufficientDocResult = await processBatchAutomaticRefunds(
        insufficientDocClaimIds,
        'insufficient_documentation',
        'cron-job'
      );

      results.summary.totalProcessed += insufficientDocResult.summary.total;
      results.summary.totalSuccessful +=
        insufficientDocResult.summary.successful;
      results.summary.totalFailed += insufficientDocResult.summary.failed;
      results.summary.totalAmount += insufficientDocResult.summary.totalAmount;

      results.details.push({
        trigger: 'insufficient_documentation',
        ...insufficientDocResult.summary,
      });
    }

    // Process ineligible claims
    if (claimsNeedingRefunds.ineligibleClaims.length > 0) {
      const ineligibleClaimIds = claimsNeedingRefunds.ineligibleClaims.map(
        (claim) => claim.get('claim_id') as string
      );

      const ineligibleResult = await processBatchAutomaticRefunds(
        ineligibleClaimIds,
        'ineligible_flight',
        'cron-job'
      );

      results.summary.totalProcessed += ineligibleResult.summary.total;
      results.summary.totalSuccessful += ineligibleResult.summary.successful;
      results.summary.totalFailed += ineligibleResult.summary.failed;
      results.summary.totalAmount += ineligibleResult.summary.totalAmount;

      results.details.push({
        trigger: 'ineligible_flight',
        ...ineligibleResult.summary,
      });
    }

    // Check for alerts (this would typically be sent to monitoring systems)
    const dashboardData = await getRefundDashboardData();
    const alerts = dashboardData.alerts;

    if (alerts.length > 0) {
      console.warn('Refund alerts detected:', alerts);
      // In production, you might send these to Slack, email, or other monitoring systems
    }

    return NextResponse.json({
      success: true,
      message: 'Automatic refund processing completed',
      results,
      alerts: alerts.length > 0 ? alerts : undefined,
    });
  } catch (error) {
    console.error('Error in automatic refund cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-automatic-refunds
 * Health check endpoint for the cron job
 */
export async function GET(request: NextRequest) {
  try {
    const claimsNeedingRefunds = await getClaimsNeedingAutomaticRefunds();

    return NextResponse.json({
      success: true,
      message: 'Cron job health check passed',
      data: {
        overdueClaims: claimsNeedingRefunds.overdueClaims.length,
        rejectedClaims: claimsNeedingRefunds.rejectedClaims.length,
        insufficientDocClaims:
          claimsNeedingRefunds.insufficientDocClaims.length,
        ineligibleClaims: claimsNeedingRefunds.ineligibleClaims.length,
        totalClaimsNeedingRefunds:
          claimsNeedingRefunds.overdueClaims.length +
          claimsNeedingRefunds.rejectedClaims.length +
          claimsNeedingRefunds.insufficientDocClaims.length +
          claimsNeedingRefunds.ineligibleClaims.length,
      },
    });
  } catch (error) {
    console.error('Error in cron job health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
