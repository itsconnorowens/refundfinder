import { NextRequest, NextResponse } from 'next/server';
import { getFollowUpStats } from '@/lib/follow-up-service';

/**
 * GET /api/admin/follow-ups/stats
 * Get follow-up statistics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getFollowUpStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting follow-up stats:', error);
    return NextResponse.json(
      { error: 'Failed to get follow-up stats' },
      { status: 500 }
    );
  }
}
