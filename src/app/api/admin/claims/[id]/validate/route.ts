import { NextRequest, NextResponse } from 'next/server';
import { validateClaimForFiling } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
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
    logger.error('Error validating claim:', error);
    return NextResponse.json(
      { error: 'Failed to validate claim' },
      { status: 500 }
    );
  }
}
