import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Error tracking service for Flghtly
 * Wraps API routes and captures errors to Sentry

 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: ErrorSeverity;
}

/**
 * Capture an error to Sentry with additional context
 */
export function captureError(
  error: Error | unknown,
  context?: ErrorContext
): string {
  const eventId = Sentry.captureException(error, {
    level: context?.level || 'error',
    user: context?.user,
    tags: context?.tags,
    extra: context?.extra,
  });

  // Also log to console for local development
  console.error('[Error Tracking]', error, context);

  return eventId;
}

/**
 * Capture a message to Sentry (for non-error events)
 */
export function captureMessage(
  message: string,
  context?: ErrorContext
): string {
  const eventId = Sentry.captureMessage(message, {
    level: context?.level || 'info',
    user: context?.user,
    tags: context?.tags,
    extra: context?.extra,
  });

  console.log('[Error Tracking]', message, context);

  return eventId;
}

/**
 * Set user context for all subsequent error reports
 */
export function setUser(user: {
  id?: string;
  email?: string;
  name?: string;
} | null) {
  Sentry.setUser(user);
  console.log('[Error Tracking] Set user:', user);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    timestamp: Date.now() / 1000,
  });
  console.log('[Breadcrumb]', message, category, data);
}

/**
 * Wrapper for API route handlers that automatically captures errors
 * Usage:
 *
 * export const POST = withErrorTracking(async (req) => {
 *   // Your handler code
 * }, { route: '/api/create-claim' });
 */
export function withErrorTracking(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    route?: string;
    tags?: Record<string, string>;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Add breadcrumb for request
      addBreadcrumb(
        `API Request: ${options?.route || req.url}`,
        'http',
        {
          method: req.method,
          url: req.url,
        }
      );

      const response = await handler(req);

      // Track successful responses
      if (response.status >= 400) {
        captureMessage(
          `API route returned ${response.status}: ${options?.route || req.url}`,
          {
            level: 'warning',
            tags: {
              route: options?.route || req.url,
              status: String(response.status),
              ...options?.tags,
            },
          }
        );
      }

      return response;
    } catch (error) {
      // Capture the error with context
      captureError(error, {
        level: 'error',
        tags: {
          route: options?.route || req.url,
          method: req.method,
          ...options?.tags,
        },
        extra: {
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
      });

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Track performance of operations
 */
export function trackPerformance(
  operation: string,
  startTime: number,
  tags?: Record<string, string>
) {
  const duration = Date.now() - startTime;

  // Set tags on the current scope for this metric
  if (tags) {
    Sentry.setTags({
      operation,
      ...tags,
    });
  }

  Sentry.metrics.distribution('operation.duration', duration, {
    unit: 'millisecond',
  });

  if (duration > 5000) {
    console.warn(`Slow operation: ${operation} took ${duration}ms`, tags);
    captureMessage(`Slow operation: ${operation} took ${duration}ms`, {
      level: 'warning',
      tags: {
        operation,
        duration: String(duration),
        ...tags,
      },
    });
  }
}

/**
 * Start a Sentry transaction for tracing
 * Uses the newer Sentry tracing API
 */
export function startTransaction(name: string, op: string) {
  // Use startSpan for newer Sentry versions
  if ('startSpan' in Sentry && typeof Sentry.startSpan === 'function') {
    return Sentry.startSpan({ name, op }, (span) => span);
  }
  // Fallback: return a mock object if API not available
  console.log('[Transaction]', name, op);
  return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  };
}
