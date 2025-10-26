import { NextRequest, NextResponse } from 'next/server';
import {
  validateAirlineConfig,
  generateAirlineConfigFromTemplate,
} from '@/lib/airline-config-template';

/**
 * POST /api/admin/airlines
 * Add a new airline configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    console.log('New airline configuration:', body);

    return NextResponse.json({
      success: true,
      message: 'Airline configuration saved successfully',
      data: body,
    });
  } catch (error) {
    console.error('Error saving airline configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save airline configuration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/airlines
 * Get all airline configurations
 */
export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error fetching airline configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airline configurations' },
      { status: 500 }
    );
  }
}
