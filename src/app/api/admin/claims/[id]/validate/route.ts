import { NextRequest, NextResponse } from 'next/server';
import { validateClaimForFiling } from '@/lib/claim-filing-service';

/**
 * POST /api/admin/claims/[id]/validate
 * Validate claim for filing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id;
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
