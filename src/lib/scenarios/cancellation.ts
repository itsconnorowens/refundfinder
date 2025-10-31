/**
 * Cancellation Scenario Support
 * Handles flight cancellations with regulation-specific compensation rules
 * Supports EU261, UK CAA, and US DOT cancellation scenarios
 */

import { calculateFlightDistance } from '../distance-calculator';

export interface CancellationData {
  isCancelled: boolean;
  cancellationReason?: string;
  alternativeFlightOffered?: boolean;
  alternativeFlightDetails?: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    delayHours: number;
  };
  noticePeriod?: 'immediate' | 'short' | 'adequate'; // <24h, 24h-14d, >14d
  extraordinaryCircumstances?: boolean;
}

export interface CancellationCompensation {
  isEligible: boolean;
  compensationAmount: number;
  currency: string;
  regulation: string;
  conditions: {
    noticePeriod: 'adequate' | 'short' | 'immediate';
    alternativeOffered: boolean;
    alternativeTiming: 'within_limits' | 'exceeds_limits';
    extraordinaryCircumstances: boolean;
  };
  additionalRights: string[];
}

export enum CancellationReason {
  WEATHER = 'weather',
  TECHNICAL = 'technical',
  OPERATIONAL = 'operational',
  SECURITY = 'security',
  CREW_SHORTAGE = 'crew_shortage',
  AIR_TRAFFIC_CONTROL = 'air_traffic_control',
  STRIKE = 'strike',
  PASSENGER_BEHAVIOR = 'passenger_behavior',
  MAINTENANCE = 'maintenance',
  FUEL_SHORTAGE = 'fuel_shortage',
  OTHER = 'other',
}

export interface CancellationReasonAnalysis {
  reason: CancellationReason;
  isExtraordinaryCircumstance: boolean;
  airlineControl: 'within' | 'outside';
  compensationImpact: 'full' | 'reduced' | 'none';
}

/**
 * Cancellation detection patterns for email parsing
 */
export const cancellationPatterns = [
  /flight\s+(\w+\d+)\s+has\s+been\s+cancelled/i,
  /flight\s+(\w+\d+)\s+is\s+no\s+longer\s+operating/i,
  /flight\s+(\w+\d+)\s+has\s+been\s+canceled/i,
  /due\s+to\s+cancellation/i,
  /flight\s+cancellation/i,
  /cancelled\s+due\s+to/i,
  /service\s+cancelled/i,
  /flight\s+will\s+not\s+operate/i,
  /flight\s+has\s+been\s+discontinued/i,
  /operational\s+reasons/i,
];

/**
 * Alternative flight detection patterns
 */
export const alternativeFlightPatterns = [
  /alternative\s+flight/i,
  /rebooked\s+on/i,
  /transferred\s+to/i,
  /moved\s+to\s+flight/i,
  /new\s+flight\s+number/i,
  /replacement\s+flight/i,
  /next\s+available\s+flight/i,
];

/**
 * Notice period detection patterns
 */
export const noticePeriodPatterns = {
  immediate: [
    /less\s+than\s+24\s+hours/i,
    /same\s+day/i,
    /last\s+minute/i,
    /short\s+notice/i,
    /immediate/i,
  ],
  short: [
    /between\s+24\s+hours\s+and\s+14\s+days/i,
    /within\s+14\s+days/i,
    /less\s+than\s+14\s+days/i,
    /short\s+notice/i,
  ],
  adequate: [
    /more\s+than\s+14\s+days/i,
    /at\s+least\s+14\s+days/i,
    /advance\s+notice/i,
    /sufficient\s+notice/i,
  ],
};

/**
 * Extraordinary circumstances patterns
 */
export const extraordinaryCircumstancesPatterns = [
  /weather/i,
  /storm/i,
  /snow/i,
  /fog/i,
  /security/i,
  /terrorist/i,
  /strike/i,
  /industrial\s+action/i,
  /air\s+traffic\s+control/i,
  /atc/i,
  /medical\s+emergency/i,
  /bird\s+strike/i,
  /volcanic\s+ash/i,
  /natural\s+disaster/i,
  /war/i,
  /political\s+unrest/i,
];

/**
 * Cancellation scenario detector
 */
export class CancellationDetector {
  /**
   * Detect cancellation scenario from email content
   */
  detectCancellation(emailContent: string): CancellationData | null {
    const content = emailContent.toLowerCase();

    // Check if email contains cancellation indicators
    const hasCancellation = cancellationPatterns.some((pattern) =>
      pattern.test(content)
    );
    if (!hasCancellation) {
      return null;
    }

    const cancellationData: CancellationData = {
      isCancelled: true,
      alternativeFlightOffered: false,
      noticePeriod: 'immediate',
    };

    // Detect cancellation reason
    cancellationData.cancellationReason =
      this.detectCancellationReason(content);

    // Detect alternative flight
    const alternativeFlight = this.detectAlternativeFlight(content);
    if (alternativeFlight) {
      cancellationData.alternativeFlightOffered = true;
      cancellationData.alternativeFlightDetails = alternativeFlight;
    }

    // Detect notice period
    cancellationData.noticePeriod = this.detectNoticePeriod(content);

    // Detect extraordinary circumstances
    cancellationData.extraordinaryCircumstances =
      this.detectExtraordinaryCircumstances(content);

    return cancellationData;
  }

