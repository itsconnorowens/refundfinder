/**
 * Verification script to read test records from Airtable
 * Validates that all Phase 2 fields were written correctly
 */

import Airtable from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ Error: AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

interface AirtableRecord {
  id: string;
  fields: {
    claim_id?: string;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    flight_number?: string;
    airline?: string;
    departure_airport?: string;
    arrival_airport?: string;
    disruption_type?: string;
    status?: string;
    estimated_compensation?: string;

    // Cancellation fields
    notice_given?: string;
    alternative_flight_offered?: boolean;
    alternative_timing?: string;
    cancellation_reason?: string;

    // Denied boarding fields
    denied_boarding_type?: string;
    denied_boarding_reason?: string;
    compensation_offered_by_airline?: boolean;
    passenger_count?: number;

    // Downgrade fields
    booked_class?: string;
    actual_class?: string;
    ticket_price?: number;
    fare_difference?: number;
    downgrade_reason?: string;

    [key: string]: any;
  };
}

async function verifyAirtableData() {
  console.log('🔍 Reading test records from Airtable...\n');
  console.log('Fetching all records with email containing "test-"\n');

  try {
    const recordsRaw = await base('Claims')
      .select({
        filterByFormula: "FIND('test-', {user_email}) > 0",
        sort: [{ field: 'user_email', direction: 'asc' }],
      })
      .all();

    const records: AirtableRecord[] = recordsRaw as unknown as AirtableRecord[];

    if (records.length === 0) {
      console.log('⚠️  No test records found!');
      console.log('Make sure the test script ran successfully.\n');
      return;
    }

    console.log(`✅ Found ${records.length} test records\n`);
    console.log('='.repeat(80));

    // Group by disruption type
    const byType: Record<string, AirtableRecord[]> = {};
    records.forEach(record => {
      const type = record.fields.disruption_type || 'unknown';
      if (!byType[type]) byType[type] = [];
      byType[type].push(record);
    });

    let allFieldsValid = true;
    const issues: string[] = [];

    // Verify each disruption type
    for (const [type, typeRecords] of Object.entries(byType)) {
      console.log(`\n📋 ${type.toUpperCase()} RECORDS (${typeRecords.length})`);
      console.log('='.repeat(80));

      for (const record of typeRecords) {
        const fields = record.fields;
        console.log(`\n✈️  ${fields.flight_number} - ${fields.user_first_name} ${fields.user_last_name}`);
        console.log(`   Record ID: ${record.id}`);
        console.log(`   Email: ${fields.user_email}`);
        console.log(`   Route: ${fields.departure_airport} → ${fields.arrival_airport}`);
        console.log(`   Status: ${fields.status}`);
        console.log(`   Compensation: ${fields.estimated_compensation}`);

        // Verify core field
        if (!fields.disruption_type) {
          issues.push(`${record.id}: Missing disruption_type`);
          allFieldsValid = false;
          console.log(`   ❌ Missing: disruption_type`);
        } else {
          console.log(`   ✅ Disruption Type: ${fields.disruption_type}`);
        }

        // Verify type-specific fields
        if (type === 'cancellation') {
          console.log('\n   📦 Cancellation Fields:');

          if (fields.notice_given) {
            console.log(`   ✅ Notice Given: ${fields.notice_given}`);
          } else {
            console.log(`   ❌ Missing: notice_given`);
            issues.push(`${record.id}: Missing notice_given`);
            allFieldsValid = false;
          }

          if (fields.alternative_flight_offered !== undefined) {
            console.log(`   ✅ Alternative Offered: ${fields.alternative_flight_offered}`);
          } else {
            console.log(`   ❌ Missing: alternative_flight_offered`);
            issues.push(`${record.id}: Missing alternative_flight_offered`);
            allFieldsValid = false;
          }

          if (fields.alternative_flight_offered && fields.alternative_timing) {
            console.log(`   ✅ Alternative Timing: ${fields.alternative_timing}`);
          } else if (fields.alternative_flight_offered && !fields.alternative_timing) {
            console.log(`   ⚠️  Alternative offered but timing not specified`);
          }

          if (fields.cancellation_reason) {
            console.log(`   ✅ Reason: ${fields.cancellation_reason}`);
          } else {
            console.log(`   ⚠️  No cancellation reason provided`);
          }

        } else if (type === 'denied_boarding') {
          console.log('\n   📦 Denied Boarding Fields:');

          if (fields.denied_boarding_type) {
            console.log(`   ✅ Type: ${fields.denied_boarding_type}`);
          } else {
            console.log(`   ❌ Missing: denied_boarding_type`);
            issues.push(`${record.id}: Missing denied_boarding_type`);
            allFieldsValid = false;
          }

          if (fields.denied_boarding_reason) {
            console.log(`   ✅ Reason: ${fields.denied_boarding_reason}`);
          } else {
            console.log(`   ❌ Missing: denied_boarding_reason`);
            issues.push(`${record.id}: Missing denied_boarding_reason`);
            allFieldsValid = false;
          }

          if (fields.compensation_offered_by_airline !== undefined) {
            console.log(`   ✅ Compensation Offered: ${fields.compensation_offered_by_airline}`);
          } else {
            console.log(`   ❌ Missing: compensation_offered_by_airline`);
            issues.push(`${record.id}: Missing compensation_offered_by_airline`);
            allFieldsValid = false;
          }

          if (fields.passenger_count !== undefined) {
            console.log(`   ✅ Passenger Count: ${fields.passenger_count}`);
          } else {
            console.log(`   ⚠️  No passenger count specified`);
          }

          if (fields.ticket_price !== undefined) {
            console.log(`   ✅ Ticket Price: $${fields.ticket_price}`);
          }

        } else if (type === 'downgrade') {
          console.log('\n   📦 Downgrade Fields:');

          if (fields.booked_class) {
            console.log(`   ✅ Booked Class: ${fields.booked_class}`);
          } else {
            console.log(`   ❌ Missing: booked_class`);
            issues.push(`${record.id}: Missing booked_class`);
            allFieldsValid = false;
          }

          if (fields.actual_class) {
            console.log(`   ✅ Actual Class: ${fields.actual_class}`);
          } else {
            console.log(`   ❌ Missing: actual_class`);
            issues.push(`${record.id}: Missing actual_class`);
            allFieldsValid = false;
          }

          if (fields.ticket_price !== undefined) {
            console.log(`   ✅ Ticket Price: $${fields.ticket_price}`);
          } else {
            console.log(`   ❌ Missing: ticket_price`);
            issues.push(`${record.id}: Missing ticket_price`);
            allFieldsValid = false;
          }

          if (fields.fare_difference !== undefined) {
            console.log(`   ✅ Fare Difference: $${fields.fare_difference}`);
          } else {
            console.log(`   ⚠️  No fare difference specified`);
          }

          if (fields.downgrade_reason) {
            console.log(`   ✅ Reason: ${fields.downgrade_reason}`);
          } else {
            console.log(`   ⚠️  No downgrade reason provided`);
          }

        } else if (type === 'delay') {
          console.log('\n   📦 Standard Delay (baseline test)');
          console.log('   ℹ️  No additional Phase 2 fields expected');
        }
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log(`Total Records: ${records.length}`);
    console.log('');

    console.log('Records by Type:');
    for (const [type, typeRecords] of Object.entries(byType)) {
      console.log(`  - ${type}: ${typeRecords.length}`);
    }
    console.log('');

    if (allFieldsValid && issues.length === 0) {
      console.log('✅ ALL PHASE 2 FIELDS VERIFIED SUCCESSFULLY!\n');
      console.log('Your Airtable integration is working perfectly. All test records');
      console.log('contain the expected Phase 2 fields with correct data types.\n');
    } else {
      console.log(`⚠️  Found ${issues.length} issues:\n`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }

    // Field type validation
    console.log('='.repeat(80));
    console.log('🔬 FIELD TYPE VALIDATION');
    console.log('='.repeat(80) + '\n');

    const typeValidation = {
      disruption_type: 'string',
      notice_given: 'string',
      alternative_flight_offered: 'boolean',
      alternative_timing: 'string',
      cancellation_reason: 'string',
      denied_boarding_type: 'string',
      denied_boarding_reason: 'string',
      compensation_offered_by_airline: 'boolean',
      passenger_count: 'number',
      booked_class: 'string',
      actual_class: 'string',
      ticket_price: 'number',
      fare_difference: 'number',
      downgrade_reason: 'string',
    };

    let typeIssues = 0;

    for (const [fieldName, expectedType] of Object.entries(typeValidation)) {
      const samplesWithField = records.filter(r => r.fields[fieldName] !== undefined);

      if (samplesWithField.length === 0) {
        continue; // Field not used in any test record
      }

      const sample = samplesWithField[0];
      const actualType = typeof sample.fields[fieldName];

      if (actualType === expectedType) {
        console.log(`✅ ${fieldName}: ${actualType} (correct)`);
      } else {
        console.log(`❌ ${fieldName}: expected ${expectedType}, got ${actualType}`);
        typeIssues++;
      }
    }

    console.log('');

    if (typeIssues === 0) {
      console.log('✅ All field types are correct!\n');
    } else {
      console.log(`⚠️  Found ${typeIssues} field type mismatches\n`);
    }

    // Next steps
    console.log('='.repeat(80));
    console.log('📋 NEXT STEPS');
    console.log('='.repeat(80) + '\n');

    if (allFieldsValid && typeIssues === 0) {
      console.log('✅ Your Airtable integration is fully functional!\n');
      console.log('You can now:');
      console.log('1. Delete test records (filter by "test-" email and bulk delete)');
      console.log('2. Set up views for each disruption type (see AIRTABLE_IMPLEMENTATION_GUIDE.md)');
      console.log('3. Run end-to-end integration tests (see INTEGRATION_TESTING_GUIDE.md)');
      console.log('4. Deploy to production\n');
    } else {
      console.log('⚠️  Please review the issues above and verify your Airtable schema.\n');
      console.log('Common fixes:');
      console.log('- Ensure field names match exactly (snake_case)');
      console.log('- Verify field types (Single select, Checkbox, Number, Text)');
      console.log('- Check that optional fields are correctly configured\n');
    }

    return { records, allFieldsValid, issues, typeIssues };

  } catch (error: any) {
    console.error('\n❌ Error reading from Airtable:', error.message);
    console.error('\nPossible issues:');
    console.error('- Invalid API credentials');
    console.error('- Table name mismatch (expecting "Claims")');
    console.error('- Network connectivity issues\n');
    throw error;
  }
}

// Run verification
verifyAirtableData()
  .then((result) => {
    if (result && result.allFieldsValid && result.typeIssues === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
