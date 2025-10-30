import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Smart trace sampling based on environment
  tracesSampler: (samplingContext) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Sample 100% in development for debugging
    if (isDevelopment) {
      return 1.0;
    }

    // Get transaction name for more granular control
    const transactionName = samplingContext.transactionContext?.name || '';

    // Edge functions are typically for middleware, API routes
    // Sample at moderate rate since edge functions are already optimized

    // Critical middleware operations
    if (
      transactionName.includes('middleware') ||
      transactionName.includes('auth')
    ) {
      return 0.4; // 40% for middleware
    }

    // Default edge function sampling
    return 0.2; // 20% for other edge functions
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure environment
  environment: process.env.NODE_ENV,
});
