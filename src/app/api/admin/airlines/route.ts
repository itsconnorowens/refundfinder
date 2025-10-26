import { NextRequest, NextResponse } from 'next/server';
import { getAllAirlineConfigs, getAirlineConfig } from '@/lib/airline-config';

/**
 * GET /api/admin/airlines
 * List all airline configurations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionMethod = searchParams.get('submission_method');

    let configs = getAllAirlineConfigs();

    // Filter by submission method if specified
    if (submissionMethod) {
      configs = configs.filter(
        (config) => config.submissionMethod === submissionMethod
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        airlines: configs,
        total: configs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching airline configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airline configurations' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/airlines/[code]
 * Get specific airline configuration
 */
export async function GET_AIRLINE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const airlineCode = params.code;
    const config = getAirlineConfig(airlineCode);

    if (!config) {
      return NextResponse.json(
        { error: 'Airline configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching airline config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airline configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/airlines/[code]
 * Update airline configuration (for future use)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // For now, return not implemented
    // In the future, this could update airline configs in a database
    return NextResponse.json(
      { error: 'Airline configuration updates not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating airline config:', error);
    return NextResponse.json(
      { error: 'Failed to update airline configuration' },
      { status: 500 }
    );
  }
}
