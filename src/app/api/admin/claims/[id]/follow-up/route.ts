import { NextRequest, NextResponse } from 'next/server';
import { scheduleFollowUp } from '@/lib/claim-filing-service';

/**
 * POST /api/admin/claims/[id]/follow-up
 * Schedule follow-up for a claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await request.json();
    const { followUpDate } = body;

    if (!followUpDate) {
      return NextResponse.json(
        { error: 'followUpDate is required' },
        { status: 400 }
      );
    }

    const success = await scheduleFollowUp(claimId, followUpDate);

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
