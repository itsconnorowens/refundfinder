import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Structured flight details extracted from email
 */
export interface FlightDetails {
  flight_number: string;
  airline: string;
  date: string;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  scheduled_arrival: string;
}

/**
 * Parse flight details from a raw email string using Claude AI
 *
 * @param emailText - Raw email text containing flight confirmation details
 * @returns Parsed flight details or null if parsing fails
 *
 * @example
 * ```typescript
 * const data = await parseFlightEmail(emailText);
 * if (data) {
 *   console.log(`Flight ${data.flight_number} on ${data.date}`);
 * }
 * ```
 */
export async function parseFlightEmail(
  emailText: string
): Promise<FlightDetails | null> {
  try {
    // Validate input
    if (!emailText || typeof emailText !== 'string') {
      console.error('Invalid email text provided to parseFlightEmail');
      return null;
    }

    // Validate environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      return null;
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Create the prompt for Claude
    const prompt = `Extract the flight number, airline, flight date, departure airport, arrival airport, scheduled departure time, and scheduled arrival time from this flight confirmation email. Return only the structured JSON {flight_number, airline, date, departure_airport, arrival_airport, scheduled_departure, scheduled_arrival}.

Email content:
${emailText}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest Sonnet model
      max_tokens: 1024,
      temperature: 0, // Deterministic output for structured data
      system:
        'You are a parser that returns strictly valid JSON with the required keys. Do not include any explanation or markdown formatting. If data is missing, use an empty string for that field.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the response text
    const content = message.content[0];
    if (content.type !== 'text') {
      console.error('Unexpected response type from Claude API');
      return null;
    }

    const responseText = content.text;

    // Parse JSON from response
    // Claude might wrap JSON in markdown code blocks, so we need to extract it
    const jsonText = extractJsonString(responseText);
    if (!jsonText) {
      console.error(
        'Could not extract JSON from Claude response:',
        responseText
      );
      return null;
    }

    // Parse the JSON
    const flightDetails = JSON.parse(jsonText) as FlightDetails;

    // Validate that all required fields are present
    const validated = validateFlightDetails(flightDetails);
    if (!validated) {
      console.error('Parsed JSON missing required fields:', flightDetails);
      return null;
    }

    console.log('Successfully parsed flight details from email');
    return validated;
  } catch (error) {
    // Log the error for debugging but don't expose details to client
    if (error instanceof Error) {
      console.error('Error parsing flight email with Claude:', error.message);
    } else {
      console.error('Unknown error parsing flight email:', error);
    }
    return null;
  }
}

/**
 * Extract JSON string from Claude's response text
 * Handles markdown code blocks and other formatting
 */
function extractJsonString(text: string): string | null {
  if (!text) return null;

  let cleaned = text.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json\s*\n?|^```\s*\n?|```$/gm, '');

  // Try direct parse first
  if (isValidJson(cleaned)) {
    return cleaned;
  }

  // Fallback: extract the first JSON object substring
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = cleaned.slice(start, end + 1).trim();
    if (isValidJson(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Check if a string is valid JSON
 */
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that all required fields are present in flight details
 */
function validateFlightDetails(
  details: Partial<FlightDetails>
): FlightDetails | null {
  const requiredFields: (keyof FlightDetails)[] = [
    'flight_number',
    'airline',
    'date',
    'departure_airport',
    'arrival_airport',
    'scheduled_departure',
    'scheduled_arrival',
  ];

  // Check if all fields are present and non-empty
  for (const field of requiredFields) {
    if (!details[field] || typeof details[field] !== 'string') {
      return null;
    }
  }

  return details as FlightDetails;
}

/**
 * Utility function to check if API key is configured
 * @returns true if ANTHROPIC_API_KEY is set
 */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
