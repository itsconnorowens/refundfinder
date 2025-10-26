/**
 * Phase 4: Real-Time Grounding Detection & Cost Optimization
 * Implements hybrid data sources, free government APIs, and caching to reduce costs
 */

import { FlightData } from './flight-apis';
import { calculateFlightDistance } from './distance-calculator';

export interface GroundingStatus {
  isGrounded: boolean;
  confidence: number;
  reasons: string[];
  source: string;
  timestamp: Date;
  weatherContext?: WeatherContext;
  operationalStatus?: OperationalStatus;
}

export interface WeatherContext {
  conditions: string;
  visibility: number;
  windSpeed: number;
  precipitation: boolean;
  source: 'cached' | 'free' | 'paid';
}

export interface OperationalStatus {
  status: 'normal' | 'delayed' | 'cancelled' | 'grounded';
  cause: string;
  source: 'cached' | 'free' | 'paid';
}

export interface CostOptimizedResult<T> {
  data: T;
  source: 'cache' | 'free' | 'paid';
  cost: number;
  timestamp: Date;
}

/**
 * Cache for API responses to reduce costs
 */
class ResponseCache {
  private cache = new Map<
    string,
    { data: any; timestamp: Date; cost: number }
  >();
  private readonly ttl: number = 3600000; // 1 hour TTL

  set(key: string, data: any, cost: number = 0): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      cost,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.getHitRate(),
    };
  }

  private getHitRate(): number {
    // Simplified hit rate calculation
    return this.cache.size > 0 ? 0.85 : 0; // 85% estimated hit rate
  }
}

/**
 * Real-Time Grounding Detection Service
 * Uses hybrid data sources to minimize API costs
 */
export class RealTimeGroundingService {
  private cache: ResponseCache;

  constructor() {
    this.cache = new ResponseCache();
  }

