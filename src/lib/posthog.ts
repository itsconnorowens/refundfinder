import { PostHog } from 'posthog-node';

/**
 * PostHog server-side tracking
 * Use this for tracking events from API routes and server components
 */

let posthogServerInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog API key not configured');
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
 * Shutdown PostHog (call this when shutting down the server)
 */
export async function shutdownPostHog() {
  if (posthogServerInstance) {
    await posthogServerInstance.shutdown();
  }
}
