/**
 * Standardized Error Code System
 *
 * This module provides a centralized error code management system for user-friendly
 * error communication while maintaining detailed technical context for debugging.
 *
 * Error Code Ranges:
 * - 100-199: Network errors
 * - 200-299: Server errors
 * - 300-399: Validation errors
 * - 400-499: Timeout errors
 * - 500-599: Client/parsing errors
 * - 600-699: Authentication/authorization errors
 * - 700-799: Business logic errors
 * - 900-999: Unknown/unexpected errors
 */

export enum ErrorCode {
  // Network Errors (100-199)
  NETWORK_ERROR = 'ERR_100',
  CONNECTION_FAILED = 'ERR_101',
  CONNECTION_TIMEOUT = 'ERR_102',
  NO_INTERNET = 'ERR_103',
  REQUEST_ABORTED = 'ERR_104',

  // Server Errors (200-299)
  SERVER_ERROR = 'ERR_200',
  SERVER_UNAVAILABLE = 'ERR_201',
  SERVER_TIMEOUT = 'ERR_202',
  INTERNAL_SERVER_ERROR = 'ERR_203',
  SERVICE_UNAVAILABLE = 'ERR_204',
  GATEWAY_TIMEOUT = 'ERR_205',

  // Validation Errors (300-399)
  VALIDATION_ERROR = 'ERR_300',
  MISSING_REQUIRED_FIELDS = 'ERR_301',
  INVALID_INPUT = 'ERR_302',
  INVALID_DATE_FORMAT = 'ERR_303',
  INVALID_EMAIL_FORMAT = 'ERR_304',
  INVALID_FLIGHT_NUMBER = 'ERR_305',

  // Timeout Errors (400-499)
  REQUEST_TIMEOUT = 'ERR_400',
  API_TIMEOUT = 'ERR_401',
  PROCESSING_TIMEOUT = 'ERR_402',

  // Client/Parsing Errors (500-599)
  JSON_PARSE_ERROR = 'ERR_500',
  INVALID_RESPONSE_FORMAT = 'ERR_501',
  UNEXPECTED_RESPONSE_TYPE = 'ERR_502',
  EMPTY_RESPONSE = 'ERR_503',
  MALFORMED_RESPONSE = 'ERR_504',

  // Authentication/Authorization Errors (600-699)
  UNAUTHORIZED = 'ERR_600',
  FORBIDDEN = 'ERR_601',
  SESSION_EXPIRED = 'ERR_602',
  INVALID_TOKEN = 'ERR_603',

  // Business Logic Errors (700-799)
  RATE_LIMIT_EXCEEDED = 'ERR_700',
  ELIGIBILITY_CHECK_FAILED = 'ERR_701',
  CLAIM_SUBMISSION_FAILED = 'ERR_702',
  PAYMENT_PROCESSING_FAILED = 'ERR_703',
  EMAIL_PARSING_FAILED = 'ERR_704',
  FLIGHT_DATA_NOT_FOUND = 'ERR_705',

