/**
 * Downgrade Scenario Support
 * Handles seat downgrades with fare-difference compensation calculation
 * Supports EU261, UK CAA, and US DOT downgrade regulations
 */

export interface DowngradeData {
  isDowngrade: boolean;
  originalClass: 'first' | 'business' | 'premium_economy' | 'economy';
  newClass: 'first' | 'business' | 'premium_economy' | 'economy';
  fareDifference?: number;
  currency?: string;
  reason?: string;
  compensationOffered?: {
    amount: number;
    currency: string;
    type: 'refund' | 'voucher' | 'miles';
  };
  downgradeReason?: string;
}

export interface DowngradeCompensation {
  isEligible: boolean;
  compensationAmount: number;
  currency: string;
  regulation: string;
  fareDifferenceRefund: number;
  distanceCategory: 'short' | 'medium' | 'long';
  additionalRights: string[];
  conditions: {
    isDowngrade: boolean;
    fareDifference: number;
    compensationOffered: boolean;
  };
}

export enum CabinClass {
  FIRST = 'first',
  BUSINESS = 'business',
  PREMIUM_ECONOMY = 'premium_economy',
  ECONOMY = 'economy',
}

export interface CabinClassAnalysis {
  originalClass: string;
  newClass: string;
  isDowngrade: boolean;
  fareDifference: number;
  compensationEligible: boolean;
}

/**
 * Downgrade detection patterns
 */
export const downgradePatterns = [
  /downgraded/i,
  /moved\s+to\s+economy/i,
  /changed\s+to\s+economy/i,
  /seat\s+class\s+change/i,
  /cabin\s+change/i,
  /class\s+downgrade/i,
  /business\s+to\s+economy/i,
  /first\s+to\s+business/i,
  /premium\s+to\s+economy/i,
  /seat\s+reassignment/i,
];

/**
 * Cabin class detection patterns
 */
export const cabinClassPatterns = {
  first: [/first\s+class/i, /first/i, /suite/i, /apartment/i, /residence/i],
  business: [
    /business\s+class/i,
    /business/i,
    /club/i,
    /premium/i,
    /executive/i,
  ],
  premium_economy: [
    /premium\s+economy/i,
    /economy\s+plus/i,
    /economy\s+comfort/i,
    /economy\s+premium/i,
    /comfort\s+plus/i,
  ],
  economy: [/economy\s+class/i, /economy/i, /coach/i, /standard/i],
};

/**
 * Fare difference patterns
 */
export const fareDifferencePatterns = [
  /fare\s+difference\s+of\s+\$?(\d+)/i,
  /price\s+difference\s+of\s+\$?(\d+)/i,
  /refund\s+of\s+\$?(\d+)/i,
  /difference\s+of\s+\$?(\d+)/i,
  /(\d+)\s+less/i,
];

/**
 * Downgrade reason patterns
 */
export const downgradeReasonPatterns = {
  aircraft_change: [
    /aircraft\s+change/i,
    /different\s+aircraft/i,
    /equipment\s+change/i,
    /aircraft\s+substitution/i,
  ],
  overbooking: [/overbooked/i, /oversold/i, /too\s+many\s+passengers/i],
  maintenance: [/maintenance/i, /technical\s+issue/i, /aircraft\s+problem/i],
  operational: [/operational\s+reasons/i, /operational/i, /schedule\s+change/i],
};

/**
 * Downgrade scenario detector
 */
export class DowngradeDetector {
  /**
   * Detect downgrade scenario from email content
   */
  detectDowngrade(emailContent: string): DowngradeData | null {
    const content = emailContent.toLowerCase();

    // Check if email contains downgrade indicators
    const hasDowngrade = downgradePatterns.some((pattern) =>
      pattern.test(content)
    );
    if (!hasDowngrade) {
      return null;
    }

    const downgradeData: DowngradeData = {
      isDowngrade: true,
      originalClass: 'economy',
      newClass: 'economy',
    };

    // Detect cabin classes
    const cabinClasses = this.detectCabinClasses(content);
    if (cabinClasses) {
      downgradeData.originalClass = cabinClasses.original;
      downgradeData.newClass = cabinClasses.new;
    }

    // Detect fare difference
    const fareDifference = this.detectFareDifference(content);
    if (fareDifference) {
      downgradeData.fareDifference = fareDifference.amount;
      downgradeData.currency = fareDifference.currency;
    }

    // Detect downgrade reason
    downgradeData.downgradeReason = this.detectDowngradeReason(content);

    // Detect compensation offered
    const compensationOffered = this.detectCompensationOffered(content);
    if (compensationOffered) {
      downgradeData.compensationOffered = compensationOffered;
    }

    return downgradeData;
  }

