import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  validateClaimForFiling,
  generateAirlineSubmission,
  markClaimAsFiled,
  updateClaimStatus,
  scheduleFollowUp,
  processAutomaticClaimPreparation,
  getClaimFilingStats,
  getClaimsByStatus,
  getAllClaimsReadyToFile,
  getClaimsNeedingFollowUp,
} from '../claim-filing-service';
import { ClaimRecord, ClaimStatus } from '../airtable';
import { AirlineConfig } from '../airline-config';

// Mock the airtable module
vi.mock('../airtable', () => ({
  getClaimByClaimId: vi.fn(),
  updateClaim: vi.fn(),
  getClaimsByStatus: vi.fn(),
  getClaimsReadyToFile: vi.fn(),
  getClaimsNeedingFollowUp: vi.fn(),
  getOverdueClaims: vi.fn(),
}));

// Mock the airline-config module
vi.mock('../airline-config', () => ({
  getAirlineConfig: vi.fn(),
  generateSubmissionTemplate: vi.fn(),
}));

// Mock the email-service module
vi.mock('../email-service', () => ({
  sendClaimFiledNotification: vi.fn(),
  sendStatusUpdateNotification: vi.fn(),
}));

describe('Claim Filing Service', () => {
  const mockClaim: ClaimRecord = {
    id: 'rec123',
    claimId: 'CLM001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    flightNumber: 'BA123',
    airline: 'British Airways',
    departureDate: '2024-01-15',
    departureAirport: 'LHR',
    arrivalAirport: 'CDG',
    delayDuration: '3 hours',
    delayReason: 'Technical issues',
    bookingReference: 'ABC123',
    boardingPassUrl: 'https://example.com/boarding-pass.pdf',
    delayProofUrl: 'https://example.com/delay-proof.pdf',
    status: 'submitted',
    submittedAt: '2024-01-15T10:00:00Z',
    amount: 600,
    paymentId: 'pi_123',
  };

  const mockAirlineConfig: AirlineConfig = {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.britishairways.com/en-gb/information/legal/eu261',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions: 'Use online EU261 form',
    regulationCovered: 'UK261',
    contactPhone: '+44 20 8738 5100',
    website: 'https://www.britishairways.com',
    claimFormFields: {
      passenger_name: 'Full Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateClaimForFiling', () => {
    it('should validate a claim that is ready for filing', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);

      const result = await validateClaimForFiling('CLM001');

      expect(result.success).toBe(true);
      expect(result.airlineConfig).toEqual(mockAirlineConfig);
      expect(result.missingDocuments).toHaveLength(0);
    });

    it('should fail validation if claim is not found', async () => {
      const { getClaimByClaimId } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const result = await validateClaimForFiling('CLM001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Claim not found');
    });

    it('should fail validation if airline config is not found', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (getAirlineConfig as Mock).mockReturnValue(undefined);

      const result = await validateClaimForFiling('CLM001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Airline configuration not found');
    });

    it('should fail validation if required documents are missing', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');

      const claimWithoutDocs = { ...mockClaim, boardingPassUrl: undefined };
      (getClaimByClaimId as Mock).mockResolvedValue({
        fields: claimWithoutDocs,
      });
      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);

      const result = await validateClaimForFiling('CLM001');

      expect(result.success).toBe(false);
      expect(result.missingDocuments).toContain('boarding_pass');
    });

    it('should fail validation if payment is not confirmed', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');

      const unpaidClaim = { ...mockClaim, paymentId: undefined };
      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: unpaidClaim 
      });
      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);

      const result = await validateClaimForFiling('CLM001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment not confirmed');
    });
  });

  describe('generateAirlineSubmission', () => {
    it('should generate submission for valid claim', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');
      const { generateSubmissionTemplate } = await import('../airline-config');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);
      (generateSubmissionTemplate as Mock).mockReturnValue({
        type: 'web_form',
        url: 'https://www.britishairways.com/en-gb/information/legal/eu261',
        body: 'Generated submission content',
        attachments: ['boarding_pass', 'delay_proof'],
      });

      const result = await generateAirlineSubmission('CLM001');

      expect(result.success).toBe(true);
      expect(result.submissionTemplate).toBeDefined();
      expect(generateSubmissionTemplate).toHaveBeenCalledWith(
        mockAirlineConfig,
        mockClaim
      );
    });

    it('should fail if claim validation fails', async () => {
      const { getClaimByClaimId } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const result = await generateAirlineSubmission('CLM001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Claim not found');
    });
  });

  describe('markClaimAsFiled', () => {
    it('should mark claim as filed successfully', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { updateClaim } = await import('../airtable');
      const { sendClaimFiledNotification } = await import('../email-service');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (updateClaim as Mock).mockResolvedValue(true);
      (sendClaimFiledNotification as Mock).mockResolvedValue(true);

      const result = await markClaimAsFiled(
        'CLM001',
        'AIRLINE_REF_123',
        'admin@example.com',
        'web_form'
      );

      expect(result).toBe(true);
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'filed',
        filingMethod: 'web_form',
        airlineReference: 'AIRLINE_REF_123',
        filedBy: 'admin@example.com',
        filedAt: expect.any(String),
        nextFollowUpDate: expect.any(String),
      });
      expect(sendClaimFiledNotification).toHaveBeenCalledWith(mockClaim.email, {
        claimId: mockClaim.claimId,
        airline: mockClaim.airline,
        airlineReference: 'AIRLINE_REF_123',
        filingMethod: 'web_form',
      });
    });

    it('should return false if claim is not found', async () => {
      const { getClaimByClaimId } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const result = await markClaimAsFiled(
        'CLM001',
        'AIRLINE_REF_123',
        'admin@example.com',
        'web_form'
      );

      expect(result).toBe(false);
    });

    it('should return false if update fails', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { updateClaim } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (updateClaim as Mock).mockRejectedValue(new Error('Update failed'));

      const result = await markClaimAsFiled(
        'CLM001',
        'AIRLINE_REF_123',
        'admin@example.com',
        'web_form'
      );

      expect(result).toBe(false);
    });
  });

  describe('updateClaimStatus', () => {
    it('should update claim status successfully', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { updateClaim } = await import('../airtable');
      const { sendStatusUpdateNotification } = await import('../email-service');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (updateClaim as Mock).mockResolvedValue(true);
      (sendStatusUpdateNotification as Mock).mockResolvedValue(true);

      const result = await updateClaimStatus(
        'CLM001',
        'airline_acknowledged',
        'admin@example.com',
        'Airline confirmed receipt',
        'We have received your claim and are processing it.',
        '2024-02-01'
      );

      expect(result).toBe(true);
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'airline_acknowledged',
        airlineAcknowledgedAt: expect.any(String),
        internalNotes: 'admin@example.com',
      });
      expect(sendStatusUpdateNotification).toHaveBeenCalledWith(
        mockClaim.email,
        {
          claimId: mockClaim.claimId,
          status: 'airline_acknowledged',
          notes: 'admin@example.com',
        }
      );
    });

    it('should handle different status types correctly', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { updateClaim } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (updateClaim as Mock).mockResolvedValue(true);

      // Test approved status
      await updateClaimStatus('CLM001', 'approved', 'admin@example.com');
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'approved',
        internalNotes: 'admin@example.com',
      });

      // Test rejected status
      await updateClaimStatus(
        'CLM001',
        'rejected',
        'admin@example.com',
        'Insufficient documentation'
      );
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'rejected',
        internalNotes: 'admin@example.com',
      });
    });
  });

  describe('scheduleFollowUp', () => {
    it('should schedule follow-up successfully', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { updateClaim } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (updateClaim as Mock).mockResolvedValue(true);

      const result = await scheduleFollowUp('CLM001', '2024-02-15');

      expect(result).toBe(true);
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        nextFollowUpDate: '2024-02-15',
      });
    });

    it('should return false if claim is not found', async () => {
      const { getClaimByClaimId } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const result = await scheduleFollowUp('CLM001', '2024-02-15');

      expect(result).toBe(false);
    });
  });

  describe('processAutomaticClaimPreparation', () => {
    it('should process claim preparation successfully', async () => {
      const { getClaimByClaimId } = await import('../airtable');
      const { getAirlineConfig } = await import('../airline-config');
      const { generateSubmissionTemplate } = await import('../airline-config');
      const { updateClaim } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue({ 
        id: 'rec123',
        fields: mockClaim 
      });
      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);
      (generateSubmissionTemplate as Mock).mockReturnValue({
        type: 'web_form',
        body: 'Generated content',
      });
      (updateClaim as Mock).mockResolvedValue(true);

      const result = await processAutomaticClaimPreparation('CLM001');

      expect(result).toBe(true);
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'documents_prepared',
        documentsPreparedAt: expect.any(String),
        generatedSubmission: expect.any(String),
        validationNotes: expect.any(String),
      });
      expect(updateClaim).toHaveBeenCalledWith('rec123', {
        status: 'ready_to_file',
        readyToFileAt: expect.any(String),
        internalNotes: 'Automatically prepared for filing',
      });
    });

    it('should return false if validation fails', async () => {
      const { getClaimByClaimId } = await import('../airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const result = await processAutomaticClaimPreparation('CLM001');

      expect(result).toBe(false);
    });
  });

  describe('getClaimFilingStats', () => {
    it('should return filing statistics', async () => {
      const { getClaimsByStatus } = await import('../airtable');

      (getClaimsByStatus as Mock).mockImplementation((status: ClaimStatus) => {
        const counts: Record<ClaimStatus, number> = {
          submitted: 5,
          validated: 3,
          documents_prepared: 2,
          ready_to_file: 1,
          filed: 10,
          airline_acknowledged: 8,
          monitoring: 6,
          airline_responded: 4,
          approved: 15,
          rejected: 2,
          completed: 20,
          refunded: 0,
        };
        return Array(counts[status] || 0).fill({ fields: {} });
      });

      const stats = await getClaimFilingStats();

      expect(stats.totalClaims).toBe(76);
      expect(stats.readyToFile).toBe(1);
      expect(stats.filed).toBe(10);
      expect(stats.approved).toBe(15);
      expect(stats.rejected).toBe(2);
      expect(stats.completed).toBe(20);
    });
  });

  describe('getClaimsByStatus', () => {
    it('should return claims by status', async () => {
      const { getClaimsByStatus: getClaimsByStatusFromAirtable } = await import(
        '../airtable'
      );

      (getClaimsByStatusFromAirtable as Mock).mockResolvedValue([
        { id: 'rec1', fields: { ...mockClaim, status: 'ready_to_file' } },
        { id: 'rec2', fields: { ...mockClaim, status: 'ready_to_file' } },
      ]);

      const claims = await getClaimsByStatus('ready_to_file');

      expect(claims).toHaveLength(2);
      expect(claims[0].id).toBe('rec1');
      expect(claims[0].status).toBe('ready_to_file');
    });
  });

  describe('getAllClaimsReadyToFile', () => {
    it('should return all claims ready to file', async () => {
      const { getClaimsReadyToFile } = await import('../airtable');

      (getClaimsReadyToFile as Mock).mockResolvedValue([
        { id: 'rec1', fields: { ...mockClaim, status: 'ready_to_file' } },
      ]);

      const claims = await getAllClaimsReadyToFile();

      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('ready_to_file');
    });
  });

  describe('getClaimsNeedingFollowUp', () => {
    it('should return claims needing follow-up', async () => {
      const { getClaimsNeedingFollowUp: getClaimsNeedingFollowUpFromAirtable } =
        await import('../airtable');

      (getClaimsNeedingFollowUpFromAirtable as Mock).mockResolvedValue([
        {
          id: 'rec1',
          fields: {
            ...mockClaim,
            status: 'monitoring',
            nextFollowUpDate: '2024-01-10',
          },
        },
      ]);

      const claims = await getClaimsNeedingFollowUp();

      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('monitoring');
    });
  });
});
