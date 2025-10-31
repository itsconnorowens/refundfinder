import { NextRequest, NextResponse } from 'next/server';
import { validateAirlineConfig } from '@/lib/airline-config-template';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/airlines
 * Add a new airline configuration
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();

  addBreadcrumb('Adding airline configuration', 'admin', { airlineCode: body.airlineCode });

  // Validate the configuration
  const validationErrors = validateAirlineConfig(body);
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validationErrors,
      },
      { status: 400 }
    );
  }

  // In a real implementation, this would save to the database
  // For now, we'll just return success
  logger.info('New airline configuration:', { body: body });

  return NextResponse.json({
    success: true,
    message: 'Airline configuration saved successfully',
    data: body,
  });
}, { route: '/api/admin/airlines', tags: { service: 'admin', operation: 'airline_management' } });

/**
 * GET /api/admin/airlines
 * Get all airline configurations
 */
export const GET = withErrorTracking(async (_request: NextRequest) => {
  // In a real implementation, this would fetch from the database
  // For now, return a mock response
  const airlines = [
    {
      airlineCode: 'BA',
      airlineName: 'British Airways',
      submissionMethod: 'web_form',
      region: 'Europe',
      isActive: true,
    },
    {
      airlineCode: 'FR',
      airlineName: 'Ryanair',
      submissionMethod: 'email',
      region: 'Europe',
      isActive: true,
    },
    // Add more airlines...
  ];

  return NextResponse.json({
    success: true,
    data: airlines,
  });
}, { route: '/api/admin/airlines', tags: { service: 'admin', operation: 'airline_management' } });
