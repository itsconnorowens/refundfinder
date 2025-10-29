/**
 * Phase 3: Regulatory Expansion
 * Swiss, Norwegian, and Canadian Regulations
 */

import { calculateFlightDistanceCached } from '../distance-calculator';

export interface RegionalEligibilityResult {
  eligible: boolean;
  compensation: number;
  currency: string;
  regulation: string;
  reason?: string;
  additionalRights?: string[];
}

export interface SwissEligibilityParams {
  delayHours: number;
  distance: number;
  isCancellation: boolean;
  isExtraordinaryCircumstances: boolean;
  alternativeFlightOffered?: boolean;
}

export interface NorwegianEligibilityParams {
  delayHours: number;
  distance: number;
  isCancellation: boolean;
  isExtraordinaryCircumstances: boolean;
  alternativeFlightOffered?: boolean;
}

export interface CanadianEligibilityParams {
  delayHours: number;
  isWithinAirlineControl: boolean;
  isCancellation: boolean;
  isDeniedBoarding: boolean;
  largeCarrier?: boolean; // Large carriers have higher compensation
  previousCompensationProvided?: boolean;
}

/**
 * Swiss Federal Office of Civil Aviation (FOCA) Regulations
 * Generally follows EU261 rules with some Swiss-specific variations
 */
export class SwissRegulations {
  /**
   * Check Swiss FOCA eligibility
   */
  checkSwissFOCAEligibility(
    params: SwissEligibilityParams
  ): RegionalEligibilityResult {
    // Swiss FOCA generally follows EU261 rules
    const {
      delayHours,
      distance,
      isCancellation,
      isExtraordinaryCircumstances,
    } = params;

    // Extraordinary circumstances - no compensation
    if (isExtraordinaryCircumstances) {
      return {
        eligible: false,
        compensation: 0,
        currency: 'CHF',
        regulation: 'Swiss FOCA',
        reason: 'Extraordinary circumstances',
      };
    }

    // Cancellation with adequate notice (>14 days) - no compensation
    if (isCancellation && !params.alternativeFlightOffered) {
      return {
        eligible: false,
        compensation: 0,
        currency: 'CHF',
        regulation: 'Swiss FOCA',
        reason: 'Cancellation with adequate notice',
      };
    }

    // Calculate compensation based on distance (same as EU261)
    let compensation = 0;
    if (distance <= 1500) {
      compensation = 250; // Short haul
    } else if (distance <= 3500) {
      compensation = 400; // Medium haul
    } else {
      compensation = 600; // Long haul
    }

    // Convert EUR to CHF (approximate conversion rate ~1.08)
    compensation = Math.round(compensation * 1.08);

    return {
      eligible: true,
      compensation,
      currency: 'CHF',
      regulation: 'Swiss FOCA',
      additionalRights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to choose between refund and re-routing',
        'Right to assistance (phone calls, etc.)',
      ],
    };
  }

  /**
   * Check if flight is covered by Swiss regulations
   */
  isSwissCoveredFlight(
    departureAirport: string,
    arrivalAirport: string
  ): boolean {
    const swissAirports = ['ZRH', 'GVA', 'BSL', 'SIR', 'LUG']; // Zurich, Geneva, Basel, Sion, Lugano
    return swissAirports.some(
      (airport) => departureAirport === airport || arrivalAirport === airport
    );
  }
}

/**
 * Norwegian Civil Aviation Authority Regulations
 * Generally follows EU261 rules with some Norwegian-specific variations
 */
