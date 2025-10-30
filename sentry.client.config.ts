import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Smart trace sampling based on environment and transaction type
  tracesSampler: (samplingContext) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Sample 100% in development for debugging
    if (isDevelopment) {
      return 1.0;
    }

    // Get transaction name for more granular control
    const transactionName = samplingContext.transactionContext?.name || '';

    // High-priority routes: payment, admin, webhooks - sample more frequently
    if (
      transactionName.includes('/api/create-payment-intent') ||
      transactionName.includes('/api/webhooks/') ||
      transactionName.includes('/api/admin/') ||
      transactionName.includes('/api/create-claim')
    ) {
      return 0.5; // 50% for critical routes
    }

    // Medium-priority routes: analytics, monitoring
    if (
      transactionName.includes('/api/analytics') ||
      transactionName.includes('/api/monitoring')
    ) {
      return 0.2; // 20% for analytics
    }

    // Low-priority: static pages, health checks
    if (
      transactionName.includes('/_next/') ||
      transactionName.includes('/health')
    ) {
      return 0.01; // 1% for static assets
    }

    // Default production sample rate for all other routes
    return 0.15; // 15% default
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture 100% of errors with session replays
  replaysOnErrorSampleRate: 1.0,

  // Lower session replay rate to reduce costs (10% of sessions)
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Configure environment
  environment: process.env.NODE_ENV,

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
