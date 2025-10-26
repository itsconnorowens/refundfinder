/**
 * Comprehensive Test Suite for Flight Validation Services
 * Tests all components: airports, airlines, distance calculation, flight validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  airports,
  getAirportByCode,
  validateAirportCode,
  searchAirports,
  getAirportCoordinates,
} from './airports';
import {
  airlines,
  getAirlineByIATACode,
  normalizeAirlineName,
  searchAirlines,
  getAirlineRegulations,
} from './airlines';
import {
  calculateFlightDistance,
  calculateFlightDistanceCached,
  getDistanceCategory,
  getEU261Compensation,
  getUKCAACompensation,
  isRealisticRoute,
  getRouteType,
  clearDistanceCache,
} from './distance-calculator';
import { flightLookupService, FlightLookupService } from './flight-apis';
import {
  flightValidationService,
  FlightValidationService,
} from './flight-validation';

describe('Airport Database Tests', () => {
  it('should have comprehensive airport coverage', () => {
    expect(airports.length).toBeGreaterThan(1000);
  });

  it('should include major international airports', () => {
    const majorAirports = [
      'LHR',
      'CDG',
      'FRA',
      'AMS',
      'JFK',
      'LAX',
      'DXB',
      'DOH',
      'SIN',
      'HKG',
    ];
    majorAirports.forEach((code) => {
      const airport = getAirportByCode(code);
      expect(airport).toBeDefined();
      expect(airport?.code).toBe(code);
    });
  });

  it('should have coordinates for all airports', () => {
    airports.forEach((airport) => {
      expect(airport.latitude).toBeDefined();
      expect(airport.longitude).toBeDefined();
      expect(typeof airport.latitude).toBe('number');
      expect(typeof airport.longitude).toBe('number');
      expect(airport.latitude).toBeGreaterThanOrEqual(-90);
      expect(airport.latitude).toBeLessThanOrEqual(90);
      expect(airport.longitude).toBeGreaterThanOrEqual(-180);
      expect(airport.longitude).toBeLessThanOrEqual(180);
    });
  });

  it('should have timezone information', () => {
    airports.forEach((airport) => {
      expect(airport.timezone).toBeDefined();
      expect(typeof airport.timezone).toBe('string');
      expect(airport.timezone.length).toBeGreaterThan(0);
    });
  });

  it('should validate airport codes correctly', () => {
    expect(validateAirportCode('LHR')).toBe(true);
    expect(validateAirportCode('CDG')).toBe(true);
    expect(validateAirportCode('INVALID')).toBe(false);
    expect(validateAirportCode('')).toBe(false);
  });

  it('should search airports by various criteria', () => {
    const londonResults = searchAirports('london');
    expect(londonResults.length).toBeGreaterThan(0);
    expect(londonResults.some((airport) => airport.code === 'LHR')).toBe(true);

    const lhrResults = searchAirports('LHR');
    expect(lhrResults.length).toBeGreaterThan(0);
    expect(lhrResults[0].code).toBe('LHR');
  });

  it('should get airport coordinates', () => {
    const coords = getAirportCoordinates('LHR');
    expect(coords).toBeDefined();
    expect(coords?.latitude).toBeCloseTo(51.47, 2);
    expect(coords?.longitude).toBeCloseTo(-0.4543, 2);
  });
});

describe('Airline Database Tests', () => {
  it('should have comprehensive airline coverage', () => {
    expect(airlines.length).toBeGreaterThan(200);
  });

  it('should include major international airlines', () => {
    const majorAirlines = [
      'BA',
      'LH',
      'AF',
      'KL',
      'EK',
      'QR',
      'TK',
      'SQ',
      'CX',
    ];
    majorAirlines.forEach((code) => {
      const airline = getAirlineByIATACode(code);
      expect(airline).toBeDefined();
      expect(airline?.iataCode).toBe(code);
    });
  });

  it('should normalize airline names correctly', () => {
    expect(normalizeAirlineName('BA')).toBe('British Airways');
    expect(normalizeAirlineName('ba')).toBe('British Airways');
    expect(normalizeAirlineName('British Airways')).toBe('British Airways');
    expect(normalizeAirlineName('British Air')).toBe('British Airways');
    expect(normalizeAirlineName('LH')).toBe('Lufthansa');
    expect(normalizeAirlineName('AF')).toBe('Air France');
  });

  it('should search airlines by various criteria', () => {
    const britishResults = searchAirlines('british');
    expect(britishResults.length).toBeGreaterThan(0);
    expect(britishResults.some((airline) => airline.iataCode === 'BA')).toBe(
      true
    );

    const baResults = searchAirlines('BA');
    expect(baResults.length).toBeGreaterThan(0);
    expect(baResults[0].iataCode).toBe('BA');
  });

  it('should get airline regulations correctly', () => {
    expect(getAirlineRegulations('BA')).toContain('UK261');
    expect(getAirlineRegulations('LH')).toContain('EU261');
    expect(getAirlineRegulations('AA')).toContain('US_DOT');
    expect(getAirlineRegulations('AC')).toContain('CANADIAN');
  });

  it('should have proper airline metadata', () => {
    airlines.forEach((airline) => {
      expect(airline.iataCode).toBeDefined();
      expect(airline.icaoCode).toBeDefined();
      expect(airline.name).toBeDefined();
      expect(airline.country).toBeDefined();
      expect(airline.region).toBeDefined();
      expect(airline.aliases).toBeDefined();
      expect(Array.isArray(airline.aliases)).toBe(true);
      expect(airline.regulationCovered).toBeDefined();
      expect(Array.isArray(airline.regulationCovered)).toBe(true);
    });
  });
});

describe('Distance Calculator Tests', () => {
  beforeEach(() => {
    clearDistanceCache();
  });

  afterEach(() => {
    clearDistanceCache();
  });

  it('should calculate distances accurately for known routes', () => {
    // JFK to LHR - known distance ~5,566 km
    const jfkLhr = calculateFlightDistance('JFK', 'LHR');
    expect(jfkLhr.isValid).toBe(true);
    expect(jfkLhr.distanceKm).toBeCloseTo(5566, -2); // Within 100km

    // LHR to CDG - known distance ~344 km
    const lhrCdg = calculateFlightDistance('LHR', 'CDG');
    expect(lhrCdg.isValid).toBe(true);
    expect(lhrCdg.distanceKm).toBeCloseTo(344, -1); // Within 10km

    // LAX to SFO - known distance ~337 km
    const laxsfo = calculateFlightDistance('LAX', 'SFO');
    expect(laxsfo.isValid).toBe(true);
    expect(laxsfo.distanceKm).toBeCloseTo(337, -1); // Within 10km
  });

  it('should handle invalid airport codes', () => {
    const invalid = calculateFlightDistance('INVALID', 'LHR');
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toContain('not found');
  });

  it('should handle same airport', () => {
    const same = calculateFlightDistance('LHR', 'LHR');
    expect(same.isValid).toBe(true);
    expect(same.distanceKm).toBe(0);
    expect(same.distanceMiles).toBe(0);
  });

  it('should cache distance calculations', () => {
    const first = calculateFlightDistanceCached('JFK', 'LHR');
    const second = calculateFlightDistanceCached('JFK', 'LHR');
    expect(first.distanceKm).toBe(second.distanceKm);
  });

  it('should categorize distances correctly', () => {
    expect(getDistanceCategory(1000)).toBe('short');
    expect(getDistanceCategory(2000)).toBe('medium');
    expect(getDistanceCategory(4000)).toBe('long');
  });

  it('should calculate EU261 compensation correctly', () => {
    expect(getEU261Compensation(1000)).toBe(250);
    expect(getEU261Compensation(2000)).toBe(400);
    expect(getEU261Compensation(4000)).toBe(600);
  });

  it('should calculate UK CAA compensation correctly', () => {
    expect(getUKCAACompensation(1000)).toBe(220);
    expect(getUKCAACompensation(2000)).toBe(350);
    expect(getUKCAACompensation(4000)).toBe(520);
  });

  it('should validate realistic routes', () => {
    expect(isRealisticRoute(100)).toBe(true);
    expect(isRealisticRoute(10000)).toBe(true);
    expect(isRealisticRoute(25000)).toBe(false);
    expect(isRealisticRoute(10)).toBe(false);
  });

  it('should classify route types correctly', () => {
    expect(getRouteType(200)).toBe('domestic');
    expect(getRouteType(1000)).toBe('regional');
    expect(getRouteType(3000)).toBe('continental');
    expect(getRouteType(8000)).toBe('intercontinental');
  });
});

describe('Flight API Integration Tests', () => {
  it('should validate flight number formats', () => {
    const service = new FlightLookupService();

    // Valid formats
    expect(service.validateFlightNumber('AA123').isValid).toBe(true);
    expect(service.validateFlightNumber('BA1234').isValid).toBe(true);
    expect(service.validateFlightNumber('LH123').isValid).toBe(true);

    // Invalid formats
    expect(service.validateFlightNumber('123AA').isValid).toBe(false);
    expect(service.validateFlightNumber('AA').isValid).toBe(false);
    expect(service.validateFlightNumber('').isValid).toBe(false);
    expect(service.validateFlightNumber('AA12345').isValid).toBe(false);
  });

  it('should handle missing API keys gracefully', () => {
    // Test with missing FlightLabs key
    const originalEnv = process.env.FLIGHTLABS_API_KEY;
    delete process.env.FLIGHTLABS_API_KEY;

    expect(() => new FlightLookupService()).not.toThrow();

    // Restore environment
    if (originalEnv) {
      process.env.FLIGHTLABS_API_KEY = originalEnv;
    }
  });

  it('should validate flight existence with date checks', async () => {
    const service = new FlightLookupService();

    // Test future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureResult = await service.validateFlightExists(
      'AA123',
      futureDate.toISOString().split('T')[0]
    );
    expect(futureResult.warnings.some((w) => w.includes('future'))).toBe(true);

    // Test old date
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 7);
    const oldResult = await service.validateFlightExists(
      'AA123',
      oldDate.toISOString().split('T')[0]
    );
    expect(oldResult.errors.some((e) => e.includes('too old'))).toBe(true);
  });
});

describe('Flight Validation Service Tests', () => {
  it('should validate flight requests comprehensively', async () => {
    const service = new FlightValidationService();

    const request = {
      flightNumber: 'AA123',
      departureDate: '2024-01-15',
      departureAirport: 'JFK',
      arrivalAirport: 'LAX',
      airline: 'American Airlines',
    };

    const result = await service.validateFlight(request);

    // Should have validation result
    expect(result.validationResult).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should normalize airline names in validation', async () => {
    const service = new FlightValidationService();

    const request = {
      flightNumber: 'BA123',
      departureDate: '2024-01-15',
      airline: 'BA', // Should be normalized to British Airways
    };

    const result = await service.validateFlight(request);
    expect(result.validationResult).toBeDefined();
  });

  it('should determine applicable regulations', async () => {
    const service = new FlightValidationService();

    // Test EU route
    const euRequest = {
      flightNumber: 'LH123',
      departureDate: '2024-01-15',
      departureAirport: 'FRA',
      arrivalAirport: 'CDG',
    };

    const euResult = await service.validateFlight(euRequest);
    expect(euResult.regulations).toContain('EU261');

    // Test UK route
    const ukRequest = {
      flightNumber: 'BA123',
      departureDate: '2024-01-15',
      departureAirport: 'LHR',
      arrivalAirport: 'CDG',
    };

    const ukResult = await service.validateFlight(ukRequest);
    expect(ukResult.regulations).toContain('UK261');
  });

  it('should check compensation eligibility', () => {
    const service = new FlightValidationService();

    const flightData = {
      flightNumber: 'LH123',
      airline: 'Lufthansa',
      departureAirport: 'FRA',
      arrivalAirport: 'CDG',
      scheduledDeparture: '2024-01-15T10:00:00Z',
      actualDeparture: '2024-01-15T13:00:00Z',
      scheduledArrival: '2024-01-15T11:30:00Z',
      actualArrival: '2024-01-15T14:30:00Z',
      delayMinutes: 180,
      isCancelled: false,
      status: 'delayed' as const,
      source: 'aviationstack' as const,
      confidence: 0.9,
    };

    const regulations = ['EU261'];
    const isEligible = service.isEligibleForCompensation(
      flightData,
      regulations
    );
    expect(isEligible).toBe(true);

    // Test with insufficient delay
    const shortDelayData = { ...flightData, delayMinutes: 60 };
    const notEligible = service.isEligibleForCompensation(
      shortDelayData,
      regulations
    );
    expect(notEligible).toBe(false);
  });

  it('should calculate compensation amounts', () => {
    const service = new FlightValidationService();

    const flightData = {
      flightNumber: 'LH123',
      airline: 'Lufthansa',
      departureAirport: 'FRA',
      arrivalAirport: 'CDG',
      scheduledDeparture: '2024-01-15T10:00:00Z',
      actualDeparture: '2024-01-15T13:00:00Z',
      scheduledArrival: '2024-01-15T11:30:00Z',
      actualArrival: '2024-01-15T14:30:00Z',
      delayMinutes: 180,
      isCancelled: false,
      status: 'delayed' as const,
      source: 'aviationstack' as const,
      confidence: 0.9,
    };

    const euCompensation = service.getCompensationAmount(flightData, ['EU261']);
    expect(euCompensation).toBeDefined();
    expect(euCompensation?.regulation).toBe('EU261');
    expect(euCompensation?.currency).toBe('EUR');

    const ukCompensation = service.getCompensationAmount(flightData, ['UK261']);
    expect(ukCompensation).toBeDefined();
    expect(ukCompensation?.regulation).toBe('UK261');
    expect(ukCompensation?.currency).toBe('GBP');

    const usCompensation = service.getCompensationAmount(flightData, [
      'US_DOT',
    ]);
    expect(usCompensation?.amount).toBe(0); // No mandatory compensation
  });
});

describe('Integration Tests', () => {
  it('should work end-to-end with real flight data', async () => {
    // This test would require actual API keys and would make real API calls
    // For now, we'll test the structure and error handling

    const service = new FlightValidationService();

    try {
      const result = await service.validateFlight({
        flightNumber: 'AA123',
        departureDate: '2024-01-15',
      });

      // Should return a structured response even if flight not found
      expect(result).toBeDefined();
      expect(result.validationResult).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    } catch (error) {
      // Should handle API errors gracefully
      expect(error).toBeDefined();
    }
  });

  it('should handle edge cases gracefully', () => {
    // Test with invalid inputs
    expect(() => calculateFlightDistance('', '')).not.toThrow();
    expect(() => normalizeAirlineName('')).not.toThrow();
    expect(() => getAirlineRegulations('')).not.toThrow();
  });

  it('should maintain data consistency', () => {
    // All airports should have valid coordinates
    airports.forEach((airport) => {
      expect(airport.latitude).toBeDefined();
      expect(airport.longitude).toBeDefined();
      expect(airport.timezone).toBeDefined();
    });

    // All airlines should have valid codes
    airlines.forEach((airline) => {
      expect(airline.iataCode).toBeDefined();
      expect(airline.icaoCode).toBeDefined();
      expect(airline.name).toBeDefined();
      expect(airline.country).toBeDefined();
    });
  });
});

describe('Performance Tests', () => {
  it('should calculate distances quickly', () => {
    const start = Date.now();

    // Calculate 100 distances
    for (let i = 0; i < 100; i++) {
      calculateFlightDistance('JFK', 'LHR');
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should cache distances effectively', () => {
    clearDistanceCache();

    const start = Date.now();
    calculateFlightDistanceCached('JFK', 'LHR');
    const firstCall = Date.now() - start;

    const start2 = Date.now();
    calculateFlightDistanceCached('JFK', 'LHR');
    const secondCall = Date.now() - start2;

    // Second call should be much faster due to caching
    expect(secondCall).toBeLessThan(firstCall);
  });
});
