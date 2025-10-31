/**
 * Reusable API Client Utility
 *
 * Provides a robust wrapper around fetch with:
 * - Automatic retry logic for transient failures
 * - Timeout handling to prevent hanging requests
 * - Response validation before parsing
 * - Error categorization and standardized error codes
 * - Integration with error tracking and monitoring
 * - User-friendly error messages
 */

/* eslint-disable no-undef */
// RequestInit and AbortController are global DOM types

import { captureError } from './error-tracking';
import { logger } from './logger';
import {
  ErrorCode,
  getErrorDetails,
  getErrorCodeFromStatus,
  getErrorCodeFromError,
  type ErrorDetails,
} from './error-codes';

export interface ApiRequestOptions extends RequestInit {
  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for retryable errors
   * @default 2
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Whether to automatically retry on transient failures
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Additional context for error tracking
   */
  errorContext?: Record<string, unknown>;

  /**
   * Custom error handler called when request fails
   */
  onError?: (error: ApiError) => void;

  /**
   * Callback for retry attempts
   */
  onRetry?: (attempt: number, maxRetries: number, error: ApiError) => void;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  errorCode?: never;
  errorDetails?: never;
}

export interface ApiErrorResponse {
  success: false;
  data?: never;
  errorCode: ErrorCode;
  errorDetails: ErrorDetails;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  constructor(
    public errorCode: ErrorCode,
    public errorDetails: ErrorDetails,
    public originalError?: unknown,
    public response?: Response
  ) {
    super(errorDetails.userMessage);
    this.name = 'ApiError';
  }
}

/**
 * Check if an error is retryable based on error code
 */
function isRetryableError(errorCode: ErrorCode, errorDetails: ErrorDetails): boolean {
  return errorDetails.retryable;
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate response before parsing
 */
async function validateResponse(response: Response): Promise<{
  valid: boolean;
  errorCode?: ErrorCode;
  errorMessage?: string;
}> {
  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const errorCode = getErrorCodeFromStatus(response.status);
    return {
      valid: false,
      errorCode,
      errorMessage: `Server returned status ${response.status}`,
    };
  }

  // Check content-type header
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {
      valid: false,
      errorCode: ErrorCode.UNEXPECTED_RESPONSE_TYPE,
      errorMessage: `Expected JSON response but got ${contentType || 'unknown content-type'}`,
    };
  }

  // Check if response has content
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return {
      valid: false,
      errorCode: ErrorCode.EMPTY_RESPONSE,
      errorMessage: 'Server returned empty response',
    };
  }

  return { valid: true };
}

/**
 * Parse JSON response safely
 */
async function parseJsonResponse<T>(response: Response): Promise<T> {
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new ApiError(
        ErrorCode.EMPTY_RESPONSE,
        getErrorDetails(ErrorCode.EMPTY_RESPONSE),
        new Error('Empty response body'),
        response
      );
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new ApiError(
        ErrorCode.JSON_PARSE_ERROR,
        getErrorDetails(ErrorCode.JSON_PARSE_ERROR),
        error,
        response
      );
    }
    throw error;
  }
}

