import { calculateFlightDistanceCached } from './distance-calculator';
import { checkRegionalEligibility } from './regulations/regional';
import { analyzeExtraordinaryCircumstances } from './extraordinary-circumstances';
import { checkDeniedBoardingEligibility } from './denied-boarding';

import { getDistanceBetweenAirports } from './airports';
import { logger } from '@/lib/logger';

// Seat class types in descending order of quality
export type SeatClass = 'first' | 'business' | 'premium_economy' | 'economy';

/**
 * Notice period for cancellation
 * Determines compensation eligibility under EU261 Article 5
 */
export type NoticePeriod = '< 7 days' | '7-14 days' | '> 14 days';

/**
 * Alternative flight offering details for cancellations
 * Based on EU261 Article 5 requirements for re-routing
 */
export interface AlternativeFlight {
  offered: boolean;
  departureTime?: string; // ISO format or time string
  arrivalTime?: string; // ISO format or time string
  // Time differences compared to original flight (in hours)
  departureTimeDifference?: number; // negative = earlier, positive = later
  arrivalTimeDifference?: number; // negative = earlier, positive = later
  // Combined timing adjustment for compensation calculation
  totalTimingAdjustment?: number; // in hours
}

/**
 * Care and assistance provided by airline during disruption
 * EU261 Article 9 requirements
 */
export interface CareProvision {
  mealsProvided?: boolean;
  refreshmentsProvided?: boolean;
  hotelAccommodationProvided?: boolean;
  transportToAccommodationProvided?: boolean;
  communicationMeansProvided?: boolean; // phone calls, emails
  adequateCareProvided?: boolean; // overall assessment
}

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;

  // Disruption type
  disruptionType?: 'delay' | 'cancellation' | 'downgrading' | 'denied_boarding';

  // Enhanced cancellation support (EU261 Article 5)
  noticeGiven?: NoticePeriod;
  cancellationDate?: string; // When passenger was notified (ISO format)
  alternativeFlight?: AlternativeFlight;
  careProvision?: CareProvision;

  // Legacy cancellation fields (maintained for backward compatibility)
  /** @deprecated Use alternativeFlight.offered instead */
  alternativeOffered?: boolean;
  /** @deprecated Use alternativeFlight.totalTimingAdjustment instead */
  alternativeTiming?: string;

  // Downgrading support
  bookedClass?: SeatClass;
  actualClass?: SeatClass;
  ticketPrice?: number;

  // Denied boarding support
  deniedBoardingType?: 'voluntary' | 'involuntary';
  alternativeArrivalDelay?: string;
  compensationOffered?: number;
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

  // Handle denied boarding
  if (disruptionType === 'denied_boarding') {
    return await checkDeniedBoardingEligibility(flight);
  }

  // Handle downgrades
  if (disruptionType === 'downgrading') {
    return await checkDowngradingEligibility(flight);
  }

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

  // Calculate distance once for downstream checks
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;

  // Determine extraordinary circumstances once
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

  // Priority: Swiss → Norwegian → Canadian → EU → UK → US
  const regionalResult = checkRegionalEligibility(
    flight.departureAirport,
    flight.arrivalAirport,
    delayHours,
    distance,
    false,
    isExtraordinary,
    flight.delayReason
  );

  if (regionalResult) {
    return {
      eligible: regionalResult.eligible,
      amount: formatRegionalAmount(regionalResult.compensation, regionalResult.currency),
      confidence: 85,
      message: formatRegionalMessage(regionalResult),
      regulation: regionalResult.regulation,
      reason: regionalResult.reason,
    };
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261Eligibility(flight, delayHours);
  }

  // Check if it's a UK flight (UK CAA regulations apply)
  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAAEligibility(flight, delayHours);
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
  // Precompute distance and extraordinary circumstances
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
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

  // Regional checks first (Swiss → Norwegian → Canadian)
  const regionalResult = checkRegionalEligibility(
    flight.departureAirport,
    flight.arrivalAirport,
    // For cancellations, some regimes still look at delay on reroute; fallback to parsed delay
    parseDelayHours(flight.delayDuration || '0 hours'),
    distance,
    true,
    isExtraordinary,
    flight.delayReason
  );

  if (regionalResult) {
    return {
      eligible: regionalResult.eligible,
      amount: formatRegionalAmount(regionalResult.compensation, regionalResult.currency),
      confidence: 85,
      message: formatRegionalMessage(regionalResult),
      regulation: regionalResult.regulation,
      reason: regionalResult.reason,
    };
  }

  // Then EU → UK → US
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261CancellationEligibility(flight);
  }

  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAACancellationEligibility(flight);
  }

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

