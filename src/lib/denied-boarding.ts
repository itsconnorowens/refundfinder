/**
 * Denied Boarding Eligibility Module
 * Implements compensation logic for EU261 Article 4, UK CAA, and US DOT 14 CFR Part 250
 */

import { calculateFlightDistanceCached } from './distance-calculator';
import type { FlightDetails, EligibilityResult } from './eligibility';

/**
 * Check denied boarding eligibility based on regulations
 * Handles both voluntary and involuntary denied boarding
 */
export async function checkDeniedBoardingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Voluntary denied boarding is not eligible for mandatory compensation
  if (flight.deniedBoardingType === 'voluntary') {
    return {
      eligible: false,
      amount: flight.compensationOffered ? `$${flight.compensationOffered}` : '$0',
      confidence: 95,
      message: 'Voluntary denied boarding - compensation is at airline discretion',
      regulation: 'Voluntary',
      reason: 'Passenger voluntarily gave up seat',
    };
  }

  // Check if it's a UK flight (UK CAA regulations apply)
  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAADeniedBoardingEligibility(flight);
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261DeniedBoardingEligibility(flight);
  }

  // Check if it's a US flight (DOT regulations)
  const isUSFlightResult = isUSFlight(flight);
  if (isUSFlightResult) {
    return await checkDOTDeniedBoardingEligibility(flight);
  }

  // Not covered by major regulations
  return {
    eligible: false,
    amount: '€0',
    confidence: 80,
    message:
      'This flight may not be covered by major compensation regulations. We provide assistance services only and cannot guarantee eligibility.',
    regulation: 'Unknown',
    reason: 'Route not covered by EU261, UK CAA, or US DOT',
  };
}

/**
 * Check UK CAA denied boarding eligibility (follows EU261 Article 4)
 */
async function checkUKCAADeniedBoardingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // UK CAA follows same rules as EU261 for denied boarding
  return await checkEU261DeniedBoardingEligibility(flight, 'UK CAA', '£');
}

/**
 * Check EU261 denied boarding eligibility (Article 4)
 * Compensation is reduced if alternative flight arrives within certain timeframes
 */
async function checkEU261DeniedBoardingEligibility(
  flight: FlightDetails,
  regulationName: string = 'EU261',
  currency: string = '€'
): Promise<EligibilityResult> {
  // Calculate base compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;

  let baseAmount = 0;
  let distanceCategory = '';

  // EU261 Article 4 compensation tiers
  if (distance <= 1500) {
    baseAmount = currency === '£' ? 250 : 250;
    distanceCategory = 'short haul (≤1500km)';
  } else if (distance <= 3500) {
    baseAmount = currency === '£' ? 400 : 400;
    distanceCategory = 'medium haul (1500-3500km)';
  } else {
    baseAmount = currency === '£' ? 520 : 600;
    distanceCategory = 'long haul (>3500km)';
  }

  // Check if alternative flight was offered and calculate arrival delay
  let finalAmount = baseAmount;
  let reductionApplied = false;
  let arrivalDelayHours = 0;

  if (flight.alternativeOffered && flight.alternativeArrivalDelay) {
    arrivalDelayHours = parseAlternativeTiming(flight.alternativeArrivalDelay);

    // Apply compensation reductions based on arrival delay
    // Short haul: 50% if arrival within 2 hours
    if (distance <= 1500) {
      if (arrivalDelayHours < 2) {
        finalAmount = Math.round(baseAmount * 0.5);
        reductionApplied = true;
      }
    }
    // Medium haul: 50% if arrival within 3 hours
    else if (distance <= 3500) {
      if (arrivalDelayHours < 3) {
        finalAmount = Math.round(baseAmount * 0.5);
        reductionApplied = true;
      }
    }
    // Long haul: 50% if arrival within 4 hours
    else {
      if (arrivalDelayHours < 4) {
        finalAmount = Math.round(baseAmount * 0.5);
        reductionApplied = true;
      }
    }
  }

  const amountString = `${currency}${finalAmount}`;
  const reductionMessage = reductionApplied
    ? ` (50% reduction applied due to alternative flight arriving within ${arrivalDelayHours} hours)`
    : '';

  return {
    eligible: true,
    amount: amountString,
    confidence: 90,
    message: `You're entitled to ${amountString} compensation under ${regulationName} for involuntary denied boarding${reductionMessage}`,
    regulation: regulationName,
    reason: `Involuntary denied boarding, ${distanceCategory}, distance ${distance}km`,
  };
}

/**
 * Check US DOT denied boarding eligibility (14 CFR Part 250)
 * Uses percentage-based calculation with caps
 */
async function checkDOTDeniedBoardingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // US DOT requires ticket price for compensation calculation
  if (!flight.ticketPrice || flight.ticketPrice <= 0) {
    return {
      eligible: false,
      amount: '$0',
      confidence: 50,
      message:
        'US DOT denied boarding compensation requires ticket price information. Please provide the original ticket price.',
      regulation: 'US DOT 14 CFR Part 250',
      reason: 'Missing ticket price for percentage calculation',
    };
  }

  // Check if alternative flight was offered and calculate arrival delay
  let arrivalDelayHours = 0;
  if (flight.alternativeOffered && flight.alternativeArrivalDelay) {
    arrivalDelayHours = parseAlternativeTiming(flight.alternativeArrivalDelay);
  }

  let compensationAmount = 0;
  let percentage = 0;
  let cap = 0;
  let reason = '';

  // US DOT compensation rules:
  // - 0-1 hour delay: No compensation required
  // - 1-2 hours domestic (1-4 hours international): 200% of one-way fare, max $775
  // - 2+ hours domestic (4+ hours international): 400% of one-way fare, max $1,550

  // Determine if international flight
  const isInternational = !isUSFlight(flight) ||
    !(isUSAirport(flight.departureAirport) && isUSAirport(flight.arrivalAirport));

  if (arrivalDelayHours < 1) {
    // No compensation for delays under 1 hour
    return {
      eligible: false,
      amount: '$0',
      confidence: 95,
      message:
        'Alternative flight arrived within 1 hour - no compensation required under US DOT regulations',
      regulation: 'US DOT 14 CFR Part 250',
      reason: `Alternative arrival delay under 1 hour (${arrivalDelayHours.toFixed(1)} hours)`,
    };
  } else if (
    (arrivalDelayHours < 2 && !isInternational) ||
    (arrivalDelayHours < 4 && isInternational)
  ) {
    // 200% compensation with $775 cap
    percentage = 200;
    cap = 775;
    compensationAmount = Math.min(flight.ticketPrice * 2, cap);
    reason = `Alternative arrival delay ${arrivalDelayHours.toFixed(1)} hours - 200% compensation`;
  } else {
    // 400% compensation with $1,550 cap
    percentage = 400;
    cap = 1550;
    compensationAmount = Math.min(flight.ticketPrice * 4, cap);
    reason = `Alternative arrival delay ${arrivalDelayHours.toFixed(1)} hours - 400% compensation`;
  }

  const amountString = `$${Math.round(compensationAmount)}`;
  const calculationDetails =
    compensationAmount >= cap
      ? ` (capped at $${cap})`
      : ` (${percentage}% of $${flight.ticketPrice} ticket price)`;

  return {
    eligible: true,
    amount: amountString,
    confidence: 95,
    message: `You're entitled to ${amountString} compensation under US DOT regulations for involuntary denied boarding${calculationDetails}`,
    regulation: 'US DOT 14 CFR Part 250',
    reason,
  };
}

/**
 * Parse alternative flight timing from string
 */
function parseAlternativeTiming(timing: string): number {
  // Handle formats like "1 hour later", "2 hours later", "30 minutes later"
  const lowerTiming = timing.toLowerCase();

  const hoursMatch = lowerTiming.match(/(\d+(?:\.\d+)?)\s*hours?/);
  const minutesMatch = lowerTiming.match(/(\d+(?:\.\d+)?)\s*minutes?/);

  let totalHours = 0;

  if (hoursMatch) {
    totalHours += parseFloat(hoursMatch[1]);
  }

  if (minutesMatch) {
    totalHours += parseFloat(minutesMatch[1]) / 60;
  }

  return totalHours;
}

/**
 * Helper function to check if an airport is a US airport
 */
function isUSAirport(airportCode: string): boolean {
  const usAirports = [
    'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'MIA', 'ATL',
    'BOS', 'PHX', 'IAH', 'MCO', 'DTW', 'MSP', 'PHL', 'LGA', 'EWR', 'CLT',
    'BWI', 'SAN', 'TPA', 'PDX', 'STL', 'HNL',
  ];
  return usAirports.includes(airportCode.toUpperCase());
}

/**
 * Check if flight is covered by UK CAA regulations
 */
function isUKCoveredFlight(flight: FlightDetails): boolean {
  const ukAirlines = [
    'British Airways',
    'EasyJet',
    'Ryanair',
    'Virgin Atlantic',
    'Jet2',
    'TUI Airways',
    'Wizz Air',
    'Flybe',
    'Loganair',
    'Eastern Airways',
  ];

  const ukAirports = [
    'LHR', 'LGW', 'STN', 'LTN', 'LBA', 'MAN', 'BHX', 'BRS',
    'NCL', 'EDI', 'GLA', 'BFS', 'DUB',
  ];

  const isUKAirline = ukAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  const isFromUK = ukAirports.includes(flight.departureAirport.toUpperCase());
  const isToUK = ukAirports.includes(flight.arrivalAirport.toUpperCase());

  return isUKAirline || isFromUK || isToUK;
}

/**
 * Check if flight is covered by EU261
 */
function isEUCoveredFlight(flight: FlightDetails): boolean {
  const euAirlines = [
    'Lufthansa',
    'British Airways',
    'Air France',
    'KLM',
    'Ryanair',
    'EasyJet',
    'Iberia',
    'Alitalia',
    'SAS',
    'Swiss',
    'Austrian',
    'TAP Air Portugal',
    'Finnair',
    'Aegean',
    'LOT Polish',
  ];

  const euAirports = [
    'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO', 'BCN', 'MUC',
    'ZUR', 'VIE', 'CPH', 'ARN', 'OSL', 'HEL', 'ATH', 'WAW',
    'LIS', 'BRU',
  ];

  const isEUAirline = euAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  const isFromEU = euAirports.includes(flight.departureAirport.toUpperCase());
  const isToEU = euAirports.includes(flight.arrivalAirport.toUpperCase());

  return isEUAirline || isFromEU || isToEU;
}

/**
 * Check if flight is a US domestic or international flight
 */
function isUSFlight(flight: FlightDetails): boolean {
  const usAirlines = [
    'American Airlines',
    'Delta',
    'United',
    'Southwest',
    'JetBlue',
    'Alaska Airlines',
    'Spirit',
    'Frontier',
    'Hawaiian',
  ];

  const usAirports = [
    'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS',
    'MIA', 'ATL', 'BOS', 'PHX', 'IAH', 'MCO', 'DTW', 'MSP',
    'PHL', 'LGA',
  ];

  const isUSAirline = usAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  const isFromUS = usAirports.includes(flight.departureAirport.toUpperCase());
  const isToUS = usAirports.includes(flight.arrivalAirport.toUpperCase());

  return isUSAirline || isFromUS || isToUS;
}
