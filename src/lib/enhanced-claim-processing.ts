import { logger } from '@/lib/logger';

/**
 * Enhanced Email Parser with Flight Status Integration
 */

import {
  flightStatusService,
  FlightStatusResult as _FlightStatusResult,
  VerificationResult,
} from './flight-status-service';
import {
  AirportStatusManager,
  DelayAttributionEngine,
} from './airport-status-service';

// Define the service type
type FlightStatusServiceType = typeof flightStatusService;

export interface ParsedFlightData {
  flightNumber: string;
  airlineCode: string;
  departureAirport: string;
  arrivalAirport: string;
  flightDate: Date;
  delayMinutes: number;
  delayReason?: string;
  status: 'delayed' | 'cancelled' | 'on-time';

  // Enhanced fields from real-time verification
  verifiedDelay?: number;
  verifiedStatus?: string;
  verifiedDelayReason?: string;
  isVerified: boolean;
  verificationTimestamp?: Date;

  // Weather context
  weatherContext?: {
    isWeatherRelated: boolean;
    severity: 'none' | 'light' | 'moderate' | 'severe';
    attribution: 'weather' | 'operational' | 'airline' | 'unknown';
    confidence: number;
  };
}

export class EnhancedEmailParser {
  private flightStatusService: FlightStatusServiceType;
  private airportStatusManager: AirportStatusManager;
  private delayAttributionEngine: DelayAttributionEngine;

  constructor(
    flightStatusService: FlightStatusServiceType,
    airportStatusManager: AirportStatusManager,
    delayAttributionEngine: DelayAttributionEngine
  ) {
    this.flightStatusService = flightStatusService;
    this.airportStatusManager = airportStatusManager;
    this.delayAttributionEngine = delayAttributionEngine;
  }

  async parseFlightEmail(emailContent: string): Promise<ParsedFlightData> {
    // 1. Parse basic flight details from email
    const basicData = await this.parseBasicFlightDetails(emailContent);

    // 2. Verify flight exists and get real-time status
    try {
      const flightStatus = await this.flightStatusService.verifyFlightStatus(
        basicData.flightNumber,
        basicData.flightDate.toISOString().split('T')[0],
        basicData.delayMinutes,
        basicData.status === 'cancelled' ? 'cancellation' : 'delay'
      );

      // 3. Get airport status for weather context
      const [departureStatus, arrivalStatus] = await Promise.all([
        this.airportStatusManager.getAirportStatus(basicData.departureAirport),
        this.airportStatusManager.getAirportStatus(basicData.arrivalAirport),
      ]);

      // 4. Cross-reference with email data and add weather context
      return this.crossReferenceData(
        basicData,
        flightStatus,
        departureStatus,
        arrivalStatus
      );
    } catch (error: unknown) {
      logger.warn('Flight status verification failed:', { error: error });
      return basicData; // Fallback to email-only data
    }
  }

  private async parseBasicFlightDetails(
    emailContent: string
  ): Promise<ParsedFlightData> {
    // This would integrate with existing email parsing logic
    // For now, return mock data structure

    const flightNumberMatch = emailContent.match(/([A-Z]{2,3})\s*(\d{3,4})/);
    const airlineCode = flightNumberMatch?.[1] || 'UNKNOWN';
    const flightNumber = flightNumberMatch
      ? `${airlineCode}${flightNumberMatch[2]}`
      : 'UNKNOWN';

    const delayMatch = emailContent.match(
      /(?:delayed by|delay|late)\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i
    );
    let delayMinutes = delayMatch ? parseInt(delayMatch[1]) : 0;

    // Convert hours to minutes if needed
    if (emailContent.toLowerCase().includes('hour') && delayMinutes < 60) {
      delayMinutes *= 60;
    }

    const airportMatch = emailContent.match(/([A-Z]{3})\s*to\s*([A-Z]{3})/);
    const departureAirport = airportMatch?.[1] || 'UNKNOWN';
    const arrivalAirport = airportMatch?.[2] || 'UNKNOWN';

    const dateMatch = emailContent.match(
      /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
    );
    const flightDate = dateMatch
      ? new Date(
          parseInt(dateMatch[3]),
          parseInt(dateMatch[1]) - 1,
          parseInt(dateMatch[2])
        )
      : new Date();

    return {
      flightNumber,
      airlineCode,
      departureAirport,
      arrivalAirport,
      flightDate,
      delayMinutes,
      status: delayMinutes > 0 ? 'delayed' : 'on-time',
      isVerified: false,
    };
  }

