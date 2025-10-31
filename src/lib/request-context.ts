import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';

export interface RequestContext {
  requestId: string;
  timestamp: string;
  url: string;
  method: string;
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
}

/**
 * Generate a unique request ID and capture request metadata
 * This context can be used for:
 * - Request tracing across services
 * - Linking logs to specific requests
 * - Debugging user issues
 */
export function generateRequestContext(request: NextRequest): RequestContext {
  // Check for existing request ID (from load balancer or previous middleware)
  const existingRequestId = request.headers.get('x-request-id');
  const requestId = existingRequestId || nanoid(16);

  return {
    requestId,
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null,
    referer: request.headers.get('referer'),
  };
}

/**
 * Extract route path from request URL for logging
 */
export function getRoutePath(request: NextRequest): string {
  try {
    const url = new URL(request.url);
    return url.pathname;
  } catch {
    return request.url;
  }
}

/**
 * Create a standardized log context from request
 * Use this with logger.info/error/warn to include request metadata
 */
export function createLogContext(
  request: NextRequest,
  additionalContext?: Record<string, any>
): Record<string, any> {
  const context = generateRequestContext(request);
  const route = getRoutePath(request);

  return {
    requestId: context.requestId,
    route,
    method: context.method,
    userAgent: context.userAgent,
    ip: context.ip,
    ...additionalContext,
  };
}
