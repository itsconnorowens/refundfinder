/**
 * Comprehensive Tests for Scenario Detection System
 * Tests all scenario types: delays, cancellations, denied boarding, downgrades
 */

import { scenarioService } from '../scenario-detector';
import { FlightData } from '../flight-apis';

// Mock flight data for testing
const mockFlightData: FlightData = {
  flightNumber: 'BA123',
  airline: 'British Airways',
  departureAirport: 'LHR',
  arrivalAirport: 'JFK',
  scheduledDeparture: '2024-01-15T10:00:00Z',
  scheduledArrival: '2024-01-15T18:00:00Z',
  delayMinutes: 0,
  isCancelled: false,
  status: 'scheduled',
  source: 'aviationstack',
  confidence: 0.9,
};

describe('Scenario Detection System', () => {
  describe('Delay Detection', () => {
    test('should detect delay scenario with specific duration', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to technical issues.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.scenarios.delay?.isDelayed).toBe(true);
      expect(result.scenarioResult.scenarios.delay?.delayMinutes).toBe(240);
      expect(result.scenarioResult.primaryScenario).toBe('delay');
    });

    test('should detect extraordinary circumstances', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed due to severe weather conditions.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(
        result.scenarioResult.scenarios.delay?.extraordinaryCircumstances
      ).toBe(true);
      expect(result.compensationResult.totalCompensation).toBe(0);
    });

    test('should not compensate for delays under 3 hours', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 2 hours due to operational reasons.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay?.delayMinutes).toBe(120);
      expect(result.compensationResult.totalCompensation).toBe(0);
    });
  });

  describe('Cancellation Detection', () => {
    test('should detect cancellation scenario', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been cancelled due to operational reasons.
        We have rebooked you on flight BA456 departing at 14:00.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.cancellation).toBeDefined();
      expect(result.scenarioResult.scenarios.cancellation?.isCancelled).toBe(
        true
      );
      expect(
        result.scenarioResult.scenarios.cancellation?.alternativeFlightOffered
      ).toBe(true);
      expect(result.scenarioResult.primaryScenario).toBe('cancellation');
    });

    test('should detect cancellation with adequate notice', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 scheduled for next month has been cancelled.
        We provided more than 14 days notice.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.cancellation?.noticePeriod).toBe(
        'adequate'
      );
      expect(result.compensationResult.totalCompensation).toBe(0);
    });

    test('should detect cancellation with extraordinary circumstances', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been cancelled due to severe weather conditions.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(
        result.scenarioResult.scenarios.cancellation?.extraordinaryCircumstances
      ).toBe(true);
      expect(result.compensationResult.totalCompensation).toBe(0);
    });
  });

  describe('Denied Boarding Detection', () => {
    test('should detect involuntary denied boarding', async () => {
      const emailContent = `
        Dear Passenger,
        Unfortunately, we are unable to accommodate you on flight BA123 due to overbooking.
        You have been involuntarily denied boarding.
        We have rebooked you on the next available flight.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.deniedBoarding).toBeDefined();
      expect(
        result.scenarioResult.scenarios.deniedBoarding?.isDeniedBoarding
      ).toBe(true);
      expect(result.scenarioResult.scenarios.deniedBoarding?.type).toBe(
        'involuntary'
      );
      expect(result.scenarioResult.scenarios.deniedBoarding?.reason).toBe(
        'overbooking'
      );
      expect(result.scenarioResult.primaryScenario).toBe('denied_boarding');
    });

    test('should detect voluntary denied boarding', async () => {
      const emailContent = `
        Dear Passenger,
        We are offering compensation of $500 for volunteers to give up their seat on flight BA123.
        Thank you for volunteering.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'US_DOT'
      );

      expect(result.scenarioResult.scenarios.deniedBoarding?.type).toBe(
        'voluntary'
      );
      expect(
        result.scenarioResult.scenarios.deniedBoarding?.compensationOffered
      ).toBeDefined();
      expect(
        result.scenarioResult.scenarios.deniedBoarding?.compensationOffered
          ?.amount
      ).toBe(500);
    });

    test('should detect aircraft change reason', async () => {
      const emailContent = `
        Dear Passenger,
        Due to an aircraft change, we are unable to accommodate all passengers on flight BA123.
        You have been denied boarding.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.deniedBoarding?.reason).toBe(
        'aircraft_change'
      );
    });
  });

  describe('Downgrade Detection', () => {
    test('should detect cabin downgrade', async () => {
      const emailContent = `
        Dear Passenger,
        Due to operational reasons, you have been moved from Business Class to Economy Class on flight BA123.
        We will refund the fare difference of $800.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.downgrade).toBeDefined();
      expect(result.scenarioResult.scenarios.downgrade?.isDowngrade).toBe(true);
      expect(result.scenarioResult.scenarios.downgrade?.originalClass).toBe(
        'business'
      );
      expect(result.scenarioResult.scenarios.downgrade?.newClass).toBe(
        'economy'
      );
      expect(result.scenarioResult.scenarios.downgrade?.fareDifference).toBe(
        800
      );
      expect(result.scenarioResult.primaryScenario).toBe('downgrade');
    });

    test('should detect first to business downgrade', async () => {
      const emailContent = `
        Dear Passenger,
        You have been downgraded from First Class to Business Class on flight BA123.
        We will provide compensation for this change.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.downgrade?.originalClass).toBe(
        'first'
      );
      expect(result.scenarioResult.scenarios.downgrade?.newClass).toBe(
        'business'
      );
    });

    test('should detect premium economy to economy downgrade', async () => {
      const emailContent = `
        Dear Passenger,
        Due to aircraft change, you have been moved from Premium Economy to Economy Class on flight BA123.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.downgrade?.originalClass).toBe(
        'premium_economy'
      );
      expect(result.scenarioResult.scenarios.downgrade?.newClass).toBe(
        'economy'
      );
    });
  });

  describe('Multiple Scenario Detection', () => {
    test('should detect multiple scenarios and prioritize primary', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 5 hours due to technical issues.
        Additionally, due to overbooking, you have been denied boarding.
        We have rebooked you on the next available flight.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.scenarios.deniedBoarding).toBeDefined();
      expect(result.scenarioResult.allScenarios.length).toBeGreaterThan(1);
      expect(result.scenarioResult.primaryScenario).toBeDefined();
    });

    test('should calculate combined compensation for multiple scenarios', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been cancelled due to operational reasons.
        We have rebooked you on flight BA456 departing 6 hours later.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
      expect(result.compensationResult.additionalRights.length).toBeGreaterThan(
        0
      );
    });
  });

  describe('Regulation-Specific Compensation', () => {
    test('should calculate EU261 compensation correctly', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.compensationResult.regulation).toBe('EU261');
      expect(result.compensationResult.currency).toBe('EUR');
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
    });

    test('should calculate UK CAA compensation correctly', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'UK261'
      );

      expect(result.compensationResult.regulation).toBe('UK261');
      expect(result.compensationResult.currency).toBe('GBP');
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
    });

    test('should calculate US DOT compensation correctly', async () => {
      const emailContent = `
        Dear Passenger,
        You have been involuntarily denied boarding on flight BA123 due to overbooking.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'US_DOT'
      );

      expect(result.compensationResult.regulation).toBe('US_DOT');
      expect(result.compensationResult.currency).toBe('USD');
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle emails with no scenario indicators', async () => {
      const emailContent = `
        Dear Passenger,
        Thank you for choosing British Airways.
        We hope you enjoyed your flight.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.allScenarios.length).toBe(0);
      expect(result.compensationResult.totalCompensation).toBe(0);
    });

    test('should handle ambiguous scenario descriptions', async () => {
      const emailContent = `
        Dear Passenger,
        There has been a change to your flight BA123.
        Please contact us for more information.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.allScenarios.length).toBe(0);
      expect(result.analysis.recommendedAction).toContain(
        'No compensation eligible'
      );
    });

    test('should handle very long email content', async () => {
      const longContent = `
        Dear Passenger,
        ${'Your flight BA123 has been delayed by 4 hours due to operational reasons. '.repeat(100)}
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        longContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.scenarios.delay?.delayMinutes).toBe(240);
    });
  });

  describe('Confidence Scoring', () => {
    test('should provide confidence scores for detected scenarios', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to technical issues.
        We apologize for the inconvenience.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.confidence).toBeGreaterThan(0);
      expect(result.scenarioResult.confidence).toBeLessThanOrEqual(1);
      expect(result.compensationResult.confidence).toBeGreaterThan(0);
    });

    test('should have higher confidence for clear scenario descriptions', async () => {
      const clearContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by exactly 4 hours due to technical issues.
        We apologize for the inconvenience.
      `;

      const ambiguousContent = `
        Dear Passenger,
        There has been a change to your flight.
        Please contact us for more information.
      `;

      const clearResult = await scenarioService.processEmailContent(
        clearContent,
        mockFlightData,
        'EU261'
      );

      const ambiguousResult = await scenarioService.processEmailContent(
        ambiguousContent,
        mockFlightData,
        'EU261'
      );

      expect(clearResult.scenarioResult.confidence).toBeGreaterThan(
        ambiguousResult.scenarioResult.confidence
      );
    });
  });
});
