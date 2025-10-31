/**
 * Enhanced error messaging system for user-friendly error handling
 */

export interface ErrorDetails {
  title: string;
  message: string;
  guidance?: string[];
  fieldSpecific?: Record<string, string>;
  retryable: boolean;
}

/**
 * Field-friendly names for better UX
 */
const FIELD_LABELS: Record<string, string> = {
  flightNumber: 'Flight Number',
  airline: 'Airline',
  departureDate: 'Departure Date',
  departureAirport: 'Departure Airport',
  arrivalAirport: 'Arrival Airport',
  delayDuration: 'Delay Duration',
  delayReason: 'Reason for Delay',
  passengerEmail: 'Email Address',
  firstName: 'First Name',
  lastName: 'Last Name',
  noticeGiven: 'Notice Period',
  alternativeTiming: 'Alternative Flight Timing',
  deniedBoardingReason: 'Denied Boarding Reason',
  checkedInOnTime: 'Check-in Status',
  ticketPrice: 'Ticket Price',
  classPaidFor: 'Class Paid For',
  classReceived: 'Class Received',
  downgradeTiming: 'Downgrade Timing',
};

/**
 * Field-specific guidance for users
 */
const FIELD_GUIDANCE: Record<string, string> = {
  flightNumber: 'Find this on your boarding pass or confirmation email (e.g., BA123, AA456)',
  airline: 'Enter the airline operating your flight (e.g., British Airways, Delta)',
  departureDate: 'Enter the date your flight was scheduled to depart',
  departureAirport: 'Enter the 3-letter airport code (e.g., JFK, LHR)',
  arrivalAirport: 'Enter the 3-letter destination airport code',
  delayDuration: 'Enter how long your flight was delayed in hours and minutes',
  passengerEmail: 'Enter a valid email address to receive updates about your claim',
  firstName: 'Enter your first name as shown on your ticket',
  lastName: 'Enter your last name as shown on your ticket',
  noticeGiven: 'Select how much advance notice you received about the cancellation',
  alternativeTiming: 'Indicate when the alternative flight departed (e.g., "2 hours later", "next day")',
  deniedBoardingReason: 'Select why you were denied boarding',
  checkedInOnTime: 'Select whether you checked in within the airline\'s deadline',
  ticketPrice: 'Enter the total price you paid for your ticket in USD',
  classPaidFor: 'Select the class you originally booked and paid for',
  classReceived: 'Select the class you were actually seated in',
  downgradeTiming: 'Select when the airline informed you about the downgrade',
};

/**
 * Get user-friendly error details for missing fields
 */
export function getMissingFieldsError(missingFields: string[]): ErrorDetails {
  const fieldLabels = missingFields.map(
    (field) => FIELD_LABELS[field] || field
  );

  const guidance = missingFields.map((field) => {
    const label = FIELD_LABELS[field] || field;
    const hint = FIELD_GUIDANCE[field];
    return hint ? `${label}: ${hint}` : `Please provide ${label}`;
  });

  return {
    title: 'Missing Required Information',
    message: missingFields.length === 1
      ? `Please provide the following field: ${fieldLabels[0]}`
      : `Please provide the following ${missingFields.length} fields: ${fieldLabels.join(', ')}`,
    guidance,
    retryable: true,
  };
}

/**
 * Get user-friendly error details for validation errors
 */
export function getValidationError(
  field: string,
  reason?: string
): ErrorDetails {
  const label = FIELD_LABELS[field] || field;
  const hint = FIELD_GUIDANCE[field];

  return {
    title: 'Invalid Information',
    message: reason || `The ${label} you provided is not valid`,
    guidance: hint ? [hint] : undefined,
    retryable: true,
  };
}

/**
 * Get user-friendly error details for rate limit errors
 */
