import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/admin-auth';

export function middleware(request: NextRequest) {
  // Apply admin authentication to /admin routes
  const authResult = adminAuthMiddleware(request);
  if (authResult) {
    return authResult;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
