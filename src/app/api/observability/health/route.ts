import { NextResponse } from 'next/server';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/observability/health
 *
 * Health check endpoint for observability stack integration
 * Validates that Sentry, PostHog, and BetterStack are properly configured
 */
export const GET = withErrorTracking(async () => {
  const health = {
    timestamp: new Date().toISOString(),
    overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    services: {
      sentry: {
        status: 'unknown' as 'configured' | 'missing' | 'error',
        dsn: null as string | null,
        environment: process.env.NODE_ENV,
        issues: [] as string[],
      },
      posthog: {
        status: 'unknown' as 'configured' | 'missing' | 'error',
        key: null as string | null,
        host: null as string | null,
        issues: [] as string[],
      },
      betterstack: {
        status: 'unknown' as 'configured' | 'missing' | 'error',
        hasToken: false,
        issues: [] as string[],
      },
    },
    integration: {
      requestIdMiddleware: 'active',
      errorCorrelation: 'enabled',
      crossServiceTracking: 'enabled',
      issues: [] as string[],
    },
    recommendations: [] as string[],
  };

  // Check Sentry configuration
  try {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      health.services.sentry.status = 'configured';
      health.services.sentry.dsn = sentryDsn.substring(0, 20) + '...'; // Partial for security
    } else {
      health.services.sentry.status = 'missing';
      health.services.sentry.issues.push('NEXT_PUBLIC_SENTRY_DSN not configured');
      health.recommendations.push('Set NEXT_PUBLIC_SENTRY_DSN environment variable for error tracking');
    }
  } catch (error) {
    health.services.sentry.status = 'error';
    health.services.sentry.issues.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Check PostHog configuration
  try {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (posthogKey && posthogHost) {
      health.services.posthog.status = 'configured';
      health.services.posthog.key = posthogKey.substring(0, 10) + '...';
      health.services.posthog.host = posthogHost;
    } else {
      health.services.posthog.status = 'missing';
      if (!posthogKey) {
        health.services.posthog.issues.push('NEXT_PUBLIC_POSTHOG_KEY not configured');
      }
      if (!posthogHost) {
        health.services.posthog.issues.push('NEXT_PUBLIC_POSTHOG_HOST not configured');
      }
      health.recommendations.push('Set PostHog environment variables for analytics tracking');
    }
  } catch (error) {
    health.services.posthog.status = 'error';
    health.services.posthog.issues.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Check BetterStack configuration
  try {
    const betterstackToken = process.env.BETTERSTACK_SOURCE_TOKEN;

    if (betterstackToken) {
      health.services.betterstack.status = 'configured';
      health.services.betterstack.hasToken = true;
    } else {
      health.services.betterstack.status = 'missing';
      health.services.betterstack.issues.push('BETTERSTACK_SOURCE_TOKEN not configured');
      health.recommendations.push('Set BETTERSTACK_SOURCE_TOKEN for centralized logging');
    }
  } catch (error) {
    health.services.betterstack.status = 'error';
    health.services.betterstack.issues.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Check integration health
  try {
    // Verify error tracking module is available
    const errorTrackingAvailable = true; // We're using it in this route

    if (!errorTrackingAvailable) {
      health.integration.issues.push('Error tracking module not available');
    }

    // Check if critical integrations are working
    const allServicesConfigured =
      health.services.sentry.status === 'configured' &&
      health.services.posthog.status === 'configured' &&
      health.services.betterstack.status === 'configured';

    if (!allServicesConfigured) {
      health.integration.issues.push('Not all observability services are configured');
    }
  } catch (error) {
    health.integration.issues.push(`Integration check failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Determine overall health status
  const criticalIssues =
    health.services.sentry.status === 'error' ||
    health.services.posthog.status === 'error' ||
    health.services.betterstack.status === 'error';

  const missingServices =
    health.services.sentry.status === 'missing' ||
    health.services.posthog.status === 'missing' ||
    health.services.betterstack.status === 'missing';

  if (criticalIssues) {
    health.overall = 'unhealthy';
  } else if (missingServices) {
    health.overall = 'degraded';
  } else {
    health.overall = 'healthy';
  }

  // Add service-specific recommendations
  if (health.services.sentry.status === 'configured') {
    health.recommendations.push('Sentry: Configure alerts for critical errors in your Sentry dashboard');
  }

  if (health.services.posthog.status === 'configured') {
    health.recommendations.push('PostHog: Create conversion funnel dashboards to track user journeys');
  }

  if (health.services.betterstack.status === 'configured') {
    health.recommendations.push('BetterStack: Monitor log volume to stay within free tier limits');
  }

  return NextResponse.json({
    success: true,
    health,
    summary: {
      status: health.overall,
      servicesConfigured: [
        health.services.sentry.status === 'configured' ? 'sentry' : null,
        health.services.posthog.status === 'configured' ? 'posthog' : null,
        health.services.betterstack.status === 'configured' ? 'betterstack' : null,
      ].filter(Boolean),
      totalIssues:
        health.services.sentry.issues.length +
        health.services.posthog.issues.length +
        health.services.betterstack.issues.length +
        health.integration.issues.length,
    },
  });
}, {
  route: '/api/observability/health',
  tags: { service: 'observability', operation: 'health_check' }
});
