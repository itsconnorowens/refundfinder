import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/admin-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PostHog proxy - rewrite /ingest/* to PostHog servers
  if (pathname.startsWith('/ingest/static/')) {
    const url = new URL(request.url);
    url.hostname = 'us-assets.i.posthog.com';
    url.port = '';
    url.protocol = 'https:';
    url.pathname = pathname.replace('/ingest/static/', '/static/');
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith('/ingest/')) {
    const url = new URL(request.url);
    url.hostname = 'us.i.posthog.com';
    url.port = '';
    url.protocol = 'https:';
    url.pathname = pathname.replace('/ingest/', '/');
    return NextResponse.rewrite(url);
  }

  // Apply admin authentication to /admin routes
  const authResult = adminAuthMiddleware(request);
  if (authResult) {
    return authResult;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ingest/:path*'],
};
