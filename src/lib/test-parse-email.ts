/**
 * Test script for the parseFlightEmail function
 * Run this from a Next.js API route or server action to test the Claude integration
 */

import { parseFlightEmail } from './parse-flight-email';

export const testEmailSamples = {
  united: `
    Dear Passenger,

    Your flight booking has been confirmed!

    Flight Details:
    - Flight Number: UA1234
    - Airline: United Airlines
    - Date: March 15, 2024
    - Route: San Francisco (SFO) to New York (JFK)
    - Departure Time: 8:00 AM PST
    - Arrival Time: 4:30 PM EST

    Thank you for choosing United Airlines.
  `,
  delta: `
    DELTA AIRLINES E-TICKET CONFIRMATION

    Booking Reference: ABC123XYZ
    
    Flight Information:
    DL5678 - Delta Air Lines
    
    Monday, April 20, 2024
    Atlanta (ATL) → Los Angeles (LAX)
    
    Departs: 11:15 AM EDT
    Arrives: 2:45 PM PDT
    
    Please arrive at least 2 hours before departure.
  `,
  american: `
    American Airlines - Itinerary Confirmation

    FLIGHT DETAILS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    AA987
    Operated by: American Airlines
    
    Travel Date: May 10, 2024
    
    Chicago O'Hare (ORD) → Miami (MIA)
    
    Scheduled Departure: 3:30 PM CDT
    Scheduled Arrival: 8:00 PM EDT
    
    Confirmation Code: ABCD12
  `,
};

/**
 * Run tests with sample emails
 */
export async function runParseTests() {
  console.log('🧪 Testing Claude Flight Email Parser\n');
  console.log('═'.repeat(60));

  const results: Record<string, any> = {};

  for (const [airline, email] of Object.entries(testEmailSamples)) {
    console.log(`\n📧 Testing ${airline.toUpperCase()} email...`);
    console.log('─'.repeat(60));

    const startTime = Date.now();
    const result = await parseFlightEmail(email);
    const duration = Date.now() - startTime;

    results[airline] = {
      success: !!result,
      data: result,
      duration,
    };

    if (result) {
      console.log('✅ SUCCESS');
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log('\nParsed Data:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ FAILED - Could not parse email');
      console.log(`⏱️  Duration: ${duration}ms`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY\n');

  const successCount = Object.values(results).filter((r) => r.success).length;
  const totalCount = Object.keys(results).length;
  const avgDuration =
    Object.values(results).reduce((sum, r) => sum + r.duration, 0) / totalCount;

  console.log(
    `Success Rate: ${successCount}/${totalCount} (${Math.round((successCount / totalCount) * 100)}%)`
  );
  console.log(`Average Duration: ${Math.round(avgDuration)}ms`);
  console.log('═'.repeat(60));

  return results;
}

/**
 * Test with a custom email string
 */
export async function testCustomEmail(emailText: string) {
  console.log('🧪 Testing custom email\n');
  console.log('═'.repeat(60));
  console.log('Email content:');
  console.log(emailText.substring(0, 200) + '...\n');
  console.log('─'.repeat(60));

  const startTime = Date.now();
  const result = await parseFlightEmail(emailText);
  const duration = Date.now() - startTime;

  if (result) {
    console.log('✅ SUCCESS');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('\nParsed Data:');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('❌ FAILED - Could not parse email');
    console.log(`⏱️  Duration: ${duration}ms`);
  }

  console.log('═'.repeat(60));

  return result;
}
