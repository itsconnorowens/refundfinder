import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSession,
  clearAdminSession,
} from '@/lib/admin-auth';

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return createAdminSession();
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

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
