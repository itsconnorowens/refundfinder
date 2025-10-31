/**
 * Denied Boarding Scenario Support
 * Handles overbooking and denied boarding scenarios with proper compensation calculation
 * Supports EU261, UK CAA, and US DOT denied boarding regulations
 */

export interface DeniedBoardingData {
  isDeniedBoarding: boolean;
  type: 'voluntary' | 'involuntary';
  reason: 'overbooking' | 'aircraft_change' | 'weight_restrictions' | 'other';
  compensationOffered?: {
    amount: number;
    currency: string;
    type: 'cash' | 'voucher' | 'miles';
  };
  alternativeFlight?: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    delayHours: number;
  };
  passengerCount?: number; // Number of passengers denied boarding
}

export interface DeniedBoardingCompensation {
  isEligible: boolean;
  compensationAmount: number;
  currency: string;
  regulation: string;
  type: 'voluntary' | 'involuntary';
  additionalRights: string[];
  conditions: {
    isOverbooking: boolean;
    compensationOffered: boolean;
    alternativeArrangements: boolean;
  };
}

export enum DeniedBoardingReason {
  OVERBOOKING = 'overbooking',
  AIRCRAFT_CHANGE = 'aircraft_change',
  WEIGHT_RESTRICTIONS = 'weight_restrictions',
  SECURITY = 'security',
  CREW_SHORTAGE = 'crew_shortage',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export interface OverbookingAnalysis {
  isOverbooking: boolean;
  airlinePolicy: 'voluntary_first' | 'involuntary_allowed';
  compensationOffered: boolean;
  alternativeArrangements: boolean;
}

/**
 * Denied boarding detection patterns
 */
export const deniedBoardingPatterns = [
  /denied\s+boarding/i,
  /unable\s+to\s+board/i,
  /cannot\s+board/i,
  /seat\s+not\s+available/i,
  /overbooked/i,
  /oversold/i,
  /more\s+passengers\s+than\s+seats/i,
  /give\s+up\s+your\s+seat/i,
  /volunteer\s+to\s+give\s+up/i,
  /compensation\s+for\s+volunteering/i,
  /bumped\s+from\s+flight/i,
  /removed\s+from\s+flight/i,
];

/**
 * Voluntary denied boarding patterns
 */
export const voluntaryPatterns = [
  /voluntary/i,
  /volunteer/i,
  /offered\s+compensation/i,
  /incentive/i,
  /give\s+up\s+seat/i,
  /willing\s+to\s+change/i,
];

/**
 * Involuntary denied boarding patterns
 */
export const involuntaryPatterns = [
  /involuntary/i,
  /forced/i,
  /required\s+to\s+give\s+up/i,
  /no\s+volunteers/i,
  /last\s+to\s+check\s+in/i,
  /random\s+selection/i,
];

/**
 * Overbooking detection patterns
 */
export const overbookingPatterns = [
  /overbook(?:ed|ing)?/i,
  /oversold/i,
  /more\s+passengers\s+than\s+seats/i,
  /too\s+many\s+passengers/i,
  /booking\s+error/i,
  /reservation\s+conflict/i,
];

/**
 * Compensation offer patterns
 */
export const compensationOfferPatterns = [
  /compensation\s+of\s+\$?(\d+)/i,
  /offered\s+\$?(\d+)/i,
  /voucher\s+worth\s+\$?(\d+)/i,
  /(\d+)\s+miles/i,
  /travel\s+credit\s+of\s+\$?(\d+)/i,
];

/**
 * Denied boarding scenario detector
 */
export class DeniedBoardingDetector {
  /**
   * Detect denied boarding scenario from email content
   */
  detectDeniedBoarding(emailContent: string): DeniedBoardingData | null {
    const content = emailContent.toLowerCase();

    // Check if email contains denied boarding indicators
    const hasDeniedBoarding = deniedBoardingPatterns.some((pattern) =>
      pattern.test(content)
    );
    if (!hasDeniedBoarding) {
      return null;
    }

    const deniedBoardingData: DeniedBoardingData = {
      isDeniedBoarding: true,
      type: 'involuntary',
      reason: 'overbooking',
    };

    // Detect type (voluntary vs involuntary)
    deniedBoardingData.type = this.detectType(content);

    // Detect reason
    deniedBoardingData.reason = this.detectReason(content);

    // Detect compensation offered
    const compensationOffered = this.detectCompensationOffered(content);
    if (compensationOffered) {
      deniedBoardingData.compensationOffered = compensationOffered;
    }

    // Detect alternative flight
    const alternativeFlight = this.detectAlternativeFlight(content);
    if (alternativeFlight) {
      deniedBoardingData.alternativeFlight = alternativeFlight;
    }

    // Detect passenger count
    const passengerCount = this.detectPassengerCount(content);
    if (passengerCount) {
      deniedBoardingData.passengerCount = passengerCount;
    }

    return deniedBoardingData;
  }

