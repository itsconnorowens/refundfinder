import { describe, it, expect } from 'vitest';
import { checkDeniedBoardingEligibility } from '../denied-boarding';
import type { FlightDetails } from '../eligibility';

describe('Denied Boarding Eligibility Tests', () => {
  // ============================================================================
  // EU261 DENIED BOARDING TESTS
  // ============================================================================

  describe('EU261 Denied Boarding', () => {
    it('should calculate compensation for involuntary denied boarding - short haul', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF123',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'AMS',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: false,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250');
      expect(result.regulation).toBe('EU261');
      expect(result.confidence).toBe(90);
      expect(result.message).toContain('involuntary denied boarding');
    });

    it('should calculate compensation for involuntary denied boarding - medium haul', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH456',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'ATH',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: false,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€400');
      expect(result.regulation).toBe('EU261');
      expect(result.confidence).toBe(90);
    });

    it('should calculate compensation for involuntary denied boarding - long haul', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF789',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: false,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€600');
      expect(result.regulation).toBe('EU261');
      expect(result.confidence).toBe(90);
    });

    it('should apply 50% reduction when alternative flight arrives within 2 hours (short haul)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF123',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'AMS',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '1.5 hours',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€125'); // 50% of €250
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('50% reduction');
      expect(result.message).toContain('1.5 hours');
    });

    it('should apply 50% reduction when alternative flight arrives within 3 hours (medium haul)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'LH456',
        airline: 'Lufthansa',
        departureDate: '2024-03-15',
        departureAirport: 'FRA',
        arrivalAirport: 'ATH',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '2.5 hours',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€200'); // 50% of €400
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('50% reduction');
    });

    it('should apply 50% reduction when alternative flight arrives within 4 hours (long haul)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF789',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'JFK',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '3.5 hours',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€300'); // 50% of €600
      expect(result.regulation).toBe('EU261');
      expect(result.message).toContain('50% reduction');
    });

    it('should not apply reduction when alternative arrives after threshold (short haul)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF123',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'AMS',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '3 hours',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€250'); // Full compensation
      expect(result.message).not.toContain('reduction');
    });
  });

  // ============================================================================
  // UK CAA DENIED BOARDING TESTS
  // ============================================================================

  describe('UK CAA Denied Boarding', () => {
    it('should calculate compensation for involuntary denied boarding - short haul', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA123',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'EDI',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: false,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('£250');
      expect(result.regulation).toBe('UK CAA');
      expect(result.confidence).toBe(90);
    });

    it('should calculate compensation for involuntary denied boarding - long haul', async () => {
      const flight: FlightDetails = {
        flightNumber: 'BA789',
        airline: 'British Airways',
        departureDate: '2024-03-15',
        departureAirport: 'LHR',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: false,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('£520');
      expect(result.regulation).toBe('UK CAA');
    });
  });

  // ============================================================================
  // US DOT DENIED BOARDING TESTS
  // ============================================================================

  describe('US DOT Denied Boarding (14 CFR Part 250)', () => {
    it('should require ticket price for US DOT calculation', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '2 hours',
        // Missing ticketPrice
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('$0');
      expect(result.confidence).toBe(50);
      expect(result.message).toContain('ticket price');
      expect(result.reason).toContain('Missing ticket price');
    });

    it('should return no compensation for alternative arriving within 1 hour', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '45 minutes',
        ticketPrice: 300,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('$0');
      expect(result.message).toContain('within 1 hour');
    });

    it('should calculate 200% compensation (domestic 1-2 hours delay)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '1.5 hours',
        ticketPrice: 300,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$600'); // 200% of $300
      expect(result.regulation).toBe('US DOT 14 CFR Part 250');
      expect(result.message).toContain('200%');
      expect(result.confidence).toBe(95);
    });

    it('should cap 200% compensation at $775', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '1.5 hours',
        ticketPrice: 500, // 200% would be $1000, but capped at $775
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$775'); // Capped
      expect(result.message).toContain('capped at $775');
    });

    it('should calculate 400% compensation (domestic 2+ hours delay)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '3 hours',
        ticketPrice: 300,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$1200'); // 400% of $300
      expect(result.regulation).toBe('US DOT 14 CFR Part 250');
      expect(result.message).toContain('400%');
    });

    it('should cap 400% compensation at $1550', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '3 hours',
        ticketPrice: 600, // 400% would be $2400, but capped at $1550
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$1550'); // Capped
      expect(result.message).toContain('capped at $1550');
    });

    it('should use international thresholds for international flights (1-4 hours = 200%)', async () => {
      const flight: FlightDetails = {
        flightNumber: 'DL100',
        airline: 'Delta',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'NRT', // Tokyo Narita (not UK/EU)
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '3 hours',
        ticketPrice: 500,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$775'); // 200% capped at $775
      expect(result.message).toContain('capped at $775');
    });

    it('should use 400% for international flights with 4+ hours delay', async () => {
      const flight: FlightDetails = {
        flightNumber: 'DL100',
        airline: 'Delta',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'NRT', // Tokyo Narita (not UK/EU)
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '5 hours',
        ticketPrice: 300,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('$1200'); // 400% of $300
      expect(result.message).toContain('400%');
    });
  });

  // ============================================================================
  // VOLUNTARY DENIED BOARDING TESTS
  // ============================================================================

  describe('Voluntary Denied Boarding', () => {
    it('should not provide mandatory compensation for voluntary denied boarding', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'voluntary',
        compensationOffered: 500,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('$500');
      expect(result.confidence).toBe(95);
      expect(result.message.toLowerCase()).toContain('voluntary');
      expect(result.message).toContain('airline discretion');
      expect(result.reason).toContain('voluntarily gave up seat');
    });

    it('should handle voluntary with no compensation offered', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'voluntary',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe('$0');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle flights not covered by any regulation', async () => {
      const flight: FlightDetails = {
        flightNumber: 'XX123',
        airline: 'Unknown Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'XXX',
        arrivalAirport: 'YYY',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.confidence).toBe(80);
      expect(result.reason).toContain('not covered');
    });

    it('should parse minutes correctly in alternative delay', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AF123',
        airline: 'Air France',
        departureDate: '2024-03-15',
        departureAirport: 'CDG',
        arrivalAirport: 'AMS',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '90 minutes', // Should be 1.5 hours
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe('€125'); // 50% reduction should apply
    });

    it('should handle zero ticket price for US DOT', async () => {
      const flight: FlightDetails = {
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departureDate: '2024-03-15',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        delayDuration: '0 hours',
        disruptionType: 'denied_boarding',
        deniedBoardingType: 'involuntary',
        alternativeOffered: true,
        alternativeArrivalDelay: '2 hours',
        ticketPrice: 0,
      };

      const result = await checkDeniedBoardingEligibility(flight);

      expect(result.eligible).toBe(false);
      expect(result.message).toContain('ticket price');
    });
  });
});
