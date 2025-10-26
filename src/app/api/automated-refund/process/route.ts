import { NextRequest, NextResponse } from 'next/server';
import { processAutomaticRefund } from '@/lib/automated-refund';

/**
 * POST /api/automated-refund/process
 * Process automatic refund for a claim
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: 'claimId is required' },
        { status: 400 }
      );
    }

    const result = await processAutomaticRefund(claimId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing automatic refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