  private async crossReferenceData(
    emailData: ParsedFlightData,
    flightStatus: VerificationResult,
    departureStatus: any,
    _arrivalStatus: any
  ): Promise<ParsedFlightData> {
    // 1. Verify delay information
    const verifiedDelay = flightStatus.actualData?.actualDelayMinutes || 0;
    const _delayDiscrepancy = Math.abs(emailData.delayMinutes - verifiedDelay);

    // 2. Get delay attribution
    const delayAttribution = await this.delayAttributionEngine.attributeDelay(
      emailData,
      departureStatus
    );

    return {
      ...emailData,
      verifiedDelay,
      verifiedStatus: flightStatus.actualData?.status || emailData.status,
      verifiedDelayReason: emailData.delayReason,
      isVerified: true,
      verificationTimestamp: new Date(),
      weatherContext: {
        isWeatherRelated: delayAttribution.isWeatherRelated,
        severity: delayAttribution.weatherSeverity,
        attribution: delayAttribution.attribution,
        confidence: delayAttribution.confidence,
      },
    };
  }
}

/**
 * Enhanced Eligibility Calculator with Weather Context
 */

export interface EligibilityResult {
  isEligible: boolean;
  reason: string;
  compensationAmount: number;
  delayMinutes: number;
  regulation: string;

  // Enhanced fields
  weatherContext?: {
    isWeatherRelated: boolean;
    severity: 'none' | 'light' | 'moderate' | 'severe';
    attribution: 'weather' | 'operational' | 'airline' | 'unknown';
    confidence: number;
  };

  verificationStatus?: {
    isVerified: boolean;
    verificationTimestamp?: Date;
    delayDiscrepancy?: number;
  };
}

export class WeatherAwareEligibilityCalculator {
  private airportStatusManager: AirportStatusManager;
  private delayAttributionEngine: DelayAttributionEngine;

  constructor(
    airportStatusManager: AirportStatusManager,
    delayAttributionEngine: DelayAttributionEngine
  ) {
    this.airportStatusManager = airportStatusManager;
    this.delayAttributionEngine = delayAttributionEngine;
  }

  async checkEligibility(
    flightData: ParsedFlightData
  ): Promise<EligibilityResult> {
    // 1. Basic eligibility check
    const basicEligibility = this.calculateBasicEligibility(flightData);

    // 2. Get airport status for departure and arrival
    let delayAttribution = null;
    try {
      const [departureStatus, _arrivalStatus] = await Promise.all([
        this.airportStatusManager.getAirportStatus(flightData.departureAirport),
        this.airportStatusManager.getAirportStatus(flightData.arrivalAirport),
      ]);

      // 3. Attribute delay to weather or operational factors
      delayAttribution = await this.delayAttributionEngine.attributeDelay(
        flightData,
        departureStatus
      );
    } catch (error: unknown) {
      logger.warn('Airport status verification failed:', { error: error });
      // Continue with basic eligibility if airport status fails
    }

    // 4. Adjust eligibility based on weather impact
    return this.adjustEligibilityForWeather(
      basicEligibility,
      delayAttribution,
      flightData
    );
  }

  private calculateBasicEligibility(
    flightData: ParsedFlightData
  ): EligibilityResult {
    const delayMinutes = flightData.verifiedDelay || flightData.delayMinutes;

    // Basic EU261 eligibility rules
    if (delayMinutes < 180) {
      // Less than 3 hours
      return {
        isEligible: false,
        reason: 'Delay less than 3 hours',
        compensationAmount: 0,
        delayMinutes,
        regulation: 'EU261',
      };
    }

    if (delayMinutes >= 180 && delayMinutes < 240) {
      // 3-4 hours
      return {
        isEligible: true,
        reason: 'Delay 3-4 hours',
        compensationAmount: 300,
        delayMinutes,
        regulation: 'EU261',
      };
    }

    if (delayMinutes >= 240 && delayMinutes < 360) {
      // 4-6 hours
      return {
        isEligible: true,
        reason: 'Delay 4-6 hours',
        compensationAmount: 600,
        delayMinutes,
        regulation: 'EU261',
      };
    }

    // 6+ hours
    return {
      isEligible: true,
      reason: 'Delay 6+ hours',
      compensationAmount: 600,
      delayMinutes,
      regulation: 'EU261',
    };
  }

