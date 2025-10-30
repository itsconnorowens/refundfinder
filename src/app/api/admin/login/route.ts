import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSession,
  clearAdminSession,
} from '@/lib/admin-auth';
import { withErrorTracking, addBreadcrumb, captureMessage } from '@/lib/error-tracking';

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json(
      { error: 'Password is required' },
      { status: 400 }
    );
  }

  addBreadcrumb('Admin login attempt', 'auth');

  if (!verifyAdminPassword(password)) {
    captureMessage('Failed admin login attempt', { level: 'warning', tags: { reason: 'invalid_password' } });
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  addBreadcrumb('Admin login successful', 'auth');
  return createAdminSession();
}, { route: '/api/admin/login', tags: { service: 'admin', operation: 'authentication' } });

/**
 * POST /api/admin/logout
 * Admin logout endpoint
 */
export async function POST_LOGOUT() {
  return clearAdminSession();
}

/**
 * GET /api/admin/status
 * Check admin authentication status
 */
export async function GET_STATUS() {
  return NextResponse.json({
    success: true,
    authenticated: true,
    timestamp: new Date().toISOString(),
  });
}
