// Enhanced flight email parsing using Anthropic Claude with improved accuracy and error handling
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface FlightEmailData {
  flightNumber: string;
  airline: string;
  departureDate: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration?: string;
  delayReason?: string;
  isCancelled: boolean;
  cancellationReason?: string;
  passengerName?: string;
  bookingReference?: string;
  ticketNumber?: string;
  confidence: number;
  parsingMetadata?: {
    emailLength: number;
    extractionMethod: string;
    ambiguousFields: string[];
    validationWarnings: string[];
  };
}

export interface EmailParseResult {
  success: boolean;
  data?: FlightEmailData;
  error?: string;
  confidence: number;
  parsingTime?: number;
  retryCount?: number;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function parseFlightEmail(
  emailContent: string,
  retryCount: number = 0
): Promise<EmailParseResult> {
  const startTime = Date.now();

  if (!emailContent || typeof emailContent !== 'string') {
    return {
      success: false,
      error: 'Invalid email content',
      confidence: 0,
      parsingTime: Date.now() - startTime,
    };
  }

  if (!isAnthropicConfigured()) {
    return {
      success: false,
      error: 'Anthropic API not configured',
      confidence: 0,
      parsingTime: Date.now() - startTime,
    };
  }

  try {
    const prompt = createEnhancedParsingPrompt(emailContent);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.1, // Lower temperature for more consistent results
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic');
    }

    const parsedData = JSON.parse(content.text);
    const confidence = calculateEnhancedConfidence(parsedData, emailContent);

    // Validate the parsed data
    const validation = validateFlightEmailData(parsedData);
    if (!validation.isValid && retryCount < 2) {
      console.log(`Validation failed, retrying... (attempt ${retryCount + 1})`);
      return await parseFlightEmail(emailContent, retryCount + 1);
    }

    const parsingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...parsedData,
        parsingMetadata: {
          emailLength: emailContent.length,
          extractionMethod: 'claude-3-5-sonnet',
          ambiguousFields: validation.errors,
          validationWarnings: validation.warnings || [],
        },
      },
      confidence,
      parsingTime,
      retryCount,
    };
  } catch (error) {
    console.error('Error parsing flight email:', error);

    // Retry on certain errors
    if (
      retryCount < 2 &&
      (error instanceof SyntaxError ||
        (error instanceof Error && error.message.includes('JSON')))
    ) {
      console.log(
        `JSON parsing error, retrying... (attempt ${retryCount + 1})`
      );
      return await parseFlightEmail(emailContent, retryCount + 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      confidence: 0,
      parsingTime: Date.now() - startTime,
      retryCount,
    };
  }
}

function createEnhancedParsingPrompt(emailContent: string): string {
  return `
You are an expert aviation data extraction specialist with deep knowledge of airline communications, flight operations, and EU261/UK CAA regulations. Your task is to extract structured flight information from airline emails with maximum accuracy.

ANALYSIS CONTEXT:
- This email may contain flight delays, cancellations, or schedule changes
- Focus on extracting data relevant to compensation claims under EU261/UK CAA
- Be precise with dates, times, and airport codes
- Distinguish between scheduled times and actual times
- Identify delay durations and reasons accurately

EMAIL CONTENT TO ANALYZE:
${emailContent}

EXTRACTION REQUIREMENTS:
Extract the following information and return ONLY a valid JSON object with this exact structure:

{
  "flightNumber": "string (e.g., 'AA123', 'BA456') - REQUIRED",
  "airline": "string (e.g., 'American Airlines', 'British Airways') - REQUIRED",
  "departureDate": "string in YYYY-MM-DD format - REQUIRED",
  "scheduledDeparture": "string in HH:MM format (24-hour) - REQUIRED",
  "scheduledArrival": "string in HH:MM format (24-hour) - REQUIRED",
  "departureAirport": "string (3-letter IATA code, e.g., 'JFK', 'LHR') - REQUIRED",
  "arrivalAirport": "string (3-letter IATA code, e.g., 'LAX', 'CDG') - REQUIRED",
  "delayDuration": "string (e.g., '2 hours', '120 minutes') or null if not mentioned",
  "delayReason": "string (reason for delay) or null if not mentioned",
  "isCancelled": "boolean (true if flight was cancelled)",
  "cancellationReason": "string (reason for cancellation) or null if not cancelled",
  "passengerName": "string (passenger name) or null if not found",
  "bookingReference": "string (PNR/booking reference) or null if not found",
  "ticketNumber": "string (ticket number) or null if not found",
  "confidence": "number between 0 and 1 (confidence in the extracted data)"
}

CRITICAL RULES:
1. If any REQUIRED field cannot be determined, use null and set confidence < 0.5
2. For dates, convert to YYYY-MM-DD format (e.g., "March 15, 2024" → "2024-03-15")
3. For times, use 24-hour format HH:MM (e.g., "2:30 PM" → "14:30")
4. For airport codes, use standard 3-letter IATA codes (e.g., "New York JFK" → "JFK")
5. For delay duration, extract the actual delay time mentioned (not scheduled vs actual)
6. Set isCancelled to true only if explicitly mentioned as cancelled
7. Calculate confidence based on:
   - Completeness of required fields (40%)
   - Format accuracy (30%)
   - Context clarity (20%)
   - Additional details found (10%)
8. Return ONLY the JSON object, no other text

EXAMPLES OF ACCURATE EXTRACTIONS:
- "Flight AA123" → "AA123"
- "American Airlines" → "American Airlines"
- "departing at 2:30 PM" → "14:30"
- "from JFK to LAX" → departureAirport: "JFK", arrivalAirport: "LAX"
- "delayed by 3 hours" → delayDuration: "3 hours"
- "cancelled due to weather" → isCancelled: true, cancellationReason: "weather"
- "March 15, 2024" → "2024-03-15"

QUALITY CHECKS:
- Verify airport codes are valid IATA codes
- Ensure dates are in correct format
- Check that times are in 24-hour format
- Validate flight number format (2-3 letters + 1-4 digits)
- Confirm delay duration makes sense

Return the JSON object now:
`;
}

