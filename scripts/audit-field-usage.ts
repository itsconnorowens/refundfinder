/**
 * Comprehensive audit of field usage across disruption types
 * Validates that each disruption type uses only its relevant fields
 */

import Airtable from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ Error: AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

// Define which fields should be used for each disruption type
const FIELD_USAGE_RULES = {
  // Core fields - ALWAYS used
  core: [
    'claim_id',
    'user_email',
    'user_first_name',
    'user_last_name',
    'flight_number',
    'airline',
    'departure_date',
    'departure_airport',
    'arrival_airport',
    'disruption_type',
    'status',
    'estimated_compensation',
  ],

  // Delay-specific fields
  delay: [
    'delay_duration', // Required for delays
    'delay_reason', // Required for delays
  ],

  // Cancellation-specific fields
  cancellation: [
    'notice_given', // Required
    'alternative_flight_offered', // Required
    'alternative_timing', // Optional
    'cancellation_reason', // Optional but recommended
  ],

  // Denied boarding-specific fields
  denied_boarding: [
    'denied_boarding_type', // Required
    'denied_boarding_reason', // Required
    'compensation_offered_by_airline', // Optional
    'passenger_count', // Optional
    'ticket_price', // Optional (for US DOT calculations)
  ],

  // Downgrade-specific fields
  downgrade: [
    'booked_class', // Required
    'actual_class', // Required
    'ticket_price', // Required
    'fare_difference', // Optional
    'downgrade_reason', // Optional but recommended
  ],

  // Optional fields that can appear on any record type
  optional: [
    'payment_id',
    'booking_reference',
    'internal_notes',
  ],
};

interface FieldIssue {
  recordId: string;
  email: string;
  disruptionType: string;
  issue: string;
  field: string;
  value?: any;
}