  /**
   * Detect cabin classes from email content
   */
  private detectCabinClasses(
    content: string
  ): {
    original: DowngradeData['originalClass'];
    new: DowngradeData['newClass'];
  } | null {
    const classes = this.extractCabinClasses(content);

    if (classes.length < 2) {
      return null;
    }

    // Sort classes by hierarchy (first > business > premium_economy > economy)
    const classHierarchy = ['first', 'business', 'premium_economy', 'economy'];
    const sortedClasses = classes.sort(
      (a, b) => classHierarchy.indexOf(a) - classHierarchy.indexOf(b)
    );

    return {
      original: sortedClasses[0] as DowngradeData['originalClass'],
      new: sortedClasses[sortedClasses.length - 1] as DowngradeData['newClass'],
    };
  }

  /**
   * Extract all cabin classes mentioned in content
   */
  private extractCabinClasses(content: string): string[] {
    const classes: string[] = [];

    for (const [classType, patterns] of Object.entries(cabinClassPatterns)) {
      if (patterns.some((pattern) => pattern.test(content))) {
        classes.push(classType);
      }
    }

    return classes;
  }

  /**
   * Detect fare difference
   */
  private detectFareDifference(
    content: string
  ): { amount: number; currency: string } | null {
    for (const pattern of fareDifferencePatterns) {
      const match = content.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        const currency = content.includes('$') ? 'USD' : 'EUR';

        return { amount, currency };
      }
    }

    return null;
  }

  /**
   * Detect downgrade reason
   */
  private detectDowngradeReason(content: string): string {
    for (const [reason, patterns] of Object.entries(downgradeReasonPatterns)) {
      if (patterns.some((pattern) => pattern.test(content))) {
        return reason.replace('_', ' ');
      }
    }

    return 'operational reasons';
  }

  /**
   * Detect compensation offered
   */
  private detectCompensationOffered(
    content: string
  ): DowngradeData['compensationOffered'] | null {
    const compensationMatch = content.match(/compensation\s+of\s+\$?(\d+)/i);
    if (!compensationMatch) {
      return null;
    }

    const amount = parseInt(compensationMatch[1]);
    let type: 'refund' | 'voucher' | 'miles' = 'refund';

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

  /**
   * Analyze cabin class downgrade
   */
  analyzeCabinClassDowngrade(emailContent: string): CabinClassAnalysis {
    const downgradeData = this.detectDowngrade(emailContent);

    if (!downgradeData) {
      return {
        originalClass: 'economy',
        newClass: 'economy',
        isDowngrade: false,
        fareDifference: 0,
        compensationEligible: false,
      };
    }

    const fareDifference = downgradeData.fareDifference || 0;
    const isDowngrade = this.isDowngrade(
      downgradeData.originalClass,
      downgradeData.newClass
    );

    return {
      originalClass: downgradeData.originalClass,
      newClass: downgradeData.newClass,
      isDowngrade,
      fareDifference,
      compensationEligible: isDowngrade && fareDifference > 0,
    };
  }

  /**
   * Check if it's actually a downgrade
   */
  private isDowngrade(originalClass: string, newClass: string): boolean {
    const classHierarchy = ['economy', 'premium_economy', 'business', 'first'];
    const originalIndex = classHierarchy.indexOf(originalClass);
    const newIndex = classHierarchy.indexOf(newClass);

    return originalIndex > newIndex; // Higher index = higher class
  }
}

/**
 * Downgrade compensation calculator
 */
export class DowngradeCompensationCalculator {
  /**
   * Calculate compensation for downgrade based on regulation
   */
  calculateCompensation(
    downgradeData: DowngradeData,
    flightData: any, // FlightData from flight-apis
    regulation: string
  ): DowngradeCompensation {
    const conditions = this.analyzeConditions(downgradeData);

    switch (regulation) {
      case 'EU261':
        return this.calculateEU261Compensation(
          downgradeData,
          flightData,
          conditions
        );
      case 'UK261':
        return this.calculateUKCAACompensation(
          downgradeData,
          flightData,
          conditions
        );
      case 'US_DOT':
        return this.calculateUSDOTCompensation(
          downgradeData,
          flightData,
          conditions
        );
      default:
        return this.getNoCompensationResult(conditions);
    }
  }

  /**
   * Analyze downgrade conditions
   */
  private analyzeConditions(
    downgradeData: DowngradeData
  ): DowngradeCompensation['conditions'] {
    return {
      isDowngrade: downgradeData.isDowngrade,
      fareDifference: downgradeData.fareDifference || 0,
      compensationOffered: !!downgradeData.compensationOffered,
    };
  }

