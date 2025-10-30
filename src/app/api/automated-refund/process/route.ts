import { NextRequest, NextResponse } from 'next/server';
import { processAutomaticRefund } from '@/lib/automated-refund';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';

/**
 * POST /api/automated-refund/process
 * Process automatic refund for a claim
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();
  const { claimId } = body;

  if (!claimId) {
    return NextResponse.json(
      { error: 'claimId is required' },
      { status: 400 }
    );
  }

  addBreadcrumb('Processing automatic refund', 'refund', { claimId });
  const result = await processAutomaticRefund(claimId);

  return NextResponse.json({
    success: true,
    data: result,
  });
}, { route: '/api/automated-refund/process', tags: { service: 'automated_refund' } });
