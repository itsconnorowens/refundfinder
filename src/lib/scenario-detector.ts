/**
 * Unified Scenario Detection Engine
 * Detects and processes all compensation scenarios (delays, cancellations, denied boarding, downgrades)
 * Provides comprehensive scenario analysis and compensation calculation
 */

import {
  cancellationService,
  CancellationData,
  CancellationCompensation,
} from './scenarios/cancellation';
import {
  deniedBoardingService,
  DeniedBoardingData,
  DeniedBoardingCompensation,
} from './scenarios/denied-boarding';
import {
  downgradeService,
  DowngradeData,
  DowngradeCompensation,
} from './scenarios/downgrade';
import { FlightData } from './flight-apis';
import { calculateFlightDistance } from './distance-calculator';

export type ScenarioType =
  | 'delay'
  | 'cancellation'
  | 'denied_boarding'
  | 'downgrade';

export interface ScenarioDetectionResult {
  scenarios: {
    delay?: DelayData;
    cancellation?: CancellationData;
    deniedBoarding?: DeniedBoardingData;
    downgrade?: DowngradeData;
  };
  primaryScenario: ScenarioType;
  confidence: number;
  allScenarios: ScenarioType[];
}

export interface DelayData {
  isDelayed: boolean;
  delayMinutes: number;
  delayReason?: string;
  extraordinaryCircumstances?: boolean;
}

export interface ComprehensiveCompensationResult {
  primaryScenario: ScenarioType;
  compensation: {
    delay?: number;
    cancellation?: CancellationCompensation;
    deniedBoarding?: DeniedBoardingCompensation;
    downgrade?: DowngradeCompensation;
  };
  totalCompensation: number;
  currency: string;
  regulation: string;
  additionalRights: string[];
  confidence: number;
}

export interface ScenarioAnalysis {
  detectedScenarios: ScenarioType[];
  primaryScenario: ScenarioType;
  scenarioConfidence: Record<ScenarioType, number>;
  compensationEligible: boolean;
  recommendedAction: string;
}

/**
 * Delay detection patterns
 */
export const delayPatterns = [
  /delayed\s+by\s+(\d+)\s+hours?/i,
  /(\d+)\s+hour\s+delay/i,
  /delay\s+of\s+(\d+)\s+minutes?/i,
  /(\d+)\s+minute\s+delay/i,
  /running\s+(\d+)\s+hours?\s+late/i,
  /behind\s+schedule/i,
  /late\s+departure/i,
  /delayed\s+departure/i,
];

/**
 * Extraordinary circumstances patterns for delays
 */
export const delayExtraordinaryPatterns = [
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
  /technical\s+issue/i,
  /maintenance/i,
];

/**
 * Unified scenario detector
 */
export class ScenarioDetector {
  /**
   * Detect all possible scenarios from email content
   */
  async detectScenarios(
    emailContent: string
  ): Promise<ScenarioDetectionResult> {
    const scenarios: ScenarioDetectionResult['scenarios'] = {};
    const scenarioConfidence: Record<ScenarioType, number> = {
      delay: 0,
      cancellation: 0,
      denied_boarding: 0,
      downgrade: 0,
    };

    // Detect delay scenario
    const delayData = this.detectDelay(emailContent);
    if (delayData) {
      scenarios.delay = delayData;
      scenarioConfidence.delay = this.calculateDelayConfidence(
        emailContent,
        delayData
      );
    }

    // Detect cancellation scenario
    const cancellationData = await this.detectCancellation(emailContent);
    if (cancellationData) {
      scenarios.cancellation = cancellationData;
      scenarioConfidence.cancellation = this.calculateCancellationConfidence(
        emailContent,
        cancellationData
      );
    }

    // Detect denied boarding scenario
    const deniedBoardingData = await this.detectDeniedBoarding(emailContent);
    if (deniedBoardingData) {
      scenarios.deniedBoarding = deniedBoardingData;
      scenarioConfidence.denied_boarding =
        this.calculateDeniedBoardingConfidence(
          emailContent,
          deniedBoardingData
        );
    }

    // Detect downgrade scenario
    const downgradeData = await this.detectDowngrade(emailContent);
    if (downgradeData) {
      scenarios.downgrade = downgradeData;
      scenarioConfidence.downgrade = this.calculateDowngradeConfidence(
        emailContent,
        downgradeData
      );
    }

    // Determine primary scenario and overall confidence
    const primaryScenario = this.determinePrimaryScenario(scenarioConfidence);
    const confidence = this.calculateOverallConfidence(scenarioConfidence);

    return {
      scenarios,
      primaryScenario,
      confidence,
      allScenarios: Object.keys(scenarios) as ScenarioType[],
    };
  }

