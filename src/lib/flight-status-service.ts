import { logger } from '@/lib/logger';

/**
 * Flight Status API Service
 *
 * Unified service for flight status verification with multiple providers
 * Includes caching, rate limiting, and cost control measures
 */

export interface FlightStatusResult {
  flightNumber: string;
  flightDate: string;
  status: 'delayed' | 'cancelled' | 'on-time' | 'unknown';
  actualDelayMinutes?: number;
  scheduledDeparture?: string;
  actualDeparture?: string;
  departureAirport: string;
  arrivalAirport: string;
  confidence: number; // 0-100
  source: 'api' | 'cache' | 'manual';
  apiProvider?: string;
  lastUpdated: string;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  actualData?: FlightStatusResult;
  userReportedMatch: boolean;
  discrepancy?: {
    field: string;
    userValue: any;
    actualValue: any;
  };
  error?: string;
}

export interface CacheEntry {
  flightNumber: string;
  flightDate: string;
  status: string;
  actualDelayMinutes?: number;
  departureAirport: string;
  arrivalAirport: string;
  cachedAt: string;
  expiresAt: string;
  apiProvider: string;
}

export interface ApiUsageLog {
  apiProvider: string;
  endpoint: string;
  requestDate: string;
  flightNumber: string;
  responseStatus: 'success' | 'error' | 'rate_limited';
  costEstimate: number;
}

class FlightStatusService {
  private cache: Map<string, CacheEntry> = new Map();
  private monthlyUsage: Map<string, number> = new Map();
  private readonly CACHE_DURATION_HOURS = 24;
  private readonly MONTHLY_LIMIT = parseInt(
    process.env.FLIGHT_API_MONTHLY_LIMIT || '100'
  );

  constructor() {
    this.loadCacheFromStorage();
    this.loadUsageFromStorage();
  }