// Helpers to format regional outputs
function formatRegionalAmount(value: number, currency: string): string {
  const upper = currency.toUpperCase();
  if (upper === 'CHF') return `CHF ${value}`;
  if (upper === 'NOK') return `NOK ${value}`;
  if (upper === 'CAD') return `$${value} CAD`;
  return `${value} ${currency}`;
}

function formatRegionalMessage(r: {
  compensation: number;
  currency: string;
  regulation: string;
}): string {
  return `You're likely entitled to ${formatRegionalAmount(r.compensation, r.currency)} under ${r.regulation}`;
}

/**
 * Analyze notification timing for cancellation
 * Determines which EU261 Article 5 rule applies
 *
 * EU261 Rules:
 * - > 14 days: No compensation required
 * - 7-14 days: Compensation required unless suitable alternative offered
 * - < 7 days: Full compensation unless very close alternative offered
 */
function analyzeNotificationTiming(flight: FlightDetails): {
  noticePeriod: NoticePeriod;
  requiresCompensation: boolean;
  allowsAlternativeReduction: boolean;
} {
  const noticeGiven = flight.noticeGiven;

  if (!noticeGiven || noticeGiven === '> 14 days') {
    return {
      noticePeriod: '> 14 days',
      requiresCompensation: false,
      allowsAlternativeReduction: false,
    };
  }

  if (noticeGiven === '7-14 days') {
    return {
      noticePeriod: '7-14 days',
      requiresCompensation: true,
      allowsAlternativeReduction: true, // Alternative must depart within 2 hours and arrive within 4 hours
    };
  }

  // < 7 days
  return {
    noticePeriod: '< 7 days',
    requiresCompensation: true,
    allowsAlternativeReduction: true, // Alternative must depart within 1 hour and arrive within 2 hours
  };
}

/**
 * Analyze alternative flight timing to determine compensation reduction
 * Based on EU261 Article 5(1)(c)
 *
 * Returns compensation multiplier (0 = no compensation, 0.5 = 50%, 1 = full)
 */
