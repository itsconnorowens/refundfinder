import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  processAutomaticRefund,
  analyzeRefundEligibility,
  processBatchAutomaticRefunds,
  RefundTrigger,
} from '@/lib/automated-refund';

/**
 * POST /api/automated-refund/process
 * Process an automatic refund for a specific claim
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, trigger, processedBy = 'api' } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing required field: claimId' },
        { status: 400 }
      );
    }

    const result = await processAutomaticRefund(
      claimId,
      trigger as RefundTrigger,
      processedBy
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        refundId: result.refundId,
        stripeRefundId: result.stripeRefundId,
        amount: result.amount,
        decision: result.decision,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          decision: result.decision,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Error processing automatic refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automated-refund/analyze
 * Analyze refund eligibility for a claim
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId');
    const trigger = searchParams.get('trigger') as RefundTrigger;

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing required parameter: claimId' },
        { status: 400 }
      );
    }

    const decision = await analyzeRefundEligibility(claimId, trigger);

    return NextResponse.json({
      success: true,
      decision,
    });
  } catch (error) {
    logger.error('Error analyzing refund eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/automated-refund/batch
 * Process batch automatic refunds
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimIds, trigger, processedBy = 'api' } = body;

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid claimIds array' },
        { status: 400 }
      );
    }

    if (!trigger) {
      return NextResponse.json(
        { error: 'Missing required field: trigger' },
        { status: 400 }
      );
    }

    const result = await processBatchAutomaticRefunds(
      claimIds,
      trigger as RefundTrigger,
      processedBy
    );

    return NextResponse.json({
      success: true,
      message: 'Batch refund processing completed',
      ...result,
    });
  } catch (error) {
    logger.error('Error processing batch refunds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