  /**
   * Detect if denied boarding was voluntary or involuntary
   */
  private detectType(content: string): 'voluntary' | 'involuntary' {
    const hasVoluntary = voluntaryPatterns.some((pattern) =>
      pattern.test(content)
    );
    const hasInvoluntary = involuntaryPatterns.some((pattern) =>
      pattern.test(content)
    );

    if (hasVoluntary && !hasInvoluntary) {
      return 'voluntary';
    } else if (hasInvoluntary && !hasVoluntary) {
      return 'involuntary';
    }

    // Default to involuntary if unclear
    return 'involuntary';
  }

  /**
   * Detect reason for denied boarding
   */
  private detectReason(content: string): DeniedBoardingData['reason'] {
    if (overbookingPatterns.some((pattern) => pattern.test(content))) {
      return 'overbooking';
    }

    if (content.includes('aircraft') && content.includes('change')) {
      return 'aircraft_change';
    }

    if (content.includes('weight') || content.includes('heavy')) {
      return 'weight_restrictions';
    }

    return 'other';
  }

  /**
   * Detect compensation offered
   */
  private detectCompensationOffered(
    content: string
  ): DeniedBoardingData['compensationOffered'] | null {
    for (const pattern of compensationOfferPatterns) {
      const match = content.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        let type: 'cash' | 'voucher' | 'miles' = 'cash';

        if (content.includes('voucher') || content.includes('credit')) {
          type = 'voucher';
        } else if (content.includes('miles') || content.includes('points')) {
          type = 'miles';
        }

        return {
          amount,
          currency: content.includes('$') ? 'USD' : 'EUR',
          type,
        };
      }
    }

    return null;
  }

  /**
   * Detect alternative flight details
   */
  private detectAlternativeFlight(
    content: string
  ): DeniedBoardingData['alternativeFlight'] | null {
    const flightMatch = content.match(/flight\s+(\w+\d+)/i);
    if (!flightMatch) {
      return null;
    }

    const flightNumber = flightMatch[1];

    // Extract times if available
    const departureTimeMatch = content.match(/departure.*?(\d{1,2}:\d{2})/i);
    const arrivalTimeMatch = content.match(/arrival.*?(\d{1,2}:\d{2})/i);

    // Calculate delay hours (simplified)
    const delayMatch = content.match(/(\d+)\s+hours?\s+later/i);
    const delayHours = delayMatch ? parseInt(delayMatch[1]) : 0;

    return {
      flightNumber,
      departureTime: departureTimeMatch?.[1] || 'TBD',
      arrivalTime: arrivalTimeMatch?.[1] || 'TBD',
      delayHours,
    };
  }

  /**
   * Detect number of passengers denied boarding
   */
  private detectPassengerCount(content: string): number | null {
    const countMatch = content.match(
      /(\d+)\s+passengers?\s+(denied|unable|bumped)/i
    );
    if (countMatch) {
      return parseInt(countMatch[1]);
    }

    return null;
  }

  /**
   * Analyze overbooking scenario
   */
  analyzeOverbooking(emailContent: string): OverbookingAnalysis {
    const content = emailContent.toLowerCase();

    return {
      isOverbooking: overbookingPatterns.some((pattern) =>
        pattern.test(content)
      ),
      airlinePolicy: this.detectAirlinePolicy(content),
      compensationOffered: compensationOfferPatterns.some((pattern) =>
        pattern.test(content)
      ),
      alternativeArrangements: this.detectAlternativeArrangements(content),
    };
  }

  /**
   * Detect airline policy
   */
  private detectAirlinePolicy(
    content: string
  ): 'voluntary_first' | 'involuntary_allowed' {
    if (content.includes('volunteer') && content.includes('first')) {
      return 'voluntary_first';
    }

    return 'involuntary_allowed';
  }

  /**
   * Detect alternative arrangements
   */
  private detectAlternativeArrangements(content: string): boolean {
    return (
      content.includes('alternative') ||
      content.includes('rebook') ||
      content.includes('next flight') ||
      content.includes('replacement')
    );
  }
}

/**
 * Denied boarding compensation calculator
 */
export class DeniedBoardingCompensationCalculator {
  /**
   * Calculate compensation for denied boarding based on regulation
   */
  calculateCompensation(
    deniedBoardingData: DeniedBoardingData,
    flightData: any, // FlightData from flight-apis
    regulation: string
  ): DeniedBoardingCompensation {
    const conditions = this.analyzeConditions(deniedBoardingData);

    switch (regulation) {
      case 'EU261':
        return this.calculateEU261Compensation(
          deniedBoardingData,
          flightData,
          conditions
        );
      case 'UK261':
        return this.calculateUKCAACompensation(
          deniedBoardingData,
          flightData,
          conditions
        );
      case 'US_DOT':
        return this.calculateUSDOTCompensation(
          deniedBoardingData,
          flightData,
          conditions
        );
      default:
        return this.getNoCompensationResult(conditions);
    }
  }

