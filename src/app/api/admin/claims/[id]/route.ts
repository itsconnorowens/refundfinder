import { NextRequest, NextResponse } from 'next/server';
import { getClaimByClaimId, updateClaim, ClaimStatus } from '@/lib/airtable';
import {
  validateClaimForFiling,
  generateAirlineSubmission,
  markClaimAsFiled,
  updateClaimStatus as updateClaimStatusService,
  scheduleFollowUp,
} from '@/lib/claim-filing-service';

/**
 * GET /api/admin/claims/[id]
 * Get claim details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
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
  } catch (error) {
    console.error('Error fetching claim:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/claims/[id]/validate
 * Validate claim for filing
 */
export async function POST_VALIDATE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const validation = await validateClaimForFiling(claimId);

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Error validating claim:', error);
    return NextResponse.json(
      { error: 'Failed to validate claim' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/claims/[id]/generate-submission
 * Generate airline submission materials
 */
export async function POST_GENERATE_SUBMISSION(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const result = await generateAirlineSubmission(claimId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating submission:', error);
    return NextResponse.json(
      { error: 'Failed to generate submission' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/claims/[id]/status
 * Update claim status
 */
export async function PUT_STATUS(
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

/**
 * POST /api/admin/claims/[id]/file
 * Mark claim as filed with airline reference
 */
export async function POST_FILE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { airlineReference, filedBy, filingMethod } = body;

    if (!airlineReference || !filedBy || !filingMethod) {
      return NextResponse.json(
        { error: 'airlineReference, filedBy, and filingMethod are required' },
        { status: 400 }
      );
    }

    const success = await markClaimAsFiled(
      claimId,
      airlineReference,
      filedBy,
      filingMethod
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark claim as filed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Claim marked as filed successfully',
    });
  } catch (error) {
    console.error('Error marking claim as filed:', error);
    return NextResponse.json(
      { error: 'Failed to mark claim as filed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/claims/[id]/follow-up
 * Schedule follow-up for claim
 */
export async function POST_FOLLOW_UP(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { followUpDate, followUpType, notes } = body;

    if (!followUpDate) {
      return NextResponse.json(
        { error: 'followUpDate is required' },
        { status: 400 }
      );
    }

    const success = await scheduleFollowUp(
      claimId,
      followUpDate,
      followUpType || 'reminder',
      notes
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to schedule follow-up' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follow-up scheduled successfully',
    });
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to schedule follow-up' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/claims/[id]
 * Update claim details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}
