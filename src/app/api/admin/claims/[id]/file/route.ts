import { NextRequest, NextResponse } from 'next/server';
import { markClaimAsFiled } from '@/lib/claim-filing-service';

/**
 * POST /api/admin/claims/[id]/file
 * Mark claim as filed with airline reference
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { airlineReference, filedBy, filingMethod } = body;

    if (!airlineReference || !filedBy || !filingMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: airlineReference, filedBy, filingMethod' },
        { status: 400 }
      );
    }

    const success = await markClaimAsFiled(
      claimId,
      filedBy,
      filingMethod,
      airlineReference
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