  /**
   * Analyze denied boarding conditions
   */
  private analyzeConditions(
    deniedBoardingData: DeniedBoardingData
  ): DeniedBoardingCompensation['conditions'] {
    return {
      isOverbooking: deniedBoardingData.reason === 'overbooking',
      compensationOffered: !!deniedBoardingData.compensationOffered,
      alternativeArrangements: !!deniedBoardingData.alternativeFlight,
    };
  }

  /**
   * Calculate EU261 compensation
   */
  private calculateEU261Compensation(
    deniedBoardingData: DeniedBoardingData,
    flightData: any,
    conditions: DeniedBoardingCompensation['conditions']
  ): DeniedBoardingCompensation {
    // EU261 applies to involuntary denied boarding
    if (deniedBoardingData.type === 'voluntary') {
      return this.getVoluntaryCompensationResult(conditions);
    }

    const distance = flightData?.distance || 1000; // Default distance
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
      type: 'involuntary',
      conditions,
      additionalRights: [
        'Right to care (meals, refreshments, accommodation)',
        'Right to choose between refund and re-routing',
        'Right to assistance (phone calls, etc.)',
        'Right to compensation',
      ],
    };
  }

  /**
   * Calculate UK CAA compensation (same as EU261 but in GBP)
   */
  private calculateUKCAACompensation(
    deniedBoardingData: DeniedBoardingData,
    flightData: any,
    conditions: DeniedBoardingCompensation['conditions']
  ): DeniedBoardingCompensation {
    const eu261Result = this.calculateEU261Compensation(
      deniedBoardingData,
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
    deniedBoardingData: DeniedBoardingData,
    flightData: any,
    conditions: DeniedBoardingCompensation['conditions']
  ): DeniedBoardingCompensation {
    if (deniedBoardingData.type === 'voluntary') {
      return this.getVoluntaryCompensationResult(conditions);
    }

    // US DOT compensation based on delay and ticket price
    const delayHours = deniedBoardingData.alternativeFlight?.delayHours || 0;
    let compensationAmount = 0;

    if (delayHours <= 1) {
      compensationAmount = 200; // 200% of ticket price (max $775)
    } else if (delayHours <= 2) {
      compensationAmount = 200; // 200% of ticket price (max $775)
    } else {
      compensationAmount = 400; // 400% of ticket price (max $1,550)
    }

    return {
      isEligible: true,
      compensationAmount,
      currency: 'USD',
      regulation: 'US_DOT',
      type: 'involuntary',
      conditions,
      additionalRights: [
        'Right to refund or re-routing',
        'Right to care if delayed overnight',
        'Right to compensation',
      ],
    };
  }

  /**
   * Get voluntary compensation result
   */
  private getVoluntaryCompensationResult(
    conditions: DeniedBoardingCompensation['conditions']
  ): DeniedBoardingCompensation {
    return {
      isEligible: true,
      compensationAmount: 0, // Negotiated with airline
      currency: 'USD',
      regulation: 'US_DOT',
      type: 'voluntary',
      conditions,
      additionalRights: [
        'Compensation negotiated with airline',
        'Right to alternative flight',
      ],
    };
  }

  /**
   * Get no compensation result
   */
  private getNoCompensationResult(
    conditions: DeniedBoardingCompensation['conditions']
  ): DeniedBoardingCompensation {
    return {
      isEligible: false,
      compensationAmount: 0,
      currency: 'EUR',
      regulation: 'EU261',
      type: 'involuntary',
      conditions,
      additionalRights: [],
    };
  }
}

/**
 * Main denied boarding service
 */
export class DeniedBoardingService {
  private detector: DeniedBoardingDetector;
  private calculator: DeniedBoardingCompensationCalculator;

  constructor() {
    this.detector = new DeniedBoardingDetector();
    this.calculator = new DeniedBoardingCompensationCalculator();
  }

  /**
   * Process denied boarding scenario
   */
  async processDeniedBoarding(
    emailContent: string,
    flightData: any,
    regulation: string
  ): Promise<{
    deniedBoardingData: DeniedBoardingData | null;
    compensation: DeniedBoardingCompensation | null;
  }> {
    const deniedBoardingData = this.detector.detectDeniedBoarding(emailContent);

    if (!deniedBoardingData) {
      return { deniedBoardingData: null, compensation: null };
    }

    const compensation = this.calculator.calculateCompensation(
      deniedBoardingData,
      flightData,
      regulation
    );

    return { deniedBoardingData, compensation };
  }
}

// Export singleton instance
export const deniedBoardingService = new DeniedBoardingService();
