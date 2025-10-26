import { NextRequest, NextResponse } from 'next/server';
import {
  getComprehensiveMonitoringStats,
  getClaimEmailStats,
} from '@/lib/monitoring-service';

/**
 * GET /api/monitoring/stats
 * Get system monitoring statistics
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const claimId = url.searchParams.get('claimId');

    if (claimId) {
      // Get email stats for specific claim
      const stats = await getClaimEmailStats(claimId);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    } else {
      // Get overall system stats
      const stats = await getComprehensiveMonitoringStats();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring stats' },
      { status: 500 }
    );
  }
}
