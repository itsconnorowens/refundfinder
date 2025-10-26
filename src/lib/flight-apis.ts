// Flight API integration with AviationStack and FlightLabs
// Using both APIs for improved data quality and reliability

// Flight API integration with AviationStack and FlightLabs
// Using both APIs for improved data quality and reliability

export interface FlightData {
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  scheduledArrival: string;
  actualArrival?: string;
  delayMinutes: number;
  isCancelled: boolean;
  cancellationReason?: string;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'departed' | 'arrived';
  source: 'aviationstack' | 'flightlabs' | 'combined';
  confidence: number; // 0-1 confidence score
  operatingCarrier?: string; // For codeshare flights
  aircraftType?: string;
  gate?: string;
  terminal?: string;
}

export interface FlightLookupResult {
  success: boolean;
  data?: FlightData;
  errors: string[];
  sources: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlightStatus {
  flightNumber: string;
  status: FlightData['status'];
  delayMinutes: number;
  isCancelled: boolean;
  actualDeparture?: string;
  actualArrival?: string;
  source: string;
  confidence: number;
}

// AviationStack API integration
class AviationStackAPI {
  private apiKey: string;
  private baseUrl = 'http://api.aviationstack.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async lookupFlight(
    flightNumber: string,
    date: string
  ): Promise<FlightData | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flights?access_key=${this.apiKey}&flight_number=${flightNumber}&flight_date=${date}`
      );

      if (!response.ok) {
        throw new Error(`AviationStack API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const flight = data.data[0];
      return this.parseAviationStackData(flight);
    } catch (error) {
      console.error('AviationStack API error:', error);
      return null;
    }
  }

  private parseAviationStackData(flight: Record<string, any>): FlightData {
    const delayMinutes = this.calculateDelayMinutes(
      flight.departure?.scheduled as string,
      flight.departure?.actual as string
    );

    return {
      flightNumber:
        (flight.flight?.iata as string) ||
        (flight.flight?.number as string) ||
        '',
      airline: (flight.airline?.name as string) || '',
      departureAirport: (flight.departure?.iata as string) || '',
      arrivalAirport: (flight.arrival?.iata as string) || '',
      scheduledDeparture: (flight.departure?.scheduled as string) || '',
      actualDeparture: (flight.departure?.actual as string) || undefined,
      scheduledArrival: (flight.arrival?.scheduled as string) || '',
      actualArrival: (flight.arrival?.actual as string) || undefined,
      delayMinutes,
      isCancelled: flight.flight_status === 'cancelled',
      cancellationReason:
        flight.flight_status === 'cancelled' ? 'Flight cancelled' : undefined,
      status: this.mapFlightStatus(flight.flight_status as string),
      source: 'aviationstack',
      confidence: 0.8, // AviationStack is generally reliable
    };
  }

  private calculateDelayMinutes(scheduled: string, actual: string): number {
    if (!scheduled || !actual) {
      return 0;
    }

    const scheduledTime = new Date(scheduled);
    const actualTime = new Date(actual);
    return Math.round(
      (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60)
    );
  }

  private mapFlightStatus(status: string): FlightData['status'] {
    const statusMap: Record<string, FlightData['status']> = {
      scheduled: 'scheduled',
      delayed: 'delayed',
      cancelled: 'cancelled',
      departed: 'departed',
      arrived: 'arrived',
      active: 'departed', // Active flights are typically departed
      landed: 'arrived', // Landed flights are arrived
    };
    return statusMap[status] || 'scheduled';
  }
}

// FlightLabs API integration
class FlightLabsAPI {
  private apiKey: string;
  private baseUrl = 'https://api.flightlabs.co/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async lookupFlight(
    flightNumber: string,
    date: string
  ): Promise<FlightData | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flight?access_key=${this.apiKey}&flight_iata=${flightNumber}&flight_date=${date}`
      );

      if (!response.ok) {
        throw new Error(`FlightLabs API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const flight = data.data[0];
      return this.parseFlightLabsData(flight);
    } catch (error) {
      console.error('FlightLabs API error:', error);
      return null;
    }
  }

  private parseFlightLabsData(flight: Record<string, any>): FlightData {
    const delayMinutes = this.calculateDelayMinutes(
      flight.departure?.scheduled as string,
      flight.departure?.actual as string
    );

    return {
      flightNumber: (flight.flight?.iata as string) || '',
      airline: (flight.airline?.name as string) || '',
      departureAirport: (flight.departure?.iata as string) || '',
      arrivalAirport: (flight.arrival?.iata as string) || '',
      scheduledDeparture: (flight.departure?.scheduled as string) || '',
      actualDeparture: (flight.departure?.actual as string) || undefined,
      scheduledArrival: (flight.arrival?.scheduled as string) || '',
      actualArrival: (flight.arrival?.actual as string) || undefined,
      delayMinutes,
      isCancelled: flight.flight_status === 'cancelled',
      cancellationReason:
        flight.flight_status === 'cancelled' ? 'Flight cancelled' : undefined,
      status: this.mapFlightStatus(flight.flight_status as string),
      source: 'flightlabs',
      confidence: 0.7, // FlightLabs is good but slightly less reliable
      operatingCarrier: flight.aircraft?.registration
        ? flight.aircraft.registration
        : undefined,
      aircraftType: flight.aircraft?.type ? flight.aircraft.type : undefined,
      gate: flight.departure?.gate ? flight.departure.gate : undefined,
      terminal: flight.departure?.terminal
        ? flight.departure.terminal
        : undefined,
    };
  }

  private calculateDelayMinutes(scheduled: string, actual: string): number {
    if (!scheduled || !actual) {
      return 0;
    }

    const scheduledTime = new Date(scheduled);
    const actualTime = new Date(actual);
    return Math.round(
      (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60)
    );
  }

  private mapFlightStatus(status: string): FlightData['status'] {
    const statusMap: Record<string, FlightData['status']> = {
      scheduled: 'scheduled',
      delayed: 'delayed',
      cancelled: 'cancelled',
      departed: 'departed',
      arrived: 'arrived',
      active: 'departed', // Active flights are typically departed
      landed: 'arrived', // Landed flights are arrived
    };
    return statusMap[status] || 'scheduled';
  }
}

