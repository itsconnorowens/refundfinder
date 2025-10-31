import { NextRequest, NextResponse } from 'next/server';
import { generateAirlineSubmission } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
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
    logger.error('Error generating submission:', error);
    return NextResponse.json(
      { error: 'Failed to generate submission' },
      { status: 500 }
    );
  }
}
