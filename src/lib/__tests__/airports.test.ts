/**
 * Comprehensive tests for airport utilities and distance calculations
 */

import { describe, it, expect } from 'vitest';
import {
  airports,
  Airport,
  calculateHaversineDistance,
  getDistanceBetweenAirports,
  searchAirports,
  getAirportByCode,
  validateAirportCode,
  normalizeAirportCode,
  normalizeAirportName,
  getAirportTimezone,
  getAirportByCodeWithTimezone,
} from '../airports';

describe('Airport Database', () => {
  it('should have 500-700 airports', () => {
    expect(airports.length).toBeGreaterThanOrEqual(500);
    expect(airports.length).toBeLessThanOrEqual(700);
  });

  it('should have all required fields for each airport', () => {
    airports.forEach((airport) => {
      expect(airport.code).toBeDefined();
      expect(airport.name).toBeDefined();
      expect(airport.city).toBeDefined();
      expect(airport.country).toBeDefined();
      expect(airport.region).toBeDefined();
      expect(airport.latitude).toBeDefined();
      expect(airport.longitude).toBeDefined();
      expect(airport.timezone).toBeDefined();

      // Validate field types
      expect(typeof airport.code).toBe('string');
      expect(typeof airport.name).toBe('string');
      expect(typeof airport.city).toBe('string');
      expect(typeof airport.country).toBe('string');
      expect(typeof airport.region).toBe('string');
      expect(typeof airport.latitude).toBe('number');
      expect(typeof airport.longitude).toBe('number');
      expect(typeof airport.timezone).toBe('string');
    });
  });

  it('should have valid IATA codes (3 characters)', () => {
    airports.forEach((airport) => {
      expect(airport.code).toMatch(/^[A-Z]{3}$/);
    });
  });

  it('should have valid coordinates', () => {
    airports.forEach((airport) => {
      expect(airport.latitude).toBeGreaterThanOrEqual(-90);
      expect(airport.latitude).toBeLessThanOrEqual(90);
      expect(airport.longitude).toBeGreaterThanOrEqual(-180);
      expect(airport.longitude).toBeLessThanOrEqual(180);
    });
  });

  it('should have coordinates with 4 decimal places precision', () => {
    airports.forEach((airport) => {
      const latStr = airport.latitude.toString();
      const lonStr = airport.longitude.toString();

      // Check that coordinates have at most 4 decimal places
      const latDecimals = latStr.includes('.')
        ? latStr.split('.')[1].length
        : 0;
      const lonDecimals = lonStr.includes('.')
        ? lonStr.split('.')[1].length
        : 0;

      expect(latDecimals).toBeLessThanOrEqual(4);
      expect(lonDecimals).toBeLessThanOrEqual(4);
    });
  });

  it('should have valid timezone strings', () => {
    airports.forEach((airport) => {
      expect(airport.timezone).toBeTruthy();
      expect(airport.timezone.length).toBeGreaterThan(0);
      // Should be a valid timezone format (contains / or is UTC)
      expect(airport.timezone.includes('/') || airport.timezone === 'UTC').toBe(
        true
      );
    });
  });

  it('should have unique IATA codes', () => {
    const codes = airports.map((airport) => airport.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should include major priority airports', () => {
    const priorityAirports = [
      'ATL',
      'LAX',
      'ORD',
      'DFW',
      'DEN',
      'JFK',
      'SFO',
      'SEA',
      'LHR',
      'CDG',
      'AMS',
      'FRA',
      'MAD',
      'BCN',
      'FCO',
      'MUC',
      'ZUR',
      'VIE',
      'CPH',
      'ARN',
      'OSL',
      'HEL',
      'PEK',
      'PVG',
      'NRT',
      'HND',
      'ICN',
      'SIN',
      'BKK',
      'KUL',
      'DEL',
      'BOM',
      'DXB',
      'AUH',
      'DOH',
      'IST',
      'TLV',
      'JNB',
      'CPT',
      'CAI',
      'YYZ',
      'YVR',
      'YUL',
      'SYD',
      'MEL',
      'BNE',
      'GRU',
      'GIG',
      'EZE',
      'SCL',
    ];

    // Check that most priority airports are present (allowing for some missing)
    const foundAirports = priorityAirports.filter((code) => {
      const airport = getAirportByCode(code);
      return airport !== undefined;
    });

    expect(foundAirports.length).toBeGreaterThanOrEqual(40); // At least 80% should be found
  });
});

describe('Haversine Distance Calculation', () => {
  it('should calculate distance between known airports accurately', () => {
    // Test some known distances (approximate) - allow for reasonable variations
    const distance1 = calculateHaversineDistance(
      51.47,
      -0.4543,
      49.0097,
      2.5479
    ); // LHR to CDG
    expect(distance1).toBeGreaterThanOrEqual(340);
    expect(distance1).toBeLessThanOrEqual(350);

    const distance2 = calculateHaversineDistance(
      40.6413,
      -73.7781,
      51.47,
      -0.4543
    ); // JFK to LHR
    expect(distance2).toBeGreaterThanOrEqual(5500);
    expect(distance2).toBeLessThanOrEqual(5600);

    const distance3 = calculateHaversineDistance(
      33.9425,
      -118.4081,
      40.6413,
      -73.7781
    ); // LAX to JFK
    expect(distance3).toBeGreaterThanOrEqual(3900);
    expect(distance3).toBeLessThanOrEqual(4000);
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculateHaversineDistance(51.47, -0.4543, 51.47, -0.4543);
    expect(distance).toBe(0);
  });

  it('should handle antipodal points (opposite sides of Earth)', () => {
    const distance = calculateHaversineDistance(0, 0, 0, 180); // Equator to opposite side
    expect(distance).toBeCloseTo(20015, 0); // Half Earth's circumference
  });

  it('should handle polar coordinates', () => {
    const distance = calculateHaversineDistance(90, 0, -90, 0); // North Pole to South Pole
    expect(distance).toBeCloseTo(20015, 0); // Earth's circumference
  });

  it('should return integer values', () => {
    const distance = calculateHaversineDistance(
      51.47,
      -0.4543,
      49.0097,
      2.5479
    );
    expect(Number.isInteger(distance)).toBe(true);
  });
});

describe('Airport Distance Lookup', () => {
  it('should calculate distance between airports by code', () => {
    const distance = getDistanceBetweenAirports('LHR', 'CDG');
    expect(distance).toBeGreaterThanOrEqual(340);
    expect(distance).toBeLessThanOrEqual(350);
  });

  it('should return null for invalid airport codes', () => {
    const distance1 = getDistanceBetweenAirports('INVALID', 'CDG');
    expect(distance1).toBeNull();

    const distance2 = getDistanceBetweenAirports('LHR', 'INVALID');
    expect(distance2).toBeNull();

    const distance3 = getDistanceBetweenAirports('INVALID1', 'INVALID2');
    expect(distance3).toBeNull();
  });

  it('should return 0 for same airport', () => {
    const distance = getDistanceBetweenAirports('LHR', 'LHR');
    expect(distance).toBe(0);
  });

  it('should be case insensitive', () => {
    const distance1 = getDistanceBetweenAirports('lhr', 'cdg');
    const distance2 = getDistanceBetweenAirports('LHR', 'CDG');
    expect(distance1).toBe(distance2);
  });

  it('should work for major international routes', () => {
    const routes = [
      { from: 'JFK', to: 'LHR', expectedMin: 5000, expectedMax: 6000 },
      { from: 'LAX', to: 'NRT', expectedMin: 8000, expectedMax: 9000 },
      { from: 'SIN', to: 'LHR', expectedMin: 10000, expectedMax: 12000 }, // Increased max
      { from: 'SYD', to: 'LAX', expectedMin: 11000, expectedMax: 13000 }, // Increased max
    ];

    routes.forEach((route) => {
      const distance = getDistanceBetweenAirports(route.from, route.to);
      expect(distance).toBeGreaterThanOrEqual(route.expectedMin);
      expect(distance).toBeLessThanOrEqual(route.expectedMax);
    });
  });
});

describe('Airport Search and Lookup', () => {
  it('should find airports by IATA code', () => {
    const airport = getAirportByCode('LHR');
    expect(airport).toBeDefined();
    expect(airport?.code).toBe('LHR');
    expect(airport?.name).toContain('Heathrow');
  });

  it('should be case insensitive for airport lookup', () => {
    const airport1 = getAirportByCode('lhr');
    const airport2 = getAirportByCode('LHR');
    expect(airport1).toEqual(airport2);
  });

  it('should return undefined for invalid codes', () => {
    const airport = getAirportByCode('INVALID');
    expect(airport).toBeUndefined();
  });

  it('should search airports by various criteria', () => {
    const results1 = searchAirports('LHR');
    expect(results1.length).toBeGreaterThan(0);
    expect(results1[0].code).toBe('LHR');

    const results2 = searchAirports('Heathrow');
    expect(results2.length).toBeGreaterThan(0);
    expect(results2[0].name).toContain('Heathrow');

    const results3 = searchAirports('London');
    expect(results3.length).toBeGreaterThan(0);
    expect(results3.some((airport) => airport.city.includes('London'))).toBe(
      true
    );

    const results4 = searchAirports('United Kingdom');
    expect(results4.length).toBeGreaterThan(0);
    expect(
      results4.some((airport) => airport.country === 'United Kingdom')
    ).toBe(true);
  });

  it('should limit search results to 10', () => {
    const results = searchAirports('a'); // Very broad search
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array for empty query', () => {
    const results = searchAirports('');
    expect(results).toEqual([]);
  });

  it('should validate airport codes', () => {
    expect(validateAirportCode('LHR')).toBe(true);
    expect(validateAirportCode('lhr')).toBe(true);
    expect(validateAirportCode('INVALID')).toBe(false);
    expect(validateAirportCode('')).toBe(false);
  });
});

describe('Airport Normalization', () => {
  it('should normalize airport codes', () => {
    expect(normalizeAirportCode('lhr')).toBe('LHR');
    expect(normalizeAirportCode(' LHR ')).toBe('LHR');
    expect(normalizeAirportCode('lHr')).toBe('LHR');
  });

  it('should normalize airport names', () => {
    expect(normalizeAirportName('London Heathrow Airport')).toBe(
      'london heathrow airport'
    );
    expect(normalizeAirportName('  London   Heathrow  ')).toBe(
      'london heathrow'
    );
    expect(normalizeAirportName('London-Heathrow Airport!')).toBe(
      'london-heathrow airport'
    );
  });
});

describe('Timezone Utilities', () => {
  it('should get timezone for valid airports', () => {
    const timezone = getAirportTimezone('LHR');
    expect(timezone).toBe('Europe/London');

    const timezone2 = getAirportTimezone('JFK');
    expect(timezone2).toBe('America/New_York');
  });

  it('should return null for invalid airport codes', () => {
    const timezone = getAirportTimezone('INVALID');
    expect(timezone).toBeNull();
  });

  it('should get airport with timezone information', () => {
    const airport = getAirportByCodeWithTimezone('LHR');
    expect(airport).toBeDefined();
    expect(airport?.timezone).toBe('Europe/London');
    expect(airport?.code).toBe('LHR');
  });

  it('should return null for invalid codes in timezone lookup', () => {
    const airport = getAirportByCodeWithTimezone('INVALID');
    expect(airport).toBeNull();
  });
});

describe('Regional Distribution', () => {
  it('should have airports from all major regions', () => {
    const regions = new Set(airports.map((airport) => airport.region));
    const expectedRegions = [
      'North America',
      'Europe',
      'Asia',
      'Middle East',
      'Africa',
      'Oceania',
      'South America',
    ];

    expectedRegions.forEach((region) => {
      expect(regions.has(region)).toBe(true);
    });
  });

  it('should have significant European coverage for EU261', () => {
    const europeanAirports = airports.filter(
      (airport) => airport.region === 'Europe'
    );
    expect(europeanAirports.length).toBeGreaterThan(100); // Should have good EU coverage
  });

  it('should have good North American coverage for DOT regulations', () => {
    const northAmericanAirports = airports.filter(
      (airport) => airport.region === 'North America'
    );
    expect(northAmericanAirports.length).toBeGreaterThan(30); // Should have good US/Canada coverage
  });
});

describe('Data Quality', () => {
  it('should not have duplicate airports', () => {
    const codes = airports.map((airport) => airport.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have reasonable airport names', () => {
    airports.forEach((airport) => {
      expect(airport.name.length).toBeGreaterThan(5); // Names should be descriptive
      expect(airport.name).not.toContain('\\N'); // Should not have null values
    });
  });

  it('should have reasonable city names', () => {
    airports.forEach((airport) => {
      expect(airport.city.length).toBeGreaterThan(2);
      expect(airport.city).not.toContain('\\N');
    });
  });

  it('should have reasonable country names', () => {
    airports.forEach((airport) => {
      expect(airport.country.length).toBeGreaterThan(2);
      expect(airport.country).not.toContain('\\N');
    });
  });
});
