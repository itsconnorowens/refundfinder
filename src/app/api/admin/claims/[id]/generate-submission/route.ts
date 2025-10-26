import { NextRequest, NextResponse } from 'next/server';
import { generateAirlineSubmission } from '@/lib/claim-filing-service';

/**
 * POST /api/admin/claims/[id]/generate-submission
 * Generate airline submission materials
 */
export async function POST(
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
