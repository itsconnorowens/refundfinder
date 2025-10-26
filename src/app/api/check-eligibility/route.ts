// API endpoint for checking flight delay compensation eligibility
import { NextRequest, NextResponse } from "next/server";
import { flightLookupService } from "../../../lib/flight-apis";
import { flightValidationService } from "../../../lib/flight-validation";
import {
  parseFlightEmail,
  validateFlightEmailData,
} from "../../../lib/parse-flight-email";

export interface CheckEligibilityRequest {
  // Method 1: Direct flight lookup
  flightNumber?: string;
  departureDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;

  // Method 2: Email parsing
  emailContent?: string;

  // Optional passenger info
  passengerEmail?: string;
  firstName?: string;
  lastName?: string;
}

export interface CheckEligibilityResponse {
  success: boolean;
  data?: {
    flightData: unknown;
    eligibility: unknown;
    validation: unknown;
  };
  error?: string;
  method: "flight_lookup" | "email_parsing";
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckEligibilityRequest = await request.json();

    // Validate request
    if (!body.flightNumber && !body.emailContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Either flightNumber or emailContent must be provided",
        },
        { status: 400 }
      );
    }

    let result: CheckEligibilityResponse;

    if (body.emailContent) {
      // Method 1: Parse email content
      result = await handleEmailParsing(body);
    } else {
      // Method 2: Direct flight lookup
      result = await handleFlightLookup(body);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in check-eligibility API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function handleEmailParsing(
  body: CheckEligibilityRequest
): Promise<CheckEligibilityResponse> {
  try {
    // Parse the email content
    const parseResult = await parseFlightEmail(body.emailContent!);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: parseResult.error || "Failed to parse email content",
        method: "email_parsing",
      };
    }

    // Validate the parsed data
    const validation = validateFlightEmailData(parseResult.data);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid flight data: ${validation.errors.join(", ")}`,
        method: "email_parsing",
      };
    }

    // Look up flight data using the parsed information
    const flightLookupResult = await flightLookupService.lookupFlight(
      parseResult.data.flightNumber,
      parseResult.data.departureDate
    );

    if (!flightLookupResult.success || !flightLookupResult.data) {
      return {
        success: false,
        error: "Flight data not found in external APIs",
        method: "email_parsing",
      };
    }

    // Validate eligibility
    const eligibilityResult =
      await flightValidationService.validateFlightEligibility(
        parseResult.data.flightNumber,
        parseResult.data.departureDate,
        parseResult.data.departureAirport,
        parseResult.data.arrivalAirport,
        body.passengerEmail
      );

    return {
      success: true,
      data: {
        flightData: flightLookupResult.data,
        eligibility: eligibilityResult.eligibility,
        validation: eligibilityResult.validation,
      },
      method: "email_parsing",
    };
  } catch (error) {
    console.error("Error in email parsing:", error);
    return {
      success: false,
      error: "Failed to process email content",
      method: "email_parsing",
    };
  }
}

async function handleFlightLookup(
  body: CheckEligibilityRequest
): Promise<CheckEligibilityResponse> {
  try {
    // Validate required fields
    if (
      !body.flightNumber ||
      !body.departureDate ||
      !body.departureAirport ||
      !body.arrivalAirport
    ) {
      return {
        success: false,
        error:
          "Missing required fields: flightNumber, departureDate, departureAirport, arrivalAirport",
        method: "flight_lookup",
      };
    }

    // Look up flight data
    const flightLookupResult = await flightLookupService.lookupFlight(
      body.flightNumber,
      body.departureDate
    );

    if (!flightLookupResult.success || !flightLookupResult.data) {
      return {
        success: false,
        error: "Flight data not found",
        method: "flight_lookup",
      };
    }

    // Validate eligibility
    const eligibilityResult =
      await flightValidationService.validateFlightEligibility(
        body.flightNumber,
        body.departureDate,
        body.departureAirport,
        body.arrivalAirport,
        body.passengerEmail
      );

    return {
      success: true,
      data: {
        flightData: flightLookupResult.data,
        eligibility: eligibilityResult.eligibility,
        validation: eligibilityResult.validation,
      },
      method: "flight_lookup",
    };
  } catch (error) {
    console.error("Error in flight lookup:", error);
    return {
      success: false,
      error: "Failed to lookup flight data",
      method: "flight_lookup",
    };
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "check-eligibility",
    timestamp: new Date().toISOString(),
  });
}
