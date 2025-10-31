import { logger } from '@/lib/logger';

/**
 * FlightAware AeroAPI Provider
 *
 * Implements flight status queries using FlightAware AeroAPI
 * Handles rate limiting and error responses
 */

export interface FlightAwareFlight {
  ident: string;
  ident_iata: string;
  ident_icao: string;
  fa_flight_id: string;
  operator: string;
  operator_iata: string;
  operator_icao: string;
  flight_number: string;
  registration: string;
  atc_ident: string;
  inbound_fa_flight_id?: string;
  codeshares?: string[];
  codeshares_iata?: string[];
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: {
    code: string;
    code_iata: string;
    code_icao: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  destination: {
    code: string;
    code_iata: string;
    code_icao: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  departure_delay: number;
  arrival_delay: number;
  filed_ete: number;
  scheduled_out: string;
  estimated_out: string;
  actual_out?: string;
  scheduled_off: string;
  estimated_off: string;
  actual_off?: string;
  scheduled_on: string;
  estimated_on: string;
  actual_on?: string;
  scheduled_in: string;
  estimated_in: string;
  actual_in?: string;
  progress_percent: number;
  status: string;
  aircraft_type: string;
  route_distance: number;
  filed_airspeed_kts: number;
  filed_altitude: number;
  route: string;
  baggage_claim?: string;
  seats_cabin_first?: number;
  seats_cabin_business?: number;
  seats_cabin_coach?: number;
  gate_origin?: string;
  gate_destination?: string;
  terminal_origin?: string;
  terminal_destination?: string;
  type: string;
  scheduled_ete: number;
  fdt: string;
  redacted_aircraft_type: string;
  waypoints?: any[];
  last_position?: {
    fa_flight_id: string;
    altitude: number;
    altitude_change: string;
    groundspeed: number;
    heading: number;
    latitude: number;
    longitude: number;
    timestamp: string;
    update_type: string;
  };
  bounding_box?: number[];
}

export interface FlightAwareResponse {
  links: {
    next?: string;
    prev?: string;
  };
  num_pages: number;
  flights: FlightAwareFlight[];
}

export class FlightAwareProvider {
  private apiKey: string;
  private baseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private rateLimitDelay = 2000; // 2 seconds between requests
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get flight status by flight number and date
   */
  async getFlightStatus(
    flightNumber: string,
    date: string
  ): Promise<FlightAwareFlight | null> {
    await this.enforceRateLimit();

    const params = new URLSearchParams({
      ident: flightNumber,
      start: `${date}T00:00:00Z`,
      end: `${date}T23:59:59Z`,
      max_pages: '1',
    });

    const url = `${this.baseUrl}/flights/search?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'x-apikey': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: FlightAwareResponse = await response.json();

      if (!data.flights || data.flights.length === 0) {
        return null;
      }

      return data.flights[0];
    } catch (error) {
      logger.error('FlightAware API error:', error);
      throw error;
    }
  }

  /**
   * Get flight status by route and date
   */
  async getFlightByRoute(
    departure: string,
    arrival: string,
    date: string
  ): Promise<FlightAwareFlight[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams({
      origin: departure,
      destination: arrival,
      start: `${date}T00:00:00Z`,
      end: `${date}T23:59:59Z`,
      max_pages: '5',
    });

    const url = `${this.baseUrl}/flights/search?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'x-apikey': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: FlightAwareResponse = await response.json();

      return data.flights || [];
    } catch (error) {
      logger.error('FlightAware API error:', error);
      throw error;
    }
  }

  /**
   * Check if flight was delayed
   */
  isDelayed(flight: FlightAwareFlight): boolean {
    const departureDelay = flight.departure_delay || 0;
    const arrivalDelay = flight.arrival_delay || 0;
    return departureDelay > 0 || arrivalDelay > 0;
  }

  /**
   * Check if flight was cancelled
   */
  isCancelled(flight: FlightAwareFlight): boolean {
    return flight.cancelled === true;
  }

  /**
   * Get delay duration in minutes
   */
  getDelayMinutes(flight: FlightAwareFlight): number {
    return flight.departure_delay || 0;
  }

  /**
   * Get delay duration in hours
   */
  getDelayHours(flight: FlightAwareFlight): number {
    return this.getDelayMinutes(flight) / 60;
  }

  /**
   * Format delay duration for display
   */
  formatDelay(flight: FlightAwareFlight): string {
    const minutes = this.getDelayMinutes(flight);
    if (minutes === 0) return 'On time';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Get flight status summary
   */
  getStatusSummary(flight: FlightAwareFlight): string {
    if (this.isCancelled(flight)) {
      return 'Cancelled';
    } else if (this.isDelayed(flight)) {
      return `Delayed ${this.formatDelay(flight)}`;
    } else {
      return 'On time';
    }
  }

  /**
   * Get flight progress percentage
   */
  getProgress(flight: FlightAwareFlight): number {
    return flight.progress_percent || 0;
  }

  /**
   * Check if flight is in progress
   */
  isInProgress(flight: FlightAwareFlight): boolean {
    return flight.progress_percent > 0 && flight.progress_percent < 100;
  }

  /**
   * Check if flight has landed
   */
  hasLanded(flight: FlightAwareFlight): boolean {
    return flight.progress_percent === 100;
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/flights/search?max_pages=1`;
      const response = await fetch(url, {
        headers: {
          'x-apikey': this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API usage information
   */
  getUsageInfo(): {
    provider: string;
    costPerRequest: number;
    rateLimit: string;
  } {
    return {
      provider: 'FlightAware',
      costPerRequest: 0.005, // $0.005 per request
      rateLimit: '1000 requests/hour',
    };
  }
}

// Export default instance
export const flightAwareProvider = new FlightAwareProvider(
  process.env.FLIGHTAWARE_API_KEY || ''
);
