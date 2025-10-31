import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/admin-auth';
import { generateRequestContext } from '@/lib/request-context';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate request context for tracing
  const requestContext = generateRequestContext(request);

  // PostHog proxy - rewrite /ingest/* to PostHog servers
  if (pathname.startsWith('/ingest/static/')) {
    const url = new URL(request.url);
    url.hostname = 'us-assets.i.posthog.com';
    url.port = '';
    url.protocol = 'https:';
    url.pathname = pathname.replace('/ingest/static/', '/static/');
    const response = NextResponse.rewrite(url);
    response.headers.set('x-request-id', requestContext.requestId);
    return response;
  }

  if (pathname.startsWith('/ingest/')) {
    const url = new URL(request.url);
    url.hostname = 'us.i.posthog.com';
    url.port = '';
    url.protocol = 'https:';
    url.pathname = pathname.replace('/ingest/', '/');
    const response = NextResponse.rewrite(url);
    response.headers.set('x-request-id', requestContext.requestId);
    return response;
  }

  // Apply admin authentication to /admin routes
  const authResult = adminAuthMiddleware(request);
  if (authResult) {
    authResult.headers.set('x-request-id', requestContext.requestId);
    return authResult;
  }

  // Add request ID to response headers for debugging
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestContext.requestId);

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