  /**
   * Detect cancellation reason from email content
   */
  private detectCancellationReason(content: string): string {
    const reasonMap: Record<string, string> = {
      weather: 'Weather conditions',
      storm: 'Severe weather',
      snow: 'Snow conditions',
      fog: 'Fog conditions',
      technical: 'Technical issues',
      maintenance: 'Aircraft maintenance',
      operational: 'Operational reasons',
      security: 'Security concerns',
      strike: 'Industrial action',
      crew: 'Crew shortage',
      'air traffic': 'Air traffic control',
      atc: 'Air traffic control',
    };

    for (const [keyword, reason] of Object.entries(reasonMap)) {
      if (content.includes(keyword)) {
        return reason;
      }
    }

    return 'Operational reasons';
  }

  /**
   * Detect alternative flight details
   */
  private detectAlternativeFlight(
    content: string
  ): CancellationData['alternativeFlightDetails'] | null {
    const alternativeMatch = content.match(/flight\s+(\w+\d+)/i);
    if (!alternativeMatch) {
      return null;
    }

    const flightNumber = alternativeMatch[1];

    // Extract times if available
    const departureTimeMatch = content.match(/departure.*?(\d{1,2}:\d{2})/i);
    const arrivalTimeMatch = content.match(/arrival.*?(\d{1,2}:\d{2})/i);

    // Extract delay hours from email text
    const delayHours = this.extractDelayHours(content);

    return {
      flightNumber,
      departureTime: departureTimeMatch?.[1] || 'TBD',
      arrivalTime: arrivalTimeMatch?.[1] || 'TBD',
      delayHours,
    };
  }

  /**
   * Extract delay hours from email content
   */
  private extractDelayHours(content: string): number {
    // Patterns to match delay mentions
    const delayPatterns = [
      /(\d+)[\s-]hour\s+delay/i,                    // "4-hour delay" or "4 hour delay"
      /delay\s+of\s+(\d+)\s+hours?/i,               // "delay of 4 hours"
      /delayed?\s+by\s+(\d+)\s+hours?/i,            // "delayed by 4 hours"
      /providing\s+a\s+(\d+)[\s-]hour\s+delay/i,    // "providing a 4-hour delay"
      /arrive\s+(\d+)\s+hours?\s+late/i,            // "arrive 4 hours late"
    ];

    for (const pattern of delayPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    return 0; // No delay mentioned or unable to parse
  }

  /**
   * Detect notice period
   */
  private detectNoticePeriod(
    content: string
  ): CancellationData['noticePeriod'] {
    for (const [period, patterns] of Object.entries(noticePeriodPatterns)) {
      if (patterns.some((pattern) => pattern.test(content))) {
        return period as CancellationData['noticePeriod'];
      }
    }

    // Default to immediate if not specified
    return 'immediate';
  }

  /**
   * Detect extraordinary circumstances
   */
  private detectExtraordinaryCircumstances(content: string): boolean {
    return extraordinaryCircumstancesPatterns.some((pattern) =>
      pattern.test(content)
    );
  }
}

/**
 * Cancellation compensation calculator
 */
export class CancellationCompensationCalculator {
  /**
   * Calculate compensation for cancellation based on regulation
   */
  calculateCompensation(
    cancellationData: CancellationData,
    flightData: any, // FlightData from flight-apis
    regulation: string
  ): CancellationCompensation {
    const conditions = this.analyzeConditions(cancellationData);

    switch (regulation) {
      case 'EU261':
        return this.calculateEU261Compensation(
          cancellationData,
          flightData,
          conditions
        );
      case 'UK261':
        return this.calculateUKCAACompensation(
          cancellationData,
          flightData,
          conditions
        );
      case 'US_DOT':
        return this.calculateUSDOTCompensation(
          cancellationData,
          flightData,
          conditions
        );
      default:
        return this.getNoCompensationResult(conditions);
    }
  }

  /**
   * Analyze cancellation conditions
   */
  private analyzeConditions(
    cancellationData: CancellationData
  ): CancellationCompensation['conditions'] {
    return {
      noticePeriod: cancellationData.noticePeriod || 'immediate',
      alternativeOffered: cancellationData.alternativeFlightOffered || false,
      alternativeTiming: this.calculateAlternativeTiming(cancellationData),
      extraordinaryCircumstances:
        cancellationData.extraordinaryCircumstances || false,
    };
  }