// Flight lookup service with dual API support
export class FlightLookupService {
  private aviationStack: AviationStackAPI;
  private flightLabs: FlightLabsAPI;

  constructor() {
    const aviationStackKey = process.env.AVIATIONSTACK_API_KEY;
    const flightLabsKey = process.env.FLIGHTLABS_API_KEY;

    if (!aviationStackKey) {
      throw new Error('AviationStack API key is required');
    }

    this.aviationStack = new AviationStackAPI(aviationStackKey);

    if (flightLabsKey) {
      this.flightLabs = new FlightLabsAPI(flightLabsKey);
    } else {
      console.warn('FlightLabs API key not provided, using AviationStack only');
      this.flightLabs = null as any;
    }
  }

  async lookupFlight(
    flightNumber: string,
    date: string
  ): Promise<FlightLookupResult> {
    const errors: string[] = [];
    const sources: string[] = [];

    // Validate flight number format
    const validationResult = this.validateFlightNumber(flightNumber);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors,
        sources: [],
      };
    }

    // Try AviationStack first (primary API)
    let aviationData: FlightData | null = null;
    try {
      aviationData = await this.aviationStack.lookupFlight(flightNumber, date);
      if (aviationData) {
        sources.push('aviationstack');
        // Return immediately if we have good data from primary API
        return {
          success: true,
          data: aviationData,
          errors,
          sources,
        };
      }
    } catch (error) {
      errors.push(
        `AviationStack: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Only try FlightLabs if AviationStack failed or returned no data
    if (this.flightLabs) {
      try {
        const flightLabsData = await this.flightLabs.lookupFlight(
          flightNumber,
          date
        );
        if (flightLabsData) {
          sources.push('flightlabs');
          return {
            success: true,
            data: flightLabsData,
            errors,
            sources,
          };
        }
      } catch (error) {
        errors.push(
          `FlightLabs: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // No data found from any API
    return {
      success: false,
      errors: errors.length > 0 ? errors : ['No flight data found'],
      sources,
    };
  }

  /**
   * Validate flight number format
   */
  validateFlightNumber(flightNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!flightNumber || flightNumber.trim().length === 0) {
      errors.push('Flight number is required');
      return { isValid: false, errors, warnings };
    }

    const cleanNumber = flightNumber.trim().toUpperCase();

    // Check format: 2-3 letters followed by 1-4 digits
    const flightNumberRegex = /^[A-Z]{2,3}\d{1,4}$/;
    if (!flightNumberRegex.test(cleanNumber)) {
      errors.push(
        'Invalid flight number format. Expected format: 2-3 letters followed by 1-4 digits (e.g., AA123, BA1234)'
      );
    }

    // Check if airline code is too long
    const airlineCode = cleanNumber.match(/^[A-Z]{2,3}/)?.[0];
    if (airlineCode && airlineCode.length > 2) {
      warnings.push(
        'Airline code is longer than standard IATA format (2 letters)'
      );
    }

    // Check if flight number is too long
    if (cleanNumber.length > 6) {
      warnings.push('Flight number is longer than typical format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate if flight exists and is valid
   */
  async validateFlightExists(
    flightNumber: string,
    date: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // First validate format
    const formatValidation = this.validateFlightNumber(flightNumber);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // Check if date is valid
    const flightDate = new Date(date);
    if (isNaN(flightDate.getTime())) {
      errors.push('Invalid date format');
      return { isValid: false, errors, warnings };
    }

    // Check if date is in the past (for compensation claims)
    const now = new Date();
    const sixYearsAgo = new Date(
      now.getFullYear() - 6,
      now.getMonth(),
      now.getDate()
    );

    if (flightDate < sixYearsAgo) {
      errors.push(
        'Flight date is too old for compensation claims (more than 6 years ago)'
      );
    } else if (flightDate > now) {
      warnings.push('Flight date is in the future - validation may be limited');
    }

    // Try to lookup the flight
    const lookupResult = await this.lookupFlight(flightNumber, date);
    if (!lookupResult.success) {
      errors.push('Flight not found in available data sources');
      if (lookupResult.errors.length > 0) {
        errors.push(...lookupResult.errors);
      }
    } else {
      warnings.push(`Flight found via: ${lookupResult.sources.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get flight status
   */
  async getFlightStatus(
    flightNumber: string,
    date: string
  ): Promise<FlightStatus | null> {
    const lookupResult = await this.lookupFlight(flightNumber, date);

    if (!lookupResult.success || !lookupResult.data) {
      return null;
    }

    const data = lookupResult.data;
    return {
      flightNumber: data.flightNumber,
      status: data.status,
      delayMinutes: data.delayMinutes,
      isCancelled: data.isCancelled,
      actualDeparture: data.actualDeparture,
      actualArrival: data.actualArrival,
      source: data.source,
      confidence: data.confidence,
    };
  }
}

// Export singleton instance
export const flightLookupService = new FlightLookupService();
