import { NextResponse } from 'next/server';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async () => {
  return NextResponse.json({
    success: true,
    authenticated: true,
    timestamp: new Date().toISOString(),
  });
}, {
  route: '/api/admin/status',
  tags: { service: 'admin', operation: 'check_status' }
});