  /**
   * Detect delay scenario
   */
  private detectDelay(emailContent: string): DelayData | null {
    const content = emailContent.toLowerCase();

    // Check if email contains delay indicators
    const hasDelay = delayPatterns.some((pattern) => pattern.test(content));
    if (!hasDelay) {
      return null;
    }

    const delayData: DelayData = {
      isDelayed: true,
      delayMinutes: 0,
      extraordinaryCircumstances: false,
    };

    // Extract delay duration
    delayData.delayMinutes = this.extractDelayMinutes(content);

    // Detect delay reason
    delayData.delayReason = this.extractDelayReason(content);

    // Detect extraordinary circumstances
    delayData.extraordinaryCircumstances =
      this.detectExtraordinaryCircumstances(content);

    return delayData;
  }

  /**
   * Extract delay minutes from content
   */
  private extractDelayMinutes(content: string): number {
    // Try to find delay duration in various formats
    const patterns = [
      /delayed\s+by\s+(\d+)\s+hours?/i,
      /(\d+)\s+hour\s+delay/i,
      /delay\s+of\s+(\d+)\s+minutes?/i,
      /(\d+)\s+minute\s+delay/i,
      /running\s+(\d+)\s+hours?\s+late/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        // Convert hours to minutes if needed
        if (pattern.source.includes('hour')) {
          return value * 60;
        }
        return value;
      }
    }

