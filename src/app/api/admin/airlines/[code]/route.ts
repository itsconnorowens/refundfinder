import { NextRequest, NextResponse } from 'next/server';
import { getAllAirlineConfigs, getAirlineConfig } from '@/lib/airline-config';
import { addBreadcrumb } from '@/lib/error-tracking';

/**
 * GET /api/admin/airlines/[code]
 * Get specific airline configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: airlineCode } = await params;
    addBreadcrumb('Fetching airline configuration', 'admin', { airlineCode });

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
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'airline_config', route: '/api/admin/airlines/[code]' } });
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
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    addBreadcrumb('Updating airline configuration', 'admin', { airlineCode: code });

    // For now, return not implemented
    // In the future, this could update airline configs in a database
    return NextResponse.json(
      { error: 'Airline configuration updates not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'airline_config_update', route: '/api/admin/airlines/[code]' } });
    console.error('Error updating airline config:', error);
    return NextResponse.json(
      { error: 'Failed to update airline configuration' },
      { status: 500 }
    );
  }
}
