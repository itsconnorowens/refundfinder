/**
 * Test script to verify Airtable integration with Phase 2 fields
 * Tests all three new disruption types: cancellation, denied_boarding, downgrade
 */

import { createClaim, ClaimRecord } from '../src/lib/airtable';
import { randomBytes } from 'crypto';

// Generate unique IDs for test records
const generateId = () => randomBytes(8).toString('hex');

// Test data for each disruption type
const testClaims: ClaimRecord[] = [
  // Test 1: Enhanced Cancellation - Short Notice
  {
    claimId: `TEST_CANCEL_${generateId()}`,
    firstName: 'John',
    lastName: 'Smith',
    email: `test-cancel-${generateId()}@flghtly.com`,
    flightNumber: 'BA456',
    airline: 'British Airways',
    departureDate: '2025-03-15',
    departureAirport: 'LHR',
    arrivalAirport: 'CDG',
    delayDuration: '',
    delayReason: '', // Not applicable for cancellations
    status: 'submitted',
    estimatedCompensation: '€250',
    submittedAt: new Date().toISOString(),

    // Disruption type and cancellation-specific fields
    disruptionType: 'cancellation',
    noticeGiven: '< 7 days',
    alternativeOffered: false,
    cancellationReason: 'Aircraft maintenance issue',
  },

  // Test 2: Cancellation with Alternative Flight
  {
    claimId: `TEST_CANCEL_ALT_${generateId()}`,
    firstName: 'Jane',
    lastName: 'Doe',
    email: `test-cancel-alt-${generateId()}@flghtly.com`,
    flightNumber: 'LH400',
    airline: 'Lufthansa',
    departureDate: '2025-03-20',
    departureAirport: 'FRA',
    arrivalAirport: 'JFK',
    delayDuration: '',
    delayReason: '', // Cancellation uses cancellation_reason field
    status: 'submitted',
    estimatedCompensation: '€600',
    submittedAt: new Date().toISOString(),

    // Cancellation with alternative flight
    disruptionType: 'cancellation',
    noticeGiven: '7-14 days',
    alternativeOffered: true,
    alternativeTiming: '4 hours later',
    cancellationReason: 'Crew shortage',
  },

  // Test 3: Denied Boarding - Involuntary EU261
  {
    claimId: `TEST_DB_INVOL_${generateId()}`,
    firstName: 'Michael',
    lastName: 'Johnson',
    email: `test-denied-${generateId()}@flghtly.com`,
    flightNumber: 'BA100',
    airline: 'British Airways',
    departureDate: '2025-03-25',
    departureAirport: 'LHR',
    arrivalAirport: 'JFK',
    delayDuration: '',
    delayReason: '', // Denied boarding uses denied_boarding_reason field
    status: 'submitted',
    estimatedCompensation: '£520',
    submittedAt: new Date().toISOString(),

    // Denied boarding fields
    disruptionType: 'denied_boarding',
    deniedBoardingType: 'involuntary',
    deniedBoardingReason: 'overbooking',
    compensationOfferedByAirline: 200,
    passengerCount: 1,
  },

  // Test 4: Denied Boarding - US DOT
  {
    claimId: `TEST_DB_US_${generateId()}`,
    firstName: 'Sarah',
    lastName: 'Williams',
    email: `test-denied-us-${generateId()}@flghtly.com`,
    flightNumber: 'UA900',
    airline: 'United Airlines',
    departureDate: '2025-03-30',
    departureAirport: 'SFO',
    arrivalAirport: 'LHR',
    delayDuration: '',
    delayReason: '', // Denied boarding uses denied_boarding_reason field
    status: 'submitted',
    estimatedCompensation: '$775',
    submittedAt: new Date().toISOString(),

    // US DOT denied boarding
    disruptionType: 'denied_boarding',
    deniedBoardingType: 'involuntary',
    deniedBoardingReason: 'overbooking',
    compensationOfferedByAirline: 400,
    passengerCount: 2,
    ticketPrice: 1200, // Used for US DOT percentage calculation
  },

  // Test 5: Seat Downgrade - Short Distance EU261
  {
    claimId: `TEST_DOWN_SHORT_${generateId()}`,
    firstName: 'David',
    lastName: 'Brown',
    email: `test-downgrade-short-${generateId()}@flghtly.com`,
    flightNumber: 'AF1234',
    airline: 'Air France',
    departureDate: '2025-04-05',
    departureAirport: 'CDG',
    arrivalAirport: 'BCN',
    delayDuration: '',
    delayReason: '', // Downgrade uses downgrade_reason field
    status: 'submitted',
    estimatedCompensation: '€150',
    submittedAt: new Date().toISOString(),

    // Downgrade fields (30% refund for < 1500km)
    disruptionType: 'downgrade',
    bookedClass: 'business',
    actualClass: 'economy',
    ticketPrice: 500,
    fareDifference: 300,
    downgradeReason: 'Aircraft change - business class unavailable',
  },

  // Test 6: Seat Downgrade - Long Distance UK CAA
  {
    claimId: `TEST_DOWN_LONG_${generateId()}`,
    firstName: 'Emily',
    lastName: 'Davis',
    email: `test-downgrade-long-${generateId()}@flghtly.com`,
    flightNumber: 'BA15',
    airline: 'British Airways',
    departureDate: '2025-04-10',
    departureAirport: 'LHR',
    arrivalAirport: 'SYD',
    delayDuration: '',
    delayReason: '', // Downgrade uses downgrade_reason field
    status: 'submitted',
    estimatedCompensation: '£6000',
    submittedAt: new Date().toISOString(),

    // Downgrade fields (75% refund for > 3500km)
    disruptionType: 'downgrade',
    bookedClass: 'first',
    actualClass: 'business',
    ticketPrice: 8000,
    fareDifference: 6000,
    downgradeReason: 'Operational reasons - first class cabin configuration changed',
  },

  // Test 7: Seat Downgrade - US Flight
  {
    claimId: `TEST_DOWN_US_${generateId()}`,
    firstName: 'Robert',
    lastName: 'Miller',
    email: `test-downgrade-us-${generateId()}@flghtly.com`,
    flightNumber: 'AA100',
    airline: 'American Airlines',
    departureDate: '2025-04-15',
    departureAirport: 'LAX',
    arrivalAirport: 'JFK',
    delayDuration: '',
    delayReason: '', // Downgrade uses downgrade_reason field
    status: 'submitted',
    estimatedCompensation: 'Varies by airline',
    submittedAt: new Date().toISOString(),

    // US downgrade (no specific DOT mandate)
    disruptionType: 'downgrade',
    bookedClass: 'business',
    actualClass: 'economy',
    ticketPrice: 600,
    fareDifference: 400,
    downgradeReason: 'Equipment change',
  },

  // Test 8: Traditional Delay (for comparison)
  {
    claimId: `TEST_DELAY_${generateId()}`,
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: `test-delay-${generateId()}@flghtly.com`,
    flightNumber: 'EZY123',
    airline: 'EasyJet',
    departureDate: '2025-04-20',
    departureAirport: 'LGW',
    arrivalAirport: 'AMS',
    delayDuration: '',
    delayReason: 'Technical issue',
    status: 'submitted',
    estimatedCompensation: '€250',
    submittedAt: new Date().toISOString(),

    // Traditional delay (default disruption type)
    disruptionType: 'delay',
  },
];