export function getRateLimitError(retryAfter?: number): ErrorDetails {
  const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 60;

  return {
    title: 'Too Many Requests',
    message: `You've made too many eligibility checks recently. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    guidance: [
      'This limit helps us ensure fair access for all users',
      'If you have multiple claims, you can check them one at a time',
      'Contact support if you need to check more flights urgently',
    ],
    retryable: true,
  };
}

/**
 * Get user-friendly error details for server errors
 */
export function getServerError(statusCode: number, originalError?: string): ErrorDetails {
  const errorMap: Record<number, ErrorDetails> = {
    500: {
      title: 'Server Error',
      message: 'We encountered an error processing your request. Our team has been notified.',
      guidance: [
        'Please try again in a few moments',
        'If the problem persists, contact our support team',
        'Your information has been saved and you can retry safely',
      ],
      retryable: true,
    },
    503: {
      title: 'Service Temporarily Unavailable',
      message: 'Our service is temporarily unavailable due to maintenance or high load.',
      guidance: [
        'Please try again in a few minutes',
        'Your data is safe and no information has been lost',
      ],
      retryable: true,
    },
    502: {
      title: 'Connection Error',
      message: 'We\'re having trouble connecting to our services.',
      guidance: [
        'This is usually temporary and resolves quickly',
        'Try refreshing the page or checking back in a moment',
      ],
      retryable: true,
    },
    504: {
      title: 'Request Timeout',
      message: 'Your request took too long to process.',
      guidance: [
        'This might be due to high traffic',
        'Please try again - most requests complete successfully on retry',
      ],
      retryable: true,
    },
  };

  return errorMap[statusCode] || {
    title: 'Unable to Process Request',
    message: originalError || 'An unexpected error occurred while processing your request.',
    guidance: [
      'Please try again',
      'If the problem continues, contact support with the details of your flight',
    ],
    retryable: true,
  };
}

/**
 * Get user-friendly error details for network errors
 */
export function getNetworkError(): ErrorDetails {
  return {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection.',
    guidance: [
      'Verify you\'re connected to the internet',
      'Try refreshing the page',
      'If you\'re on a slow connection, please wait a moment and try again',
    ],
    retryable: true,
  };
}

/**
 * Get user-friendly error details for authentication errors
 */
export function getAuthError(): ErrorDetails {
  return {
    title: 'Authentication Required',
    message: 'Your session has expired. Please refresh the page and try again.',
    guidance: [
      'Refresh the page to continue',
      'Make sure cookies are enabled in your browser',
    ],
    retryable: true,
  };
}

/**
 * Get user-friendly error details for payment errors
 */
export function getPaymentError(reason?: string): ErrorDetails {
  return {
    title: 'Payment Processing Error',
    message: reason || 'We encountered an error processing your payment.',
    guidance: [
      'Please verify your payment information',
      'Check that your card has sufficient funds',
      'Try a different payment method if the issue persists',
      'Contact your bank if you continue to experience issues',
    ],
    retryable: true,
  };
}

/**
 * Get user-friendly error details for claim submission errors
 */
export function getClaimSubmissionError(reason?: string): ErrorDetails {
  return {
    title: 'Unable to Submit Claim',
    message: reason || 'We couldn\'t submit your claim at this time.',
    guidance: [
      'Your payment has not been charged',
      'Please check all required fields are filled correctly',
      'Try submitting again in a moment',
      'Contact support if you continue to have issues',
    ],
    retryable: true,
  };
}

/**
 * Parse API error response and return user-friendly error details
 */
export function parseApiError(
  error: any,
  defaultTitle = 'Unable to Check Eligibility'
): ErrorDetails {
  // Handle missing fields error
  if (error.missingFields && Array.isArray(error.missingFields)) {
    return getMissingFieldsError(error.missingFields);
  }

  // Handle rate limit error
  if (error.error === 'Rate limit exceeded' || error.retryAfter) {
    return getRateLimitError(error.retryAfter);
  }

  // Handle validation errors
  if (error.field && error.validation) {
    return getValidationError(error.field, error.validation);
  }

  // Handle network errors
  if (error.message === 'Failed to fetch' || error.message?.includes('network')) {
    return getNetworkError();
  }

  // Handle authentication errors
  if (error.status === 401 || error.status === 403) {
    return getAuthError();
  }

  // Handle server errors by status code
  if (error.status && error.status >= 500) {
    return getServerError(error.status, error.error || error.message);
  }

  // Generic error with available message
  return {
    title: defaultTitle,
    message: error.message || error.error || 'An unexpected error occurred.',
    guidance: ['Please try again', 'Contact support if the problem persists'],
    retryable: true,
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(errorDetails: ErrorDetails): {
  title: string;
  message: string;
  guidanceList?: string[];
} {
  return {
    title: errorDetails.title,
    message: errorDetails.message,
    guidanceList: errorDetails.guidance,
  };
}