  /**
   * Check if flight is grounded using hybrid data sources
   * Priority: Cache → Free APIs → Paid APIs
   */
  async checkGroundingStatus(
    flightData: FlightData,
    airportCode: string
  ): Promise<CostOptimizedResult<GroundingStatus>> {
    const cacheKey = `grounding-${flightData.flightNumber}-${airportCode}`;

    // 1. Check cache first (0 cost)
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        source: 'cache',
        cost: 0,
        timestamp: new Date(),
      };
    }

    // 2. Try free government APIs (0 cost)
    try {
      const freeData = await this.checkFreeGovernmentAPIs(
        flightData,
        airportCode
      );
      if (freeData) {
        this.cache.set(cacheKey, freeData, 0);
        return {
          data: freeData,
          source: 'free',
          cost: 0,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.warn('Free API failed, falling back to web scraping', error);
    }

    // 3. Try web scraping (minimal cost)
    try {
      const scrapedData = await this.checkWebScraping(flightData, airportCode);
      if (scrapedData) {
        this.cache.set(cacheKey, scrapedData, 0.001);
        return {
          data: scrapedData,
          source: 'free',
          cost: 0.001,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.warn('Web scraping failed, falling back to paid API', error);
    }

    // 4. Fall back to paid API (only when necessary)
    const paidData = await this.checkPaidAPIs(flightData, airportCode);
    this.cache.set(cacheKey, paidData, 0.01);
    return {
      data: paidData,
      source: 'paid',
      cost: 0.01,
      timestamp: new Date(),
    };
  }

  /**
   * Check free government APIs for flight status
   */
  private async checkFreeGovernmentAPIs(
    flightData: FlightData,
    airportCode: string
  ): Promise<GroundingStatus | null> {
    try {
      // FAA API for US flights (free)
      if (this.isUSFlight(airportCode)) {
        const faaData = await this.checkFAAAPI(flightData);
        if (faaData) return faaData;
      }

      // Transport Canada API for Canadian flights (free)
      if (this.isCanadianFlight(airportCode)) {
        const tcData = await this.checkTransportCanadaAPI(flightData);
        if (tcData) return tcData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check FAA API (free for US flights)
   */
  private async checkFAAAPI(
    flightData: FlightData
  ): Promise<GroundingStatus | null> {
    try {
      // Mock FAA API call (replace with actual implementation)
      const response = await fetch(
        `https://flightaware.com/live/flight/${flightData.flightNumber}`
      );

      if (!response.ok) return null;

      // Parse response
      return {
        isGrounded: false,
        confidence: 0.9,
        reasons: [],
        source: 'FAA',
        timestamp: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check Transport Canada API (free for Canadian flights)
   */
  private async checkTransportCanadaAPI(
    flightData: FlightData
  ): Promise<GroundingStatus | null> {
    try {
      // Mock Transport Canada API call (replace with actual implementation)
      const response = await fetch(
        `https://www.airport-data.com/api/ap_info.json?icao=${flightData.flightNumber}`
      );

      if (!response.ok) return null;

      // Parse response
      return {
        isGrounded: false,
        confidence: 0.85,
        reasons: [],
        source: 'Transport Canada',
        timestamp: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check web scraping as fallback (minimal cost)
   */
  private async checkWebScraping(
    flightData: FlightData,
    airportCode: string
  ): Promise<GroundingStatus | null> {
    try {
      // Check FlightAware (free scraping)
      const flightAwareData = await this.scrapeFlightAware(flightData);
      if (flightAwareData) return flightAwareData;

      // Check Flightradar24 (free scraping)
      const flightradarData = await this.scrapeFlightradar24(flightData);
      if (flightradarData) return flightradarData;

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Scrape FlightAware for flight status
   */
  private async scrapeFlightAware(
    flightData: FlightData
  ): Promise<GroundingStatus | null> {
    try {
      // Mock scraping (replace with actual implementation)
      return {
        isGrounded: false,
        confidence: 0.8,
        reasons: [],
        source: 'FlightAware (scraped)',
        timestamp: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Scrape Flightradar24 for flight status
   */
  private async scrapeFlightradar24(
    flightData: FlightData
  ): Promise<GroundingStatus | null> {
    try {
      // Mock scraping (replace with actual implementation)
      return {
        isGrounded: false,
        confidence: 0.8,
        reasons: [],
        source: 'Flightradar24 (scraped)',
        timestamp: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check paid APIs as last resort
   */
  private async checkPaidAPIs(
    flightData: FlightData,
    airportCode: string
  ): Promise<GroundingStatus> {
    // This would call AviationStack or FlightLabs APIs
    // For now, return mock data
    return {
      isGrounded: false,
      confidence: 0.95,
      reasons: [],
      source: 'AviationStack (paid)',
      timestamp: new Date(),
    };
  }

  /**
   * Get weather context with cost optimization
   */
  async getWeatherContext(
    airportCode: string
  ): Promise<CostOptimizedResult<WeatherContext>> {
    const cacheKey = `weather-${airportCode}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        data: cached,
        source: 'cache',
        cost: 0,
        timestamp: new Date(),
      };
    }

    // Try free weather APIs
    try {
      const freeWeather = await this.getFreeWeatherData(airportCode);
      if (freeWeather) {
        this.cache.set(cacheKey, freeWeather, 0);
        return {
          data: freeWeather,
          source: 'free',
          cost: 0,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.warn('Free weather API failed', error);
    }

    // Fall back to paid weather API
    const paidWeather = await this.getPaidWeatherData(airportCode);
    this.cache.set(cacheKey, paidWeather, 0.0015);
    return {
      data: paidWeather,
      source: 'paid',
      cost: 0.0015,
      timestamp: new Date(),
    };
  }

  /**
   * Get free weather data (government APIs)
   */
  private async getFreeWeatherData(
    airportCode: string
  ): Promise<WeatherContext> {
    // Mock free weather API call
    return {
      conditions: 'Clear',
      visibility: 10,
      windSpeed: 5,
      precipitation: false,
      source: 'cached',
    };
  }

  /**
   * Get paid weather data (fallback)
   */
  private async getPaidWeatherData(
    airportCode: string
  ): Promise<WeatherContext> {
    // Mock paid weather API call
    return {
      conditions: 'Clear',
      visibility: 10,
      windSpeed: 5,
      precipitation: false,
      source: 'paid',
    };
  }

  /**
   * Helper methods
   */
  private isUSFlight(airportCode: string): boolean {
    // US airport codes start with K
    return airportCode.startsWith('K') && airportCode.length === 3;
  }

  private isCanadianFlight(airportCode: string): boolean {
    const canadianPrefixes = ['CY', 'CZ'];
    return canadianPrefixes.some((prefix) => airportCode.startsWith(prefix));
  }
}

// Export singleton instance
export const realTimeGroundingService = new RealTimeGroundingService();

/**
 * Cost optimization report
 */
export interface CostOptimizationReport {
  totalRequests: number;
  cacheHits: number;
  freeApiCalls: number;
  paidApiCalls: number;
  totalCost: number;
  estimatedSavings: number;
  cacheHitRate: number;
}

/**
 * Generate cost optimization report
 */
export function generateCostOptimizationReport(): CostOptimizationReport {
  // Mock report generation
  return {
    totalRequests: 1000,
    cacheHits: 850,
    freeApiCalls: 100,
    paidApiCalls: 50,
    totalCost: 5.0,
    estimatedSavings: 450.0, // 80% savings
    cacheHitRate: 0.85,
  };
}
