import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { logger } from '@/lib/logger';

// Lazy initialization of Airtable to avoid build-time errors
function getAirtableBase() {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  });

  return airtable.base(process.env.AIRTABLE_BASE_ID || '');
}

const tableName = process.env.AIRTABLE_CLAIMS_TABLE_NAME || 'Claims';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const {
      claim_id, // Optional - for custom claim IDs if needed later
      user_name,
      user_email,
      flight_number,
      flight_date,
      airline,
      delay_minutes,
      status,
    } = body;

    // Validate required fields
    if (
      !user_name ||
      !flight_number ||
      !flight_date ||
      !airline ||
      delay_minutes === undefined ||
      !status
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: user_name, flight_number, flight_date, airline, delay_minutes, status',
        },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['pending', 'paid', 'filed', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create the record in Airtable with matching field names
    const fields: Record<string, string | number> = {
      user_name,
      flight_number,
      flight_date,
      airline,
      delay_minutes: Number(delay_minutes),
      status,
    };

    // Add optional fields if provided
    if (user_email) {
      fields.user_email = user_email;
    }
    if (claim_id) {
      fields.claim_id = claim_id;
    }

    const base = getAirtableBase();
    const records = await base(tableName).create([{ fields }]);

    // Extract the Airtable record ID - this is our primary claim_id
    const airtableRecordId = records[0].id;

    logger.info('✅ Successfully created claim: ', { airtableRecordId: airtableRecordId });

    return NextResponse.json(
      {
        success: true,
        claim_id: airtableRecordId,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('❌ Error creating claim in Airtable:', error);

    // Log detailed error information
    let errorMessage =
      'Failed to create claim. Please check server logs for details.';

    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
      errorMessage = error.message;
    }

    // Log any additional error properties (Airtable specific errors)
    if (typeof error === 'object' && error !== null) {
      logger.error('Full error object:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch all records from the Claims table
    const base = getAirtableBase();
    const records = await base(tableName)
      .select({
        // You can add filters, sorting, etc. here if needed
        // maxRecords: 100,
        // view: 'Grid view',
      })
      .all();

    // Transform records into a more readable format
    const claims = records.map((record) => ({
      id: record.id,
      fields: record.fields,
      created_time: record.get('Created'),
    }));

    logger.info('✅ Successfully retrieved  claims', { length: claims.length });

    return NextResponse.json(
      {
        success: true,
        count: claims.length,
        claims,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('❌ Error reading claims from Airtable:', error);

    // Log detailed error information
    let errorMessage =
      'Failed to retrieve claims. Please check server logs for details.';

    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
      errorMessage = error.message;
    }

    // Log any additional error properties (Airtable specific errors)
    if (typeof error === 'object' && error !== null) {
      logger.error('Full error object:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
