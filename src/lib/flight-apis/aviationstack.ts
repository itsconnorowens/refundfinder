import { logger } from '@/lib/logger';

/**
 * AviationStack API Provider
 *
 * Implements flight status queries using AviationStack API
 * Handles rate limiting and error responses
 */

export interface AviationStackFlight {
  flight: {
    number: string;
    iata: string;
    icao: string;
  };
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  aircraft?: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  };
}

export interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationStackFlight[];
}

export class AviationStackProvider {
  private apiKey: string;
  private baseUrl = 'http://api.aviationstack.com/v1';
  private rateLimitDelay = 1000; // 1 second between requests
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
  ): Promise<AviationStackFlight | null> {
    await this.enforceRateLimit();

    const params = new URLSearchParams({
      access_key: this.apiKey,
      flight_iata: flightNumber,
      flight_date: date,
      limit: '1',
    });

    const url = `${this.baseUrl}/flights?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: AviationStackResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        return null;
      }

      return data.data[0];
    } catch (error: unknown) {
      logger.error('AviationStack API error:', error);
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
  ): Promise<AviationStackFlight[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams({
      access_key: this.apiKey,
      dep_iata: departure,
      arr_iata: arrival,
      flight_date: date,
      limit: '10',
    });

    const url = `${this.baseUrl}/flights?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: AviationStackResponse = await response.json();

      return data.data || [];
    } catch (error: unknown) {
      logger.error('AviationStack API error:', error);
      throw error;
    }
  }

  /**
   * Check if flight was delayed
   */
  isDelayed(flight: AviationStackFlight): boolean {
    const departureDelay = flight.departure.delay || 0;
    const arrivalDelay = flight.arrival.delay || 0;
    return departureDelay > 0 || arrivalDelay > 0;
  }

  /**
   * Check if flight was cancelled
   */
  isCancelled(flight: AviationStackFlight): boolean {
    return flight.flight_status === 'cancelled';
  }

  /**
   * Get delay duration in minutes
   */
  getDelayMinutes(flight: AviationStackFlight): number {
    return flight.departure.delay || 0;
  }

  /**
   * Get delay duration in hours
   */
  getDelayHours(flight: AviationStackFlight): number {
    return this.getDelayMinutes(flight) / 60;
  }

  /**
   * Format delay duration for display
   */
  formatDelay(flight: AviationStackFlight): string {
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
  getStatusSummary(flight: AviationStackFlight): string {
    if (this.isCancelled(flight)) {
      return 'Cancelled';
    } else if (this.isDelayed(flight)) {
      return `Delayed ${this.formatDelay(flight)}`;
    } else {
      return 'On time';
    }
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
      const params = new URLSearchParams({
        access_key: this.apiKey,
        limit: '1',
      });

      const url = `${this.baseUrl}/flights?${params}`;
      const response = await fetch(url);

      return response.ok;
    } catch {
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
      provider: 'AviationStack',
      costPerRequest: 0.01, // $0.01 per request
      rateLimit: '1000 requests/hour',
    };
  }
}

// Export default instance
export const aviationStackProvider = new AviationStackProvider(
  process.env.AVIATIONSTACK_API_KEY || ''
);
