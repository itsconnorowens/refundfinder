/**
 * Quick test to verify Payments and Refunds table integration
 * Tests that payment records link correctly to claims
 */

import { createClaim, createPayment, getClaimByClaimId, getPaymentByPaymentId, ClaimRecord, PaymentRecord } from '../src/lib/airtable';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

async function testPaymentsIntegration() {
  console.log('🧪 Testing Payments & Refunds Table Integration\n');
  console.log('This test verifies that payment records link correctly to claims');
  console.log('across all disruption types.\n');

  const testScenarios = [
    {
      name: 'Cancellation Claim + Payment',
      claim: {
        claimId: `TEST_PAY_CANCEL_${generateId()}`,
        firstName: 'John',
        lastName: 'Payment',
        email: `test-payment-cancel-${generateId()}@flghtly.com`,
        flightNumber: 'BA100',
        airline: 'British Airways',
        departureDate: '2025-04-01',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        delayDuration: '',
        delayReason: 'Flight cancelled',
        status: 'submitted' as const,
        estimatedCompensation: '€600',
        submittedAt: new Date().toISOString(),
        disruptionType: 'cancellation' as const,
        noticeGiven: '< 7 days',
        alternativeOffered: false,
        cancellationReason: 'Technical issue',
      },
      payment: {
        paymentId: `PAY_CANCEL_${generateId()}`,
        stripePaymentIntentId: `pi_test_cancel_${generateId()}`,
        amount: 4900, // $49.00
        currency: 'usd',
        status: 'succeeded' as const,
        email: '', // Will be set from claim
        createdAt: new Date().toISOString(),
      },
    },
    {
      name: 'Denied Boarding Claim + Payment',
      claim: {
        claimId: `TEST_PAY_DB_${generateId()}`,
        firstName: 'Jane',
        lastName: 'Payment',
        email: `test-payment-db-${generateId()}@flghtly.com`,
        flightNumber: 'UA900',
        airline: 'United Airlines',
        departureDate: '2025-04-05',
        departureAirport: 'SFO',
        arrivalAirport: 'LHR',
        delayDuration: '',
        delayReason: 'Denied boarding',
        status: 'submitted' as const,
        estimatedCompensation: '$775',
        submittedAt: new Date().toISOString(),
        disruptionType: 'denied_boarding' as const,
        deniedBoardingType: 'involuntary' as const,
        deniedBoardingReason: 'overbooking',
        compensationOfferedByAirline: 400,
        passengerCount: 1,
      },
      payment: {
        paymentId: `PAY_DB_${generateId()}`,
        stripePaymentIntentId: `pi_test_db_${generateId()}`,
        amount: 4900,
        currency: 'usd',
        status: 'succeeded' as const,
        email: '',
        createdAt: new Date().toISOString(),
      },
    },
    {
      name: 'Downgrade Claim + Payment',
      claim: {
        claimId: `TEST_PAY_DOWN_${generateId()}`,
        firstName: 'Mike',
        lastName: 'Payment',
        email: `test-payment-down-${generateId()}@flghtly.com`,
        flightNumber: 'AF1234',
        airline: 'Air France',
        departureDate: '2025-04-10',
        departureAirport: 'CDG',
        arrivalAirport: 'BCN',
        delayDuration: '',
        delayReason: 'Seat downgrade',
        status: 'submitted' as const,
        estimatedCompensation: '€150',
        submittedAt: new Date().toISOString(),
        disruptionType: 'downgrade' as const,
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: 500,
        fareDifference: 300,
        downgradeReason: 'Aircraft change',
      },
      payment: {
        paymentId: `PAY_DOWN_${generateId()}`,
        stripePaymentIntentId: `pi_test_down_${generateId()}`,
        amount: 4900,
        currency: 'usd',
        status: 'succeeded' as const,
        email: '',
        createdAt: new Date().toISOString(),
      },
    },
  ];

  const results: Array<{
    scenario: string;
    success: boolean;
    claimId?: string;
    paymentId?: string;
    error?: string;
    verified?: boolean;
  }> = [];

  console.log('='.repeat(80));
  console.log('🚀 RUNNING TESTS');
  console.log('='.repeat(80) + '\n');

  for (const scenario of testScenarios) {
    console.log(`📝 Testing: ${scenario.name}`);
    console.log(`   Flight: ${scenario.claim.flightNumber} (${scenario.claim.departureAirport} → ${scenario.claim.arrivalAirport})`);
    console.log(`   Type: ${scenario.claim.disruptionType}`);

    try {
      // Step 1: Create claim
      console.log('   [1/4] Creating claim...');
      const claimRecordId = await createClaim(scenario.claim as ClaimRecord);
      console.log(`   ✅ Claim created: ${claimRecordId}`);

      // Step 2: Create payment linked to claim
      console.log('   [2/4] Creating payment...');
      const paymentData: PaymentRecord = {
        ...scenario.payment,
        email: scenario.claim.email,
        claimId: scenario.claim.claimId, // Link to claim
      };
      const paymentRecordId = await createPayment(paymentData);
      console.log(`   ✅ Payment created: ${paymentRecordId}`);

      // Step 3: Verify claim can be retrieved
      console.log('   [3/4] Verifying claim retrieval...');
      const retrievedClaim = await getClaimByClaimId(scenario.claim.claimId);
      if (!retrievedClaim) {
        throw new Error('Claim not found after creation');
      }
      console.log(`   ✅ Claim retrieved successfully`);

      // Step 4: Verify payment can be retrieved
      console.log('   [4/4] Verifying payment retrieval...');
      const retrievedPayment = await getPaymentByPaymentId(scenario.payment.paymentId);
      if (!retrievedPayment) {
        throw new Error('Payment not found after creation');
      }

      // Verify the link between claim and payment
      const paymentClaimId = retrievedPayment.fields.claim_id;
      if (paymentClaimId !== scenario.claim.claimId) {
        throw new Error(`Payment claim_id mismatch: expected ${scenario.claim.claimId}, got ${paymentClaimId}`);
      }

      console.log(`   ✅ Payment retrieved and linked correctly`);
      console.log(`   ✅ Link verified: Payment → Claim\n`);

      results.push({
        scenario: scenario.name,
        success: true,
        claimId: claimRecordId,
        paymentId: paymentRecordId,
        verified: true,
      });

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('');

  if (successful.length > 0) {
    console.log('✅ Successfully Created & Linked:');
    successful.forEach(r => {
      console.log(`   ${r.scenario}`);
      console.log(`      - Claim: ${r.claimId}`);
      console.log(`      - Payment: ${r.paymentId}`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed Tests:');
    failed.forEach(r => {
      console.log(`   ${r.scenario}: ${r.error}`);
    });
    console.log('');
  }

  // Verification details
  console.log('='.repeat(80));
  console.log('✅ VERIFIED');
  console.log('='.repeat(80) + '\n');

  if (successful.length === results.length) {
    console.log('🎉 All tests passed! Payment integration is working correctly.\n');
    console.log('What was verified:');
    console.log('  1. Claims can be created for all disruption types');
    console.log('  2. Payment records can be created');
    console.log('  3. Payments link correctly to claims via claim_id');
    console.log('  4. Both claims and payments can be retrieved');
    console.log('  5. The relationship between claims and payments is intact\n');

    console.log('Next steps:');
    console.log('  1. Verify records in Airtable (filter by "test-payment-")');
    console.log('  2. Check that Claims and Payments tables show linked records');
    console.log('  3. Clean up test data when done');
    console.log('  4. Proceed with end-to-end testing (INTEGRATION_TESTING_GUIDE.md)\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    console.log('Common issues:');
    console.log('  - Payments table not created in Airtable');
    console.log('  - Field name mismatches in Payments table');
    console.log('  - Missing required fields\n');
  }

  // Note about Refunds table
  console.log('='.repeat(80));
  console.log('ℹ️  NOTE: REFUNDS TABLE');
  console.log('='.repeat(80) + '\n');
  console.log('The Refunds table was not tested because it requires:');
  console.log('  - An actual payment to exist');
  console.log('  - A claim to be rejected or require refund');
  console.log('  - Stripe refund processing\n');
  console.log('Refunds are tested as part of the full claim lifecycle in');
  console.log('the integration testing guide.\n');

  return results;
}

// Run the test
testPaymentsIntegration()
  .then((results) => {
    const exitCode = results.every(r => r.success) ? 0 : 1;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error running test:', error);
    process.exit(1);
  });
