// Flight number: AA123, BA456, LH1234
export function validateFlightNumber(value: string): { valid: boolean; error?: string } {
  const regex = /^[A-Z]{2}[0-9]{1,4}[A-Z]?$/;
  if (!value) return { valid: false, error: 'Flight number is required' };
  if (!regex.test(value.toUpperCase())) {
    return {
      valid: false,
      error: 'Flight number should be airline code (2 letters) followed by 1-4 digits (e.g., BA123)'
    };
  }
  return { valid: true };
}

// Airport code: LHR, JFK, CDG
export function validateAirportCode(value: string): { valid: boolean; error?: string } {
  const regex = /^[A-Z]{3}$/;
  if (!value) return { valid: false, error: 'Airport code is required' };
  if (!regex.test(value.toUpperCase())) {
    return {
      valid: false,
      error: 'Please enter a valid 3-letter airport code (e.g., LHR, JFK)'
    };
  }
  // Optional: validate against known airports
  return { valid: true };
}

// Date: must be in past, within claim period
export function validateFlightDate(value: string): { valid: boolean; error?: string } {
  if (!value) return { valid: false, error: 'Flight date is required' };

  const date = new Date(value);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Please enter a valid date' };
  }

  const now = new Date();
  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(now.getFullYear() - 6);

  if (date > now) {
    return { valid: false, error: 'Flight date cannot be in the future' };
  }
  if (date < sixYearsAgo) {
    return { valid: false, error: 'Claims must be for flights within the last 6 years' };
  }
  return { valid: true };
}

// Delay duration: "3 hours", "3h", "180 minutes"
export function validateDelayDuration(value: string): { valid: boolean; error?: string; normalized?: string } {
  if (!value) return { valid: false, error: 'Delay duration is required' };

  const hours = value.match(/(\d+)\s*h(ours?)?/i);
  const minutes = value.match(/(\d+)\s*m(in(utes?)?)?/i);

  let totalMinutes = 0;
  if (hours) totalMinutes += parseInt(hours[1]) * 60;
  if (minutes) totalMinutes += parseInt(minutes[1]);

  if (totalMinutes === 0) {
    return {
      valid: false,
      error: 'Please enter delay in hours (e.g., "3 hours" or "3h")'
    };
  }

  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = totalMinutes % 60;
  const normalized = normalizedMinutes > 0
    ? `${normalizedHours}h ${normalizedMinutes}m`
    : `${normalizedHours}h`;

  return { valid: true, normalized };
}

// Email with typo suggestions
export function validateEmail(value: string): { valid: boolean; error?: string; suggestion?: string } {
  if (!value) return { valid: false, error: 'Email is required' };

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonTypos: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
  };

  const domain = value.split('@')[1];
  if (commonTypos[domain]) {
    return {
      valid: true,
      suggestion: value.replace(domain, commonTypos[domain])
    };
  }

  return { valid: true };
}
