import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Error tracking service for Flghtly
 * Wraps API routes and captures errors to Sentry

 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * Error categories for better grouping in Sentry
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  DATABASE = 'database',
  PAYMENT = 'payment',
  EMAIL = 'email',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

/**
 * Base application error with structured context
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Validation error for invalid user input
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCategory.VALIDATION, 400, true, context);
  }
}

/**
 * Database/Airtable operation errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    operation: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.DATABASE,
      500,
      false,
      { operation, ...context }
    );
  }
}

/**
 * Payment/Stripe errors
 */
export class PaymentError extends AppError {
  constructor(
    message: string,
    paymentIntentId?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.PAYMENT,
      402,
      true,
      { paymentIntentId, ...context }
    );
  }
}

/**
 * Email delivery errors
 */
export class EmailError extends AppError {
  constructor(
    message: string,
    recipient?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.EMAIL,
      500,
      true,
      { recipient, ...context }
    );
  }
}

/**
 * External API errors (flight data, weather, etc.)
 */
export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    service: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.EXTERNAL_API,
      statusCode || 503,
      true,
      { service, ...context }
    );
  }
}

/**
 * Business logic errors (eligibility, compensation calculation, etc.)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, reason: string, context?: Record<string, any>) {
    super(
      message,
      ErrorCategory.BUSINESS_LOGIC,
      422,
      true,
      { reason, ...context }
    );
  }
}

/**
 * Authentication/authorization errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCategory.AUTHENTICATION, 401, true, context);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    retryAfter: number,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.RATE_LIMIT,
      429,
      true,
      { retryAfter, ...context }
    );
  }
}

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
 * Automatically extracts structured context from AppError instances
 */
