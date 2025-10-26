import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple admin authentication middleware
 * Protects all /admin/* routes with password authentication
 */

const ADMIN_SESSION_COOKIE = 'admin_session';

// Session state (in a real app, this would be stored in a database or Redis)
let currentSession: {
  authenticated: boolean;
  createdAt: Date;
  token: string;
} | null = null;

export function adminAuthMiddleware(request: NextRequest) {
  const url = request.nextUrl;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return null;
  }

  // Check if user is already authenticated
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE);
  if (sessionCookie?.value === 'authenticated') {
    return null; // Already authenticated
  }

  // Check for password in Authorization header (for API calls)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    return null; // API authentication successful
  }

  // Check for password in form data (for login form)
  if (request.method === 'POST' && url.pathname === '/admin/login') {
    return null; // Let login endpoint handle authentication
  }

  // Redirect to login page for GET requests
  if (request.method === 'GET') {
    const loginUrl = new URL('/admin/login', url.origin);
    loginUrl.searchParams.set('redirect', url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Return unauthorized for other requests
  return NextResponse.json(
    { error: 'Admin authentication required' },
    { status: 401 }
  );
}

/**
 * Verify admin password
 */
export function verifyAdminPassword(password: string): boolean {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  return password === ADMIN_PASSWORD;
}

/**
 * Create admin session cookie
 */
export function createAdminSession(): NextResponse {
  // Generate a unique session token
  const sessionToken =
    Math.random().toString(36).substring(2) + Date.now().toString(36);

  // Set session state
  currentSession = {
    authenticated: true,
    createdAt: new Date(),
    token: sessionToken,
  };

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
  return response;
}

/**
 * Clear admin session cookie
 */
export function clearAdminSession(): NextResponse {
  // Clear session state
  currentSession = null;

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  });
  return response;
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated(): boolean {
  return currentSession?.authenticated === true;
}

/**
 * Get admin session data
 */
export function getAdminSession(): {
  authenticated: boolean;
  createdAt: Date;
  token: string;
} | null {
  return currentSession;
}