function analyzeAlternativeFlights(
  flight: FlightDetails,
  noticePeriod: NoticePeriod
): {
  hasAlternative: boolean;
  compensationMultiplier: number;
  reason: string;
} {
  // Check for enhanced alternative flight data first
  if (flight.alternativeFlight && flight.alternativeFlight.offered) {
    const alt = flight.alternativeFlight;
    const departDiff = Math.abs(alt.departureTimeDifference || 0);
    const arrivalDiff = Math.abs(alt.arrivalTimeDifference || 0);

    if (noticePeriod === '7-14 days') {
      // For 7-14 days: depart < 2 hours before, arrive < 4 hours after
      if (departDiff <= 2 && arrivalDiff <= 4) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0,
          reason: 'Alternative flight within acceptable timing (7-14 days notice)',
        };
      }
    } else if (noticePeriod === '< 7 days') {
      // For < 7 days: depart < 1 hour before, arrive < 2 hours after
      if (departDiff <= 1 && arrivalDiff <= 2) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0,
          reason: 'Alternative flight within acceptable timing (< 7 days notice)',
        };
      }
      // Partial reduction for close alternatives
      if (departDiff <= 2 && arrivalDiff <= 3) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0.5,
          reason: 'Alternative flight offered with minor delays (< 7 days notice)',
        };
      }
    }

    return {
      hasAlternative: true,
      compensationMultiplier: 1,
      reason: 'Alternative flight offered but timing exceeds EU261 thresholds',
    };
  }

  // Fallback to legacy fields for backward compatibility
  if (flight.alternativeOffered && flight.alternativeTiming) {
    const alternativeHours = parseAlternativeTiming(flight.alternativeTiming);

    if (noticePeriod === '7-14 days') {
      if (alternativeHours <= 4) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0,
          reason: 'Alternative flight within 4 hours (7-14 days notice)',
        };
      }
    } else if (noticePeriod === '< 7 days') {
      if (alternativeHours <= 2) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0,
          reason: 'Alternative flight within 2 hours (< 7 days notice)',
        };
      }
      if (alternativeHours <= 3) {
        return {
          hasAlternative: true,
          compensationMultiplier: 0.5,
          reason: 'Alternative flight within 3 hours (< 7 days notice)',
        };
      }
    }

    return {
      hasAlternative: true,
      compensationMultiplier: 1,
      reason: 'Alternative flight timing exceeds EU261 thresholds',
    };
  }

  return {
    hasAlternative: false,
    compensationMultiplier: 1,
    reason: 'No alternative flight offered',
  };
}

/**
 * Calculate cancellation compensation amount
 * Based on flight distance and compensation multiplier
 */
