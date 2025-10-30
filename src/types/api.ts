/**
 * Disruption type for eligibility checks
 * @default 'delay' - for backward compatibility
 */
export type DisruptionType = 'delay' | 'cancellation' | 'denied_boarding' | 'downgrade';

/**
 * Seat class types in descending order of quality
 */
export type SeatClass = 'first' | 'business' | 'premium_economy' | 'economy';

/**
 * Check eligibility request payload
 * Supports multiple disruption scenarios
 */
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

  // Disruption type (defaults to 'delay' if not specified)
  disruptionType?: DisruptionType;

  // Common fields
  delayDuration?: string;
  delayReason?: string;

  // Cancellation-specific fields
  /** Notice period given by airline (e.g., "< 7 days", "7-14 days", "> 14 days") */
  noticeGiven?: string;
  /** Whether an alternative flight was offered */
  alternativeOffered?: boolean;
  /** Timing difference of alternative flight (e.g., "2 hours later") */
  alternativeTiming?: string;
  /** Reason for cancellation */
  cancellationReason?: string;

  // Denied boarding-specific fields
  /** Type of denied boarding: voluntary or involuntary */
  deniedBoardingType?: 'voluntary' | 'involuntary';
  /** Reason for denied boarding */
  deniedBoardingReason?: 'overbooking' | 'aircraft_change' | 'weight_restrictions' | 'other';
  /** Whether compensation was offered by airline */
  compensationOffered?: boolean;
  /** Amount of compensation offered by airline */
  compensationAmount?: number;
  /** Number of passengers denied boarding */
  passengerCount?: number;

  // Downgrade-specific fields
  /** The seat class originally booked */
  bookedClass?: SeatClass;
  /** The seat class actually received */
  actualClass?: SeatClass;
  /** Original ticket price for percentage calculation */
  ticketPrice?: number;
  /** Fare difference amount */
  fareDifference?: number;
  /** Reason for downgrade */
  downgradeReason?: string;
}

export interface FlightData {
  flightNumber?: string;
  departureDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Eligibility data with scenario-specific details
 */
export interface EligibilityData {
  isEligible?: boolean;
  compensationAmount?: string | number;
  reason?: string;
  regulation?: string;
  confidence?: number;

  // Scenario-specific data
  disruptionType?: DisruptionType;

  // Cancellation-specific
  noticeGiven?: string;
  alternativeOffered?: boolean;
  alternativeTiming?: string;
  cancellationReason?: string;

  // Denied boarding-specific
  deniedBoardingType?: 'voluntary' | 'involuntary';
  deniedBoardingReason?: string;
  compensationOffered?: boolean;

  // Downgrade-specific
  bookedClass?: SeatClass;
  actualClass?: SeatClass;
  fareDifference?: number;
  fareDifferenceRefund?: number;
  downgradeReason?: string;

  // Additional rights information
  additionalRights?: string[];

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
  // Error fields
  error?: string;
  message?: string;
  missingFields?: string[];
  field?: string;
  validation?: string;
  retryAfter?: number;
  status?: number;
  method: "flight_lookup" | "email_parsing";
}
