import { NextRequest, NextResponse } from 'next/server';
import { getClaimFilingStats } from '@/lib/claim-filing-service';
import { getFollowUpStats } from '@/lib/follow-up-service';
import { getMonitoringStats } from '@/lib/monitoring-service';

/**
 * GET /api/admin/claims/stats
 * Get claim filing statistics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getClaimFilingStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting claim filing stats:', error);
    return NextResponse.json(
      { error: 'Failed to get claim filing stats' },
      { status: 500 }
    );
  }
}
