import { NextResponse } from 'next/server';
import { getClaimsReadyToFile } from '@/lib/airtable';

export async function GET() {
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
  } catch (error) {
    console.error('Error fetching claims ready to file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims ready to file' },
      { status: 500 }
    );
  }
}


