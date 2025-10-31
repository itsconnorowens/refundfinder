/**
 * API Response utilities for consistent error and success responses
 */

import { NextResponse } from 'next/server';
import { ErrorCode, getErrorDetails } from './error-codes';

export interface ApiErrorResponse {
  error: string;
  message?: string;
  missingFields?: string[];
  field?: string;
  validation?: string;
  retryAfter?: number;
  status?: number;
}

/**
 * Create a validation error response for missing fields
 */
export function missingFieldsResponse(fields: string[], status = 400) {
  const fieldLabels: Record<string, string> = {
    flightNumber: 'Flight Number',
    airline: 'Airline',
    departureDate: 'Departure Date',
    departureAirport: 'Departure Airport',
    arrivalAirport: 'Arrival Airport',
    delayDuration: 'Delay Duration',
    passengerEmail: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
  };

  const friendlyFields = fields.map(f => fieldLabels[f] || f);
  const errorCode = ErrorCode.MISSING_REQUIRED_FIELDS;
  const errorDetails = getErrorDetails(errorCode);

  return NextResponse.json(
    {
      success: false,
      errorCode,
      errorDetails: {
        ...errorDetails,
        userMessage: fields.length === 1
          ? `Please provide: ${friendlyFields[0]}`
          : `Please provide the following fields: ${friendlyFields.join(', ')}`,
      },
    },
    { status }
  );
}

/**
 * Create a validation error response for invalid field values
 */
export function validationErrorResponse(
  field: string,
  reason: string,
  status = 400
) {
  const errorCode = ErrorCode.VALIDATION_ERROR;
  const errorDetails = getErrorDetails(errorCode);

  return NextResponse.json(
    {
      success: false,
      errorCode,
      errorDetails: {
        ...errorDetails,
        userMessage: reason,
      },
    },
    { status }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(retryAfter: number, remaining = 0) {
  const minutes = Math.ceil(retryAfter / 60);
  const errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
  const errorDetails = getErrorDetails(errorCode);

  return NextResponse.json(
    {
      success: false,
      errorCode,
      errorDetails: {
        ...errorDetails,
        userMessage: `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      },
    }
  );
}

/**
 * Create a server error response
 */
export function serverErrorResponse(
  message = 'An internal server error occurred',
  status = 500
) {
  const errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  const errorDetails = getErrorDetails(errorCode);

  return NextResponse.json(
    {
      success: false,
      errorCode,
      errorDetails: {
        ...errorDetails,
        userMessage: message,
      },
    },
    { status }
  );
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
      headers,
    }
  );
}
