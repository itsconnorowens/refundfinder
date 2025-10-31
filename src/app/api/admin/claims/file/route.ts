import { NextRequest, NextResponse } from 'next/server';
import { processAutomaticClaimFiling } from '@/lib/claim-filing-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimIds } = body;

    // Process automatic filing
    const results = await processAutomaticClaimFiling(claimIds);

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} claims for filing`,
    });
  } catch (error: unknown) {
    logger.error('Error processing automatic claim filing:', error);
    return NextResponse.json(
      { error: 'Failed to process automatic filing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Process all claims ready to file
    const results = await processAutomaticClaimFiling();

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} claims for filing`,
    });
  } catch (error: unknown) {
    logger.error('Error processing automatic claim filing:', error);
    return NextResponse.json(
      { error: 'Failed to process automatic filing' },
      { status: 500 }
    );
  }
}
