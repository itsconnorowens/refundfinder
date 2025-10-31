import { NextResponse } from 'next/server';
import { getClaimsReadyToFile } from '@/lib/airtable';
import { logger } from '@/lib/logger';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async () => {
  try {
    const records = await getClaimsReadyToFile();
    const claims = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    return NextResponse.json({
      success: true,
      data: { claims },
    });
  } catch (error: unknown) {
    logger.error('Error fetching claims ready to file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims ready to file' },
      { status: 500 }
    );
  }
}, {
  route: '/api/admin/claims/ready-to-file',
  tags: { service: 'admin', operation: 'get_ready_to_file' }
});


