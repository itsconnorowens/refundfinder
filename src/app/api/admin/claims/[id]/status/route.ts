import { NextRequest, NextResponse } from 'next/server';
import {
  updateClaimStatus as updateClaimStatusService,
  ClaimStatus,
} from '@/lib/claim-filing-service';

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

    const success = await updateClaimStatusService(
      claimId,
      status as ClaimStatus,
      'admin@refundfinder.com',
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
    console.error('Error updating claim status:', error);
    return NextResponse.json(
      { error: 'Failed to update claim status' },
      { status: 500 }
    );
  }
}
