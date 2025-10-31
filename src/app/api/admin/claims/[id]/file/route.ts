import { NextRequest, NextResponse } from 'next/server';
import { markClaimAsFiled } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';

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
  } catch (error: unknown) {
    logger.error('Error marking claim as filed:', error);
    return NextResponse.json(
      { error: 'Failed to mark claim as filed' },
      { status: 500 }
    );
  }
}
