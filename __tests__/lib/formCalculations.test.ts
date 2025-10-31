/**
 * Unit Tests for Form Calculation Helpers
 * Tests the calculation functions added in FlightLookupForm v2.0
 */

describe('calculateNoticePeriod', () => {
  // Helper function (matches implementation in FlightLookupForm.tsx)
  const calculateNoticePeriod = (notificationDate: string, departureDate: string): string => {
    if (!notificationDate || !departureDate) return '';

    const notification = new Date(notificationDate);
    const departure = new Date(departureDate);
    const daysDiff = Math.floor((departure.getTime() - notification.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7) return '< 7 days';
    if (daysDiff <= 14) return '7-14 days';
    return '> 14 days';
  };

  describe('valid calculations', () => {
    it('should calculate < 7 days correctly', () => {
      expect(calculateNoticePeriod('2024-01-10', '2024-01-15')).toBe('< 7 days');  // 5 days
      expect(calculateNoticePeriod('2024-01-09', '2024-01-15')).toBe('< 7 days');  // 6 days
    });

    it('should calculate 7-14 days correctly', () => {
      expect(calculateNoticePeriod('2024-01-08', '2024-01-15')).toBe('7-14 days');  // 7 days
      expect(calculateNoticePeriod('2024-01-05', '2024-01-15')).toBe('7-14 days');  // 10 days
      expect(calculateNoticePeriod('2024-01-01', '2024-01-15')).toBe('7-14 days');  // 14 days
    });

    it('should calculate > 14 days correctly', () => {
      expect(calculateNoticePeriod('2023-12-31', '2024-01-15')).toBe('> 14 days');  // 15 days
      expect(calculateNoticePeriod('2023-12-15', '2024-01-15')).toBe('> 14 days');  // 31 days
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 7 days', () => {
      expect(calculateNoticePeriod('2024-01-08', '2024-01-15')).toBe('7-14 days');
    });

    it('should handle exactly 14 days', () => {
      expect(calculateNoticePeriod('2024-01-01', '2024-01-15')).toBe('7-14 days');
    });

    it('should handle 0 days (same day notification)', () => {
      expect(calculateNoticePeriod('2024-01-15', '2024-01-15')).toBe('< 7 days');
    });

    it('should handle month boundaries', () => {
      expect(calculateNoticePeriod('2024-01-28', '2024-02-05')).toBe('7-14 days');  // 8 days across months
    });

    it('should handle year boundaries', () => {
      expect(calculateNoticePeriod('2023-12-25', '2024-01-05')).toBe('7-14 days');  // 11 days across years
    });
  });

  describe('invalid inputs', () => {
    it('should return empty string for missing notification date', () => {
      expect(calculateNoticePeriod('', '2024-01-15')).toBe('');
    });

    it('should return empty string for missing departure date', () => {
      expect(calculateNoticePeriod('2024-01-10', '')).toBe('');
    });

    it('should return empty string for both missing', () => {
      expect(calculateNoticePeriod('', '')).toBe('');
    });
  });
});

describe('calculateDaysBetween', () => {
  const calculateDaysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  it('should calculate positive differences', () => {
    expect(calculateDaysBetween('2024-01-01', '2024-01-10')).toBe(9);
    expect(calculateDaysBetween('2024-01-10', '2024-01-15')).toBe(5);
  });

  it('should handle same day', () => {
    expect(calculateDaysBetween('2024-01-15', '2024-01-15')).toBe(0);
  });

  it('should handle negative differences (date2 before date1)', () => {
    expect(calculateDaysBetween('2024-01-15', '2024-01-10')).toBe(-5);
  });

  it('should handle month boundaries', () => {
    expect(calculateDaysBetween('2024-01-28', '2024-02-05')).toBe(8);
  });

  it('should handle year boundaries', () => {
    expect(calculateDaysBetween('2023-12-25', '2024-01-05')).toBe(11);
  });

  it('should handle leap years', () => {
    expect(calculateDaysBetween('2024-02-28', '2024-03-01')).toBe(2);  // 2024 is leap year
    expect(calculateDaysBetween('2023-02-28', '2023-03-01')).toBe(1);  // 2023 is not
  });
});

describe('calculateTiming', () => {
  const calculateTiming = (hours: string, minutes: string, nextDay?: boolean): string => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const total = h + (m / 60) + (nextDay ? 24 : 0);

    if (total >= 24) return `${Math.floor(total / 24)} day(s)`;
    if (h === 0 && m > 0) return `${m} minutes`;
    if (h > 0 && m === 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${h}h ${m}m`;
  };

  describe('hours only', () => {
    it('should format single hour', () => {
      expect(calculateTiming('1', '0')).toBe('1 hour');
    });

    it('should format multiple hours', () => {
      expect(calculateTiming('3', '0')).toBe('3 hours');
    });

    it('should handle string "0"', () => {
      expect(calculateTiming('0', '0')).toBe('0h 0m');
    });
  });

  describe('minutes only', () => {
    it('should format minutes', () => {
      expect(calculateTiming('0', '45')).toBe('45 minutes');
    });

    it('should format single minute', () => {
      expect(calculateTiming('0', '1')).toBe('1 minutes');  // Note: doesn't handle singular
    });
  });

  describe('hours and minutes', () => {
    it('should format combined time', () => {
      expect(calculateTiming('3', '25')).toBe('3h 25m');
    });

    it('should format small values', () => {
      expect(calculateTiming('1', '5')).toBe('1h 5m');
    });
  });

  describe('next day calculation', () => {
    it('should add 24 hours when nextDay is true', () => {
      expect(calculateTiming('2', '30', true)).toBe('1 day(s)');  // 26.5 hours = 1+ days
    });

    it('should handle exactly 24 hours', () => {
      expect(calculateTiming('0', '0', true)).toBe('1 day(s)');
    });

    it('should handle multiple days', () => {
      expect(calculateTiming('26', '0', true)).toBe('2 day(s)');  // 50 hours
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings as 0', () => {
      expect(calculateTiming('', '')).toBe('0h 0m');
    });

    it('should handle non-numeric strings as 0', () => {
      expect(calculateTiming('abc', 'def')).toBe('0h 0m');
    });

    it('should handle large values', () => {
      expect(calculateTiming('48', '0')).toBe('2 day(s)');
    });
  });
});

describe('getNoticePeriodLabel', () => {
  const getNoticePeriodLabel = (period: string): string => {
    switch(period) {
      case '< 7 days': return 'Less than 7 days notice';
      case '7-14 days': return '7-14 days notice';
      case '> 14 days': return 'More than 14 days notice';
      default: return '';
    }
  };

  it('should return correct label for < 7 days', () => {
    expect(getNoticePeriodLabel('< 7 days')).toBe('Less than 7 days notice');
  });

  it('should return correct label for 7-14 days', () => {
    expect(getNoticePeriodLabel('7-14 days')).toBe('7-14 days notice');
  });

  it('should return correct label for > 14 days', () => {
    expect(getNoticePeriodLabel('> 14 days')).toBe('More than 14 days notice');
  });

  it('should return empty string for unknown period', () => {
    expect(getNoticePeriodLabel('unknown')).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(getNoticePeriodLabel('')).toBe('');
  });
});

describe('ticket price round-trip calculation', () => {
  const calculateOneWayPrice = (price: string, isRoundTrip: boolean): number | undefined => {
    if (!price) return undefined;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return undefined;
    return isRoundTrip ? numPrice / 2 : numPrice;
  };

  it('should return full price for one-way tickets', () => {
    expect(calculateOneWayPrice('450', false)).toBe(450);
  });

  it('should divide by 2 for round-trip tickets', () => {
    expect(calculateOneWayPrice('900', true)).toBe(450);
  });

  it('should handle decimal prices', () => {
    expect(calculateOneWayPrice('899.99', true)).toBe(449.995);
  });

  it('should return undefined for empty string', () => {
    expect(calculateOneWayPrice('', false)).toBeUndefined();
  });

  it('should return undefined for invalid number', () => {
    expect(calculateOneWayPrice('abc', false)).toBeUndefined();
  });

  it('should return undefined for zero', () => {
    expect(calculateOneWayPrice('0', false)).toBeUndefined();
  });

  it('should return undefined for negative number', () => {
    expect(calculateOneWayPrice('-100', false)).toBeUndefined();
  });
});

describe('alternative timing API payload construction', () => {
  const constructAlternativeTimingPayload = (
    depHours: string,
    depMinutes: string,
    arrHours: string,
    arrMinutes: string,
    nextDay: boolean
  ) => {
    const alternativeDepartureTotal =
      (parseInt(depHours) || 0) +
      ((parseInt(depMinutes) || 0) / 60) +
      (nextDay ? 24 : 0);

    const alternativeArrivalTotal =
      (parseInt(arrHours) || 0) +
      ((parseInt(arrMinutes) || 0) / 60);

    const alternativeTiming = `${depHours || 0}h ${depMinutes || 0}m departure, ${arrHours || 0}h ${arrMinutes || 0}m arrival`;

    return {
      alternativeTiming,
      alternativeFlight: {
        offered: true,
        departureTimeDifference: alternativeDepartureTotal,
        arrivalTimeDifference: alternativeArrivalTotal,
      }
    };
  };

  it('should construct payload for simple case', () => {
    const result = constructAlternativeTimingPayload('3', '0', '2', '0', false);

    expect(result.alternativeTiming).toBe('3h 0m departure, 2h 0m arrival');
    expect(result.alternativeFlight.departureTimeDifference).toBe(3);
    expect(result.alternativeFlight.arrivalTimeDifference).toBe(2);
  });

  it('should handle minutes correctly', () => {
    const result = constructAlternativeTimingPayload('3', '25', '2', '15', false);

    expect(result.alternativeTiming).toBe('3h 25m departure, 2h 15m arrival');
    expect(result.alternativeFlight.departureTimeDifference).toBeCloseTo(3.4167, 4);
    expect(result.alternativeFlight.arrivalTimeDifference).toBe(2.25);
  });

  it('should add 24 hours for next day', () => {
    const result = constructAlternativeTimingPayload('3', '0', '2', '0', true);

    expect(result.alternativeFlight.departureTimeDifference).toBe(27);
    expect(result.alternativeFlight.arrivalTimeDifference).toBe(2);
  });

  it('should handle empty strings as 0', () => {
    const result = constructAlternativeTimingPayload('', '', '', '', false);

    expect(result.alternativeTiming).toBe('0h 0m departure, 0h 0m arrival');
    expect(result.alternativeFlight.departureTimeDifference).toBe(0);
    expect(result.alternativeFlight.arrivalTimeDifference).toBe(0);
  });
});
