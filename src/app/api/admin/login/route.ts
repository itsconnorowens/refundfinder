import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSession,
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
// Moved to /api/admin/logout

/**
 * GET /api/admin/status
 * Check admin authentication status
 */
// Moved to /api/admin/status