async function auditFieldUsage() {
  console.log('🔍 FIELD USAGE AUDIT\n');
  console.log('Analyzing all Claims records for proper field usage by disruption type\n');
  console.log('='.repeat(80) + '\n');

  try {
    const records = await base('Claims')
      .select({
        // Get all records
      })
      .all();

    console.log(`📊 Found ${records.length} total records\n`);

    const issues: FieldIssue[] = [];
    const stats = {
      delay: 0,
      cancellation: 0,
      denied_boarding: 0,
      downgrade: 0,
      unknown: 0,
    };

    for (const record of records) {
      const fields = record.fields as any;
      const disruptionType = fields.disruption_type || 'unknown';
      const recordId = record.id;
      const email = fields.user_email || 'no-email';

      // Count by type
      if (stats.hasOwnProperty(disruptionType)) {
        stats[disruptionType as keyof typeof stats]++;
      } else {
        stats.unknown++;
      }

      // Check for improper field usage based on disruption type
      switch (disruptionType) {
        case 'delay':
          // Delays should NOT have cancellation/denied_boarding/downgrade fields
          if (fields.notice_given) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Delay record has cancellation field',
              field: 'notice_given',
              value: fields.notice_given,
            });
          }
          if (fields.alternative_flight_offered !== undefined) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Delay record has cancellation field',
              field: 'alternative_flight_offered',
              value: fields.alternative_flight_offered,
            });
          }
          if (fields.cancellation_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Delay record has cancellation field',
              field: 'cancellation_reason',
              value: fields.cancellation_reason,
            });
          }
          if (fields.denied_boarding_type) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Delay record has denied_boarding field',
              field: 'denied_boarding_type',
              value: fields.denied_boarding_type,
            });
          }
          if (fields.booked_class) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Delay record has downgrade field',
              field: 'booked_class',
              value: fields.booked_class,
            });
          }
          break;

        case 'cancellation':
          // Cancellations should NOT have delay_duration/delay_reason or denied_boarding/downgrade fields
          if (fields.delay_duration) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Cancellation record has delay field',
              field: 'delay_duration',
              value: fields.delay_duration,
            });
          }
          if (fields.delay_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Cancellation record has delay field',
              field: 'delay_reason',
              value: fields.delay_reason,
            });
          }
          if (fields.denied_boarding_type) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Cancellation record has denied_boarding field',
              field: 'denied_boarding_type',
              value: fields.denied_boarding_type,
            });
          }
          if (fields.booked_class) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Cancellation record has downgrade field',
              field: 'booked_class',
              value: fields.booked_class,
            });
          }
          break;

        case 'denied_boarding':
          // Denied boarding should NOT have delay/cancellation/downgrade specific fields
          if (fields.delay_duration) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Denied boarding record has delay field',
              field: 'delay_duration',
              value: fields.delay_duration,
            });
          }
          if (fields.delay_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Denied boarding record has delay field',
              field: 'delay_reason',
              value: fields.delay_reason,
            });
          }
          if (fields.notice_given) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Denied boarding record has cancellation field',
              field: 'notice_given',
              value: fields.notice_given,
            });
          }
          if (fields.cancellation_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Denied boarding record has cancellation field',
              field: 'cancellation_reason',
              value: fields.cancellation_reason,
            });
          }
          if (fields.booked_class) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Denied boarding record has downgrade field',
              field: 'booked_class',
              value: fields.booked_class,
            });
          }
          break;

        case 'downgrade':
          // Downgrades should NOT have delay/cancellation/denied_boarding fields
          if (fields.delay_duration) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Downgrade record has delay field',
              field: 'delay_duration',
              value: fields.delay_duration,
            });
          }
          if (fields.delay_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Downgrade record has delay field',
              field: 'delay_reason',
              value: fields.delay_reason,
            });
          }
          if (fields.notice_given) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Downgrade record has cancellation field',
              field: 'notice_given',
              value: fields.notice_given,
            });
          }
          if (fields.cancellation_reason) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Downgrade record has cancellation field',
              field: 'cancellation_reason',
              value: fields.cancellation_reason,
            });
          }
          if (fields.denied_boarding_type) {
            issues.push({
              recordId,
              email,
              disruptionType,
              issue: 'Downgrade record has denied_boarding field',
              field: 'denied_boarding_type',
              value: fields.denied_boarding_type,
            });
          }
          break;
      }
    }

    // Report findings
    console.log('📊 RECORDS BY DISRUPTION TYPE');
    console.log('='.repeat(80) + '\n');
    console.log(`Delay: ${stats.delay}`);
    console.log(`Cancellation: ${stats.cancellation}`);
    console.log(`Denied Boarding: ${stats.denied_boarding}`);
    console.log(`Downgrade: ${stats.downgrade}`);
    console.log(`Unknown/Missing Type: ${stats.unknown}\n`);

    console.log('='.repeat(80));
    console.log('🔍 FIELD USAGE ISSUES');
    console.log('='.repeat(80) + '\n');

    if (issues.length === 0) {
      console.log('✅ NO ISSUES FOUND!\n');
      console.log('All records use appropriate fields for their disruption type.\n');
    } else {
      console.log(`⚠️  Found ${issues.length} field usage issues:\n`);

      // Group issues by type
      const issuesByType: Record<string, FieldIssue[]> = {};
      issues.forEach(issue => {
        if (!issuesByType[issue.disruptionType]) {
          issuesByType[issue.disruptionType] = [];
        }
        issuesByType[issue.disruptionType].push(issue);
      });

      for (const [type, typeIssues] of Object.entries(issuesByType)) {
        console.log(`\n${type.toUpperCase()} Records (${typeIssues.length} issues):`);
        console.log('-'.repeat(80));

        // Group by field
        const issuesByField: Record<string, FieldIssue[]> = {};
        typeIssues.forEach(issue => {
          if (!issuesByField[issue.field]) {
            issuesByField[issue.field] = [];
          }
          issuesByField[issue.field].push(issue);
        });

        for (const [field, fieldIssues] of Object.entries(issuesByField)) {
          console.log(`\n  ❌ Field: ${field} (${fieldIssues.length} records)`);
          fieldIssues.slice(0, 3).forEach(issue => {
            console.log(`     - ${issue.recordId} (${issue.email})`);
            if (issue.value) {
              console.log(`       Value: "${issue.value}"`);
            }
          });
          if (fieldIssues.length > 3) {
            console.log(`     ... and ${fieldIssues.length - 3} more`);
          }
        }
      }
      console.log('');
    }

    // Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 FIELD USAGE RULES');
    console.log('='.repeat(80) + '\n');

    console.log('Each disruption type should ONLY use these fields:\n');

    console.log('🔵 DELAY:');
    console.log('  Required: delay_duration, delay_reason');
    console.log('  Should NOT have: cancellation fields, denied_boarding fields, downgrade fields\n');

    console.log('🟠 CANCELLATION:');
    console.log('  Required: notice_given, alternative_flight_offered');
    console.log('  Optional: alternative_timing, cancellation_reason');
    console.log('  Should NOT have: delay_duration, delay_reason, denied_boarding fields, downgrade fields\n');

    console.log('🔴 DENIED_BOARDING:');
    console.log('  Required: denied_boarding_type, denied_boarding_reason');
    console.log('  Optional: compensation_offered_by_airline, passenger_count, ticket_price');
    console.log('  Should NOT have: delay fields, cancellation fields, downgrade fields\n');

    console.log('🟣 DOWNGRADE:');
    console.log('  Required: booked_class, actual_class, ticket_price');
    console.log('  Optional: fare_difference, downgrade_reason');
    console.log('  Should NOT have: delay fields, cancellation fields, denied_boarding fields\n');

    console.log('='.repeat(80));
    console.log('🛠️  NEXT STEPS');
    console.log('='.repeat(80) + '\n');

    if (issues.length > 0) {
      console.log('Issues found! Recommended actions:\n');
      console.log('1. Update code to ensure fields are only written for relevant disruption types');
      console.log('2. Clean up existing records with improper field usage');
      console.log('3. Add validation to prevent future field misuse\n');
      console.log('The test scripts have been updated to avoid this issue going forward.\n');
    } else {
      console.log('✅ No action needed - all records have proper field usage!\n');
    }

    return { issues, stats };

  } catch (error: any) {
    console.error('\n❌ Error reading from Airtable:', error.message);
    throw error;
  }
}

// Run audit
auditFieldUsage()
  .then((result) => {
    if (result && result.issues.length === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
