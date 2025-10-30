/**
 * API Response utilities for consistent error and success responses
 */

import { NextResponse } from 'next/server';

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

  return NextResponse.json(
    {
      error: 'Missing required fields',
      message: fields.length === 1
        ? `Please provide: ${friendlyFields[0]}`
        : `Please provide the following fields: ${friendlyFields.join(', ')}`,
      missingFields: fields,
      status,
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
  return NextResponse.json(
    {
      error: 'Validation error',
      message: reason,
      field,
      validation: reason,
      status,
    },
    { status }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(retryAfter: number, remaining = 0) {
  const minutes = Math.ceil(retryAfter / 60);

  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      retryAfter,
      status: 429,
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
  return NextResponse.json(
    {
      error: 'Server error',
      message,
      status,
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