  private adjustEligibilityForWeather(
    basicEligibility: EligibilityResult,
    delayAttribution: any,
    flightData: ParsedFlightData
  ): EligibilityResult {
    // Handle case where delayAttribution is undefined (e.g., when verification fails)
    if (!delayAttribution) {
      return {
        ...basicEligibility,
        weatherContext: {
          isWeatherRelated: false,
          severity: 'none',
          attribution: 'airline',
          confidence: 0.5,
        },
        verificationStatus: {
          isVerified: flightData.isVerified,
          verificationTimestamp: flightData.verificationTimestamp,
          delayDiscrepancy: flightData.verifiedDelay
            ? Math.abs(flightData.delayMinutes - flightData.verifiedDelay)
            : undefined,
        },
      };
    }

    // If weather is extraordinary circumstances, no compensation
    if (delayAttribution.isExtraordinary && delayAttribution.confidence > 0.7) {
      return {
        ...basicEligibility,
        isEligible: false,
        reason: 'Extraordinary circumstances (severe weather)',
        compensationAmount: 0,
        weatherContext: {
          isWeatherRelated: true,
          severity: delayAttribution.weatherSeverity,
          attribution: delayAttribution.attribution,
          confidence: delayAttribution.confidence,
        },
        verificationStatus: {
          isVerified: flightData.isVerified,
          verificationTimestamp: flightData.verificationTimestamp,
          delayDiscrepancy: flightData.verifiedDelay
            ? Math.abs(flightData.delayMinutes - flightData.verifiedDelay)
            : undefined,
        },
      };
    }

    // If weather is moderate but not extraordinary, reduce compensation
    if (
      delayAttribution.isWeatherRelated &&
      delayAttribution.confidence > 0.5
    ) {
      const reductionFactor =
        this.calculateWeatherReductionFactor(delayAttribution);
      return {
        ...basicEligibility,
        compensationAmount: Math.floor(
          basicEligibility.compensationAmount * reductionFactor
        ),
        weatherContext: {
          isWeatherRelated: true,
          severity: delayAttribution.weatherSeverity,
          attribution: delayAttribution.attribution,
          confidence: delayAttribution.confidence,
        },
        verificationStatus: {
          isVerified: flightData.isVerified,
          verificationTimestamp: flightData.verificationTimestamp,
          delayDiscrepancy: flightData.verifiedDelay
            ? Math.abs(flightData.delayMinutes - flightData.verifiedDelay)
            : undefined,
        },
      };
    }

    return {
      ...basicEligibility,
      weatherContext: {
        isWeatherRelated: false,
        severity: 'none',
        attribution: 'airline',
        confidence: 0.8,
      },
      verificationStatus: {
        isVerified: flightData.isVerified,
        verificationTimestamp: flightData.verificationTimestamp,
        delayDiscrepancy: flightData.verifiedDelay
          ? Math.abs(flightData.delayMinutes - flightData.verifiedDelay)
          : undefined,
      },
    };
  }

  private calculateWeatherReductionFactor(attribution: any): number {
    switch (attribution.weatherSeverity) {
      case 'severe':
        return 0; // No compensation
      case 'moderate':
        return 0.5; // 50% reduction
      case 'light':
        return 0.8; // 20% reduction
      default:
        return 1; // No reduction
    }
  }
}

/**
 * Integration Service - Main entry point for enhanced claim processing
 */

export class EnhancedClaimProcessingService {
  private emailParser: EnhancedEmailParser;
  private eligibilityCalculator: WeatherAwareEligibilityCalculator;

  constructor(
    flightStatusService: FlightStatusServiceType,
    airportStatusManager: AirportStatusManager,
    delayAttributionEngine: DelayAttributionEngine
  ) {
    this.emailParser = new EnhancedEmailParser(
      flightStatusService,
      airportStatusManager,
      delayAttributionEngine
    );

    this.eligibilityCalculator = new WeatherAwareEligibilityCalculator(
      airportStatusManager,
      delayAttributionEngine
    );
  }

  async processClaim(emailContent: string): Promise<{
    parsedData: ParsedFlightData;
    eligibility: EligibilityResult;
    recommendations: string[];
  }> {
    // 1. Parse email with real-time verification
    const parsedData = await this.emailParser.parseFlightEmail(emailContent);

    // 2. Calculate eligibility with weather context
    const eligibility =
      await this.eligibilityCalculator.checkEligibility(parsedData);

    // 3. Generate recommendations
    const recommendations = this.generateRecommendations(
      parsedData,
      eligibility
    );

    return {
      parsedData,
      eligibility,
      recommendations,
    };
  }

  private generateRecommendations(
    parsedData: ParsedFlightData,
    eligibility: EligibilityResult
  ): string[] {
    const recommendations: string[] = [];

    if (!parsedData.isVerified) {
      recommendations.push(
        'Flight status could not be verified - proceed with caution'
      );
    }

    if (parsedData.weatherContext?.isWeatherRelated) {
      if (parsedData.weatherContext.severity === 'severe') {
        recommendations.push(
          'Severe weather conditions detected - compensation unlikely'
        );
      } else if (parsedData.weatherContext.severity === 'moderate') {
        recommendations.push(
          'Weather-related delays detected - compensation may be reduced'
        );
      }
    }

    if (
      eligibility.verificationStatus?.delayDiscrepancy &&
      eligibility.verificationStatus.delayDiscrepancy > 30
    ) {
      recommendations.push(
        'Significant discrepancy between claimed and verified delay'
      );
    }

    if (eligibility.isEligible) {
      recommendations.push('Claim appears eligible for compensation');
      recommendations.push('Submit claim with verified delay information');
    } else {
      recommendations.push('Claim does not meet eligibility criteria');
      if (eligibility.reason.includes('weather')) {
        recommendations.push('Consider appealing if weather was not severe');
      }
    }

    return recommendations;
  }
}