/**
 * Make an API request with automatic retry, timeout, and error handling
 *
 * @example
 * ```typescript
 * const response = await apiRequest<EligibilityResult>('/api/check-eligibility', {
 *   method: 'POST',
 *   body: JSON.stringify(formData),
 *   timeout: 30000,
 *   maxRetries: 2,
 *   onRetry: (attempt, max) => console.log(`Retrying ${attempt}/${max}...`),
 * });
 *
 * if (response.success) {
 *   console.log('Eligible:', response.data.eligible);
 * } else {
 *   console.error('Error:', response.errorDetails.userMessage);
 *   console.error('Error code:', response.errorCode);
 * }
 * ```
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 30000,
    maxRetries = 2,
    retryDelay = 1000,
    enableRetry = true,
    errorContext = {},
    onError,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: ApiError | null = null;
  const startTime = Date.now();

  // Attempt the request with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Log request attempt
        logger.debug('API request attempt', {
          url,
          method: fetchOptions.method || 'GET',
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        });

        // Make the fetch request
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        // Validate response
        const validation = await validateResponse(response);
        if (!validation.valid) {
          const errorCode = validation.errorCode || ErrorCode.INVALID_RESPONSE_FORMAT;
          const errorDetails = getErrorDetails(errorCode);
          throw new ApiError(errorCode, errorDetails, new Error(validation.errorMessage), response);
        }

        // Parse JSON response
        const data = await parseJsonResponse<T>(response);

        // Log successful request
        const duration = Date.now() - startTime;
        logger.info('API request successful', {
          url,
          method: fetchOptions.method || 'GET',
          duration,
          attempts: attempt + 1,
        });

        return {
          success: true,
          data,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort/timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
          const errorCode = ErrorCode.REQUEST_TIMEOUT;
          const errorDetails = getErrorDetails(errorCode);
          throw new ApiError(errorCode, errorDetails, error);
        }

        // Re-throw ApiError
        if (error instanceof ApiError) {
          throw error;
        }

        // Categorize other errors
        const errorCode = getErrorCodeFromError(error);
        const errorDetails = getErrorDetails(errorCode);
        throw new ApiError(errorCode, errorDetails, error);
      }
    } catch (error) {
      if (!(error instanceof ApiError)) {
        // Unexpected error type
        const errorCode = ErrorCode.UNEXPECTED_ERROR;
        const errorDetails = getErrorDetails(errorCode);
        lastError = new ApiError(errorCode, errorDetails, error);
      } else {
        lastError = error;
      }

      // Check if we should retry
      const shouldRetry =
        enableRetry &&
        attempt < maxRetries &&
        isRetryableError(lastError.errorCode, lastError.errorDetails);

      if (shouldRetry) {
        // Calculate delay with exponential backoff
        const delayMs = retryDelay * Math.pow(2, attempt);

        logger.warn('API request failed, retrying...', {
          url,
          method: fetchOptions.method || 'GET',
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          errorCode: lastError.errorCode,
          retryDelay: delayMs,
        });

        // Call retry callback
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, lastError);
        }

        // Wait before retrying
        await delay(delayMs);
        continue;
      }

      // No more retries, break the loop
      break;
    }
  }

  // All retries exhausted or non-retryable error
  if (!lastError) {
    lastError = new ApiError(
      ErrorCode.UNKNOWN_ERROR,
      getErrorDetails(ErrorCode.UNKNOWN_ERROR),
      new Error('Unknown error occurred')
    );
  }

  // Log error
  const duration = Date.now() - startTime;
  logger.error('API request failed', {
    url,
    method: fetchOptions.method || 'GET',
    duration,
    errorCode: lastError.errorCode,
    errorMessage: lastError.errorDetails.technicalMessage,
  });

  // Track error in monitoring system
  captureError(lastError.originalError || lastError, {
    tags: {
      context: 'api_request',
      errorCode: lastError.errorCode,
      category: lastError.errorDetails.category,
    },
    extra: {
      url,
      method: fetchOptions.method || 'GET',
      ...errorContext,
    },
    level: lastError.errorDetails.severity === 'critical' ? 'fatal' :
           lastError.errorDetails.severity === 'high' ? 'error' : 'warning',
  });

  // Call error callback
  if (onError) {
    onError(lastError);
  }

  return {
    success: false,
    errorCode: lastError.errorCode,
    errorDetails: lastError.errorDetails,
  };
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = unknown>(
  url: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = unknown>(
  url: string,
  data?: unknown,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = unknown>(
  url: string,
  data?: unknown,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = unknown>(
  url: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'DELETE' });
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for online status
 */
export function waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      resolve(false);
    }, timeoutMs);

    const onOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onOnline);
      resolve(true);
    };

    window.addEventListener('online', onOnline);
  });
}
