import { logger } from '@/lib/logger';

/**
 * Flight Validation Service
 *
 * Provides flight status verification with caching and cost controls
 * Integrates with multiple flight status APIs
 */

import {
  flightStatusService,
  VerificationResult,
} from './flight-status-service';

export interface FlightValidationRequest {
  flightNumber: string;
  flightDate: string;
  userReportedDelay: number;
  userReportedType: 'delay' | 'cancellation';
  departureAirport?: string;
  arrivalAirport?: string;
}

export interface FlightValidationResponse {
  verified: boolean;
  confidence: number;
  status: 'verified' | 'unverified' | 'failed' | 'manual';
  actualData?: {
    status: 'delayed' | 'cancelled' | 'on-time' | 'unknown';
    delayMinutes?: number;
    delayHours?: number;
    scheduledDeparture?: string;
    actualDeparture?: string;
  };
  userReportedMatch: boolean;
  discrepancy?: {
    field: string;
    userValue: any;
    actualValue: any;
  };
  message: string;
  error?: string;
}

export class FlightValidationService {
  /**
   * Validate flight status with user-reported data
   */
  async validateFlight(
    request: FlightValidationRequest
  ): Promise<FlightValidationResponse> {
    try {
      const result = await flightStatusService.verifyFlightStatus(
        request.flightNumber,
        request.flightDate,
        request.userReportedDelay,
        request.userReportedType
      );

      return this.formatValidationResponse(result);
    } catch (error) {
      logger.error('Flight validation error:', error);
      return {
        verified: false,
        confidence: 0,
        status: 'failed',
        userReportedMatch: true,
        message: 'Unable to verify flight status',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format verification result for API response
   */
  private formatValidationResponse(
    result: VerificationResult
  ): FlightValidationResponse {
    const status = this.determineStatus(result);
    const message = this.generateMessage(result, status);

    return {
      verified: result.verified,
      confidence: result.confidence,
      status,
      actualData: result.actualData
        ? {
            status: result.actualData.status,
            delayMinutes: result.actualData.actualDelayMinutes,
            delayHours: result.actualData.actualDelayMinutes
              ? Math.round((result.actualData.actualDelayMinutes / 60) * 10) /
                10
              : undefined,
            scheduledDeparture: result.actualData.scheduledDeparture,
            actualDeparture: result.actualData.actualDeparture,
          }
        : undefined,
      userReportedMatch: result.userReportedMatch,
      discrepancy: result.discrepancy,
      message,
      error: result.error,
    };
  }

  /**
   * Determine validation status
   */
  private determineStatus(
    result: VerificationResult
  ): 'verified' | 'unverified' | 'failed' | 'manual' {
    if (result.error) {
      return 'failed';
    }

    if (result.verified && result.confidence >= 80) {
      return 'verified';
    }

    if (result.verified && result.confidence >= 60) {
      return 'unverified';
    }

    return 'manual';
  }

  /**
   * Generate user-friendly message
   */
  private generateMessage(result: VerificationResult, status: string): string {
    if (result.error) {
      return 'Unable to verify flight status. Proceeding with your reported information.';
    }

    switch (status) {
      case 'verified':
        if (result.actualData) {
          const delayText = result.actualData.actualDelayMinutes
            ? `${Math.round((result.actualData.actualDelayMinutes / 60) * 10) / 10} hours`
            : 'as reported';
          return `✓ Verified: Flight ${result.actualData.status} ${delayText}`;
        }
        return '✓ Flight status verified';

      case 'unverified':
        if (result.discrepancy) {
          return `⚠ Minor discrepancy detected: ${result.discrepancy.field} differs from reported data`;
        }
        return '⚠ Flight status partially verified';

      case 'manual':
        return '⚠ Unable to verify automatically. Your claim will be manually reviewed.';

      case 'failed':
        return 'Unable to verify flight status. Proceeding with your reported information.';

      default:
        return 'Flight status verification completed';
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    currentMonthUsage: number;
    monthlyLimit: number;
    cacheHitRate: number;
    isApiEnabled: boolean;
  } {
    return {
      currentMonthUsage: flightStatusService.getCurrentMonthUsage(),
      monthlyLimit: flightStatusService.getMonthlyLimit(),
      cacheHitRate: 0, // Would need to implement cache hit tracking
      isApiEnabled: process.env.FLIGHT_API_ENABLED === 'true',
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    flightStatusService.clearCache();
  }

  /**
   * Validate multiple flights in batch
   */
  async validateBatch(
    requests: FlightValidationRequest[]
  ): Promise<FlightValidationResponse[]> {
    const results: FlightValidationResponse[] = [];

    // Process requests sequentially to respect rate limits
    for (const request of requests) {
      const result = await this.validateFlight(request);
      results.push(result);

      // Add small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Check if flight validation is available
   */
  isValidationAvailable(): boolean {
    return (
      process.env.FLIGHT_API_ENABLED === 'true' &&
      (!!process.env.AVIATIONSTACK_API_KEY || !!process.env.FLIGHTAWARE_API_KEY)
    );
  }

  /**
   * Get validation service status
   */
  getServiceStatus(): {
    available: boolean;
    provider: string;
    monthlyUsage: number;
    monthlyLimit: number;
    remainingRequests: number;
  } {
    const provider = process.env.FLIGHT_API_PROVIDER || 'aviationstack';
    const currentUsage = flightStatusService.getCurrentMonthUsage();
    const limit = flightStatusService.getMonthlyLimit();

    return {
      available: this.isValidationAvailable(),
      provider,
      monthlyUsage: currentUsage,
      monthlyLimit: limit,
      remainingRequests: Math.max(0, limit - currentUsage),
    };
  }
}

// Export singleton instance
export const flightValidationService = new FlightValidationService();