export class NorwegianRegulations {
  /**
   * Check Norwegian eligibility
   */
  checkNorwegianEligibility(
    params: NorwegianEligibilityParams
  ): RegionalEligibilityResult {
    const {
      delayHours,
      distance,
      isCancellation,
      isExtraordinaryCircumstances,
    } = params;

    // Extraordinary circumstances - no compensation
    if (isExtraordinaryCircumstances) {
      return {
        eligible: false,
        compensation: 0,
        currency: 'NOK',
        regulation: 'Norwegian CAA',
        reason: 'Extraordinary circumstances',
      };
    }

    // Cancellation with adequate notice (>14 days) - no compensation
    if (isCancellation && !params.alternativeFlightOffered) {
      return {
        eligible: false,
        compensation: 0,
        currency: 'NOK',
        regulation: 'Norwegian CAA',
        reason: 'Cancellation with adequate notice',
      };
    }

    // Calculate compensation based on distance (same as EU261)
    let compensation = 0;
    if (distance <= 1500) {
      compensation = 250; // Short haul
    } else if (distance <= 3500) {
      compensation = 400; // Medium haul
    } else {
      compensation = 600; // Long haul
    }

    // Convert EUR to NOK (approximate conversion rate ~11.5)
    compensation = Math.round(compensation * 11.5);

    return {
      eligible: true,
      compensation,
      currency: 'NOK',
      regulation: 'Norwegian CAA',
      additionalRights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to choose between refund and re-routing',
        'Right to assistance (phone calls, etc.)',
      ],
    };
  }

  /**
   * Check if flight is covered by Norwegian regulations
   */
  isNorwegianCoveredFlight(
    departureAirport: string,
    arrivalAirport: string
  ): boolean {
    const norwegianAirports = ['OSL', 'BGO', 'TRD', 'SVG', 'TOS', 'AAL', 'BOO']; // Oslo, Bergen, Trondheim, Stavanger, Tromsø, Ålesund, Bodø
    return norwegianAirports.some(
      (airport) => departureAirport === airport || arrivalAirport === airport
    );
  }
}

/**
 * Canadian Air Passenger Protection Regulations (APPR)
 * Different from EU261 - based on airline control, not extraordinary circumstances
 */
