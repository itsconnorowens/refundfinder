import { calculateFlightDistanceCached } from './distance-calculator';
import { getAirlineRegulations, normalizeAirlineName } from './airlines';
import { analyzeExtraordinaryCircumstances } from './extraordinary-circumstances';

import { getDistanceBetweenAirports } from './airports';

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;
  // New fields for cancellation support
  disruptionType?: 'delay' | 'cancellation';
  noticeGiven?: string; // "< 7 days", "7-14 days", "> 14 days"
  alternativeOffered?: boolean;
  alternativeTiming?: string; // departure time difference
}

export interface EligibilityResult {
  eligible: boolean;
  amount: string;
  confidence: number;
  message: string;
  regulation: string;
  reason?: string;
}

/**
 * Check if a flight is eligible for compensation
 */
export async function checkEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  const disruptionType = flight.disruptionType || 'delay';

  // Handle cancellations differently
  if (disruptionType === 'cancellation') {
    return await checkCancellationEligibility(flight);
  }

  // Handle delays (existing logic)
  const delayHours = parseDelayHours(flight.delayDuration);

  // Basic validation for delays
  if (delayHours < 3) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 100,
      message: 'Delay must be at least 3 hours to qualify for compensation',
      regulation: 'EU261/UK CAA/US DOT',
      reason: 'Insufficient delay duration',
    };
  }

  // Check if it's a UK flight (UK CAA regulations apply)
  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAAEligibility(flight, delayHours);
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261Eligibility(flight, delayHours);
  }

  // Check if it's a US flight (DOT regulations)
  const isUSFlightResult = isUSFlight(flight);
  if (isUSFlightResult) {
    return await checkDOTEligibility(flight, delayHours);
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
 * Check cancellation eligibility based on regulations
 */
async function checkCancellationEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Check if it's a UK flight (UK CAA regulations apply)
  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAACancellationEligibility(flight);
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261CancellationEligibility(flight);
  }

  // Check if it's a US flight (DOT regulations)
  const isUSFlightResult = isUSFlight(flight);
  if (isUSFlightResult) {
    return await checkDOTCancellationEligibility(flight);
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
 * Check UK CAA cancellation eligibility
 */
async function checkUKCAACancellationEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Check notice period
  const noticeGiven = flight.noticeGiven;
  if (!noticeGiven || noticeGiven === '> 14 days') {
    return {
      eligible: false,
      amount: '£0',
      confidence: 90,
      message:
        'Cancellation with more than 14 days notice does not qualify for compensation',
      regulation: 'UK CAA',
      reason: 'Insufficient notice period',
    };
  }

  // Check for extraordinary circumstances using enhanced NLP
  const isExtraordinary = await isExtraordinaryCircumstance(
    flight.delayReason,
    {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      delayDuration: flight.delayDuration,
    }
  );

  if (isExtraordinary) {
    return {
      eligible: false,
      amount: '£0',
      confidence: 90,
      message: 'Compensation not available due to extraordinary circumstances',
      regulation: 'UK CAA',
      reason: 'Extraordinary circumstances (weather, security, etc.)',
    };
  }

  // Calculate compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
  let amount = '£0';

  if (distance <= 1500) {
    amount = '£250';
  } else if (distance <= 3500) {
    amount = '£400';
  } else {
    amount = '£520';
  }

  // Check if alternative flight was offered
  if (flight.alternativeOffered && flight.alternativeTiming) {
    const alternativeHours = parseAlternativeTiming(flight.alternativeTiming);

    if (alternativeHours <= 1) {
      // 50% compensation if alternative within 1 hour
      const baseAmount = parseFloat(amount.replace('£', ''));
      amount = `£${Math.round(baseAmount * 0.5)}`;
    } else if (alternativeHours <= 2) {
      // No compensation if alternative within 2 hours
      amount = '£0';
      return {
        eligible: false,
        amount,
        confidence: 90,
        message:
          'Alternative flight offered within 2 hours - no compensation required',
        regulation: 'UK CAA',
        reason: 'Alternative flight timing',
      };
    }
  }

  return {
    eligible: true,
    amount,
    confidence: 85,
    message: `You're likely entitled to ${amount} compensation under UK CAA regulations for cancellation`,
    regulation: 'UK CAA',
    reason: `Flight cancelled with ${noticeGiven} notice, distance ${distance}km`,
  };
}