  /**
   * Verify flight status with caching and cost controls
   */
  async verifyFlightStatus(
    flightNumber: string,
    date: string,
    userReportedDelay: number,
    userReportedType: 'delay' | 'cancellation'
  ): Promise<VerificationResult> {
    const cacheKey = this.getCacheKey(flightNumber, date);

    // 1. Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.compareWithUserData(
        cached,
        userReportedDelay,
        userReportedType
      );
    }

    // 2. Check if API is enabled and under budget
    if (!this.isApiEnabled() || !this.isUnderMonthlyLimit()) {
      return {
        verified: false,
        confidence: 0,
        userReportedMatch: true,
        error:
          'API verification unavailable - proceeding with user-reported data',
      };
    }

    // 3. Call flight status API
    try {
      const apiResult = await this.callFlightStatusApi(flightNumber, date);

      // 4. Cache the result
      this.setCache(cacheKey, apiResult);

      // 5. Compare with user data
      return this.compareWithUserData(
        apiResult,
        userReportedDelay,
        userReportedType
      );
    } catch (error) {
      logger.error('Flight verification API error:', error);
      return {
        verified: false,
        confidence: 0,
        userReportedMatch: true,
        error: 'API verification failed - proceeding with user-reported data',
      };
    }
  }

  /**
   * Get flight status from cache
   */
  private getFromCache(cacheKey: string): FlightStatusResult | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is expired
    if (new Date(cached.expiresAt) < new Date()) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      flightNumber: cached.flightNumber,
      flightDate: cached.flightDate,
      status: cached.status as any,
      actualDelayMinutes: cached.actualDelayMinutes,
      departureAirport: cached.departureAirport,
      arrivalAirport: cached.arrivalAirport,
      confidence: 90, // High confidence for cached data
      source: 'cache',
      apiProvider: cached.apiProvider,
      lastUpdated: cached.cachedAt,
    };
  }

  /**
   * Set flight status in cache
   */
  private setCache(cacheKey: string, data: FlightStatusResult): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_DURATION_HOURS);

    const cacheEntry: CacheEntry = {
      flightNumber: data.flightNumber,
      flightDate: data.flightDate,
      status: data.status,
      actualDelayMinutes: data.actualDelayMinutes,
      departureAirport: data.departureAirport,
      arrivalAirport: data.arrivalAirport,
      cachedAt: data.lastUpdated,
      expiresAt: expiresAt.toISOString(),
      apiProvider: data.apiProvider || 'unknown',
    };

    this.cache.set(cacheKey, cacheEntry);
    this.saveCacheToStorage();
  }

  /**
   * Call the configured flight status API
   */
  private async callFlightStatusApi(
    flightNumber: string,
    date: string
  ): Promise<FlightStatusResult> {
    const provider = process.env.FLIGHT_API_PROVIDER || 'aviationstack';

    // Log API usage
    this.logApiUsage(provider, 'flight_status', flightNumber);

    switch (provider) {
      case 'aviationstack':
        return await this.callAviationStack(flightNumber, date);
      case 'flightaware':
        return await this.callFlightAware(flightNumber, date);
      default:
        throw new Error(`Unknown API provider: ${provider}`);
    }
  }

  /**
   * Call AviationStack API
   */
  private async callAviationStack(
    flightNumber: string,
    date: string
  ): Promise<FlightStatusResult> {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey) {
      throw new Error('AviationStack API key not configured');
    }

    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}&flight_date=${date}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('Flight not found in AviationStack');
    }

    const flight = data.data[0];
    const delayMinutes = flight.departure?.delay || 0;

    return {
      flightNumber: flight.flight?.iata || flightNumber,
      flightDate: date,
      status:
        flight.flight_status === 'cancelled'
          ? 'cancelled'
          : delayMinutes > 0
            ? 'delayed'
            : 'on-time',
      actualDelayMinutes: delayMinutes,
      scheduledDeparture: flight.departure?.scheduled,
      actualDeparture: flight.departure?.actual,
      departureAirport: flight.departure?.iata || '',
      arrivalAirport: flight.arrival?.iata || '',
      confidence: 85,
      source: 'api',
      apiProvider: 'aviationstack',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Call FlightAware API
   */
  private async callFlightAware(
    _flightNumber: string,
    _date: string
  ): Promise<FlightStatusResult> {
    const apiKey = process.env.FLIGHTAWARE_API_KEY;
    if (!apiKey) {
      throw new Error('FlightAware API key not configured');
    }

    // FlightAware API implementation would go here
    // For now, return a placeholder
    throw new Error('FlightAware API not yet implemented');
  }

  /**
   * Compare API data with user-reported data
   */
  private compareWithUserData(
    apiData: FlightStatusResult,
    userReportedDelay: number,
    userReportedType: 'delay' | 'cancellation'
  ): VerificationResult {
    const userDelayMinutes = userReportedDelay * 60; // Convert hours to minutes
    const actualDelayMinutes = apiData.actualDelayMinutes || 0;

    // Check if user-reported type matches API data
    const typeMatch =
      (userReportedType === 'cancellation' && apiData.status === 'cancelled') ||
      (userReportedType === 'delay' && apiData.status === 'delayed');

    // Calculate confidence based on delay difference
    let confidence = 100;
    let discrepancy: any = undefined;

    if (apiData.status === 'delayed' && userReportedType === 'delay') {
      const delayDifference = Math.abs(userDelayMinutes - actualDelayMinutes);

      if (delayDifference <= 15) {
        confidence = 95; // Very close match
      } else if (delayDifference <= 60) {
        confidence = 80; // Reasonable match
      } else if (delayDifference <= 120) {
        confidence = 60; // Some discrepancy
      } else {
        confidence = 30; // Significant discrepancy
        discrepancy = {
          field: 'delay',
          userValue: `${userReportedDelay} hours`,
          actualValue: `${Math.round((actualDelayMinutes / 60) * 10) / 10} hours`,
        };
      }
    } else if (
      apiData.status === 'cancelled' &&
      userReportedType === 'cancellation'
    ) {
      confidence = 90; // High confidence for cancellation match
    } else if (!typeMatch) {
      confidence = 20; // Low confidence for type mismatch
      discrepancy = {
        field: 'type',
        userValue: userReportedType,
        actualValue: apiData.status,
      };
    }

    return {
      verified: confidence >= 60,
      confidence,
      actualData: apiData,
      userReportedMatch: confidence >= 80,
      discrepancy,
    };
  }

  /**
   * Check if API is enabled
   */
  private isApiEnabled(): boolean {
    return process.env.FLIGHT_API_ENABLED === 'true';
  }

  /**
   * Check if under monthly API limit
   */
  private isUnderMonthlyLimit(): boolean {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentUsage = this.monthlyUsage.get(currentMonth) || 0;
    return currentUsage < this.MONTHLY_LIMIT;
  }

  /**
   * Log API usage for cost tracking
   */
  private logApiUsage(
    provider: string,
    endpoint: string,
    flightNumber: string
  ): void {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentUsage = this.monthlyUsage.get(currentMonth) || 0;
    this.monthlyUsage.set(currentMonth, currentUsage + 1);

    // Save to storage
    this.saveUsageToStorage();

    // Log to Airtable (if available)
    this.logToAirtable({
      apiProvider: provider,
      endpoint,
      requestDate: new Date().toISOString(),
      flightNumber,
      responseStatus: 'success',
      costEstimate: this.getCostEstimate(provider),
    });
  }

  /**
   * Get cost estimate for API call
   */
  private getCostEstimate(provider: string): number {
    switch (provider) {
      case 'aviationstack':
        return 0.01; // $0.01 per request
      case 'flightaware':
        return 0.005; // $0.005 per request
      default:
        return 0.01;
    }
  }

  /**
   * Log API usage to Airtable
   */
  private async logToAirtable(logEntry: ApiUsageLog): Promise<void> {
    try {
      // This would integrate with Airtable API
      // For now, just log to console
      logger.info('API Usage Log:', { logEntry: logEntry });
    } catch (error) {
      logger.error('Failed to log API usage to Airtable:', error);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(flightNumber: string, date: string): string {
    return `${flightNumber.toUpperCase()}_${date}`;
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('flight_status_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem('flight_status_cache', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load usage from localStorage
   */
  private loadUsageFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('api_usage_log');
      if (stored) {
        const data = JSON.parse(stored);
        this.monthlyUsage = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.error('Failed to load usage from storage:', error);
    }
  }

  /**
   * Save usage to localStorage
   */
  private saveUsageToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.monthlyUsage);
      localStorage.setItem('api_usage_log', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save usage to storage:', error);
    }
  }

  /**
   * Get current month's API usage
   */
  getCurrentMonthUsage(): number {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return this.monthlyUsage.get(currentMonth) || 0;
  }

  /**
   * Get monthly limit
   */
  getMonthlyLimit(): number {
    return this.MONTHLY_LIMIT;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.saveCacheToStorage();
  }
}

// Export singleton instance
export const flightStatusService = new FlightStatusService();
