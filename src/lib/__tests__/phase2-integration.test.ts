/**
 * Phase 2 Integration Test
 * Demonstrates complete scenario detection and compensation calculation
 */

import { scenarioService } from '../scenario-detector';
import { FlightData } from '../flight-apis';

describe('Phase 2 Integration Tests', () => {
  describe('Complete Scenario Detection Pipeline', () => {
    test('should process complex cancellation scenario with EU261 compensation', async () => {
      const emailContent = `
        Dear Mr. Smith,
        
        We regret to inform you that your flight BA123 from London Heathrow to New York JFK 
        scheduled for January 15, 2024 at 10:00 AM has been cancelled due to operational reasons.
        
        We have automatically rebooked you on flight BA456 departing at 2:00 PM on the same day.
        This alternative flight will arrive at 10:00 PM, providing a 4-hour delay.
        
        We apologize for the inconvenience and any disruption to your travel plans.
        
        Best regards,
        British Airways Customer Service
      `;

      const flightData: FlightData = {
        flightNumber: 'BA123',
        airline: 'British Airways',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: '2024-01-15T10:00:00Z',
        scheduledArrival: '2024-01-15T18:00:00Z',
        delayMinutes: 0,
        isCancelled: true,
        cancellationReason: 'Operational reasons',
        status: 'cancelled',
        source: 'aviationstack',
        confidence: 0.9,
      };

      const result = await scenarioService.processEmailContent(
        emailContent,
        flightData,
        'EU261'
      );

      // Verify scenario detection
      expect(result.scenarioResult.scenarios.cancellation).toBeDefined();
      expect(result.scenarioResult.scenarios.cancellation?.isCancelled).toBe(
        true
      );
      expect(
        result.scenarioResult.scenarios.cancellation?.alternativeFlightOffered
      ).toBe(true);
      expect(result.scenarioResult.scenarios.cancellation?.noticePeriod).toBe(
        'immediate'
      );

      // Verify compensation calculation
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
      expect(result.compensationResult.currency).toBe('EUR');
      expect(result.compensationResult.regulation).toBe('EU261');

      // Verify additional rights
      expect(result.compensationResult.additionalRights).toContain(
        'Right to care (meals, refreshments, accommodation)'
      );
      expect(result.compensationResult.additionalRights).toContain(
        'Right to choose between refund and re-routing'
      );

      // Verify analysis
      expect(result.analysis.compensationEligible).toBe(true);
      expect(result.analysis.recommendedAction).toContain('compensation');
    });

    test('should process denied boarding scenario with US DOT compensation', async () => {
      const emailContent = `
        Dear Passenger,
        
        We are writing to inform you that you have been involuntarily denied boarding 
        on flight AA789 from Chicago O'Hare to Los Angeles due to overbooking.
        
        We have rebooked you on flight AA890 departing at 3:00 PM, which will arrive 
        at 5:30 PM, providing a 2-hour delay.
        
        We apologize for this inconvenience and any disruption to your travel plans.
        
        Sincerely,
        American Airlines Customer Service
      `;

      const flightData: FlightData = {
        flightNumber: 'AA789',
        airline: 'American Airlines',
        departureAirport: 'ORD',
        arrivalAirport: 'LAX',
        scheduledDeparture: '2024-01-15T13:00:00Z',
        scheduledArrival: '2024-01-15T15:30:00Z',
        delayMinutes: 0,
        isCancelled: false,
        status: 'scheduled',
        source: 'aviationstack',
        confidence: 0.9,
      };

      const result = await scenarioService.processEmailContent(
        emailContent,
        flightData,
        'US_DOT'
      );

      // Verify scenario detection
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

      // Verify compensation calculation
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
      expect(result.compensationResult.currency).toBe('USD');
      expect(result.compensationResult.regulation).toBe('US_DOT');

      // Verify analysis
      expect(result.analysis.compensationEligible).toBe(true);
      expect(result.analysis.recommendedAction).toContain('denied boarding');
    });

    test('should process downgrade scenario with fare difference compensation', async () => {
      const emailContent = `
        Dear Passenger,
        
        We regret to inform you that due to an aircraft change, you have been 
        downgraded from Business Class to Economy Class on flight LH456 from 
        Frankfurt to Tokyo.
        
        We will refund the fare difference of €1,200 and provide additional 
        compensation for this inconvenience.
        
        We apologize for any disruption to your travel experience.
        
        Best regards,
        Lufthansa Customer Service
      `;

      const flightData: FlightData = {
        flightNumber: 'LH456',
        airline: 'Lufthansa',
        departureAirport: 'FRA',
        arrivalAirport: 'NRT',
        scheduledDeparture: '2024-01-15T14:00:00Z',
        scheduledArrival: '2024-01-16T08:00:00Z',
        delayMinutes: 0,
        isCancelled: false,
        status: 'scheduled',
        source: 'aviationstack',
        confidence: 0.9,
      };

      const result = await scenarioService.processEmailContent(
        emailContent,
        flightData,
        'EU261'
      );

      // Verify scenario detection
      expect(result.scenarioResult.scenarios.downgrade).toBeDefined();
      expect(result.scenarioResult.scenarios.downgrade?.isDowngrade).toBe(true);
      expect(result.scenarioResult.scenarios.downgrade?.originalClass).toBe(
        'business'
      );
      expect(result.scenarioResult.scenarios.downgrade?.newClass).toBe(
        'economy'
      );
      expect(result.scenarioResult.scenarios.downgrade?.fareDifference).toBe(
        1200
      );

      // Verify compensation calculation
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
      expect(result.compensationResult.currency).toBe('EUR');
      expect(result.compensationResult.regulation).toBe('EU261');

      // Verify analysis
      expect(result.analysis.compensationEligible).toBe(true);
      expect(result.analysis.recommendedAction).toContain('downgrade');
    });

    test('should process delay scenario with extraordinary circumstances (no compensation)', async () => {
      const emailContent = `
        Dear Passenger,
        
        We regret to inform you that your flight BA123 has been delayed by 5 hours 
        due to severe weather conditions affecting the departure airport.
        
        We apologize for the inconvenience and any disruption to your travel plans.
        
        Best regards,
        British Airways Customer Service
      `;

      const flightData: FlightData = {
        flightNumber: 'BA123',
        airline: 'British Airways',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: '2024-01-15T10:00:00Z',
        scheduledArrival: '2024-01-15T18:00:00Z',
        delayMinutes: 300,
        isCancelled: false,
        status: 'delayed',
        source: 'aviationstack',
        confidence: 0.9,
      };

      const result = await scenarioService.processEmailContent(
        emailContent,
        flightData,
        'EU261'
      );

      // Verify scenario detection
      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.scenarios.delay?.isDelayed).toBe(true);
      expect(result.scenarioResult.scenarios.delay?.delayMinutes).toBe(300);
      expect(
        result.scenarioResult.scenarios.delay?.extraordinaryCircumstances
      ).toBe(true);

      // Verify no compensation due to extraordinary circumstances
      expect(result.compensationResult.totalCompensation).toBe(0);

      // Verify analysis
      expect(result.analysis.compensationEligible).toBe(false);
      expect(result.analysis.recommendedAction).toContain(
        'No compensation eligible'
      );
    });

    test('should process multiple scenarios and prioritize primary', async () => {
      const emailContent = `
        Dear Passenger,
        
        We regret to inform you that your flight BA123 has been delayed by 6 hours 
        due to technical issues. Additionally, due to overbooking, you have been 
        involuntarily denied boarding.
        
        We have rebooked you on flight BA456 departing at 4:00 PM, which will arrive 
        at 12:00 AM, providing a 6-hour delay.
        
        We apologize for the inconvenience and any disruption to your travel plans.
        
        Best regards,
        British Airways Customer Service
      `;

      const flightData: FlightData = {
        flightNumber: 'BA123',
        airline: 'British Airways',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: '2024-01-15T10:00:00Z',
        scheduledArrival: '2024-01-15T18:00:00Z',
        delayMinutes: 360,
        isCancelled: false,
        status: 'delayed',
        source: 'aviationstack',
        confidence: 0.9,
      };

      const result = await scenarioService.processEmailContent(
        emailContent,
        flightData,
        'EU261'
      );

      // Verify multiple scenarios detected
      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.scenarios.deniedBoarding).toBeDefined();
      expect(result.scenarioResult.allScenarios.length).toBeGreaterThan(1);

      // Verify primary scenario is determined
      expect(result.scenarioResult.primaryScenario).toBeDefined();
      expect(['delay', 'denied_boarding']).toContain(
        result.scenarioResult.primaryScenario
      );

      // Verify combined compensation
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
      expect(result.compensationResult.additionalRights.length).toBeGreaterThan(
        0
      );
    });
  });

  describe('Performance and Reliability', () => {
    test('should process scenarios quickly', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
        We apologize for the inconvenience.
      `;

      const startTime = Date.now();

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within 100ms
      expect(processingTime).toBeLessThan(100);
      expect(result.scenarioResult.scenarios.delay).toBeDefined();
    });

    test('should handle malformed email content gracefully', async () => {
      const malformedContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
        We apologize for the inconvenience.
        ${'x'.repeat(10000)} // Very long content
      `;

      const result = await scenarioService.processEmailContent(
        malformedContent,
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.scenarioResult.confidence).toBeGreaterThan(0);
    });

    test('should provide consistent results for same input', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
        We apologize for the inconvenience.
      `;

      const result1 = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      const result2 = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'EU261'
      );

      expect(result1.scenarioResult.scenarios.delay?.delayMinutes).toBe(
        result2.scenarioResult.scenarios.delay?.delayMinutes
      );
      expect(result1.compensationResult.totalCompensation).toBe(
        result2.compensationResult.totalCompensation
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty email content', async () => {
      const result = await scenarioService.processEmailContent(
        '',
        mockFlightData,
        'EU261'
      );

      expect(result.scenarioResult.allScenarios.length).toBe(0);
      expect(result.compensationResult.totalCompensation).toBe(0);
    });

    test('should handle null flight data gracefully', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight has been delayed by 4 hours due to operational reasons.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        null as any,
        'EU261'
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.compensationResult.totalCompensation).toBeGreaterThan(0);
    });

    test('should handle unsupported regulation gracefully', async () => {
      const emailContent = `
        Dear Passenger,
        Your flight BA123 has been delayed by 4 hours due to operational reasons.
      `;

      const result = await scenarioService.processEmailContent(
        emailContent,
        mockFlightData,
        'UNSUPPORTED_REGULATION' as any
      );

      expect(result.scenarioResult.scenarios.delay).toBeDefined();
      expect(result.compensationResult.totalCompensation).toBe(0);
    });
  });
});

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
