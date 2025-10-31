import { NextRequest, NextResponse } from 'next/server';
import { validateClaimForFiling } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';
import { withErrorTracking } from '@/lib/error-tracking';

export const POST = withErrorTracking(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: claimId } = await params;
    const validation = await validateClaimForFiling(claimId);

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error: unknown) {
    logger.error('Error validating claim:', error);
    return NextResponse.json(
      { error: 'Failed to validate claim' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/claims/[id]/validate',
  tags: { service: 'admin', operation: 'validate_claim' }
});
