import { NextRequest, NextResponse } from 'next/server';
import { analyzeRefundEligibility } from '@/lib/automated-refund';
import { logger } from '@/lib/logger';

/**
 * GET /api/automated-refund/analyze
 * Analyze a claim for refund eligibility
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId');

    if (!claimId) {
      return NextResponse.json(
        { error: 'claimId parameter is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeRefundEligibility(claimId);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: unknown) {
    logger.error('Error analyzing refund eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
