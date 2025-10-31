import { NextRequest, NextResponse } from 'next/server';
import { scheduleFollowUp } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';
import { withErrorTracking } from '@/lib/error-tracking';

export const POST = withErrorTracking(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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
  } catch (error: unknown) {
    logger.error('Error scheduling follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to schedule follow-up' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/claims/[id]/follow-up',
  tags: { service: 'admin', operation: 'schedule_follow_up' }
});
