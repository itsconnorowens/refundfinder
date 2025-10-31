/**
 * Comprehensive test suite for enhanced cancellation support
 * Tests EU261 Article 5 compliance and all edge cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkEligibility, FlightDetails, AlternativeFlight } from '../eligibility';

// Mock the dependencies
vi.mock('../extraordinary-circumstances', () => ({
  analyzeExtraordinaryCircumstances: vi.fn().mockResolvedValue({
    isExtraordinary: false,
    confidence: 0.9,
    reason: 'Not extraordinary',
    category: 'operational',
    explanation: 'Operational issue within airline control',
  }),
}));

vi.mock('../distance-calculator', () => ({
  calculateFlightDistanceCached: vi.fn((_from, _to) => ({
    isValid: true,
    distanceKm: 1200, // Default to short-haul
  })),
}));

describe('Enhanced Cancellation Support - EU261 Article 5 Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notice Period Scenarios', () => {
    it('should reject compensation for cancellations with >14 days notice', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH123',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '> 14 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
      expect(result.message).toContain('more than 14 days');
      expect(result.regulation).toBe('EU261');
    });

    it('should require compensation for 7-14 days notice without suitable alternative', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH456',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '7-14 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250'); // Short haul
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.regulation).toBe('EU261');
    });

    it('should require compensation for <7 days notice without suitable alternative', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF789',
        airline: 'Air France',
        departureDate: '2024-04-15',
        departureAirport: 'CDG',
        arrivalAirport: 'FRA',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.regulation).toBe('EU261');
    });
  });

  describe('Alternative Flight Timing - 7-14 Days Notice', () => {
    it('should waive compensation if alternative departs <2h before and arrives <4h after (7-14 days)', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 1.5, // 1.5 hours later
        arrivalTimeDifference: 3.5, // 3.5 hours later
      };

      const flight: FlightDetails = {
        flightNumber: 'LH123',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'CDG',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '7-14 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('Alternative flight offered');
      expect(result.regulation).toBe('EU261');
    });

    it('should require compensation if alternative exceeds timing thresholds (7-14 days)', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 3, // 3 hours later - exceeds 2h threshold
        arrivalTimeDifference: 5, // 5 hours later - exceeds 4h threshold
      };

      const flight: FlightDetails = {
        flightNumber: 'AF456',
        airline: 'Air France',
        departureDate: '2024-04-15',
        departureAirport: 'CDG',
        arrivalAirport: 'FRA',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '7-14 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
      expect(result.regulation).toBe('EU261');
    });
  });

  describe('Alternative Flight Timing - <7 Days Notice', () => {
    it('should waive compensation if alternative departs <1h before and arrives <2h after (<7 days)', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 0.5, // 30 minutes later
        arrivalTimeDifference: 1.5, // 1.5 hours later
      };

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('Alternative flight offered');
    });

    it('should provide 50% compensation for close alternative (<7 days)', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 1.5, // 1.5 hours later - outside 1h threshold
        arrivalTimeDifference: 2.5, // 2.5 hours later - outside 2h threshold but within 3h
      };

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€125'); // 50% of €250
      expect(result.regulation).toBe('EU261');
    });

    it('should require full compensation if alternative exceeds all thresholds (<7 days)', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 4, // 4 hours later
        arrivalTimeDifference: 6, // 6 hours later
      };

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
      expect(result.regulation).toBe('EU261');
    });
  });

  describe('Distance-Based Compensation Tiers', () => {
    it('should calculate €250 for flights ≤1500km', async () => {
      const { calculateFlightDistanceCached } = await import('../distance-calculator');
      vi.mocked(calculateFlightDistanceCached).mockReturnValue({
        isValid: true,
        distanceKm: 1200,
      });

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
    });

    it('should calculate €400 for flights 1500-3500km', async () => {
      const { calculateFlightDistanceCached } = await import('../distance-calculator');
      vi.mocked(calculateFlightDistanceCached).mockReturnValue({
        isValid: true,
        distanceKm: 2500,
      });

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€400');
    });

    it('should calculate €600 for flights >3500km', async () => {
      const { calculateFlightDistanceCached } = await import('../distance-calculator');
      vi.mocked(calculateFlightDistanceCached).mockReturnValue({
        isValid: true,
        distanceKm: 5500,
      });

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€600');
    });
  });

  describe('Extraordinary Circumstances', () => {
    it('should reject compensation for extraordinary circumstances', async () => {
      const { analyzeExtraordinaryCircumstances } = await import('../extraordinary-circumstances');
      vi.mocked(analyzeExtraordinaryCircumstances).mockResolvedValue({
        isExtraordinary: true,
        confidence: 0.95,
        reason: 'Weather conditions',
        category: 'weather',
        explanation: 'Severe weather beyond airline control',
      });

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        delayReason: 'Severe storm at departure airport',
      };

      const result = await checkEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('extraordinary circumstances');
      expect(result.regulation).toBe('EU261');
    });
  });

  describe('Backward Compatibility - Legacy Fields', () => {
    it('should support legacy alternativeOffered and alternativeTiming fields', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeOffered: true,
        alternativeTiming: '1.5 hours later', // Should trigger 50% compensation
      };

      const result = await checkEligibility(flight);

      // Should use legacy parsing and apply appropriate compensation
      expect(result.eligible).toBe(false); // Within 2 hours for < 7 days notice
      expect(result.amount).toBe('€0');
    });

    it('should prioritize new alternativeFlight over legacy fields', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        departureTimeDifference: 0.5,
        arrivalTimeDifference: 1.5,
      };

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeFlight, // New format - within 1h/2h threshold
        alternativeOffered: true, // Legacy format - should be ignored
        alternativeTiming: '5 hours later', // Legacy format - should be ignored
      };

      const result = await checkEligibility(flight);

      // Should use new alternativeFlight data (within thresholds for < 7 days)
      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
      expect(result.message).toContain('Alternative flight offered');
    });
  });

  describe('UK CAA Regulation Compatibility', () => {
    it('should apply UK CAA regulations for UK flights', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'LHR', // UK airport
        arrivalAirport: 'JFK',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      expect(result.regulation).toBe('UK CAA');
      expect(result.eligible).toBe(true);
      // UK uses GBP currency
      expect(result.amount).toMatch(/£/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing notice period gracefully', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        // noticeGiven is missing
      };

      const result = await checkEligibility(flight);

      // Should default to "> 14 days" and reject compensation
      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
    });

    it('should handle alternative flight with partial data', async () => {
      const alternativeFlight: AlternativeFlight = {
        offered: true,
        // Missing time differences - should default to 0
      };

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
        alternativeFlight,
      };

      const result = await checkEligibility(flight);

      // With missing time differences, defaults to 0 (within thresholds)
      // So compensation is waived for < 7 days with 0 hour difference
      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('€0');
    });

    it('should handle invalid distance calculation', async () => {
      const { calculateFlightDistanceCached } = await import('../distance-calculator');
      vi.mocked(calculateFlightDistanceCached).mockReturnValue({
        isValid: false,
        distanceKm: 0,
      });

      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'XXX', // Invalid airport
        arrivalAirport: 'YYY', // Invalid airport
        delayDuration: '0',
        disruptionType: 'cancellation',
        noticeGiven: '< 7 days',
      };

      const result = await checkEligibility(flight);

      // Should fallback to 1000km (€250 tier)
      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
    });
  });

  describe('Delay vs Cancellation Distinction', () => {
    it('should not apply cancellation logic to delays', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '4 hours',
        disruptionType: 'delay', // Not a cancellation
      };

      const result = await checkEligibility(flight);

      // Should use delay logic, not cancellation logic
      expect(result.regulation).toMatch(/UK CAA|EU261/);
      expect(result.message).not.toContain('cancellation');
      expect(result.message).not.toContain('notice');
    });

    it('should default to delay logic when disruptionType is missing', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH789',
        airline: 'Lufthansa',
        departureDate: '2024-04-15',
        departureAirport: 'FRA',
        arrivalAirport: 'AMS',
        delayDuration: '4 hours',
        // disruptionType is missing - should default to delay
      };

      const result = await checkEligibility(flight);

      expect(result.message).not.toContain('cancellation');
    });
  });
});

describe('Integration Tests - End-to-End Cancellation Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default behavior
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { analyzeExtraordinaryCircumstances } = require('../extraordinary-circumstances');
    vi.mocked(analyzeExtraordinaryCircumstances).mockResolvedValue({
      isExtraordinary: false,
      confidence: 0.9,
      reason: 'Not extraordinary',
      category: 'operational',
      explanation: 'Operational issue within airline control',
    });
  });

  it('should handle realistic cancellation scenario: Last-minute cancellation with no alternative', async () => {
    const { calculateFlightDistanceCached } = await import('../distance-calculator');
    vi.mocked(calculateFlightDistanceCached).mockReturnValue({
      isValid: true,
      distanceKm: 2500, // Medium haul
    });

    const flight: FlightDetails = {
      flightNumber: 'LH456',
      airline: 'Lufthansa',
      departureDate: '2024-05-20',
      departureAirport: 'FRA',
      arrivalAirport: 'MAD',
      delayDuration: '0',
      disruptionType: 'cancellation',
      noticeGiven: '< 7 days',
      cancellationDate: '2024-05-18',
      delayReason: 'Technical issue with aircraft',
    };

    const result = await checkEligibility(flight);

    expect(result.eligible).toBe(true);
    expect(result.amount).toBe('€400'); // Medium haul
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.message).toContain('compensation');
  });

  it('should handle realistic cancellation scenario: Early cancellation with good alternative', async () => {
    const alternativeFlight: AlternativeFlight = {
      offered: true,
      departureTime: '14:00',
      arrivalTime: '20:30',
      departureTimeDifference: 1,
      arrivalTimeDifference: 1.5,
    };

    const flight: FlightDetails = {
      flightNumber: 'AF789',
      airline: 'Air France',
      departureDate: '2024-06-15',
      departureAirport: 'CDG',
      arrivalAirport: 'FRA',
      delayDuration: '0',
      disruptionType: 'cancellation',
      noticeGiven: '7-14 days',
      cancellationDate: '2024-06-05',
      alternativeFlight,
      delayReason: 'Operational reasons',
    };

    const result = await checkEligibility(flight);

    expect(result.eligible).toBe(false);
    expect(result.amount).toBe('€0');
    expect(result.message).toContain('Alternative flight offered');
  });
});
