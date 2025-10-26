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
  status: "scheduled" | "delayed" | "cancelled" | "departed" | "arrived";
  source: "aviationstack" | "flightlabs" | "combined";
  confidence: number; // 0-1 confidence score
}

export interface FlightLookupResult {
  success: boolean;
  data?: FlightData;
  errors: string[];
  sources: string[];
  usage?: any; // Usage information from monitoring
}

// AviationStack API integration
class AviationStackAPI {
  private apiKey: string;
  private baseUrl = "http://api.aviationstack.com/v1";

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
      console.error("AviationStack API error:", error);
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
        "",
      airline: (flight.airline?.name as string) || "",
      departureAirport: (flight.departure?.iata as string) || "",
      arrivalAirport: (flight.arrival?.iata as string) || "",
      scheduledDeparture: (flight.departure?.scheduled as string) || "",
      actualDeparture: (flight.departure?.actual as string) || undefined,
      scheduledArrival: (flight.arrival?.scheduled as string) || "",
      actualArrival: (flight.arrival?.actual as string) || undefined,
      delayMinutes,
      isCancelled: flight.flight_status === "cancelled",
      cancellationReason:
        flight.flight_status === "cancelled" ? "Flight cancelled" : undefined,
      status: this.mapFlightStatus(flight.flight_status as string),
      source: "aviationstack",
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

  private mapFlightStatus(status: string): FlightData["status"] {
    const statusMap: Record<string, FlightData["status"]> = {
      scheduled: "scheduled",
      delayed: "delayed",
      cancelled: "cancelled",
      departed: "departed",
      arrived: "arrived",
      active: "departed", // Active flights are typically departed
      landed: "arrived", // Landed flights are arrived
    };
    return statusMap[status] || "scheduled";
  }
}

// FlightLabs API integration - disabled for now
/*
class FlightLabsAPI {
  private apiKey: string;
  private baseUrl = "https://api.flightlabs.co/v1";

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
      console.error("FlightLabs API error:", error);
      return null;
    }
  }

  private parseFlightLabsData(flight: Record<string, any>): FlightData {
    const delayMinutes = this.calculateDelayMinutes(
      flight.departure?.scheduled as string,
      flight.departure?.actual as string
    );

    return {
      flightNumber: (flight.flight?.iata as string) || "",
      airline: (flight.airline?.name as string) || "",
      departureAirport: (flight.departure?.iata as string) || "",
      arrivalAirport: (flight.arrival?.iata as string) || "",
      scheduledDeparture: (flight.departure?.scheduled as string) || "",
      actualDeparture: (flight.departure?.actual as string) || undefined,
      scheduledArrival: (flight.arrival?.scheduled as string) || "",
      actualArrival: (flight.arrival?.actual as string) || undefined,
      delayMinutes,
      isCancelled: flight.flight_status === "cancelled",
      cancellationReason:
        flight.flight_status === "cancelled" ? "Flight cancelled" : undefined,
      status: this.mapFlightStatus(flight.flight_status as string),
      source: "flightlabs",
      confidence: 0.7, // FlightLabs is good but slightly less reliable
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

  private mapFlightStatus(status: string): FlightData["status"] {
    const statusMap: Record<string, FlightData["status"]> = {
      scheduled: "scheduled",
      delayed: "delayed",
      cancelled: "cancelled",
      departed: "departed",
      arrived: "arrived",
      active: "departed", // Active flights are typically departed
      landed: "arrived", // Landed flights are arrived
    };
    return statusMap[status] || "scheduled";
  }
}
*/

// Import usage monitoring
import { usageMiddleware } from "./usage-middleware";
import { mockFlightDataService } from "./mock-flight-data";

// Flight lookup service - currently using only AviationStack
export class FlightLookupService {
  private aviationStack: AviationStackAPI;
  // private flightLabs: FlightLabsAPI; // Disabled for now

