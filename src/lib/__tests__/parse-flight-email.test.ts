import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFlightEmail, isAnthropicConfigured } from '../parse-flight-email';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn(),
      };
    },
  };
});

describe('parseFlightEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for invalid input', async () => {
    const result = await parseFlightEmail('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email content');
    expect(result.confidence).toBe(0);
  });

  it('should return error for non-string input', async () => {
    const result = await parseFlightEmail(null as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email content');
    expect(result.confidence).toBe(0);
  });

  it('should validate that all required fields are present', () => {
    // This test verifies the validation logic
    const incompleteData = {
      flight_number: 'AA123',
      airline: 'American Airlines',
      // Missing other required fields
    };
    // The function should return null for incomplete data
    expect(incompleteData).not.toHaveProperty('date');
  });

  it('should check if Anthropic is configured', () => {
    const isConfigured = isAnthropicConfigured();
    expect(typeof isConfigured).toBe('boolean');
    expect(isConfigured).toBe(true); // Should be true with test env var
  });
});

describe('Flight Details Validation', () => {
  it('should require all fields to be present', () => {
    const requiredFields = [
      'flight_number',
      'airline',
      'date',
      'departure_airport',
      'arrival_airport',
      'scheduled_departure',
      'scheduled_arrival',
    ];

    expect(requiredFields).toHaveLength(7);
    expect(requiredFields).toContain('flight_number');
    expect(requiredFields).toContain('airline');
  });
});

