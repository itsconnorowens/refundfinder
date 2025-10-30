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

    // Critical routes: payment processing, webhooks - higher sampling
    if (
      transactionName.includes('POST /api/create-payment-intent') ||
      transactionName.includes('POST /api/webhooks/stripe') ||
      transactionName.includes('POST /api/create-claim') ||
      transactionName.includes('/api/process-refund')
    ) {
      return 0.8; // 80% for payment/critical operations
    }

    // Admin routes - important for debugging
    if (transactionName.includes('/api/admin/')) {
      return 0.5; // 50% for admin operations
    }

    // Background jobs and cron - medium priority
    if (
      transactionName.includes('/api/cron/') ||
      transactionName.includes('automatic')
    ) {
      return 0.3; // 30% for background jobs
    }

    // Analytics and monitoring - lower priority
    if (
      transactionName.includes('/api/analytics') ||
      transactionName.includes('/api/monitoring')
    ) {
      return 0.15; // 15% for analytics
    }

    // Health checks and low-priority routes
    if (
      transactionName.includes('/api/health') ||
      transactionName.includes('GET /api/')
    ) {
      return 0.05; // 5% for health checks
    }

    // Default production sample rate
    return 0.2; // 20% default
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure environment
  environment: process.env.NODE_ENV,

  // Capture server-side errors with additional context
  beforeSend(event, hint) {
    // Add additional context for server errors
    if (event.exception) {
      // Only log in development to avoid noise in production logs
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry] Capturing server error:', hint.originalException);
      }
    }
    return event;
  },
});