  // Unknown/Unexpected Errors (900-999)
  UNKNOWN_ERROR = 'ERR_900',
  UNEXPECTED_ERROR = 'ERR_901',
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'network'
  | 'server'
  | 'validation'
  | 'timeout'
  | 'client'
  | 'auth'
  | 'business'
  | 'unknown';

export interface ErrorDetails {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  suggestedAction: string;
  retryable: boolean;
}

/**
 * Comprehensive error code mapping with user-friendly messages and technical details
 */
export const ERROR_CODE_MAP: Record<ErrorCode, Omit<ErrorDetails, 'code'>> = {
  // Network Errors
  [ErrorCode.NETWORK_ERROR]: {
    category: 'network',
    severity: 'medium',
    userMessage: 'Unable to connect to our servers. Please check your internet connection.',
    technicalMessage: 'Network request failed due to connectivity issues',
    suggestedAction: 'Check your internet connection and try again',
    retryable: true,
  },
  [ErrorCode.CONNECTION_FAILED]: {
    category: 'network',
    severity: 'medium',
    userMessage: 'Connection failed. Please try again.',
    technicalMessage: 'Failed to establish connection to the server',
    suggestedAction: 'Try again in a few moments',
    retryable: true,
  },
  [ErrorCode.CONNECTION_TIMEOUT]: {
    category: 'network',
    severity: 'medium',
    userMessage: 'Connection timed out. Please try again.',
    technicalMessage: 'Network connection timed out before completing',
    suggestedAction: 'Check your internet connection and try again',
    retryable: true,
  },
  [ErrorCode.NO_INTERNET]: {
    category: 'network',
    severity: 'high',
    userMessage: 'No internet connection detected.',
    technicalMessage: 'Client appears to be offline',
    suggestedAction: 'Connect to the internet and try again',
    retryable: true,
  },
  [ErrorCode.REQUEST_ABORTED]: {
    category: 'network',
    severity: 'low',
    userMessage: 'Request was cancelled. Please try again.',
    technicalMessage: 'Request was aborted before completion',
    suggestedAction: 'Try again',
    retryable: true,
  },

  // Server Errors
  [ErrorCode.SERVER_ERROR]: {
    category: 'server',
    severity: 'high',
    userMessage: 'Server error occurred. Please try again or contact support.',
    technicalMessage: 'Server returned an error status (5xx)',
    suggestedAction: 'Try again or contact support if the problem persists',
    retryable: true,
  },
  [ErrorCode.SERVER_UNAVAILABLE]: {
    category: 'server',
    severity: 'high',
    userMessage: 'Our servers are temporarily unavailable. Please try again shortly.',
    technicalMessage: 'Server returned 503 Service Unavailable',
    suggestedAction: 'Wait a few minutes and try again',
    retryable: true,
  },
  [ErrorCode.SERVER_TIMEOUT]: {
    category: 'server',
    severity: 'high',
    userMessage: 'Server took too long to respond. Please try again.',
    technicalMessage: 'Server did not respond within the expected time',
    suggestedAction: 'Try again in a few moments',
    retryable: true,
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    category: 'server',
    severity: 'critical',
    userMessage: 'An unexpected server error occurred. Please contact support.',
    technicalMessage: 'Server returned 500 Internal Server Error',
    suggestedAction: 'Contact support with this error code',
    retryable: false,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    category: 'server',
    severity: 'high',
    userMessage: 'Service is temporarily unavailable. Please try again later.',
    technicalMessage: 'Dependent service is unavailable',
    suggestedAction: 'Try again later',
    retryable: true,
  },
  [ErrorCode.GATEWAY_TIMEOUT]: {
    category: 'server',
    severity: 'high',
    userMessage: 'Gateway timeout. The server is taking too long to respond.',
    technicalMessage: 'Server returned 504 Gateway Timeout',
    suggestedAction: 'Try again in a few moments',
    retryable: true,
  },

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Please check your input and try again.',
    technicalMessage: 'Request validation failed',
    suggestedAction: 'Review the form and correct any errors',
    retryable: false,
  },
  [ErrorCode.MISSING_REQUIRED_FIELDS]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Please fill in all required fields.',
    technicalMessage: 'One or more required fields are missing',
    suggestedAction: 'Complete all required fields and submit again',
    retryable: false,
  },
  [ErrorCode.INVALID_INPUT]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Some information appears to be invalid. Please check and try again.',
    technicalMessage: 'Input validation failed for one or more fields',
    suggestedAction: 'Review your input and correct any errors',
    retryable: false,
  },
  [ErrorCode.INVALID_DATE_FORMAT]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Invalid date format. Please use the correct format.',
    technicalMessage: 'Date field contains invalid format',
    suggestedAction: 'Enter date in the correct format',
    retryable: false,
  },
  [ErrorCode.INVALID_EMAIL_FORMAT]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Invalid email address. Please check and try again.',
    technicalMessage: 'Email field contains invalid email format',
    suggestedAction: 'Enter a valid email address',
    retryable: false,
  },
  [ErrorCode.INVALID_FLIGHT_NUMBER]: {
    category: 'validation',
    severity: 'low',
    userMessage: 'Invalid flight number format.',
    technicalMessage: 'Flight number does not match expected format',
    suggestedAction: 'Enter a valid flight number (e.g., AA1234)',
    retryable: false,
  },

  // Timeout Errors
  [ErrorCode.REQUEST_TIMEOUT]: {
    category: 'timeout',
    severity: 'medium',
    userMessage: 'Request timed out. Please try again.',
    technicalMessage: 'Request exceeded maximum allowed time',
    suggestedAction: 'Try again',
    retryable: true,
  },
  [ErrorCode.API_TIMEOUT]: {
    category: 'timeout',
    severity: 'medium',
    userMessage: 'The request is taking longer than expected. Please try again.',
    technicalMessage: 'API request timed out',
    suggestedAction: 'Try again in a few moments',
    retryable: true,
  },
  [ErrorCode.PROCESSING_TIMEOUT]: {
    category: 'timeout',
    severity: 'medium',
    userMessage: 'Processing is taking too long. Please try again.',
    technicalMessage: 'Server processing exceeded timeout threshold',
    suggestedAction: 'Try again or contact support if this continues',
    retryable: true,
  },

  // Client/Parsing Errors
  [ErrorCode.JSON_PARSE_ERROR]: {
    category: 'client',
    severity: 'high',
    userMessage: 'Unable to process server response. Please try again or contact support.',
    technicalMessage: 'Failed to parse JSON response from server',
    suggestedAction: 'Try again or contact support with this error code',
    retryable: true,
  },
  [ErrorCode.INVALID_RESPONSE_FORMAT]: {
    category: 'client',
    severity: 'high',
    userMessage: 'Received an invalid response from the server. Please contact support.',
    technicalMessage: 'Server response format does not match expected structure',
    suggestedAction: 'Contact support with this error code',
    retryable: false,
  },
  [ErrorCode.UNEXPECTED_RESPONSE_TYPE]: {
    category: 'client',
    severity: 'high',
    userMessage: 'Received an unexpected response type. Please try again.',
    technicalMessage: 'Response content-type is not application/json',
    suggestedAction: 'Try again or contact support if this continues',
    retryable: true,
  },
  [ErrorCode.EMPTY_RESPONSE]: {
    category: 'client',
    severity: 'high',
    userMessage: 'Received an empty response from the server. Please try again.',
    technicalMessage: 'Server returned empty response body',
    suggestedAction: 'Try again or contact support if this continues',
    retryable: true,
  },
  [ErrorCode.MALFORMED_RESPONSE]: {
    category: 'client',
    severity: 'high',
    userMessage: 'Server response is malformed. Please contact support.',
    technicalMessage: 'Response body is malformed or corrupted',
    suggestedAction: 'Contact support with this error code',
    retryable: false,
  },

  // Authentication/Authorization Errors
  [ErrorCode.UNAUTHORIZED]: {
    category: 'auth',
    severity: 'medium',
    userMessage: 'Authentication required. Please log in and try again.',
    technicalMessage: 'User is not authenticated (401)',
    suggestedAction: 'Log in and try again',
    retryable: false,
  },
  [ErrorCode.FORBIDDEN]: {
    category: 'auth',
    severity: 'medium',
    userMessage: 'You do not have permission to perform this action.',
    technicalMessage: 'User does not have required permissions (403)',
    suggestedAction: 'Contact support if you believe this is an error',
    retryable: false,
  },
  [ErrorCode.SESSION_EXPIRED]: {
    category: 'auth',
    severity: 'medium',
    userMessage: 'Your session has expired. Please log in again.',
    technicalMessage: 'User session has expired',
    suggestedAction: 'Log in again and retry',
    retryable: false,
  },
  [ErrorCode.INVALID_TOKEN]: {
    category: 'auth',
    severity: 'medium',
    userMessage: 'Invalid authentication token. Please log in again.',
    technicalMessage: 'Authentication token is invalid or expired',
    suggestedAction: 'Log in again',
    retryable: false,
  },

  // Business Logic Errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    category: 'business',
    severity: 'medium',
    userMessage: 'Too many requests. Please wait a moment and try again.',
    technicalMessage: 'Rate limit exceeded for this endpoint',
    suggestedAction: 'Wait a few minutes before trying again',
    retryable: true,
  },
  [ErrorCode.ELIGIBILITY_CHECK_FAILED]: {
    category: 'business',
    severity: 'medium',
    userMessage: 'Unable to check eligibility at this time. Please try again.',
    technicalMessage: 'Eligibility check process failed',
    suggestedAction: 'Try again or contact support if this continues',
    retryable: true,
  },
  [ErrorCode.CLAIM_SUBMISSION_FAILED]: {
    category: 'business',
    severity: 'high',
    userMessage: 'Unable to submit your claim. Please try again or contact support.',
    technicalMessage: 'Claim submission process failed',
    suggestedAction: 'Try again or contact support with this error code',
    retryable: true,
  },
  [ErrorCode.PAYMENT_PROCESSING_FAILED]: {
    category: 'business',
    severity: 'high',
    userMessage: 'Payment processing failed. Please try again or contact support.',
    technicalMessage: 'Payment processing encountered an error',
    suggestedAction: 'Check your payment details and try again',
    retryable: true,
  },
  [ErrorCode.EMAIL_PARSING_FAILED]: {
    category: 'business',
    severity: 'medium',
    userMessage: 'Unable to parse your email. Please try entering details manually.',
    technicalMessage: 'Email parsing service failed to extract flight information',
    suggestedAction: 'Enter flight details manually',
    retryable: false,
  },
  [ErrorCode.FLIGHT_DATA_NOT_FOUND]: {
    category: 'business',
    severity: 'medium',
    userMessage: 'Flight information not found. Please verify your details.',
    technicalMessage: 'Flight data lookup returned no results',
    suggestedAction: 'Verify flight number and date are correct',
    retryable: false,
  },

  // Unknown/Unexpected Errors
  [ErrorCode.UNKNOWN_ERROR]: {
    category: 'unknown',
    severity: 'high',
    userMessage: 'An unexpected error occurred. Please contact support.',
    technicalMessage: 'Unknown error type',
    suggestedAction: 'Contact support with this error code',
    retryable: false,
  },
  [ErrorCode.UNEXPECTED_ERROR]: {
    category: 'unknown',
    severity: 'high',
    userMessage: 'Something went wrong. Please try again or contact support.',
    technicalMessage: 'Unexpected error occurred',
    suggestedAction: 'Try again or contact support with this error code',
    retryable: true,
  },
};

