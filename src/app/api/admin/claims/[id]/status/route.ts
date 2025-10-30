import { NextRequest, NextResponse } from 'next/server';
import { updateClaimStatus as updateClaimStatusService } from '@/lib/claim-filing-service';
import { ClaimStatus } from '@/lib/airtable';
import { addBreadcrumb } from '@/lib/error-tracking';

/**
 * PUT /api/admin/claims/[id]/status
 * Update claim status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    addBreadcrumb('Updating claim status', 'admin', { claimId, newStatus: status });

    const success = await updateClaimStatusService(
      claimId,
      status as ClaimStatus,
      notes
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update claim status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Claim status updated successfully',
    });
  } catch (error) {
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'claim_status_update', route: '/api/admin/claims/[id]/status' } });
    return NextResponse.json({ error: 'Failed to update claim status' }, { status: 500 });
  }
}