    return 0;
  }

  /**
   * Extract delay reason
   */
  private extractDelayReason(content: string): string {
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
   * Detect extraordinary circumstances
   */
  private detectExtraordinaryCircumstances(content: string): boolean {
    return delayExtraordinaryPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Detect cancellation scenario
   */
  private async detectCancellation(
    emailContent: string
  ): Promise<CancellationData | null> {
    const result = await cancellationService.processCancellation(
      emailContent,
      null,
      'EU261'
    );
    return result.cancellationData;
  }

  /**
   * Detect denied boarding scenario
   */
  private async detectDeniedBoarding(
    emailContent: string
  ): Promise<DeniedBoardingData | null> {
    const result = await deniedBoardingService.processDeniedBoarding(
      emailContent,
      null,
      'EU261'
    );
    return result.deniedBoardingData;
  }

  /**
   * Detect downgrade scenario
   */
  private async detectDowngrade(
    emailContent: string
  ): Promise<DowngradeData | null> {
    const result = await downgradeService.processDowngrade(
      emailContent,
      null,
      'EU261'
    );
    return result.downgradeData;
  }

  /**
   * Calculate confidence for delay detection
   */
  private calculateDelayConfidence(
    content: string,
    delayData: DelayData
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on specific indicators
    if (delayData.delayMinutes > 0) {
      confidence += 0.3;
    }

    if (delayData.delayReason) {
      confidence += 0.1;
    }

    if (delayPatterns.some((pattern) => pattern.test(content))) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for cancellation detection
   */
  private calculateCancellationConfidence(
    content: string,
    cancellationData: CancellationData
  ): number {
    let confidence = 0.7; // Base confidence for cancellation

    if (cancellationData.cancellationReason) {
      confidence += 0.1;
    }

    if (cancellationData.alternativeFlightOffered) {
      confidence += 0.1;
    }

    if (cancellationData.noticePeriod) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for denied boarding detection
   */
  private calculateDeniedBoardingConfidence(
    content: string,
    deniedBoardingData: DeniedBoardingData
  ): number {
    let confidence = 0.6; // Base confidence for denied boarding

    if (deniedBoardingData.type) {
      confidence += 0.2;
    }

    if (deniedBoardingData.reason) {
      confidence += 0.1;
    }

    if (deniedBoardingData.compensationOffered) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for downgrade detection
   */
  private calculateDowngradeConfidence(
    content: string,
    downgradeData: DowngradeData
  ): number {
    let confidence = 0.5; // Base confidence for downgrade

    if (downgradeData.originalClass !== downgradeData.newClass) {
      confidence += 0.3;
    }

    if (downgradeData.fareDifference) {
      confidence += 0.1;
    }

    if (downgradeData.downgradeReason) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Determine primary scenario based on confidence scores
   */
  private determinePrimaryScenario(
    confidence: Record<ScenarioType, number>
  ): ScenarioType {
    const scenarios = Object.entries(confidence) as [ScenarioType, number][];
    const sortedScenarios = scenarios.sort((a, b) => b[1] - a[1]);

    return sortedScenarios[0][0];
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    confidence: Record<ScenarioType, number>
  ): number {
    const values = Object.values(confidence);
    if (values.length === 0) return 0;

    return values.reduce((sum, conf) => sum + conf, 0) / values.length;
  }
}

/**
 * Comprehensive compensation calculator
 */
export class ComprehensiveCompensationCalculator {
  /**
   * Calculate comprehensive compensation for all detected scenarios
   */
  async calculateComprehensiveCompensation(
    scenarioResult: ScenarioDetectionResult,
    flightData: FlightData,
    regulation: string
  ): Promise<ComprehensiveCompensationResult> {
    const compensation: ComprehensiveCompensationResult['compensation'] = {};
    let totalCompensation = 0;
    let currency = 'EUR';
    const additionalRights: string[] = [];

    // Calculate delay compensation (if applicable)
    if (scenarioResult.scenarios.delay) {
      const delayCompensation = this.calculateDelayCompensation(
        scenarioResult.scenarios.delay,
        flightData,
        regulation
      );
      compensation.delay = delayCompensation.amount;
      totalCompensation += delayCompensation.amount;
      currency = delayCompensation.currency;
      additionalRights.push(...delayCompensation.rights);
    }

    // Calculate cancellation compensation
    if (scenarioResult.scenarios.cancellation) {
      const cancellationResult = await cancellationService.processCancellation(
        '', // We already have the data
        flightData,
        regulation
      );
      if (cancellationResult.compensation) {
        compensation.cancellation = cancellationResult.compensation;
        if (cancellationResult.compensation.isEligible) {
          totalCompensation +=
            cancellationResult.compensation.compensationAmount;
          currency = cancellationResult.compensation.currency;
          additionalRights.push(
            ...cancellationResult.compensation.additionalRights
          );
        }
      }
    }

    // Calculate denied boarding compensation
    if (scenarioResult.scenarios.deniedBoarding) {
      const deniedBoardingResult =
        await deniedBoardingService.processDeniedBoarding(
          '', // We already have the data
          flightData,
          regulation
        );
      if (deniedBoardingResult.compensation) {
        compensation.deniedBoarding = deniedBoardingResult.compensation;
        if (deniedBoardingResult.compensation.isEligible) {
          totalCompensation +=
            deniedBoardingResult.compensation.compensationAmount;
          currency = deniedBoardingResult.compensation.currency;
          additionalRights.push(
            ...deniedBoardingResult.compensation.additionalRights
          );
        }
      }
    }

    // Calculate downgrade compensation
    if (scenarioResult.scenarios.downgrade) {
      const downgradeResult = await downgradeService.processDowngrade(
        '', // We already have the data
        flightData,
        regulation
      );
      if (downgradeResult.compensation) {
        compensation.downgrade = downgradeResult.compensation;
        if (downgradeResult.compensation.isEligible) {
          totalCompensation += downgradeResult.compensation.compensationAmount;
          currency = downgradeResult.compensation.currency;
          additionalRights.push(
            ...downgradeResult.compensation.additionalRights
          );
        }
      }
    }

    return {
      primaryScenario: scenarioResult.primaryScenario,
      compensation,
      totalCompensation,
      currency,
      regulation,
      additionalRights: [...new Set(additionalRights)], // Remove duplicates
      confidence: scenarioResult.confidence,
    };
  }

  /**
   * Calculate delay compensation
   */
  private calculateDelayCompensation(
    delayData: DelayData,
    flightData: FlightData,
    _regulation: string
  ): { amount: number; currency: string; rights: string[] } {
    // Only compensate for delays > 3 hours (EU261 threshold)
    if (delayData.delayMinutes < 180) {
      return { amount: 0, currency: 'EUR', rights: [] };
    }

    // Check for extraordinary circumstances
    if (delayData.extraordinaryCircumstances) {
      return { amount: 0, currency: 'EUR', rights: [] };
    }

    // Calculate distance between airports
    const distanceResult = calculateFlightDistance(
      flightData.departureAirport,
      flightData.arrivalAirport
    );

    const distance = distanceResult.isValid ? distanceResult.distanceKm : 1000;
    let compensationAmount = 250; // Short haul default

    if (distance > 3500) {
      compensationAmount = 600; // Long haul
    } else if (distance > 1500) {
      compensationAmount = 400; // Medium haul
    }

    return {
      amount: compensationAmount,
      currency: 'EUR',
      rights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to assistance (phone calls, etc.)',
      ],
    };
  }
}

/**
 * Main scenario service
 */
export class ScenarioService {
  private detector: ScenarioDetector;
  private calculator: ComprehensiveCompensationCalculator;

  constructor() {
    this.detector = new ScenarioDetector();
    this.calculator = new ComprehensiveCompensationCalculator();
  }

  /**
   * Process email content and return comprehensive scenario analysis
   */
  async processEmailContent(
    emailContent: string,
    flightData: FlightData,
    regulation: string
  ): Promise<{
    scenarioResult: ScenarioDetectionResult;
    compensationResult: ComprehensiveCompensationResult;
    analysis: ScenarioAnalysis;
  }> {
    // Detect all scenarios
    const scenarioResult = await this.detector.detectScenarios(emailContent);

    // Calculate comprehensive compensation
    const compensationResult =
      await this.calculator.calculateComprehensiveCompensation(
        scenarioResult,
        flightData,
        regulation
      );

    // Generate analysis
    const analysis: ScenarioAnalysis = {
      detectedScenarios: scenarioResult.allScenarios,
      primaryScenario: scenarioResult.primaryScenario,
      scenarioConfidence: {
        delay: scenarioResult.scenarios.delay ? 0.8 : 0,
        cancellation: scenarioResult.scenarios.cancellation ? 0.8 : 0,
        denied_boarding: scenarioResult.scenarios.deniedBoarding ? 0.8 : 0,
        downgrade: scenarioResult.scenarios.downgrade ? 0.8 : 0,
      },
      compensationEligible: compensationResult.totalCompensation > 0,
      recommendedAction: this.generateRecommendedAction(
        scenarioResult,
        compensationResult
      ),
    };

    return {
      scenarioResult,
      compensationResult,
      analysis,
    };
  }

  /**
   * Generate recommended action based on scenario and compensation
   */
  private generateRecommendedAction(
    scenarioResult: ScenarioDetectionResult,
    compensationResult: ComprehensiveCompensationResult
  ): string {
    if (compensationResult.totalCompensation === 0) {
      return 'No compensation eligible - check airline policy for assistance';
    }

    const primaryScenario = scenarioResult.primaryScenario;
    const amount = compensationResult.totalCompensation;
    const currency = compensationResult.currency;

    switch (primaryScenario) {
      case 'delay':
        return `You may be eligible for ${amount} ${currency} compensation for the delay`;
      case 'cancellation':
        return `You may be eligible for ${amount} ${currency} compensation for the cancellation`;
      case 'denied_boarding':
        return `You may be eligible for ${amount} ${currency} compensation for denied boarding`;
      case 'downgrade':
        return `You may be eligible for ${amount} ${currency} compensation for the downgrade`;
      default:
        return `You may be eligible for ${amount} ${currency} compensation`;
    }
  }
}

// Export singleton instance
export const scenarioService = new ScenarioService();
