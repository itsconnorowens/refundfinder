import { NextRequest, NextResponse } from 'next/server';
import { getAllAirlineConfigs } from '@/lib/airline-config';

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
