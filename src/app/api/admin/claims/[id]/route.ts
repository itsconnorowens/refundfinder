import { NextRequest, NextResponse } from 'next/server';
import { getClaimByClaimId, updateClaim } from '@/lib/airtable';
import { addBreadcrumb, withErrorTracking } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/claims/[id]
 * Get claim details
 */
export const GET = withErrorTracking(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: claimId } = await params;

    addBreadcrumb('Fetching claim details', 'admin', { claimId });
    const claim = await getClaimByClaimId(claimId);

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: claim.id,
        ...claim.fields,
      },
    });
  } catch (error: unknown) {
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'claim_management', route: '/api/admin/claims/[id]' } });
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
}, {
  route: '/api/admin/claims/[id]',
  tags: { service: 'admin', operation: 'get_claim' }
});

/**
 * POST /api/admin/claims/[id]/validate
 * Validate claim for filing
 */

/**
 * PUT /api/admin/claims/[id]
 * Update claim details
 */
export const PUT = withErrorTracking(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: claimId } = await params;
    const body = await request.json();

    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    await updateClaim(claim.id!, body);

    return NextResponse.json({
      success: true,
      message: 'Claim updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/claims/[id]',
  tags: { service: 'admin', operation: 'update_claim' }
});