  constructor() {
    const aviationStackKey = process.env.AVIATIONSTACK_API_KEY;

    if (!aviationStackKey) {
      throw new Error("AviationStack API key is required");
    }

    this.aviationStack = new AviationStackAPI(aviationStackKey);
    // this.flightLabs = new FlightLabsAPI(flightLabsKey); // Disabled for now
  }

  async lookupFlight(
    flightNumber: string,
    date: string
  ): Promise<FlightLookupResult> {
    const errors: string[] = [];
    const sources: string[] = [];

    // Check usage limits before making API call
    const usageCheck = await usageMiddleware.checkUsage({
      apiName: "aviationstack",
      requestCount: 1,
      blockOnLimit: true,
      logUsage: true,
    });

    if (!usageCheck.allowed) {
      return {
        success: false,
        errors: [usageCheck.error || "API usage limit exceeded"],
        sources,
      };
    }

    try {
      // Try AviationStack API first
      const aviationStackData = await this.aviationStack.lookupFlight(
        flightNumber,
        date
      );

      if (aviationStackData) {
        sources.push("aviationstack");
        return {
          success: true,
          data: aviationStackData,
          errors,
          sources,
          usage: usageCheck.usage, // Include usage info in response
        };
      } else {
        errors.push("AviationStack: No data found");
      }
    } catch (error) {
      console.error("AviationStack API error:", error);
      errors.push(
        `AviationStack: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Fallback to mock data if AviationStack fails
    try {
      console.log("Falling back to mock flight data...");
      const mockData = await mockFlightDataService.lookupFlight(
        flightNumber,
        date
      );

      if (mockData) {
        sources.push("mock");
        return {
          success: true,
          data: mockData,
          errors: [...errors, "Using mock data - real-time data unavailable"],
          sources,
          usage: usageCheck.usage,
        };
      } else {
        errors.push("Mock data: No data found");
        return {
          success: false,
          errors,
          sources,
          usage: usageCheck.usage,
        };
      }
    } catch (error) {
      console.error("Mock data error:", error);
      errors.push(
        `Mock data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return {
        success: false,
        errors,
        sources,
        usage: usageCheck.usage,
      };
    }
  }

  // Commented out for single API implementation
  // private combineFlightData(
  //   aviationData: FlightData,
  //   flightLabsData: FlightData
  // ): FlightData {
  //   // Use AviationStack as primary source (higher confidence)
  //   const primary =
  //     aviationData.confidence > flightLabsData.confidence
  //       ? aviationData
  //       : flightLabsData;

  //   // Cross-validate critical fields
  //   const isDataConsistent = this.validateDataConsistency(
  //     aviationData,
  //     flightLabsData
  //   );

  //   if (isDataConsistent) {
  //     // Data is consistent - use primary source with higher confidence
  //     return {
  //       ...primary,
  //       source: "combined",
  //       confidence: Math.min(0.95, primary.confidence + 0.1), // Boost confidence when both sources agree
  //     };
  //   } else {
  //     // Data is inconsistent - use primary source but flag lower confidence
  //     return {
  //       ...primary,
  //       source: "combined",
  //       confidence: Math.max(0.5, primary.confidence - 0.2), // Reduce confidence when sources disagree
  //     };
  //   }
  // }

  // private validateDataConsistency(
  //   data1: FlightData,
  //   data2: FlightData
  // ): boolean {
  //   // Check if critical fields match between both sources
  //   const criticalFields = [
  //     "flightNumber",
  //     "airline",
  //     "departureAirport",
  //     "arrivalAirport",
  //     "isCancelled",
  //   ];

  //   for (const field of criticalFields) {
  //     if (
  //       data1[field as keyof FlightData] !== data2[field as keyof FlightData]
  //     ) {
  //       return false;
  //     }
  //   }

  //   // Check if delay times are within reasonable range (within 30 minutes)
  //   const delayDiff = Math.abs(data1.delayMinutes - data2.delayMinutes);
  //   if (delayDiff > 30) {
  //     return false;
  //   }

  //   return true;
  // }
}

// Export singleton instance
export const flightLookupService = new FlightLookupService();