/**
 * Check EU261 cancellation eligibility
 */
async function checkEU261CancellationEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Check notice period
  const noticeGiven = flight.noticeGiven;
  if (!noticeGiven || noticeGiven === '> 14 days') {
    return {
      eligible: false,
      amount: '€0',
      confidence: 90,
      message:
        'Cancellation with more than 14 days notice does not qualify for compensation',
      regulation: 'EU261',
      reason: 'Insufficient notice period',
    };
  }

  // Check for extraordinary circumstances using enhanced NLP
  const isExtraordinary = await isExtraordinaryCircumstance(
    flight.delayReason,
    {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      delayDuration: flight.delayDuration,
    }
  );

  if (isExtraordinary) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 90,
      message: 'Compensation not available due to extraordinary circumstances',
      regulation: 'EU261',
      reason: 'Extraordinary circumstances (weather, security, etc.)',
    };
  }

  // Calculate compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
  let amount = '€0';

  if (distance <= 1500) {
    amount = '€250';
  } else if (distance <= 3500) {
    amount = '€400';
  } else {
    amount = '€600';
  }

  // Check if alternative flight was offered
  if (flight.alternativeOffered && flight.alternativeTiming) {
    const alternativeHours = parseAlternativeTiming(flight.alternativeTiming);

    if (alternativeHours <= 1) {
      // 50% compensation if alternative within 1 hour
      const baseAmount = parseFloat(amount.replace('€', ''));
      amount = `€${Math.round(baseAmount * 0.5)}`;
    } else if (alternativeHours <= 2) {
      // No compensation if alternative within 2 hours
      amount = '€0';
      return {
        eligible: false,
        amount,
        confidence: 90,
        message:
          'Alternative flight offered within 2 hours - no compensation required',
        regulation: 'EU261',
        reason: 'Alternative flight timing',
      };
    }
  }

  return {
    eligible: true,
    amount,
    confidence: 85,
    message: `You're likely entitled to ${amount} compensation under EU261 for cancellation`,
    regulation: 'EU261',
    reason: `Flight cancelled with ${noticeGiven} notice, distance ${distance}km`,
  };
}

/**
 * Check US DOT cancellation eligibility
 */
async function checkDOTCancellationEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // US DOT doesn't mandate compensation for cancellations
  return {
    eligible: true,
    amount: 'Varies by airline',
    confidence: 60,
    message:
      'US DOT does not mandate compensation for cancellations, but the airline may offer assistance',
    regulation: 'US DOT',
    reason: 'Check with airline for cancellation policy',
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
 * Check UK CAA eligibility (similar to EU261)
 */
async function checkUKCAAEligibility(
  flight: FlightDetails,
  delayHours: number
): Promise<EligibilityResult> {
  // Check for extraordinary circumstances using enhanced NLP
  const isExtraordinary = await isExtraordinaryCircumstance(
    flight.delayReason,
    {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      delayDuration: flight.delayDuration,
    }
  );

  if (isExtraordinary) {
    return {
      eligible: false,
      amount: '£0',
      confidence: 90,
      message: 'Compensation not available due to extraordinary circumstances',
      regulation: 'UK CAA',
      reason: 'Extraordinary circumstances (weather, security, etc.)',
    };
  }

  // Calculate compensation based on distance (same as EU261)
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
  let amount = '£0';

  if (distance <= 1500) {
    amount = '£250';
  } else if (distance <= 3500) {
    amount = '£400';
  } else {
    amount = '£520';
  }

  return {
    eligible: true,
    amount,
    confidence: 85,
    message: `You're likely entitled to ${amount} compensation under UK CAA regulations`,
    regulation: 'UK CAA',
    reason: `Flight delayed ${delayHours} hours, distance ${distance}km`,
  };
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
    'LHR', // London Heathrow
    'LGW', // London Gatwick
    'STN', // London Stansted
    'LTN', // London Luton
    'LBA', // Leeds Bradford
    'MAN', // Manchester
    'BHX', // Birmingham
    'BRS', // Bristol
    'NCL', // Newcastle
    'EDI', // Edinburgh
    'GLA', // Glasgow
    'BFS', // Belfast
    'DUB', // Dublin (Ireland)
  ];

  // Check if airline is UK-based
  const isUKAirline = ukAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  // Check if departing from UK airport
  const isFromUK = ukAirports.includes(flight.departureAirport.toUpperCase());

  // Check if arriving at UK airport
  const isToUK = ukAirports.includes(flight.arrivalAirport.toUpperCase());

  return isUKAirline || isFromUK || isToUK;
}