function calculateCancellationCompensation(
  distance: number,
  compensationMultiplier: number,
  currency: '€' | '£' = '€'
): string {
  let baseAmount = 0;

  // EU261/UK CAA compensation tiers based on distance
  if (distance <= 1500) {
    baseAmount = currency === '£' ? 250 : 250;
  } else if (distance <= 3500) {
    baseAmount = currency === '£' ? 400 : 400;
  } else {
    baseAmount = currency === '£' ? 520 : 600;
  }

  const finalAmount = Math.round(baseAmount * compensationMultiplier);
  return `${currency}${finalAmount}`;
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
 * Check EU261 cancellation eligibility with enhanced Article 5 compliance
 * Implements full EU261/2004 Article 5 logic for cancellation compensation
 */
async function checkEU261CancellationEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Step 1: Analyze notification timing
  const timing = analyzeNotificationTiming(flight);

  // If > 14 days notice, no compensation required
  if (!timing.requiresCompensation) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 95,
      message:
        'Cancellation with more than 14 days notice does not qualify for compensation under EU261 Article 5',
      regulation: 'EU261',
      reason: 'More than 14 days notice given',
    };
  }

  // Step 2: Check for extraordinary circumstances using enhanced NLP
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
      message:
        'Compensation not available due to extraordinary circumstances that could not have been avoided (EU261 Article 5(3))',
      regulation: 'EU261',
      reason: 'Extraordinary circumstances (weather, security, etc.)',
    };
  }

  // Step 3: Calculate flight distance for compensation tier
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;

  // Step 4: Analyze alternative flight timing for compensation reduction
  const alternativeAnalysis = analyzeAlternativeFlights(
    flight,
    timing.noticePeriod
  );

  // Step 5: Calculate final compensation amount
  const amount = calculateCancellationCompensation(
    distance,
    alternativeAnalysis.compensationMultiplier,
    '€'
  );

  // Step 6: Determine eligibility and return result
  if (alternativeAnalysis.compensationMultiplier === 0) {
    return {
      eligible: false,
      amount,
      confidence: 90,
      message:
        'Alternative flight offered within EU261 acceptable timing - no compensation required',
      regulation: 'EU261',
      reason: alternativeAnalysis.reason,
    };
  }

  const eligible = alternativeAnalysis.compensationMultiplier > 0;
  const confidence = eligible ? 85 : 90;

  return {
    eligible,
    amount,
    confidence,
    message: eligible
      ? `You're likely entitled to ${amount} compensation under EU261 Article 5 for cancellation`
      : 'No compensation required based on alternative flight timing',
    regulation: 'EU261',
    reason: `Flight cancelled with ${timing.noticePeriod} notice, distance ${distance}km. ${alternativeAnalysis.reason}`,
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
    logger.error('Error analyzing extraordinary circumstances:', error);
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

/**
 * Calculate the class difference level for downgrading
 * Returns the number of class steps downgraded
 */
export function calculateClassDifference(
  bookedClass: SeatClass,
  actualClass: SeatClass
): number {
  const classHierarchy: SeatClass[] = [
    'first',
    'business',
    'premium_economy',
    'economy',
  ];

  const bookedIndex = classHierarchy.indexOf(bookedClass);
  const actualIndex = classHierarchy.indexOf(actualClass);

  // Return positive number if downgraded, 0 or negative if same/upgraded
  return actualIndex - bookedIndex;
}

/**
 * Calculate downgrading refund percentage based on flight distance (EU261 Article 10)
 */
function calculateDowngradingPercentage(distanceKm: number): number {
  if (distanceKm <= 1500) {
    return 30; // 30% for flights up to 1500km
  } else if (distanceKm <= 3500) {
    return 50; // 50% for flights between 1500-3500km
  } else {
    return 75; // 75% for flights over 3500km
  }
}

/**
 * Check downgrading eligibility based on regulations
 */
export async function checkDowngradingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Check if it's a UK flight (UK CAA regulations apply)
  const isUKFlight = isUKCoveredFlight(flight);
  if (isUKFlight) {
    return await checkUKCAADowngradingEligibility(flight);
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return await checkEU261DowngradingEligibility(flight);
  }

  // Check if it's a US flight (DOT regulations)
  const isUSFlightResult = isUSFlight(flight);
  if (isUSFlightResult) {
    return await checkDOTDowngradingEligibility(flight);
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
 * Check EU261 downgrading eligibility (Article 10)
 * Note: Downgrades are ALWAYS eligible - no extraordinary circumstances exemption
 */
async function checkEU261DowngradingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Validate required fields
  if (!flight.bookedClass || !flight.actualClass) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 50,
      message:
        'Unable to determine downgrading eligibility - missing booked or actual class information',
      regulation: 'EU261',
      reason: 'Missing class information',
    };
  }

  // Check if actually downgraded
  const classDifference = calculateClassDifference(
    flight.bookedClass,
    flight.actualClass
  );
  if (classDifference <= 0) {
    return {
      eligible: false,
      amount: '€0',
      confidence: 100,
      message:
        'No downgrade detected - you received the same or better class than booked',
      regulation: 'EU261',
      reason: 'No downgrade occurred',
    };
  }

  // Check if ticket price is available
  if (!flight.ticketPrice || flight.ticketPrice <= 0) {
    return {
      eligible: true,
      amount: 'To be calculated',
      confidence: 70,
      message:
        'You are eligible for downgrading compensation under EU261 Article 10. Please provide your ticket price to calculate the exact refund amount.',
      regulation: 'EU261',
      reason: `Downgraded from ${flight.bookedClass} to ${flight.actualClass} class`,
    };
  }

  // Calculate compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;

  // Get percentage based on distance (EU261 Article 10)
  const percentage = calculateDowngradingPercentage(distance);

  // Calculate refund amount
  const refundAmount = Math.round((flight.ticketPrice * percentage) / 100);

  // Cap at ticket price
  const finalAmount = Math.min(refundAmount, flight.ticketPrice);

  return {
    eligible: true,
    amount: `€${finalAmount}`,
    confidence: 95,
    message: `You're entitled to €${finalAmount} (${percentage}% of ticket price) under EU261 Article 10 for seat downgrading`,
    regulation: 'EU261',
    reason: `Downgraded from ${flight.bookedClass} to ${flight.actualClass}, distance ${distance}km, ${percentage}% refund`,
  };
}