/**
 * Get error details by error code
 */
export function getErrorDetails(code: ErrorCode): ErrorDetails {
  const details = ERROR_CODE_MAP[code];
  if (!details) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      ...ERROR_CODE_MAP[ErrorCode.UNKNOWN_ERROR],
    };
  }
  return {
    code,
    ...details,
  };
}

/**
 * Categorize HTTP status code into error code
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 403) return ErrorCode.FORBIDDEN;
  if (status === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
  if (status === 500) return ErrorCode.INTERNAL_SERVER_ERROR;
  if (status === 502 || status === 503) return ErrorCode.SERVICE_UNAVAILABLE;
  if (status === 504) return ErrorCode.GATEWAY_TIMEOUT;
  if (status >= 500) return ErrorCode.SERVER_ERROR;
  if (status >= 400) return ErrorCode.VALIDATION_ERROR;
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Categorize error type into error code
 */
export function getErrorCodeFromError(error: unknown): ErrorCode {
  if (error instanceof SyntaxError) {
    return ErrorCode.JSON_PARSE_ERROR;
  }
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return ErrorCode.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ErrorCode.REQUEST_TIMEOUT;
    }
    return ErrorCode.UNEXPECTED_ERROR;
  }
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: string }).name;
    if (name === 'AbortError') return ErrorCode.REQUEST_ABORTED;
    if (name === 'TimeoutError') return ErrorCode.REQUEST_TIMEOUT;
  }
  return ErrorCode.UNKNOWN_ERROR;
}
