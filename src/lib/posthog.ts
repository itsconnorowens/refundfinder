import { PostHog } from 'posthog-node';
import { logger } from '@/lib/logger';

/**
 * PostHog server-side tracking
 * Use this for tracking events from API routes and server components
 */

let posthogServerInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    logger.warn('PostHog API key not configured');
    return null;
  }

  if (!posthogServerInstance) {
    posthogServerInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1, // Flush immediately in serverless environment
      flushInterval: 0,
    });
  }

  return posthogServerInstance;
}

/**
 * Track a server-side event
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  const posthog = getPostHogServer();
  if (!posthog) return;

  posthog.capture({
    distinctId,
    event,
    properties,
  });
}

/**
 * Identify a user on the server
 */
export function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  const posthog = getPostHogServer();
  if (!posthog) return;

  posthog.identify({
    distinctId,
    properties,
  });
}

/**
 * Track a server-side error
 * Use this to track API errors, exceptions, and failures on the server
 */
export function trackServerError(
  errorName: string,
  error: unknown,
  context?: {
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    [key: string]: any;
  }
) {
  const posthog = getPostHogServer();
  if (!posthog) {
    logger.warn('Cannot track server error - PostHog not configured');
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  posthog.capture({
    distinctId: context?.userId || 'anonymous',
    event: 'api_error',
    properties: {
      error_name: errorName,
      error_message: errorMessage,
      error_stack: errorStack,
      endpoint: context?.endpoint,
      method: context?.method,
      status_code: context?.statusCode,
      timestamp: new Date().toISOString(),
      ...context,
    },
  });

  // Also log the error
  logger.error(
    `API Error: ${errorName}`,
    error instanceof Error ? error : new Error(errorMessage),
    context
  );
}

/**
 * Shutdown PostHog (call this when shutting down the server)
 */
export async function shutdownPostHog() {
  if (posthogServerInstance) {
    await posthogServerInstance.shutdown();
  }
}
