import { NextRequest, NextResponse } from 'next/server';
import { getClaimFilingStats } from '@/lib/claim-filing-service';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/admin/claims/stats
 * Get claim filing statistics for the dashboard
 */
export const GET = withErrorTracking(async (_request: NextRequest) => {
  const stats = await getClaimFilingStats();

  return NextResponse.json({
    success: true,
    data: stats,
  });
}, { route: '/api/admin/claims/stats', tags: { service: 'admin', operation: 'statistics' } });