/**
 * Check EU261 eligibility
 */
async function checkEU261Eligibility(
  flight: FlightDetails,
  delayHours: number
): Promise<EligibilityResult> {
  // Check for extraordinary circumstances using enhanced NLP
  const isExtraordinary = await isExtraordinaryCircumstance(
    flight.delayReason,
    {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      delayDuration: flight.delayDuration,
    }
  );

  if (isExtraordinary) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 90,
      message: 'Compensation not available due to extraordinary circumstances',
      regulation: 'EU261',
      reason: 'Extraordinary circumstances (weather, security, etc.)',
    };
  }

  // Calculate compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
  let amount = '€0';

  if (distance <= 1500) {
    amount = '€250';
  } else if (distance <= 3500) {
    amount = '€400';
  } else {
    amount = '€600';
  }

  return {
    eligible: true,
    amount,
    confidence: 85,
    message: `You're likely entitled to ${amount} compensation under EU261`,
    regulation: 'EU261',
    reason: `Flight delayed ${delayHours} hours, distance ${distance}km`,
  };
}

/**
 * Check US DOT eligibility
 */
async function checkDOTEligibility(
  flight: FlightDetails,
  delayHours: number
): Promise<EligibilityResult> {
  // US DOT doesn't mandate compensation, but airlines may offer it
  if (delayHours >= 4) {
    return {
      eligible: true,
      amount: 'Varies by airline',
      confidence: 60,
      message:
        "US DOT doesn't mandate compensation, but the airline may offer assistance",
      regulation: 'US DOT',
      reason: 'Check with airline for compensation policy',
    };
  }

  return {
    eligible: false,
    amount: '€0',
    confidence: 80,
    message: "US DOT doesn't mandate compensation for delays under 4 hours",
    regulation: 'US DOT',
    reason: 'Insufficient delay for DOT consideration',
  };
}

/**
 * Parse delay duration from string to hours
 */
function parseDelayHours(delayDuration: string): number {
  // Handle formats like "4 hours 45 minutes", "4.75 hours", "285 minutes", etc.
  const lowerDelay = delayDuration.toLowerCase();

  // Extract hours and minutes separately
  const hoursMatch = lowerDelay.match(/(\d+(?:\.\d+)?)\s*hours?/);
  const minutesMatch = lowerDelay.match(/(\d+(?:\.\d+)?)\s*minutes?/);

  let totalHours = 0;

  // Add hours if found
  if (hoursMatch) {
    totalHours += parseFloat(hoursMatch[1]);
  }

  // Add minutes converted to hours if found
  if (minutesMatch) {
    totalHours += parseFloat(minutesMatch[1]) / 60;
  }

  // If no hours/minutes found, try to extract just a number and assume it's hours
  if (totalHours === 0) {
    const numberMatch = delayDuration.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      totalHours = parseFloat(numberMatch[1]);
      // If it mentions minutes, convert to hours
      if (lowerDelay.includes('minute')) {
        totalHours = totalHours / 60;
      }
    }
  }

  return totalHours;
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
    'LHR',
    'CDG',
    'FRA',
    'AMS',
    'MAD',
    'FCO',
    'BCN',
    'MUC',
    'ZUR',
    'VIE',
    'CPH',
    'ARN',
    'OSL',
    'HEL',
    'ATH',
    'WAW',
    'LIS',
    'BRU',
  ];

  // Check if airline is EU-based
  const isEUAirline = euAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  // Check if departing from EU airport
  const isFromEU = euAirports.includes(flight.departureAirport.toUpperCase());

  // Check if arriving at EU airport
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
    'JFK',
    'LAX',
    'ORD',
    'DFW',
    'DEN',
    'SFO',
    'SEA',
    'LAS',
    'MIA',
    'ATL',
    'BOS',
    'PHX',
    'IAH',
    'MCO',
    'DTW',
    'MSP',
    'PHL',
    'LGA',
  ];

  const isUSAirline = usAirlines.some((airline) =>
    flight.airline.toLowerCase().includes(airline.toLowerCase())
  );

  const isFromUS = usAirports.includes(flight.departureAirport.toUpperCase());
  const isToUS = usAirports.includes(flight.arrivalAirport.toUpperCase());

  return isUSAirline || isFromUS || isToUS;
}