  /**
   * Calculate EU261 compensation
   */
  private calculateEU261Compensation(
    downgradeData: DowngradeData,
    flightData: any,
    conditions: DowngradeCompensation['conditions']
  ): DowngradeCompensation {
    if (!conditions.isDowngrade) {
      return this.getNoCompensationResult(conditions);
    }

    const distance = flightData?.distance || 1000; // Default distance
    const distanceCategory = this.getDistanceCategory(distance);

    // EU261 compensation based on distance and fare difference
    let compensationPercentage = 0.3; // 30% default (short haul)

    if (distanceCategory === 'medium') {
      compensationPercentage = 0.5; // 50% for medium haul
    } else if (distanceCategory === 'long') {
      compensationPercentage = 0.75; // 75% for long haul
    }

    const fareDifference = conditions.fareDifference;
    const compensationAmount = Math.round(
      fareDifference * compensationPercentage
    );

    return {
      isEligible: true,
      compensationAmount,
      currency: 'EUR',
      regulation: 'EU261',
      fareDifferenceRefund: fareDifference,
      distanceCategory,
      conditions,
      additionalRights: [
        'Refund of fare difference',
        'Right to care if downgrade causes delay',
        'Right to assistance',
      ],
    };
  }

  /**
   * Calculate UK CAA compensation (same as EU261 but in GBP)
   */
  private calculateUKCAACompensation(
    downgradeData: DowngradeData,
    flightData: any,
    conditions: DowngradeCompensation['conditions']
  ): DowngradeCompensation {
    const eu261Result = this.calculateEU261Compensation(
      downgradeData,
      flightData,
      conditions
    );

    if (!eu261Result.isEligible) {
      return eu261Result;
    }

    // Convert EUR to GBP (approximate rates)
    const gbpCompensation = Math.round(eu261Result.compensationAmount * 0.88);
    const gbpFareDifference = Math.round(
      eu261Result.fareDifferenceRefund * 0.88
    );

    return {
      ...eu261Result,
      currency: 'GBP',
      regulation: 'UK261',
      compensationAmount: gbpCompensation,
      fareDifferenceRefund: gbpFareDifference,
    };
  }

  /**
   * Calculate US DOT compensation
   */
  private calculateUSDOTCompensation(
    downgradeData: DowngradeData,
    flightData: any,
    conditions: DowngradeCompensation['conditions']
  ): DowngradeCompensation {
    if (!conditions.isDowngrade) {
      return this.getNoCompensationResult(conditions);
    }

    // US DOT typically requires refund of fare difference
    const fareDifference = conditions.fareDifference;

    return {
      isEligible: true,
      compensationAmount: fareDifference, // Full fare difference refund
      currency: 'USD',
      regulation: 'US_DOT',
      fareDifferenceRefund: fareDifference,
      distanceCategory: 'short', // US DOT doesn't differentiate by distance
      conditions,
      additionalRights: [
        'Refund of fare difference',
        'Right to alternative flight if available',
      ],
    };
  }

  /**
   * Get distance category
   */
  private getDistanceCategory(distance: number): 'short' | 'medium' | 'long' {
    if (distance <= 1500) {
      return 'short';
    } else if (distance <= 3500) {
      return 'medium';
    } else {
      return 'long';
    }
  }

  /**
   * Get no compensation result
   */
  private getNoCompensationResult(
    conditions: DowngradeCompensation['conditions']
  ): DowngradeCompensation {
    return {
      isEligible: false,
      compensationAmount: 0,
      currency: 'EUR',
      regulation: 'EU261',
      fareDifferenceRefund: 0,
      distanceCategory: 'short',
      conditions,
      additionalRights: [],
    };
  }
}

/**
 * Main downgrade service
 */
export class DowngradeService {
  private detector: DowngradeDetector;
  private calculator: DowngradeCompensationCalculator;

  constructor() {
    this.detector = new DowngradeDetector();
    this.calculator = new DowngradeCompensationCalculator();
  }

  /**
   * Process downgrade scenario
   */
  async processDowngrade(
    emailContent: string,
    flightData: any,
    regulation: string
  ): Promise<{
    downgradeData: DowngradeData | null;
    compensation: DowngradeCompensation | null;
  }> {
    const downgradeData = this.detector.detectDowngrade(emailContent);

    if (!downgradeData) {
      return { downgradeData: null, compensation: null };
    }

    const compensation = this.calculator.calculateCompensation(
      downgradeData,
      flightData,
      regulation
    );

    return { downgradeData, compensation };
  }
}

// Export singleton instance
export const downgradeService = new DowngradeService();
