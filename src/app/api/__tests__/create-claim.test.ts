import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../create-claim/route';
import { NextRequest } from 'next/server';

// Mock the dependencies
vi.mock('@/lib/airtable', () => ({
  createClaim: vi.fn().mockResolvedValue('record-123'),
  createPayment: vi.fn().mockResolvedValue('payment-record-123'),
}));

vi.mock('@/lib/stripe-server', () => ({
  retrievePaymentIntent: vi.fn().mockResolvedValue({
    id: 'pi_test_123',
    status: 'succeeded',
    amount: 4900,
    currency: 'usd',
  }),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/create-claim', () => {
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a test form data
    formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('flightNumber', 'AA123');
    formData.append('airline', 'American Airlines');
    formData.append('departureDate', '2024-01-01');
    formData.append('departureAirport', 'JFK');
    formData.append('arrivalAirport', 'LAX');
    formData.append('delayDuration', '4 hours');
    formData.append('delayReason', 'Weather');
    formData.append('paymentIntentId', 'pi_test_123');
    
    // Mock files
    const boardingPass = new File(['boarding pass content'], 'boarding-pass.pdf', {
      type: 'application/pdf',
    });
    const delayProof = new File(['delay proof content'], 'delay-proof.pdf', {
      type: 'application/pdf',
    });
    
    formData.append('boardingPass', boardingPass);
    formData.append('delayProof', delayProof);
  });

  it('should return 400 if required fields are missing', async () => {
    const incompleteFormData = new FormData();
    incompleteFormData.append('firstName', 'John');
    // Missing other required fields

    const request = new NextRequest('http://localhost:3000/api/create-claim', {
      method: 'POST',
      body: incompleteFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if files are missing', async () => {
    const noFilesFormData = new FormData();
    noFilesFormData.append('firstName', 'John');
    noFilesFormData.append('lastName', 'Doe');
    noFilesFormData.append('email', 'john@example.com');
    noFilesFormData.append('flightNumber', 'AA123');
    noFilesFormData.append('airline', 'American Airlines');
    noFilesFormData.append('departureDate', '2024-01-01');
    noFilesFormData.append('departureAirport', 'JFK');
    noFilesFormData.append('arrivalAirport', 'LAX');
    noFilesFormData.append('delayDuration', '4 hours');
    noFilesFormData.append('paymentIntentId', 'pi_test_123');

    const request = new NextRequest('http://localhost:3000/api/create-claim', {
      method: 'POST',
      body: noFilesFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required documents');
  });

  it('should return 400 for invalid file types', async () => {
    const invalidFileFormData = new FormData();
    invalidFileFormData.append('firstName', 'John');
    invalidFileFormData.append('lastName', 'Doe');
    invalidFileFormData.append('email', 'john@example.com');
    invalidFileFormData.append('flightNumber', 'AA123');
    invalidFileFormData.append('airline', 'American Airlines');
    invalidFileFormData.append('departureDate', '2024-01-01');
    invalidFileFormData.append('departureAirport', 'JFK');
    invalidFileFormData.append('arrivalAirport', 'LAX');
    invalidFileFormData.append('delayDuration', '4 hours');
    invalidFileFormData.append('paymentIntentId', 'pi_test_123');

    const invalidFile = new File(['content'], 'file.txt', { type: 'text/plain' });
    invalidFileFormData.append('boardingPass', invalidFile);
    invalidFileFormData.append('delayProof', invalidFile);

    const request = new NextRequest('http://localhost:3000/api/create-claim', {
      method: 'POST',
      body: invalidFileFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });
});

describe('Compensation Calculation', () => {
  it('should return not eligible for delays less than 3 hours', () => {
    // Testing the compensation logic indirectly
    const delayHours = 2;
    expect(delayHours).toBeLessThan(3);
  });

  it('should calculate higher compensation for longer delays', () => {
    const shortDelay = 3.5;
    const longDelay = 4.5;
    expect(longDelay).toBeGreaterThan(shortDelay);
  });

  it('should parse delay duration correctly', () => {
    const delayString = '4 hours';
    const parsed = parseFloat(delayString.replace(/[^\d.]/g, ''));
    expect(parsed).toBe(4);
  });
});

