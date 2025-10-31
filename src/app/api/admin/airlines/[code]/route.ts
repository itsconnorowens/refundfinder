import { NextRequest, NextResponse } from 'next/server';
import { getAirlineConfig } from '@/lib/airline-config';
import { addBreadcrumb, withErrorTracking } from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/airlines/[code]
 * Get specific airline configuration
 */
export const GET = withErrorTracking(async (
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
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
  } catch (error: unknown) {
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'airline_config', route: '/api/admin/airlines/[code]' } });
    logger.error('Error fetching airline config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airline configuration' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/airlines/[code]',
  tags: { service: 'admin', operation: 'get_airline_config' }
});

/**
 * PUT /api/admin/airlines/[code]
 * Update airline configuration (for future use)
 */
export const PUT = withErrorTracking(async (
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  try {
    const { code } = await params;
    addBreadcrumb('Updating airline configuration', 'admin', { airlineCode: code });

    // For now, return not implemented
    // In the future, this could update airline configs in a database
    return NextResponse.json(
      { error: 'Airline configuration updates not implemented yet' },
      { status: 501 }
    );
  } catch (error: unknown) {
    const { captureError } = await import('@/lib/error-tracking');
    captureError(error, { level: 'error', tags: { service: 'admin', operation: 'airline_config_update', route: '/api/admin/airlines/[code]' } });
    logger.error('Error updating airline config:', error);
    return NextResponse.json(
      { error: 'Failed to update airline configuration' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/airlines/[code]',
  tags: { service: 'admin', operation: 'update_airline_config' }
});