/**
 * Main test function
 */
async function testAirtableIntegration() {
  console.log('🚀 Starting Airtable Integration Test\n');
  console.log('Testing Phase 2 field additions:');
  console.log('- Disruption type field');
  console.log('- Cancellation fields (4 new fields)');
  console.log('- Denied boarding fields (5 new fields)');
  console.log('- Downgrade fields (5 new fields)\n');

  const results: { success: boolean; claim: ClaimRecord; recordId?: string; error?: string }[] = [];

  // Test each claim sequentially
  for (const claim of testClaims) {
    const testName = `${claim.disruptionType?.toUpperCase()} - ${claim.firstName} ${claim.lastName}`;

    try {
      console.log(`📝 Creating claim: ${testName}`);
      console.log(`   Flight: ${claim.flightNumber} (${claim.departureAirport} → ${claim.arrivalAirport})`);

      // Show disruption-specific details
      if (claim.disruptionType === 'cancellation') {
        console.log(`   Notice: ${claim.noticeGiven}`);
        console.log(`   Alternative: ${claim.alternativeOffered ? 'Yes' : 'No'}`);
      } else if (claim.disruptionType === 'denied_boarding') {
        console.log(`   Type: ${claim.deniedBoardingType}`);
        console.log(`   Reason: ${claim.deniedBoardingReason}`);
        console.log(`   Airline offered: $${claim.compensationOfferedByAirline}`);
      } else if (claim.disruptionType === 'downgrade') {
        console.log(`   From: ${claim.bookedClass} → To: ${claim.actualClass}`);
        console.log(`   Ticket price: $${claim.ticketPrice}`);
        console.log(`   Refund: ${claim.estimatedCompensation}`);
      }

      const recordId = await createClaim(claim);

      console.log(`   ✅ Success! Record ID: ${recordId}\n`);

      results.push({ success: true, claim, recordId });
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      results.push({ success: false, claim, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log();

  // Breakdown by disruption type
  const byType: Record<string, number> = {};
  successful.forEach(r => {
    const type = r.claim.disruptionType || 'delay';
    byType[type] = (byType[type] || 0) + 1;
  });

  console.log('Successful Claims by Type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
  console.log();

  // List successful record IDs for verification
  if (successful.length > 0) {
    console.log('✅ Successfully Created Records:');
    successful.forEach(r => {
      console.log(`   ${r.recordId} - ${r.claim.disruptionType} - ${r.claim.email}`);
    });
    console.log();
  }

  // List failures with details
  if (failed.length > 0) {
    console.log('❌ Failed Records:');
    failed.forEach(r => {
      console.log(`   ${r.claim.claimId} - ${r.error}`);
    });
    console.log();
  }

  // Next steps
  console.log('='.repeat(60));
  console.log('📋 NEXT STEPS');
  console.log('='.repeat(60) + '\n');

  if (successful.length === results.length) {
    console.log('🎉 All tests passed! Your Airtable integration is working correctly.\n');
    console.log('To verify in Airtable:');
    console.log('1. Log into your Airtable base');
    console.log('2. Open the Claims table');
    console.log('3. Filter by email containing "test-" to see test records');
    console.log('4. Verify all Phase 2 fields are populated correctly:\n');
    console.log('   Cancellation records should show:');
    console.log('   - disruption_type = "cancellation"');
    console.log('   - notice_given = "< 7 days" or "7-14 days"');
    console.log('   - alternative_offered = true/false');
    console.log('   - cancellation_reason\n');
    console.log('   Denied Boarding records should show:');
    console.log('   - disruption_type = "denied_boarding"');
    console.log('   - denied_boarding_type = "involuntary" or "voluntary"');
    console.log('   - denied_boarding_reason');
    console.log('   - compensation_offered_by_airline');
    console.log('   - passenger_count\n');
    console.log('   Downgrade records should show:');
    console.log('   - disruption_type = "downgrade"');
    console.log('   - booked_class');
    console.log('   - actual_class');
    console.log('   - ticket_price');
    console.log('   - fare_difference');
    console.log('   - downgrade_reason\n');
  } else {
    console.log('⚠️  Some tests failed. Common issues:\n');
    console.log('1. Field names mismatch:');
    console.log('   - Verify your Airtable fields use snake_case (e.g., "booked_class")');
    console.log('   - Check for typos in field names\n');
    console.log('2. Field types incorrect:');
    console.log('   - "disruption_type" should be Single select');
    console.log('   - "alternative_offered" should be Checkbox');
    console.log('   - "ticket_price" should be Number or Currency');
    console.log('   - "compensation_offered_by_airline" should be Number or Currency\n');
    console.log('3. Missing required fields:');
    console.log('   - Ensure all core fields exist (user_email, flight_number, etc.)');
    console.log('   - Check if any fields are marked as required in Airtable\n');
    console.log('4. Environment variables:');
    console.log('   - Verify AIRTABLE_API_KEY is set');
    console.log('   - Verify AIRTABLE_BASE_ID is correct\n');
  }

  console.log('To clean up test records after verification:');
  console.log('1. In Airtable, filter by email containing "test-"');
  console.log('2. Select all test records');
  console.log('3. Right-click and delete\n');

  return results;
}

// Run the test
testAirtableIntegration()
  .then((results) => {
    const exitCode = results.every(r => r.success) ? 0 : 1;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error running test:', error);
    process.exit(1);
  });
