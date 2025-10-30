import { NextRequest, NextResponse } from 'next/server';
import {
  getComprehensiveMonitoringStats,
  getClaimEmailStats,
} from '@/lib/monitoring-service';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/monitoring/stats
 * Get system monitoring statistics
 */
export const GET = withErrorTracking(async (request: NextRequest) => {
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
}, { route: '/api/monitoring/stats', tags: { service: 'monitoring', operation: 'statistics' } });
