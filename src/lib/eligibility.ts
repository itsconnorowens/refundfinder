/**
 * Flight eligibility checker based on EU261 and US DOT regulations
 */

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;
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
export function checkEligibility(flight: FlightDetails): EligibilityResult {
  const delayHours = parseDelayHours(flight.delayDuration);

  // Basic validation
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
    return checkUKCAAEligibility(flight, delayHours);
  }

  // Check if it's an EU flight (EU261 applies)
  const isEUFlight = isEUCoveredFlight(flight);
  if (isEUFlight) {
    return checkEU261Eligibility(flight, delayHours);
  }

  // Check if it's a US flight (DOT regulations)
  const isUSFlightResult = isUSFlight(flight);
  if (isUSFlightResult) {
    return checkDOTEligibility(flight, delayHours);
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
 * Check UK CAA eligibility (similar to EU261)
 */
function checkUKCAAEligibility(
  flight: FlightDetails,
  delayHours: number
): EligibilityResult {
  // Check for extraordinary circumstances
  if (isExtraordinaryCircumstance(flight.delayReason)) {
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
  const distance = calculateFlightDistance(
    flight.departureAirport,
    flight.arrivalAirport
  );
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
function checkEU261Eligibility(
  flight: FlightDetails,
  delayHours: number
): EligibilityResult {
  // Check for extraordinary circumstances
  if (isExtraordinaryCircumstance(flight.delayReason)) {
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
  const distance = calculateFlightDistance(
    flight.departureAirport,
    flight.arrivalAirport
  );
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
function checkDOTEligibility(
  flight: FlightDetails,
  delayHours: number
): EligibilityResult {
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
  // Extract numbers from strings like "4 hours", "3.5 hours", "180 minutes", etc.
  const match = delayDuration.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);

  // If it mentions minutes, convert to hours
  if (delayDuration.toLowerCase().includes('minute')) {
    return value / 60;
  }

  return value;
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
 * Check if delay reason is extraordinary circumstance
 */
function isExtraordinaryCircumstance(reason?: string): boolean {
  if (!reason) return false;

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
 * Calculate approximate flight distance between airports
 * This is a simplified calculation - in production, use a proper airport database
 */
function calculateFlightDistance(departure: string, arrival: string): number {
  // Simplified distance calculation based on common routes
  // In production, use Haversine formula with actual coordinates

  const routeDistances: Record<string, number> = {
    'LHR-CDG': 344,
    'LHR-FRA': 646,
    'LHR-AMS': 357,
    'LHR-MAD': 1253,
    'LHR-FCO': 1432,
    'LHR-BCN': 1135,
    'LHR-MUC': 920,
    'LHR-ZUR': 777,
    'LHR-VIE': 1235,
    'LHR-CPH': 955,
    'LHR-ARN': 1455,
    'LHR-OSL': 1150,
    'LHR-HEL': 1830,
    'LHR-ATH': 2380,
    'LHR-WAW': 1445,
    'LHR-LIS': 1580,
    'LHR-BRU': 320,
    'JFK-LHR': 5566,
    'JFK-CDG': 5840,
    'JFK-FRA': 6200,
    'JFK-AMS': 5850,
    'LAX-LHR': 8800,
    'LAX-CDG': 9100,
    'LAX-FRA': 9500,
    'SFO-LHR': 8600,
    'SFO-CDG': 8900,
    'SFO-FRA': 9300,
    'JFK-LAX': 3944,
    'JFK-SFO': 4150,
    'LAX-SFO': 337,
    'JFK-MIA': 1090,
    'JFK-ORD': 740,
    'LAX-ORD': 1744,
    'JFK-DFW': 1388,
    'LAX-DFW': 1233,
    'JFK-DEN': 1626,
    'LAX-DEN': 860,
    'JFK-SEA': 2420,
    'LAX-SEA': 954,
    'JFK-LAS': 2240,
    'LAX-LAS': 236,
    'JFK-ATL': 760,
    'LAX-ATL': 1940,
    'JFK-BOS': 190,
    'LAX-BOS': 2610,
    'JFK-PHX': 2140,
    'LAX-PHX': 370,
    'JFK-IAH': 1410,
    'LAX-IAH': 1370,
    'JFK-MCO': 945,
    'LAX-MCO': 2140,
    'JFK-DTW': 504,
    'LAX-DTW': 1950,
    'JFK-MSP': 1020,
    'LAX-MSP': 1530,
    'JFK-PHL': 95,
    'LAX-PHL': 2400,
    'JFK-LGA': 8,
    'LAX-LGA': 2450,
  };

  const route = `${departure.toUpperCase()}-${arrival.toUpperCase()}`;
  const reverseRoute = `${arrival.toUpperCase()}-${departure.toUpperCase()}`;

  return routeDistances[route] || routeDistances[reverseRoute] || 1000; // Default to 1000km if unknown
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
