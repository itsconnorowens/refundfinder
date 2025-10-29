/**
 * Comprehensive Test Suite for Seat Downgrading Compensation (EU261 Article 10)
 * Tests all aspects of downgrading eligibility logic across EU261, UK CAA, and US DOT regulations
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the Anthropic SDK to avoid browser environment errors
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {}
    messages = {
      create: vi.fn(),
    };
  },
}));

import {
  checkEligibility,
  checkDowngradingEligibility,
  calculateClassDifference,
  FlightDetails,
  SeatClass,
} from '../eligibility';

describe('Seat Downgrading - EU261 Article 10 Compliance', () => {
  describe('Class Difference Calculation', () => {
    it('should calculate correct downgrade levels for all class combinations', () => {
      // First to lower classes
      expect(calculateClassDifference('first', 'business')).toBe(1);
      expect(calculateClassDifference('first', 'premium_economy')).toBe(2);
      expect(calculateClassDifference('first', 'economy')).toBe(3);

      // Business to lower classes
      expect(calculateClassDifference('business', 'premium_economy')).toBe(1);
      expect(calculateClassDifference('business', 'economy')).toBe(2);

      // Premium Economy to Economy
      expect(calculateClassDifference('premium_economy', 'economy')).toBe(1);
    });

    it('should return 0 for same class', () => {
      expect(calculateClassDifference('first', 'first')).toBe(0);
      expect(calculateClassDifference('business', 'business')).toBe(0);
      expect(calculateClassDifference('premium_economy', 'premium_economy')).toBe(0);
      expect(calculateClassDifference('economy', 'economy')).toBe(0);
    });

    it('should return negative for upgrades', () => {
      expect(calculateClassDifference('economy', 'first')).toBe(-3);
      expect(calculateClassDifference('economy', 'business')).toBe(-2);
      expect(calculateClassDifference('economy', 'premium_economy')).toBe(-1);
      expect(calculateClassDifference('business', 'first')).toBe(-1);
    });
  });

  describe('EU261 Downgrading Compensation - Distance Tiers', () => {
    it('should calculate 30% refund for short-haul flights (≤1500km)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH123',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: 500,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€150'); // 30% of 500
      expect(result.confidence).toBe(95);
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('30%');
      expect(result.message).toContain('Article 10');
      expect(result.reason).toContain('30% refund');
    });

    it('should calculate 50% refund for medium-haul flights (1500-3500km)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA456',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'ATH',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'business',
        ticketPrice: 1000,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€500'); // 50% of 1000
      expect(result.confidence).toBe(95);
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('50%');
      expect(result.reason).toContain('50% refund');
    });

    it('should calculate 75% refund for long-haul flights (>3500km)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF789',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'economy',
        ticketPrice: 2000,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€1500'); // 75% of 2000
      expect(result.confidence).toBe(95);
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('75%');
      expect(result.reason).toContain('75% refund');
    });
  });

  describe('EU261 Downgrading - All Class Combinations', () => {
    it('should handle First to Business downgrade', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH100',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'business',
        ticketPrice: 3000,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€2250'); // 75% of 3000
      expect(result.reason).toContain('Downgraded from first to business');
    });

    it('should handle First to Premium Economy downgrade', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA200',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'premium_economy',
        ticketPrice: 2500,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€1875'); // 75% of 2500
      expect(result.reason).toContain('Downgraded from first to premium_economy');
    });

    it('should handle Business to Premium Economy downgrade', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF300',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'premium_economy',
        ticketPrice: 1800,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€1350'); // 75% of 1800
      expect(result.reason).toContain('Downgraded from business to premium_economy');
    });

    it('should handle Business to Economy downgrade', async () => {
      const flight: FlightDetails = {
        flightNumber: 'KL400',
        airline: 'KLM',
        departureDate: '2024-03-15',
        departureAirport: 'AMS',
        arrivalAirport: 'ATH',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: 800,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€400'); // 50% of 800
      expect(result.reason).toContain('Downgraded from business to economy');
    });

    it('should handle Premium Economy to Economy downgrade', async () => {
      const flight: FlightDetails = {
        flightNumber: 'IB500',
        airline: 'Iberia',
        departureDate: '2024-03-15',
        departureAirport: 'MAD',
        arrivalAirport: 'BCN',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'premium_economy',
        actualClass: 'economy',
        ticketPrice: 300,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€90'); // 30% of 300
      expect(result.reason).toContain('Downgraded from premium_economy to economy');
    });
  });

  describe('EU261 Downgrading - Missing Ticket Price Handling', () => {
    it('should still be eligible but request ticket price', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH600',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        // ticketPrice not provided
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('To be calculated');
      expect(result.confidence).toBe(70);
      expect(result.message).toContain('Please provide your ticket price');
      expect(result.message).toContain('Article 10');
      expect(result.reason).toContain('Downgraded from business to economy');
    });

    it('should handle zero ticket price as missing', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA700',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'business',
        ticketPrice: 0,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('To be calculated');
      expect(result.message).toContain('Please provide your ticket price');
    });

    it('should handle negative ticket price as missing', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF800',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'LHR',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: -100,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('To be calculated');
      expect(result.message).toContain('Please provide your ticket price');
    });
  });

  describe('EU261 Downgrading - No Downgrade Scenarios', () => {
    it('should not be eligible for same class', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH900',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'business',
        ticketPrice: 500,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.confidence).toBe(100);
      expect(result.message).toContain('No downgrade detected');
      expect(result.message).toContain('same or better class');
      expect(result.reason).toBe('No downgrade occurred');
    });

    it('should not be eligible for upgrades', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA1000',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'economy',
        actualClass: 'business',
        ticketPrice: 200,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('No downgrade detected');
      expect(result.reason).toBe('No downgrade occurred');
    });
  });

  describe('EU261 Downgrading - Missing Class Information', () => {
    it('should not be eligible when bookedClass is missing', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH1100',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        // bookedClass missing
        actualClass: 'economy',
        ticketPrice: 500,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.confidence).toBe(50);
      expect(result.message).toContain('missing booked or actual class information');
      expect(result.reason).toBe('Missing class information');
    });

    it('should not be eligible when actualClass is missing', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA1200',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        // actualClass missing
        ticketPrice: 500,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('missing booked or actual class information');
    });
  });

  describe('EU261 Downgrading - Compensation Cap at Ticket Price', () => {
    it('should cap compensation at ticket price for very cheap tickets', async () => {
      const flight: FlightDetails = {
        flightNumber: 'FR1300',
        airline: 'Ryanair',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: 50, // Very cheap ticket
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      // 75% of 50 = 37.5, rounds to 38, but should be capped at 50
      expect(result.amount).toBe('€38'); // Rounded 75% of 50
      expect(result.confidence).toBe(95);
    });
  });

  describe('EU261 Downgrading - No Extraordinary Circumstances Exemption', () => {
    it('should ALWAYS be eligible regardless of delay reason', async () => {
      // Downgrading compensation has NO extraordinary circumstances exemption per EU261 Article 10
      const flight: FlightDetails = {
        flightNumber: 'LH1400',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0 hours',
        delayReason: 'severe weather and volcanic ash', // Would normally be extraordinary
        disruptionType: 'downgrading',
        bookedClass: 'business',
        actualClass: 'economy',
        ticketPrice: 500,
      };

      const result = await checkDowngradingEligibility(flight);

      // Should still be eligible - downgrades always qualify
      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€150'); // 30% of 500
      expect(result.confidence).toBe(95);
    });

    it('should be eligible even with technical issues', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA1500',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        delayReason: 'emergency maintenance required',
        disruptionType: 'downgrading',
        bookedClass: 'first',
        actualClass: 'business',
        ticketPrice: 2000,
      };

      const result = await checkDowngradingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€1500'); // 75% of 2000
    });
  });
});

describe('UK CAA Downgrading Compensation', () => {
  it('should calculate compensation in GBP for UK flights', async () => {
    const flight: FlightDetails = {
      flightNumber: 'BA2000',
      airline: 'British Airways',
      departureDate: '2024-03-15',
      departureAirport: 'LHR',
      arrivalAirport: 'EDI',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'business',
      actualClass: 'economy',
      ticketPrice: 400,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('£120'); // 30% of 400
    expect(result.confidence).toBe(95);
    expect(result.regulation).toBe('UK CAA');
    expect(result.message).toContain('UK CAA regulations');
  });

  it('should handle 50% refund for medium-haul UK flights', async () => {
    const flight: FlightDetails = {
      flightNumber: 'BA2100',
      airline: 'British Airways',
      departureDate: '2024-03-15',
      departureAirport: 'LHR',
      arrivalAirport: 'ATH',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'first',
      actualClass: 'economy',
      ticketPrice: 1200,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('£600'); // 50% of 1200
    expect(result.regulation).toBe('UK CAA');
  });
});

describe('US DOT Downgrading Rules', () => {
  it('should indicate airline-specific policy for US flights', async () => {
    const flight: FlightDetails = {
      flightNumber: 'AA3000',
      airline: 'American Airlines',
      departureDate: '2024-03-15',
      departureAirport: 'JFK',
      arrivalAirport: 'LAX',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'first',
      actualClass: 'business',
      ticketPrice: 1500,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('Varies by airline');
    expect(result.confidence).toBe(65);
    expect(result.regulation).toBe('US DOT');
    expect(result.message).toContain('US DOT does not mandate specific compensation');
    expect(result.message).toContain('airline directly');
    expect(result.reason).toContain('check airline policy');
  });

  it('should handle missing class information for US flights', async () => {
    const flight: FlightDetails = {
      flightNumber: 'DL3100',
      airline: 'Delta',
      departureDate: '2024-03-15',
      departureAirport: 'LAX',
      arrivalAirport: 'JFK',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      // Missing class info
      ticketPrice: 1000,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(false);
    expect(result.amount).toBe('$0');
    expect(result.message).toContain('missing booked or actual class information');
  });

  it('should not be eligible for upgrades in US', async () => {
    const flight: FlightDetails = {
      flightNumber: 'UA3200',
      airline: 'United',
      departureDate: '2024-03-15',
      departureAirport: 'ORD',
      arrivalAirport: 'SFO',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'economy',
      actualClass: 'business',
      ticketPrice: 300,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(false);
    expect(result.amount).toBe('$0');
    expect(result.message).toContain('No downgrade detected');
  });
});

describe('Integration with checkEligibility', () => {
  it('should route to downgrading eligibility when disruptionType is downgrading', async () => {
    const flight: FlightDetails = {
      flightNumber: 'LH4000',
      airline: 'Lufthansa',
      departureDate: '2024-03-15',
      departureAirport: 'FRA',
      arrivalAirport: 'CDG',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'business',
      actualClass: 'economy',
      ticketPrice: 600,
    };

    const result = await checkEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('€180'); // 30% of 600
    expect(result.regulation).toBe('EU261');
    expect(result.message).toContain('Article 10');
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle exact 1500km boundary (short-haul tier)', async () => {
    const flight: FlightDetails = {
      flightNumber: 'TEST1',
      airline: 'Test Airlines',
      departureDate: '2024-03-15',
      departureAirport: 'FRA',
      arrivalAirport: 'LIS', // Approximately 1500km
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'business',
      actualClass: 'economy',
      ticketPrice: 1000,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    // At 1500km should be 30%
    expect(result.message).toContain('30%');
  });

  it('should handle very large ticket prices', async () => {
    const flight: FlightDetails = {
      flightNumber: 'LH5000',
      airline: 'Lufthansa',
      departureDate: '2024-03-15',
      departureAirport: 'FRA',
      arrivalAirport: 'JFK',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'first',
      actualClass: 'economy',
      ticketPrice: 15000,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('€11250'); // 75% of 15000
    expect(result.confidence).toBe(95);
  });

  it('should round compensation amounts correctly', async () => {
    const flight: FlightDetails = {
      flightNumber: 'BA5100',
      airline: 'British Airways',
      departureDate: '2024-03-15',
      departureAirport: 'LHR',
      arrivalAirport: 'CDG',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'business',
      actualClass: 'economy',
      ticketPrice: 333, // 30% = 99.9
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('€100'); // Should round to 100
  });

  it('should handle fractional ticket prices', async () => {
    const flight: FlightDetails = {
      flightNumber: 'AF5200',
      airline: 'Air France',
      departureDate: '2024-03-15',
      departureAirport: 'CDG',
      arrivalAirport: 'FRA',
      delayDuration: '0 hours',
      disruptionType: 'downgrading',
      bookedClass: 'business',
      actualClass: 'economy',
      ticketPrice: 550.50,
    };

    const result = await checkDowngradingEligibility(flight);

    expect(result.eligible).toBe(true);
    // 30% of 550.50 = 165.15, rounds to 165
    expect(result.amount).toBe('€165');
  });
});