export class CanadianRegulations {
  /**
   * Check Canadian APPR eligibility
   */
  checkCanadianAPPReligibility(
    params: CanadianEligibilityParams
  ): RegionalEligibilityResult {
    const {
      delayHours,
      isWithinAirlineControl,
      isCancellation,
      isDeniedBoarding,
      largeCarrier = true,
      previousCompensationProvided = false,
    } = params;

    // No compensation if delay is outside airline control
    if (!isWithinAirlineControl) {
      return {
        eligible: false,
        compensation: 0,
        currency: 'CAD',
        regulation: 'Canadian APPR',
        reason: 'Delay outside airline control',
      };
    }

    // For denied boarding on large carriers
    if (isDeniedBoarding) {
      if (largeCarrier) {
        // Large carrier denied boarding
        if (delayHours <= 6) {
          return {
            eligible: true,
            compensation: 400, // CAD $400
            currency: 'CAD',
            regulation: 'Canadian APPR (Large Carrier)',
            additionalRights: [
              'Right to alternative transportation',
              'Right to care if delayed overnight',
            ],
          };
        } else if (delayHours <= 9) {
          return {
            eligible: true,
            compensation: 700, // CAD $700
            currency: 'CAD',
            regulation: 'Canadian APPR (Large Carrier)',
            additionalRights: [
              'Right to alternative transportation',
              'Right to care if delayed overnight',
            ],
          };
        } else {
          return {
            eligible: true,
            compensation: 1000, // CAD $1,000
            currency: 'CAD',
            regulation: 'Canadian APPR (Large Carrier)',
            additionalRights: [
              'Right to alternative transportation',
              'Right to care if delayed overnight',
            ],
          };
        }
      } else {
        // Small carrier denied boarding
        return {
          eligible: true,
          compensation: 200, // CAD $200
          currency: 'CAD',
          regulation: 'Canadian APPR (Small Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      }
    }

    // For cancellations or delays within airline control
    if (largeCarrier) {
      // Large carrier compensation
      if (delayHours <= 6) {
        return {
          eligible: true,
          compensation: 400, // CAD $400
          currency: 'CAD',
          regulation: 'Canadian APPR (Large Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      } else if (delayHours <= 9) {
        return {
          eligible: true,
          compensation: 700, // CAD $700
          currency: 'CAD',
          regulation: 'Canadian APPR (Large Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      } else {
        return {
          eligible: true,
          compensation: 1000, // CAD $1,000
          currency: 'CAD',
          regulation: 'Canadian APPR (Large Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      }
    } else {
      // Small carrier compensation
      if (delayHours <= 6) {
        return {
          eligible: true,
          compensation: 125, // CAD $125
          currency: 'CAD',
          regulation: 'Canadian APPR (Small Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      } else if (delayHours <= 9) {
        return {
          eligible: true,
          compensation: 250, // CAD $250
          currency: 'CAD',
          regulation: 'Canadian APPR (Small Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      } else {
        return {
          eligible: true,
          compensation: 500, // CAD $500
          currency: 'CAD',
          regulation: 'Canadian APPR (Small Carrier)',
          additionalRights: [
            'Right to alternative transportation',
            'Right to care if delayed overnight',
          ],
        };
      }
    }
  }

  /**
   * Check if flight is covered by Canadian regulations
   */
  isCanadianCoveredFlight(
    departureAirport: string,
    arrivalAirport: string
  ): boolean {
    const canadianAirports = [
      'YYZ', // Toronto
      'YVR', // Vancouver
      'YUL', // Montreal
      'YYC', // Calgary
      'YOW', // Ottawa
      'YHZ', // Halifax
      'YEG', // Edmonton
      'YQT', // Thunder Bay
      'YYT', // St. John's
      'YWG', // Winnipeg
      'YQR', // Regina
    ];
    return canadianAirports.some(
      (airport) => departureAirport === airport || arrivalAirport === airport
    );
  }

  /**
   * Determine if delay is within airline control
   * Common factors: weather, security, air traffic control = outside control
   * Maintenance, crew shortage, overbooking = within control
   */
  isDelayWithinAirlineControl(delayReason?: string): boolean {
    if (!delayReason) return true; // Default to within airline control

    const outsideControlPatterns = [
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

    return !outsideControlPatterns.some((pattern) => pattern.test(delayReason));
  }
}

// Export singleton instances
export const swissRegulations = new SwissRegulations();
export const norwegianRegulations = new NorwegianRegulations();
export const canadianRegulations = new CanadianRegulations();

/**
 * Check eligibility for all regional regulations
 */
export function checkRegionalEligibility(
  departureAirport: string,
  arrivalAirport: string,
  delayHours: number,
  distance: number,
  isCancellation: boolean,
  isExtraordinaryCircumstances: boolean,
  delayReason?: string,
  isDeniedBoarding = false,
  largeCarrier = true
): RegionalEligibilityResult | null {
  // Check Swiss regulations
  if (swissRegulations.isSwissCoveredFlight(departureAirport, arrivalAirport)) {
    return swissRegulations.checkSwissFOCAEligibility({
      delayHours,
      distance,
      isCancellation,
      isExtraordinaryCircumstances,
    });
  }

  // Check Norwegian regulations
  if (
    norwegianRegulations.isNorwegianCoveredFlight(
      departureAirport,
      arrivalAirport
    )
  ) {
    return norwegianRegulations.checkNorwegianEligibility({
      delayHours,
      distance,
      isCancellation,
      isExtraordinaryCircumstances,
    });
  }

  // Check Canadian regulations
  if (
    canadianRegulations.isCanadianCoveredFlight(
      departureAirport,
      arrivalAirport
    )
  ) {
    const isWithinAirlineControl =
      canadianRegulations.isDelayWithinAirlineControl(delayReason);
    return canadianRegulations.checkCanadianAPPReligibility({
      delayHours,
      isWithinAirlineControl,
      isCancellation,
      isDeniedBoarding,
      largeCarrier,
    });
  }

  return null;
}
