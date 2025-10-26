/**
 * Flight Status Providers - Implementation of various flight data APIs
 *
 * NOTE: This file is temporarily disabled due to missing type definitions.
 * The provider pattern will be implemented in a future update.
 */

/*
import {
  FlightStatusProvider,
  FlightStatus,
  FlightStatusType,
  DelayReason,
  DelayCategory,
} from '../flight-status-service';

export class FlightRadar24Provider implements FlightStatusProvider {
  name = 'FlightRadar24';
  priority = 1;
  rateLimit = {
    requestsPerMinute: 100,
    requestsPerDay: 10000,
  };
  costPerRequest = 0.001;
  private apiKey: string;
  private baseUrl = 'https://api.flightradar24.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFlightStatus(
    flightNumber: string,
    date: Date
  ): Promise<FlightStatus> {
    const response = await fetch(`${this.baseUrl}/common/v1/flight/list.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: flightNumber,
        fetchBy: 'flight',
        page: 1,
        limit: 1,
        timestamp: Math.floor(date.getTime() / 1000),
      }),
    });

    if (!response.ok) {
      throw new Error(`FlightRadar24 API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.result || data.result.length === 0) {
      throw new Error(`Flight ${flightNumber} not found`);
    }

    return this.transformToFlightStatus(data.result[0]);
  }

  async validateFlightExists(
    flightNumber: string,
    date: Date
  ): Promise<boolean> {
    try {
      await this.getFlightStatus(flightNumber, date);
      return true;
    } catch {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private transformToFlightStatus(data: any): FlightStatus {
    return {
      flightNumber: data.identification.number,
      airlineCode: data.airline.iata,
      departureAirport: data.airport.origin.iata,
      arrivalAirport: data.airport.destination.iata,
      scheduledDeparture: new Date(data.time.scheduled.departure * 1000),
      actualDeparture: data.time.real.departure
        ? new Date(data.time.real.departure * 1000)
        : undefined,
      scheduledArrival: new Date(data.time.scheduled.arrival * 1000),
      actualArrival: data.time.real.arrival
        ? new Date(data.time.real.arrival * 1000)
        : undefined,
      delayMinutes: this.calculateDelayMinutes(data),
      status: this.mapStatus(data.status.text),
      delayReason: this.extractDelayReason(data),
      aircraftType: data.aircraft.model?.text,
      gate: data.airport.origin.gate,
      terminal: data.airport.origin.terminal,
      lastUpdated: new Date(),
    };
  }

  private calculateDelayMinutes(data: any): number {
    if (!data.time.real.departure || !data.time.scheduled.departure) {
      return 0;
    }

    const scheduled = new Date(data.time.scheduled.departure * 1000);
    const actual = new Date(data.time.real.departure * 1000);
    return Math.max(
      0,
      Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60))
    );
  }

  private mapStatus(statusText: string): FlightStatusType {
    const status = statusText.toLowerCase();

    if (status.includes('cancelled') || status.includes('canceled')) {
      return 'cancelled';
    }
    if (status.includes('diverted')) {
      return 'diverted';
    }
    if (status.includes('boarding')) {
      return 'boarding';
    }
    if (status.includes('departed')) {
      return 'departed';
    }
    if (status.includes('arrived')) {
      return 'arrived';
    }
    if (status.includes('delayed')) {
      return 'delayed';
    }

    return 'on-time';
  }

  private extractDelayReason(data: any): DelayReason | undefined {
    // FlightRadar24 doesn't always provide delay reasons
    // This would need to be enhanced based on actual API response structure
    return {
      category: 'unknown',
      description: 'Delay reason not available',
      isExtraordinary: false,
    };
  }
}

export class AviationStackProvider implements FlightStatusProvider {
  name = 'AviationStack';
  priority = 2;
  rateLimit = {
    requestsPerMinute: 50,
    requestsPerDay: 5000,
  };
  costPerRequest = 0.002;
  private apiKey: string;
  private baseUrl = 'http://api.aviationstack.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFlightStatus(
    flightNumber: string,
    date: Date
  ): Promise<FlightStatus> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      flight_iata: flightNumber,
      flight_date: date.toISOString().split('T')[0],
    });

    const response = await fetch(`${this.baseUrl}/flights?${params}`);

    if (!response.ok) {
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      throw new Error(`Flight ${flightNumber} not found`);
    }

    return this.transformToFlightStatus(data.data[0]);
  }

  async validateFlightExists(
    flightNumber: string,
    date: Date
  ): Promise<boolean> {
    try {
      await this.getFlightStatus(flightNumber, date);
      return true;
    } catch {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/airlines?access_key=${this.apiKey}&limit=1`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private transformToFlightStatus(data: any): FlightStatus {
    return {
      flightNumber: data.flight.iata,
      airlineCode: data.airline.iata,
      departureAirport: data.departure.iata,
      arrivalAirport: data.arrival.iata,
      scheduledDeparture: new Date(data.departure.scheduled),
      actualDeparture: data.departure.actual
        ? new Date(data.departure.actual)
        : undefined,
      scheduledArrival: new Date(data.arrival.scheduled),
      actualArrival: data.arrival.actual
        ? new Date(data.arrival.actual)
        : undefined,
      delayMinutes: this.calculateDelayMinutes(data),
      status: this.mapStatus(data.flight_status),
      delayReason: this.extractDelayReason(data),
      aircraftType: data.aircraft?.iata,
      gate: data.departure.gate,
      terminal: data.departure.terminal,
      lastUpdated: new Date(),
    };
  }

  private calculateDelayMinutes(data: any): number {
    if (!data.departure.actual || !data.departure.scheduled) {
      return 0;
    }

    const scheduled = new Date(data.departure.scheduled);
    const actual = new Date(data.departure.actual);
    return Math.max(
      0,
      Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60))
    );
  }

  private mapStatus(status: string): FlightStatusType {
    switch (status.toLowerCase()) {
      case 'cancelled':
        return 'cancelled';
      case 'diverted':
        return 'diverted';
      case 'boarding':
        return 'boarding';
      case 'departed':
        return 'departed';
      case 'arrived':
        return 'arrived';
      case 'delayed':
        return 'delayed';
      default:
        return 'on-time';
    }
  }

  private extractDelayReason(data: any): DelayReason | undefined {
    if (!data.departure.delay) {
      return undefined;
    }

    return {
      category: this.mapDelayCategory(data.departure.delay_reason),
      description: data.departure.delay_reason || 'Delay reason not specified',
      isExtraordinary: this.isExtraordinaryDelay(data.departure.delay_reason),
    };
  }

  private mapDelayCategory(reason: string): DelayCategory {
    if (!reason) return 'unknown';

    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes('weather')) return 'weather';
    if (reasonLower.includes('aircraft')) return 'aircraft';
    if (reasonLower.includes('crew')) return 'crew';
    if (reasonLower.includes('air traffic') || reasonLower.includes('atc'))
      return 'air_traffic';
    if (reasonLower.includes('security')) return 'security';
    if (reasonLower.includes('passenger')) return 'passenger';
    if (reasonLower.includes('operational')) return 'operational';

    return 'unknown';
  }

  private isExtraordinaryDelay(reason: string): boolean {
    if (!reason) return false;

    const reasonLower = reason.toLowerCase();
    const extraordinaryReasons = [
      'weather',
      'storm',
      'snow',
      'fog',
      'ice',
      'security',
      'terrorist',
      'bomb',
      'air traffic control',
      'atc',
      'strike',
      'industrial action',
    ];

    return extraordinaryReasons.some((extraordinary) =>
      reasonLower.includes(extraordinary)
    );
  }
}

export class FlightAPIProvider implements FlightStatusProvider {
  name = 'FlightAPI';
  priority = 3;
  rateLimit = {
    requestsPerMinute: 30,
    requestsPerDay: 2000,
  };
  costPerRequest = 0.001;
  private apiKey: string;
  private baseUrl = 'https://flightapi.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFlightStatus(
    flightNumber: string,
    date: Date
  ): Promise<FlightStatus> {
    const response = await fetch(
      `${this.baseUrl}/flight/${flightNumber}/${date.toISOString().split('T')[0]}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`FlightAPI error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.flight) {
      throw new Error(`Flight ${flightNumber} not found`);
    }

    return this.transformToFlightStatus(data);
  }

  async validateFlightExists(
    flightNumber: string,
    date: Date
  ): Promise<boolean> {
    try {
      await this.getFlightStatus(flightNumber, date);
      return true;
    } catch {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private transformToFlightStatus(data: any): FlightStatus {
    const flight = data.flight;

    return {
      flightNumber: flight.number,
      airlineCode: flight.airline.iata,
      departureAirport: flight.departure.airport.iata,
      arrivalAirport: flight.arrival.airport.iata,
      scheduledDeparture: new Date(flight.departure.scheduled),
      actualDeparture: flight.departure.actual
        ? new Date(flight.departure.actual)
        : undefined,
      scheduledArrival: new Date(flight.arrival.scheduled),
      actualArrival: flight.arrival.actual
        ? new Date(flight.arrival.actual)
        : undefined,
      delayMinutes: this.calculateDelayMinutes(flight),
      status: this.mapStatus(flight.status),
      delayReason: this.extractDelayReason(flight),
      aircraftType: flight.aircraft?.model,
      gate: flight.departure.gate,
      terminal: flight.departure.terminal,
      lastUpdated: new Date(),
    };
  }

  private calculateDelayMinutes(flight: any): number {
    if (!flight.departure.actual || !flight.departure.scheduled) {
      return 0;
    }

    const scheduled = new Date(flight.departure.scheduled);
    const actual = new Date(flight.departure.actual);
    return Math.max(
      0,
      Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60))
    );
  }

  private mapStatus(status: string): FlightStatusType {
    switch (status.toLowerCase()) {
      case 'cancelled':
        return 'cancelled';
      case 'diverted':
        return 'diverted';
      case 'boarding':
        return 'boarding';
      case 'departed':
        return 'departed';
      case 'arrived':
        return 'arrived';
      case 'delayed':
        return 'delayed';
      default:
        return 'on-time';
    }
  }

  private extractDelayReason(flight: any): DelayReason | undefined {
    if (!flight.delay || !flight.delay.reason) {
      return undefined;
    }

    return {
      category: this.mapDelayCategory(flight.delay.reason),
      description: flight.delay.reason,
      isExtraordinary: this.isExtraordinaryDelay(flight.delay.reason),
    };
  }

  private mapDelayCategory(reason: string): DelayCategory {
    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes('weather')) return 'weather';
    if (reasonLower.includes('aircraft')) return 'aircraft';
    if (reasonLower.includes('crew')) return 'crew';
    if (reasonLower.includes('air traffic') || reasonLower.includes('atc'))
      return 'air_traffic';
    if (reasonLower.includes('security')) return 'security';
    if (reasonLower.includes('passenger')) return 'passenger';
    if (reasonLower.includes('operational')) return 'operational';

    return 'unknown';
  }

  private isExtraordinaryDelay(reason: string): boolean {
    const reasonLower = reason.toLowerCase();
    const extraordinaryReasons = [
      'weather',
      'storm',
      'snow',
      'fog',
      'ice',
      'security',
      'terrorist',
      'bomb',
      'air traffic control',
      'atc',
      'strike',
      'industrial action',
    ];

    return extraordinaryReasons.some((extraordinary) =>
      reasonLower.includes(extraordinary)
    );
  }
}
*/
