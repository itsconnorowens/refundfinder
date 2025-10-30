import { NextRequest, NextResponse } from 'next/server';
import { getFollowUpStats } from '@/lib/follow-up-service';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/admin/follow-ups/stats
 * Get follow-up statistics for the dashboard
 */
export const GET = withErrorTracking(async (_request: NextRequest) => {
  const stats = await getFollowUpStats();

  return NextResponse.json({
    success: true,
    data: stats,
  });
}, { route: '/api/admin/follow-ups/stats', tags: { service: 'admin', operation: 'follow_up_statistics' } });
