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

export interface FlightData {
  flightNumber?: string;
  departureDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  status?: string;
  [key: string]: unknown;
}

export interface EligibilityData {
  isEligible?: boolean;
  compensationAmount?: string | number;
  reason?: string;
  [key: string]: unknown;
}

export interface ValidationData {
  isValid?: boolean;
  [key: string]: unknown;
}

export interface CheckEligibilityResponse {
  success: boolean;
  data?: {
    flightData: FlightData;
    eligibility: EligibilityData;
    validation: ValidationData;
  };
  error?: string;
  method: "flight_lookup" | "email_parsing";
}
