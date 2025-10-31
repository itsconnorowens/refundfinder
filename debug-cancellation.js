/**
 * Debug script to investigate cancellation service
 */

import { scenarioService } from './src/lib/scenario-detector.ts';

const emailContent = `
  Dear Mr. Smith,

  We regret to inform you that your flight BA123 from London Heathrow to New York JFK
  scheduled for January 15, 2024 at 10:00 AM has been cancelled due to operational reasons.

  We have automatically rebooked you on flight BA456 departing at 2:00 PM on the same day.
  This alternative flight will arrive at 10:00 PM, providing a 4-hour delay.

  We apologize for the inconvenience and any disruption to your travel plans.

  Best regards,
  British Airways Customer Service
`;

const flightData = {
  flightNumber: 'BA123',
  airline: 'British Airways',
  departureAirport: 'LHR',
  arrivalAirport: 'JFK',
  scheduledDeparture: '2024-01-15T10:00:00Z',
  scheduledArrival: '2024-01-15T18:00:00Z',
  delayMinutes: 0,
  isCancelled: true,
  cancellationReason: 'Operational reasons',
  status: 'cancelled',
  source: 'aviationstack',
  confidence: 0.9,
};

async function debug() {
  console.log('Testing cancellation scenario...\n');

  const result = await scenarioService.processEmailContent(
    emailContent,
    flightData,
    'EU261'
  );

  console.log('=== SCENARIO RESULT ===');
  console.log('Scenarios detected:', Object.keys(result.scenarioResult.scenarios));
  console.log('\nCancellation data:', JSON.stringify(result.scenarioResult.scenarios.cancellation, null, 2));

  console.log('\n=== COMPENSATION RESULT ===');
  console.log('Total compensation:', result.compensationResult.totalCompensation);
  console.log('Currency:', result.compensationResult.currency);
  console.log('Regulation:', result.compensationResult.regulation);
  console.log('\nCompensation breakdown:', JSON.stringify(result.compensationResult.compensation, null, 2));

  console.log('\n=== ANALYSIS ===');
  console.log('Eligible:', result.analysis.compensationEligible);
  console.log('Recommended action:', result.analysis.recommendedAction);
}

debug().catch(console.error);
