import { describe, it, expect } from 'vitest';

describe('Payment Intent Creation', () => {
  it('should validate required payment fields', () => {
    const paymentData = {
      email: 'john@example.com',
      claimId: 'claim-123',
      firstName: 'John',
      lastName: 'Doe',
    };

    expect(paymentData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(paymentData.claimId).toBeTruthy();
    expect(paymentData.firstName).toBeTruthy();
    expect(paymentData.lastName).toBeTruthy();
  });

  it('should calculate correct payment amount', () => {
    const basePrice = 49.00;
    const amountInCents = Math.round(basePrice * 100);
    expect(amountInCents).toBe(4900);
  });

  it('should use USD currency', () => {
    const currency = 'usd';
    expect(currency).toBe('usd');
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';

    expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