/**
 * Check UK CAA downgrading eligibility
 * Same as EU261 but with GBP currency
 */
async function checkUKCAADowngradingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Validate required fields
  if (!flight.bookedClass || !flight.actualClass) {
    return {
      eligible: false,
      amount: '£0',
      confidence: 50,
      message:
        'Unable to determine downgrading eligibility - missing booked or actual class information',
      regulation: 'UK CAA',
      reason: 'Missing class information',
    };
  }

  // Check if actually downgraded
  const classDifference = calculateClassDifference(
    flight.bookedClass,
    flight.actualClass
  );
  if (classDifference <= 0) {
    return {
      eligible: false,
      amount: '£0',
      confidence: 100,
      message:
        'No downgrade detected - you received the same or better class than booked',
      regulation: 'UK CAA',
      reason: 'No downgrade occurred',
    };
  }

  // Check if ticket price is available
  if (!flight.ticketPrice || flight.ticketPrice <= 0) {
    return {
      eligible: true,
      amount: 'To be calculated',
      confidence: 70,
      message:
        'You are eligible for downgrading compensation under UK CAA regulations. Please provide your ticket price to calculate the exact refund amount.',
      regulation: 'UK CAA',
      reason: `Downgraded from ${flight.bookedClass} to ${flight.actualClass} class`,
    };
  }

  // Calculate compensation based on distance
  const distanceResult = calculateFlightDistanceCached(
    flight.departureAirport,
    flight.arrivalAirport
  );
  const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;

  // Get percentage based on distance (same as EU261 Article 10)
  const percentage = calculateDowngradingPercentage(distance);

  // Calculate refund amount
  const refundAmount = Math.round((flight.ticketPrice * percentage) / 100);

  // Cap at ticket price
  const finalAmount = Math.min(refundAmount, flight.ticketPrice);

  return {
    eligible: true,
    amount: `£${finalAmount}`,
    confidence: 95,
    message: `You're entitled to £${finalAmount} (${percentage}% of ticket price) under UK CAA regulations for seat downgrading`,
    regulation: 'UK CAA',
    reason: `Downgraded from ${flight.bookedClass} to ${flight.actualClass}, distance ${distance}km, ${percentage}% refund`,
  };
}

/**
 * Check US DOT downgrading eligibility
 * US DOT doesn't mandate specific downgrading compensation - it's airline-specific
 */
async function checkDOTDowngradingEligibility(
  flight: FlightDetails
): Promise<EligibilityResult> {
  // Validate required fields
  if (!flight.bookedClass || !flight.actualClass) {
    return {
      eligible: false,
      amount: '$0',
      confidence: 50,
      message:
        'Unable to determine downgrading eligibility - missing booked or actual class information',
      regulation: 'US DOT',
      reason: 'Missing class information',
    };
  }

  // Check if actually downgraded
  const classDifference = calculateClassDifference(
    flight.bookedClass,
    flight.actualClass
  );
  if (classDifference <= 0) {
    return {
      eligible: false,
      amount: '$0',
      confidence: 100,
      message:
        'No downgrade detected - you received the same or better class than booked',
      regulation: 'US DOT',
      reason: 'No downgrade occurred',
    };
  }

  // US DOT doesn't mandate compensation, but airlines typically offer refunds
  return {
    eligible: true,
    amount: 'Varies by airline',
    confidence: 65,
    message:
      'US DOT does not mandate specific compensation for seat downgrades, but most airlines offer a partial refund. Contact the airline directly for their downgrade policy.',
    regulation: 'US DOT',
    reason: `Downgraded from ${flight.bookedClass} to ${flight.actualClass} - check airline policy`,
  };
}

// checkDeniedBoardingEligibility is imported from ./denied-boarding module