/**
 * Check if delay reason is extraordinary circumstance using enhanced NLP
 */
async function isExtraordinaryCircumstance(
  reason?: string,
  additionalContext?: any
): Promise<boolean> {
  if (!reason) return false;

  try {
    const analysis = await analyzeExtraordinaryCircumstances(
      reason,
      additionalContext
    );
    return analysis.isExtraordinary;
  } catch (error) {
    console.error('Error analyzing extraordinary circumstances:', error);
    // Fallback to simple keyword detection
    return fallbackExtraordinaryDetection(reason);
  }
}

/**
 * Fallback keyword-based detection for extraordinary circumstances
 */
function fallbackExtraordinaryDetection(reason: string): boolean {
  const extraordinaryReasons = [
    'weather',
    'storm',
    'snow',
    'fog',
    'ice',
    'hurricane',
    'tornado',
    'security',
    'terrorist',
    'threat',
    'bomb',
    'suspicious',
    'air traffic control',
    'atc',
    'strike',
    'industrial action',
    'bird strike',
    'wildlife',
    'medical emergency',
    'emergency landing',
  ];

  const lowerReason = reason.toLowerCase();
  return extraordinaryReasons.some((extraordinary) =>
    lowerReason.includes(extraordinary)
  );
}

/**
 * Calculate flight distance between airports using Haversine formula
 * @param departure IATA code of departure airport
 * @param arrival IATA code of arrival airport
 * @returns Distance in kilometers, or 1000km fallback if airports not found
 */
function calculateFlightDistance(departure: string, arrival: string): number {
  const distance = getDistanceBetweenAirports(departure, arrival);

  if (distance === null) {
    // Fallback for airports not in database
    console.warn(`Airport not found in database: ${departure} or ${arrival}`);
    return 1000; // Default to 1000km if unknown
  }

  return distance;
}

/**
 * Get airline-specific compensation information
 */
export function getAirlineCompensationInfo(airline: string): string {
  const airlineInfo: Record<string, string> = {
    Lufthansa: 'Lufthansa typically processes EU261 claims within 2-4 weeks',
    'British Airways': 'British Airways has a dedicated EU261 claims portal',
    'Air France': 'Air France offers online claim submission for EU261 cases',
    KLM: 'KLM provides automated EU261 compensation through their website',
    Ryanair:
      'Ryanair processes EU261 claims but may require additional documentation',
    'American Airlines':
      'American Airlines may offer compensation for delays over 4 hours',
    Delta:
      'Delta provides assistance for significant delays on a case-by-case basis',
    United: 'United may offer compensation for delays over 4 hours',
    Southwest: 'Southwest offers compensation for delays over 4 hours',
    JetBlue: 'JetBlue provides assistance for significant delays',
  };

  const lowerAirline = airline.toLowerCase();
  const matchedAirline = Object.keys(airlineInfo).find((key) =>
    lowerAirline.includes(key.toLowerCase())
  );

  return matchedAirline
    ? airlineInfo[matchedAirline]
    : 'Check with airline for compensation policy';
}
