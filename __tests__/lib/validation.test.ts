/**
 * Unit Tests for Validation Functions
 * Tests all validation logic used in the FlightLookupForm
 */

import {
  validateFlightNumber,
  validateAirportCode,
  validateFlightDate,
  validateDelayDuration,
  validateEmail
} from '@/lib/validation';

describe('validateFlightNumber', () => {
  describe('valid flight numbers', () => {
    it('should accept 2 letters + 1-4 digits', () => {
      expect(validateFlightNumber('BA123').valid).toBe(true);
      expect(validateFlightNumber('LH1').valid).toBe(true);
      expect(validateFlightNumber('AA1234').valid).toBe(true);
    });

    it('should accept optional trailing letter', () => {
      expect(validateFlightNumber('AA456A').valid).toBe(true);
      expect(validateFlightNumber('BA123Z').valid).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validateFlightNumber('ba123').valid).toBe(true);
      expect(validateFlightNumber('Ba123').valid).toBe(true);
    });
  });

  describe('invalid flight numbers', () => {
    it('should reject numbers only', () => {
      expect(validateFlightNumber('123').valid).toBe(false);
      expect(validateFlightNumber('123').error).toBeDefined();
    });

    it('should reject single letter prefix', () => {
      expect(validateFlightNumber('A123').valid).toBe(false);
    });

    it('should reject too many letters', () => {
      expect(validateFlightNumber('ABC123').valid).toBe(false);
    });

    it('should reject too many digits', () => {
      expect(validateFlightNumber('BA12345').valid).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateFlightNumber('').valid).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateFlightNumber('BA-123').valid).toBe(false);
      expect(validateFlightNumber('BA 123').valid).toBe(false);
    });
  });
});

describe('validateAirportCode', () => {
  describe('valid airport codes', () => {
    it('should accept 3 letter codes', () => {
      expect(validateAirportCode('LHR').valid).toBe(true);
      expect(validateAirportCode('JFK').valid).toBe(true);
      expect(validateAirportCode('CDG').valid).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validateAirportCode('lhr').valid).toBe(true);
      expect(validateAirportCode('Jfk').valid).toBe(true);
    });
  });

  describe('invalid airport codes', () => {
    it('should reject codes with wrong length', () => {
      expect(validateAirportCode('LH').valid).toBe(false);
      expect(validateAirportCode('LOND').valid).toBe(false);
    });

    it('should reject codes with numbers', () => {
      expect(validateAirportCode('LH1').valid).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateAirportCode('').valid).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateAirportCode('LH-').valid).toBe(false);
    });
  });
});

describe('validateFlightDate', () => {
  const now = new Date();

  describe('valid dates', () => {
    it('should accept dates in the past', () => {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 1);
      expect(validateFlightDate(pastDate.toISOString().split('T')[0]).valid).toBe(true);
    });

    it('should accept dates within 6 years', () => {
      const oldDate = new Date(now);
      oldDate.setFullYear(oldDate.getFullYear() - 5);
      expect(validateFlightDate(oldDate.toISOString().split('T')[0]).valid).toBe(true);
    });

    it('should accept dates at the 6-year boundary', () => {
      const sixYearsAgo = new Date(now);
      sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
      sixYearsAgo.setDate(sixYearsAgo.getDate() + 1); // Just inside the boundary
      expect(validateFlightDate(sixYearsAgo.toISOString().split('T')[0]).valid).toBe(true);
    });
  });

  describe('invalid dates', () => {
    it('should reject future dates', () => {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 1);
      const result = validateFlightDate(futureDate.toISOString().split('T')[0]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('future');
    });

    it('should reject dates older than 6 years', () => {
      const oldDate = new Date(now);
      oldDate.setFullYear(oldDate.getFullYear() - 7);
      const result = validateFlightDate(oldDate.toISOString().split('T')[0]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 years');
    });

    it('should reject empty string', () => {
      expect(validateFlightDate('').valid).toBe(false);
    });

    it('should reject invalid date format', () => {
      expect(validateFlightDate('not-a-date').valid).toBe(false);
    });
  });
});

describe('validateDelayDuration', () => {
  describe('valid durations', () => {
    it('should accept hours', () => {
      const result = validateDelayDuration('3 hours');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('3h');
    });

    it('should accept hours (short format)', () => {
      const result = validateDelayDuration('3h');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('3h');
    });

    it('should accept minutes', () => {
      const result = validateDelayDuration('45 minutes');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('0h 45m');
    });

    it('should accept hours and minutes', () => {
      const result = validateDelayDuration('3 hours 25 minutes');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('3h 25m');
    });

    it('should handle short formats', () => {
      const result = validateDelayDuration('3h 25m');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('3h 25m');
    });

    it('should convert minutes to hours', () => {
      const result = validateDelayDuration('180 minutes');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('3h');
    });
  });

  describe('invalid durations', () => {
    it('should reject zero duration', () => {
      expect(validateDelayDuration('0 hours').valid).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateDelayDuration('').valid).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(validateDelayDuration('three hours').valid).toBe(false);
    });
  });
});

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email addresses', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk').valid).toBe(true);
      expect(validateEmail('name.surname@company.org').valid).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject missing @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject missing domain', () => {
      expect(validateEmail('test@').valid).toBe(false);
    });

    it('should reject missing username', () => {
      expect(validateEmail('@example.com').valid).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('').valid).toBe(false);
    });
  });

  describe('typo detection', () => {
    it('should detect gmail typos', () => {
      const result = validateEmail('test@gmial.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('test@gmail.com');
    });

    it('should detect gmail typos (gmai)', () => {
      const result = validateEmail('test@gmai.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('test@gmail.com');
    });

    it('should detect yahoo typos', () => {
      const result = validateEmail('test@yahooo.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('test@yahoo.com');
    });

    it('should detect hotmail typos', () => {
      const result = validateEmail('test@hotmial.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('test@hotmail.com');
    });

    it('should not suggest for valid domains', () => {
      const result = validateEmail('test@gmail.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBeUndefined();
    });
  });
});
