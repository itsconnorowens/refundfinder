// Flight email parsing using Anthropic Claude
import Anthropic from "@anthropic-ai/sdk";
import { usageMiddleware } from "./usage-middleware";

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
}

export interface EmailParseResult {
  success: boolean;
  data?: FlightEmailData;
  error?: string;
  confidence: number;
  usage?: any; // Usage information from monitoring
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function parseFlightEmail(
  emailContent: string
): Promise<EmailParseResult> {
  if (!emailContent || typeof emailContent !== "string") {
    return {
      success: false,
      error: "Invalid email content",
      confidence: 0,
    };
  }

  if (!isAnthropicConfigured()) {
    return {
      success: false,
      error: "Anthropic API not configured",
      confidence: 0,
    };
  }

  // Check usage limits before making API call
  const usageCheck = await usageMiddleware.checkUsage({
    apiName: "anthropic",
    requestCount: 1,
    blockOnLimit: true,
    logUsage: true,
  });

  if (!usageCheck.allowed) {
    return {
      success: false,
      error: usageCheck.error || "API usage limit exceeded",
      confidence: 0,
      usage: usageCheck.usage,
    };
  }

  try {
    const prompt = createParsingPrompt(emailContent);
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return {
        success: false,
        error: "Unexpected response format from Anthropic",
        confidence: 0,
        usage: usageCheck.usage,
      };
    }

    const parsedData = JSON.parse(content.text);
    const confidence = calculateConfidence(parsedData);

    return {
      success: true,
      data: parsedData,
      confidence,
      usage: usageCheck.usage,
    };
  } catch (error) {
    console.error("Error parsing flight email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      confidence: 0,
      usage: usageCheck.usage,
    };
  }
}

function createParsingPrompt(emailContent: string): string {
  return `
You are an expert at parsing flight-related emails to extract structured flight information. 

Analyze the following email content and extract flight details. Return ONLY a valid JSON object with the exact structure specified below.

Email Content:
${emailContent}

Extract the following information and return as JSON:

{
  "flightNumber": "string (e.g., 'AA123', 'BA456')",
  "airline": "string (e.g., 'American Airlines', 'British Airways')",
  "departureDate": "string in YYYY-MM-DD format",
  "scheduledDeparture": "string in HH:MM format (24-hour)",
  "scheduledArrival": "string in HH:MM format (24-hour)",
  "departureAirport": "string (3-letter airport code, e.g., 'JFK', 'LHR')",
  "arrivalAirport": "string (3-letter airport code, e.g., 'LAX', 'CDG')",
  "delayDuration": "string (e.g., '2 hours', '120 minutes') or null if not mentioned",
  "delayReason": "string (reason for delay) or null if not mentioned",
  "isCancelled": "boolean (true if flight was cancelled)",
  "cancellationReason": "string (reason for cancellation) or null if not cancelled",
  "passengerName": "string (passenger name) or null if not found",
  "bookingReference": "string (PNR/booking reference) or null if not found",
  "ticketNumber": "string (ticket number) or null if not found",
  "confidence": "number between 0 and 1 (confidence in the extracted data)"
}

IMPORTANT RULES:
1. If any field cannot be determined from the email, use null
2. For dates, convert to YYYY-MM-DD format
3. For times, use 24-hour format (HH:MM)
4. For airport codes, use standard 3-letter IATA codes
5. For delay duration, extract the actual delay time mentioned
6. Set isCancelled to true only if explicitly mentioned
7. Calculate confidence based on how much information you could extract
8. Return ONLY the JSON object, no other text

Examples of good extractions:
- "Flight AA123" → "AA123"
- "American Airlines" → "American Airlines"
- "departing at 2:30 PM" → "14:30"
- "from JFK to LAX" → departureAirport: "JFK", arrivalAirport: "LAX"
- "delayed by 3 hours" → delayDuration: "3 hours"
- "cancelled due to weather" → isCancelled: true, cancellationReason: "weather"
`;
}

function calculateConfidence(data: any): number {
  let confidence = 0;
  let totalFields = 0;
  let filledFields = 0;

  // Required fields for basic flight identification
  const requiredFields = [
    "flightNumber",
    "airline",
    "departureDate",
    "scheduledDeparture",
    "scheduledArrival",
    "departureAirport",
    "arrivalAirport",
  ];

  // Check required fields
  for (const field of requiredFields) {
    totalFields++;
    if (data[field] && data[field] !== null && data[field] !== "") {
      filledFields++;
    }
  }

  // Base confidence on required fields
  confidence = filledFields / totalFields;

  // Bonus points for additional information
  const bonusFields = [
    "delayDuration",
    "delayReason",
    "passengerName",
    "bookingReference",
  ];
  for (const field of bonusFields) {
    if (data[field] && data[field] !== null && data[field] !== "") {
      confidence += 0.1;
    }
  }

  // Penalty for invalid formats
  if (data.departureDate && !isValidDate(data.departureDate)) {
    confidence -= 0.2;
  }

  if (data.scheduledDeparture && !isValidTime(data.scheduledDeparture)) {
    confidence -= 0.1;
  }

  if (data.scheduledArrival && !isValidTime(data.scheduledArrival)) {
    confidence -= 0.1;
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

// Helper function to validate extracted flight data
export function validateFlightEmailData(data: FlightEmailData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.flightNumber) {
    errors.push("Flight number is required");
  }

  if (!data.airline) {
    errors.push("Airline is required");
  }

  if (!data.departureDate) {
    errors.push("Departure date is required");
  } else if (!isValidDate(data.departureDate)) {
    errors.push("Invalid departure date format");
  }

  if (!data.scheduledDeparture) {
    errors.push("Scheduled departure time is required");
  } else if (!isValidTime(data.scheduledDeparture)) {
    errors.push("Invalid scheduled departure time format");
  }

  if (data.scheduledArrival && !isValidTime(data.scheduledArrival)) {
    errors.push("Invalid scheduled arrival time format");
  }

  if (!data.departureAirport) {
    errors.push("Departure airport is required");
  } else if (!/^[A-Z]{3}$/.test(data.departureAirport)) {
    errors.push("Invalid departure airport code format");
  }

  if (!data.arrivalAirport) {
    errors.push("Arrival airport is required");
  } else if (!/^[A-Z]{3}$/.test(data.arrivalAirport)) {
    errors.push("Invalid arrival airport code format");
  }

  if (data.confidence < 0.5) {
    errors.push("Low confidence in extracted data");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
