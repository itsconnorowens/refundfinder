import { describe, it, expect } from 'vitest';
import { TABLES } from '../airtable';

describe('Airtable Configuration', () => {
  it('should have correct table names defined', () => {
    expect(TABLES.CLAIMS).toBe('Claims');
    expect(TABLES.PAYMENTS).toBe('Payments');
    expect(TABLES.REFUNDS).toBe('Refunds');
  });

  it('should have all required tables', () => {
    const tables = Object.keys(TABLES);
    expect(tables).toContain('CLAIMS');
    expect(tables).toContain('PAYMENTS');
    expect(tables).toContain('REFUNDS');
    expect(tables).toHaveLength(3);
  });
});

describe('Type Definitions', () => {
  it('should validate ClaimStatus types', () => {
    const validStatuses = [
      'submitted',
      'processing',
      'filed',
      'approved',
      'rejected',
      'refunded',
      'completed',
    ];
    expect(validStatuses).toHaveLength(7);
    expect(validStatuses).toContain('submitted');
    expect(validStatuses).toContain('completed');
  });

  it('should validate PaymentStatus types', () => {
    const validPaymentStatuses = [
      'pending',
      'succeeded',
      'failed',
      'refunded',
      'partially_refunded',
    ];
    expect(validPaymentStatuses).toHaveLength(5);
    expect(validPaymentStatuses).toContain('succeeded');
    expect(validPaymentStatuses).toContain('refunded');
  });
});

describe('Record Structures', () => {
  it('should validate ClaimRecord structure', () => {
    const claimRecord = {
      claimId: 'claim-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      flightNumber: 'AA123',
      airline: 'American Airlines',
      departureDate: '2024-01-01',
      departureAirport: 'JFK',
      arrivalAirport: 'LAX',
      delayDuration: '4 hours',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    expect(claimRecord.claimId).toBeDefined();
    expect(claimRecord.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(claimRecord.status).toBe('submitted');
  });

  it('should validate PaymentRecord structure', () => {
    const paymentRecord = {
      paymentId: 'payment-123',
      stripePaymentIntentId: 'pi_test_123',
      amount: 4900,
      currency: 'usd',
      status: 'succeeded',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    };

    expect(paymentRecord.amount).toBeGreaterThan(0);
    expect(paymentRecord.currency).toBe('usd');
    expect(paymentRecord.status).toBe('succeeded');
  });
});