function calculateEnhancedConfidence(data: any, emailContent: string): number {
  let confidence = 0;
  let totalFields = 0;
  let filledFields = 0;

  // Required fields for basic flight identification (40% of confidence)
  const requiredFields = [
    'flightNumber',
    'airline',
    'departureDate',
    'scheduledDeparture',
    'scheduledArrival',
    'departureAirport',
    'arrivalAirport',
  ];

  // Check required fields completeness
  for (const field of requiredFields) {
    totalFields++;
    if (data[field] && data[field] !== null && data[field] !== '') {
      filledFields++;
    }
  }

  const completenessScore = (filledFields / totalFields) * 0.4;
  confidence += completenessScore;

  // Format accuracy (30% of confidence)
  let formatScore = 0;
  if (data.departureDate && isValidDate(data.departureDate)) formatScore += 0.1;
  if (data.scheduledDeparture && isValidTime(data.scheduledDeparture))
    formatScore += 0.1;
  if (data.scheduledArrival && isValidTime(data.scheduledArrival))
    formatScore += 0.1;
  confidence += formatScore;

  // Context clarity (20% of confidence)
  let contextScore = 0;
  if (data.flightNumber && isValidFlightNumber(data.flightNumber))
    contextScore += 0.05;
  if (data.departureAirport && isValidAirportCode(data.departureAirport))
    contextScore += 0.05;
  if (data.arrivalAirport && isValidAirportCode(data.arrivalAirport))
    contextScore += 0.05;
  if (data.delayDuration && isValidDelayDuration(data.delayDuration))
    contextScore += 0.05;
  confidence += contextScore;

  // Additional details found (10% of confidence)
  let additionalScore = 0;
  const bonusFields = [
    'delayDuration',
    'delayReason',
    'passengerName',
    'bookingReference',
    'ticketNumber',
  ];
  for (const field of bonusFields) {
    if (data[field] && data[field] !== null && data[field] !== '') {
      additionalScore += 0.02;
    }
  }
  confidence += additionalScore;

  // Email content quality bonus
  if (emailContent.length > 500 && emailContent.length < 10000) {
    confidence += 0.05; // Well-sized email
  }

  // Penalty for very low confidence
  if (confidence < 0.3) {
    confidence = Math.max(0.1, confidence - 0.1);
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function isValidTime(timeString: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeString);
}

function isValidFlightNumber(flightNumber: string): boolean {
  return /^[A-Z]{2,3}\d{1,4}$/i.test(flightNumber);
}

function isValidAirportCode(airportCode: string): boolean {
  return /^[A-Z]{3}$/.test(airportCode);
}

function isValidDelayDuration(delayDuration: string): boolean {
  // Check if it contains time-related keywords
  const timeKeywords = ['hour', 'minute', 'hr', 'min', 'delay', 'late'];
  return timeKeywords.some((keyword) =>
    delayDuration.toLowerCase().includes(keyword)
  );
}

// Enhanced validation function for extracted flight data
export function validateFlightEmailData(data: FlightEmailData): {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!data.flightNumber) {
    errors.push('Flight number is required');
  } else if (!isValidFlightNumber(data.flightNumber)) {
    errors.push('Invalid flight number format');
  }

  if (!data.airline) {
    errors.push('Airline is required');
  }

  if (!data.departureDate) {
    errors.push('Departure date is required');
  } else if (!isValidDate(data.departureDate)) {
    errors.push('Invalid departure date format');
  }

  if (!data.scheduledDeparture) {
    errors.push('Scheduled departure time is required');
  } else if (!isValidTime(data.scheduledDeparture)) {
    errors.push('Invalid scheduled departure time format');
  }

  if (data.scheduledArrival && !isValidTime(data.scheduledArrival)) {
    errors.push('Invalid scheduled arrival time format');
  }

  if (!data.departureAirport) {
    errors.push('Departure airport is required');
  } else if (!isValidAirportCode(data.departureAirport)) {
    errors.push('Invalid departure airport code format');
  }

  if (!data.arrivalAirport) {
    errors.push('Arrival airport is required');
  } else if (!isValidAirportCode(data.arrivalAirport)) {
    errors.push('Invalid arrival airport code format');
  }

  // Confidence validation
  if (data.confidence < 0.5) {
    warnings.push('Low confidence in extracted data');
  }

  // Additional validation warnings
  if (data.delayDuration && !isValidDelayDuration(data.delayDuration)) {
    warnings.push('Delay duration format may be incorrect');
  }

  if (data.departureAirport === data.arrivalAirport) {
    warnings.push('Departure and arrival airports are the same');
  }

  // Date reasonableness check
  if (data.departureDate) {
    const departureDate = new Date(data.departureDate);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (departureDate < oneYearAgo || departureDate > oneYearFromNow) {
      warnings.push(
        'Departure date is more than one year in the past or future'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