export function captureError(
  error: Error | unknown,
  context?: ErrorContext
): string {
  let enrichedTags = { ...context?.tags };
  let enrichedExtra = { ...context?.extra };
  let fingerprint: string[] | undefined;

  // Extract structured context from AppError instances
  if (error instanceof AppError) {
    enrichedTags = {
      ...enrichedTags,
      error_category: error.category,
      error_type: error.name,
      status_code: String(error.statusCode),
      is_operational: String(error.isOperational),
    };

    enrichedExtra = {
      ...enrichedExtra,
      ...error.context,
      error_details: error.toJSON(),
    };

    // Set fingerprint for better grouping in Sentry
    fingerprint = [error.category, error.name, error.message];
  }

  const eventId = Sentry.captureException(error, {
    level: context?.level || (error instanceof AppError && error.category === ErrorCategory.VALIDATION ? 'warning' : 'error'),
    user: context?.user,
    tags: enrichedTags,
    extra: enrichedExtra,
    ...(fingerprint && { fingerprint }),
  });

  // Also log to console for local development
  logger.error('[Error Tracking]', error, { tags: enrichedTags, extra: enrichedExtra });

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

  logger.info('[Error Tracking]', { messagecontext: message, context });

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
  logger.info('[Error Tracking] Set user:', { user: user });
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
  logger.info('[Breadcrumb]', { messagecategorydata: message, category, data });
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
    } catch (error: unknown) {
      // Capture the error with context
      captureError(error, {
        level: error instanceof AppError && error.isOperational ? 'warning' : 'error',
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

      // Determine status code and error message
      let statusCode = 500;
      let errorType = 'Internal server error';
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof AppError) {
        statusCode = error.statusCode;
        errorType = error.name;
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Return error response
      return NextResponse.json(
        {
          error: errorType,
          message: errorMessage,
          ...(error instanceof AppError && error.context && { details: error.context }),
        },
        { status: statusCode }
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
  logger.info('[Transaction]', { nameop: name, op });
  return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  };
}

/**
 * Track database operation performance
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Track successful operation
    Sentry.setTags({ operation, table, db_status: 'success' });
    Sentry.metrics.distribution('database.operation.duration', duration, {
      unit: 'millisecond',
    });

    // Log slow queries
    if (duration > 2000) {
      captureMessage(`Slow database operation: ${operation} on ${table} took ${duration}ms`, {
        level: 'warning',
        tags: { operation, table, duration: String(duration) },
      });
    }

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    // Track failed operation
    Sentry.setTags({ operation, table, db_status: 'error' });
    Sentry.metrics.distribution('database.operation.duration', duration, {
      unit: 'millisecond',
    });

    throw new DatabaseError(
      `Database operation failed: ${operation}`,
      operation,
      { table, duration, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Track external API call performance
 */
export async function trackAPICall<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Track successful API call
    Sentry.setTags({ service, endpoint, api_status: 'success' });
    Sentry.metrics.distribution('api.call.duration', duration, {
      unit: 'millisecond',
    });

    // Log slow API calls
    if (duration > 3000) {
      captureMessage(`Slow API call: ${service}/${endpoint} took ${duration}ms`, {
        level: 'warning',
        tags: { service, endpoint, duration: String(duration) },
      });
    }

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    // Track failed API call
    Sentry.setTags({ service, endpoint, api_status: 'error' });
    Sentry.metrics.distribution('api.call.duration', duration, {
      unit: 'millisecond',
    });

    throw new ExternalAPIError(
      `API call failed: ${service}/${endpoint}`,
      service,
      undefined,
      { endpoint, duration, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Track email delivery performance
 */
export async function trackEmailDelivery<T>(
  emailType: string,
  recipient: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Track successful email delivery
    Sentry.setTags({ email_type: emailType, email_status: 'success' });
    Sentry.metrics.distribution('email.delivery.duration', duration, {
      unit: 'millisecond',
    });

    // Log successful delivery
    logger.info('[Email] Successfully sent ${emailType} to ${recipient} in ms', { duration: duration });

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    // Track failed email delivery
    Sentry.setTags({ email_type: emailType, email_status: 'error' });
    Sentry.metrics.distribution('email.delivery.duration', duration, {
      unit: 'millisecond',
    });

    // Log failed delivery
    console.error(`[Email] Failed to send ${emailType} to ${recipient} after ${duration}ms`);

    throw new EmailError(
      `Email delivery failed: ${emailType}`,
      recipient,
      { duration, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get recommended sampling rates based on route priority and traffic
 */
export function getRecommendedSamplingRates(): Record<string, { rate: number; reason: string }> {
  return {
    'payment-critical': {
      rate: 0.8,
      reason: 'High sampling for payment processing to catch all payment-related issues',
    },
    'webhooks': {
      rate: 0.8,
      reason: 'High sampling for webhooks - critical for external integrations',
    },
    'claims-creation': {
      rate: 0.7,
      reason: 'High sampling for claim creation - core business logic',
    },
    'admin-operations': {
      rate: 0.5,
      reason: 'Medium sampling for admin operations - important for debugging',
    },
    'eligibility-checks': {
      rate: 0.4,
      reason: 'Medium sampling for eligibility checks - high volume but important',
    },
    'background-jobs': {
      rate: 0.3,
      reason: 'Lower sampling for cron jobs - can review logs if needed',
    },
    'analytics': {
      rate: 0.15,
      reason: 'Low sampling for analytics endpoints - not critical',
    },
    'health-checks': {
      rate: 0.05,
      reason: 'Minimal sampling for health checks - very high volume',
    },
    'static-assets': {
      rate: 0.01,
      reason: 'Minimal sampling for static assets - not important',
    },
  };
}

/**
 * Calculate optimal sampling rate based on error rate and traffic volume
 * Higher error rates should trigger higher sampling
 */
export function calculateDynamicSamplingRate(
  baseRate: number,
  errorRate: number,
  trafficVolume: number
): number {
  // If error rate is high (>5%), increase sampling
  if (errorRate > 0.05) {
    return Math.min(baseRate * 2, 1.0);
  }

  // If error rate is very low (<0.1%) and traffic is high (>1000/hr), decrease sampling
  if (errorRate < 0.001 && trafficVolume > 1000) {
    return Math.max(baseRate * 0.5, 0.01);
  }

  // Otherwise use base rate
  return baseRate;
}