  /**
   * Calculate alternative flight timing
   */
  private calculateAlternativeTiming(
    cancellationData: CancellationData
  ): 'within_limits' | 'exceeds_limits' {
    if (!cancellationData.alternativeFlightDetails) {
      return 'exceeds_limits';
    }

    const delayHours = cancellationData.alternativeFlightDetails.delayHours;

    // EU261 limits: <2h for short notice, <4h for immediate notice
    if (cancellationData.noticePeriod === 'adequate') {
      return delayHours <= 2 ? 'within_limits' : 'exceeds_limits';
    } else {
      return delayHours <= 4 ? 'within_limits' : 'exceeds_limits';
    }
  }

  /**
   * Calculate EU261 compensation
   */
  private calculateEU261Compensation(
    cancellationData: CancellationData,
    flightData: any,
    conditions: CancellationCompensation['conditions']
  ): CancellationCompensation {
    // No compensation if extraordinary circumstances
    if (conditions.extraordinaryCircumstances) {
      return this.getNoCompensationResult(conditions);
    }

    // No compensation if adequate notice given
    if (conditions.noticePeriod === 'adequate') {
      return this.getNoCompensationResult(conditions);
    }

    // Reduced compensation if alternative offered within limits
    if (
      conditions.alternativeOffered &&
      conditions.alternativeTiming === 'within_limits'
    ) {
      return this.getReducedCompensationResult(conditions, 'EUR', 'EU261');
    }

    // Full compensation otherwise
    // Calculate distance between airports
    let distance = 1000; // Default medium-haul distance
    if (flightData?.departureAirport && flightData?.arrivalAirport) {
      const distanceResult = calculateFlightDistance(
        flightData.departureAirport,
        flightData.arrivalAirport
      );
      distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
    }
    let compensationAmount = 250; // Short haul default

    if (distance > 3500) {
      compensationAmount = 600; // Long haul
    } else if (distance > 1500) {
      compensationAmount = 400; // Medium haul
    }

    return {
      isEligible: true,
      compensationAmount,
      currency: 'EUR',
      regulation: 'EU261',
      conditions,
      additionalRights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to choose between refund and re-routing',
        'Right to assistance (phone calls, etc.)',
      ],
    };
  }

  /**
   * Calculate UK CAA compensation (same as EU261 but in GBP)
   */
  private calculateUKCAACompensation(
    cancellationData: CancellationData,
    flightData: any,
    conditions: CancellationCompensation['conditions']
  ): CancellationCompensation {
    const eu261Result = this.calculateEU261Compensation(
      cancellationData,
      flightData,
      conditions
    );

    if (!eu261Result.isEligible) {
      return eu261Result;
    }

    // Convert EUR to GBP (approximate rates)
    const gbpAmounts: Record<number, number> = {
      250: 220,
      400: 350,
      600: 520,
    };

    return {
      ...eu261Result,
      currency: 'GBP',
      regulation: 'UK261',
      compensationAmount:
        gbpAmounts[eu261Result.compensationAmount] ||
        eu261Result.compensationAmount,
    };
  }

  /**
   * Calculate US DOT compensation
   */
  private calculateUSDOTCompensation(
    cancellationData: CancellationData,
    flightData: any,
    conditions: CancellationCompensation['conditions']
  ): CancellationCompensation {
    // US DOT has no mandatory compensation for cancellations
    return {
      isEligible: false,
      compensationAmount: 0,
      currency: 'USD',
      regulation: 'US_DOT',
      conditions,
      additionalRights: [
        'Right to refund or re-routing',
        'Right to care if delayed overnight',
      ],
    };
  }

  /**
   * Get no compensation result
   */
  private getNoCompensationResult(
    conditions: CancellationCompensation['conditions']
  ): CancellationCompensation {
    return {
      isEligible: false,
      compensationAmount: 0,
      currency: 'EUR',
      regulation: 'EU261',
      conditions,
      additionalRights: [],
    };
  }

  /**
   * Get reduced compensation result
   */
  private getReducedCompensationResult(
    conditions: CancellationCompensation['conditions'],
    currency: string,
    regulation: string
  ): CancellationCompensation {
    return {
      isEligible: true,
      compensationAmount: 125, // Reduced amount
      currency,
      regulation,
      conditions,
      additionalRights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to assistance',
      ],
    };
  }
}

/**
 * Main cancellation service
 */
export class CancellationService {
  private detector: CancellationDetector;
  private calculator: CancellationCompensationCalculator;

  constructor() {
    this.detector = new CancellationDetector();
    this.calculator = new CancellationCompensationCalculator();
  }

  /**
   * Process cancellation scenario
   */
  async processCancellation(
    emailContent: string,
    flightData: any,
    regulation: string
  ): Promise<{
    cancellationData: CancellationData | null;
    compensation: CancellationCompensation | null;
  }> {
    const cancellationData = this.detector.detectCancellation(emailContent);

    if (!cancellationData) {
      return { cancellationData: null, compensation: null };
    }

    const compensation = this.calculator.calculateCompensation(
      cancellationData,
      flightData,
      regulation
    );

    return { cancellationData, compensation };
  }
}

// Export singleton instance
export const cancellationService = new CancellationService();
