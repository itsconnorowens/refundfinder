import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the airtable module
vi.mock('../../../lib/airtable', () => ({
  getClaimsByStatus: vi.fn(),
  getClaimsReadyToFile: vi.fn(),
  getClaimsNeedingFollowUp: vi.fn(),
  getOverdueClaims: vi.fn(),
  getClaimByClaimId: vi.fn(),
  updateClaim: vi.fn(),
  ClaimStatus: {},
}));

// Mock the claim-filing-service module
vi.mock('../../../lib/claim-filing-service', () => ({
  validateClaimForFiling: vi.fn(),
  generateAirlineSubmission: vi.fn(),
  markClaimAsFiled: vi.fn(),
  updateClaimStatus: vi.fn(),
  scheduleFollowUp: vi.fn(),
  getClaimFilingStats: vi.fn(),
}));

// Mock the airline-config module
vi.mock('../../../lib/airline-config', () => ({
  getAllAirlineConfigs: vi.fn(),
  getAirlineConfig: vi.fn(),
}));

describe('Admin API Integration Tests', () => {
  const mockClaim = {
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
    status: 'ready_to_file',
    submittedAt: '2024-01-15T10:00:00Z',
    amount: 600,
    paymentId: 'pi_123',
  };

  const mockAirlineConfig = {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.britishairways.com/en-gb/information/legal/eu261',
    requiredDocuments: ['boarding_pass', 'delay_proof'],
    requiredFields: ['passenger_name', 'flight_number'],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks'],
    specialInstructions: 'Use online form',
    regulationCovered: 'UK261',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/claims', () => {
    it('should return claims with status filter', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      (getClaimsByStatus as Mock).mockResolvedValue([
        { id: 'rec123', fields: mockClaim },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims?status=ready_to_file'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.claims).toHaveLength(1);
      expect(data.data.claims[0].claimId).toBe('CLM001');
      expect(getClaimsByStatus).toHaveBeenCalledWith('ready_to_file');
    });

    it('should return all claims when no status filter', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      (getClaimsByStatus as Mock).mockResolvedValue([
        { id: 'rec123', fields: mockClaim },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.claims).toBeDefined();
    });

    it('should filter by airline', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      (getClaimsByStatus as Mock).mockResolvedValue([
        { id: 'rec123', fields: mockClaim },
        { id: 'rec456', fields: { ...mockClaim, airline: 'Ryanair' } },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims?airline=British'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.claims).toHaveLength(1);
      expect(data.data.claims[0].airline).toBe('British Airways');
    });

    it('should handle pagination', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      const mockClaims = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `rec${i}`,
          fields: {
            ...mockClaim,
            claimId: `CLM${i.toString().padStart(3, '0')}`,
          },
        }));

      (getClaimsByStatus as Mock).mockResolvedValue(mockClaims);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims?limit=10&offset=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.claims).toHaveLength(10);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.offset).toBe(0);
      expect(data.data.pagination.hasMore).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      (getClaimsByStatus as Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Error fetching claims');
    });
  });

  describe('GET /api/admin/claims/ready-to-file', () => {
    it('should return claims ready to file', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsReadyToFile } = await import('../../../lib/airtable');

      (getClaimsReadyToFile as Mock).mockResolvedValue([
        { id: 'rec123', fields: mockClaim },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/ready-to-file'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.claims).toHaveLength(1);
      expect(data.data.claims[0].status).toBe('ready_to_file');
    });
  });

  describe('GET /api/admin/claims/stats', () => {
    it('should return claim filing statistics', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimFilingStats } = await import(
        '@/lib/claim-filing-service'
      );

      const mockStats = {
        totalClaims: 100,
        readyToFile: 5,
        filed: 20,
        approved: 15,
        rejected: 3,
        completed: 18,
      };

      (getClaimFilingStats as Mock).mockResolvedValue(mockStats);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/stats'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
    });
  });

  describe('GET /api/admin/claims/[id]', () => {
    it('should return specific claim details', async () => {
      const { GET } = await import('../admin/claims/[id]/route');
      const { getClaimByClaimId } = await import('../../../lib/airtable');

      (getClaimByClaimId as Mock).mockResolvedValue({ fields: mockClaim });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001'
      );
      const response = await GET(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.claimId).toBe('CLM001');
      expect(data.data.firstName).toBe('John');
    });

    it('should return 404 for non-existent claim', async () => {
      const { GET } = await import('../admin/claims/[id]/route');
      const { getClaimByClaimId } = await import('../../../lib/airtable');

      (getClaimByClaimId as Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/NONEXISTENT'
      );
      const response = await GET(request, { params: { id: 'NONEXISTENT' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Claim not found');
    });
  });

  describe('POST /api/admin/claims/[id]/validate', () => {
    it('should validate claim for filing', async () => {
      const { POST } = await import('../admin/claims/[id]/validate/route');
      const { validateClaimForFiling } = await import(
        '@/lib/claim-filing-service'
      );

      const mockValidation = {
        success: true,
        airlineConfig: mockAirlineConfig,
        missingDocuments: [],
      };

      (validateClaimForFiling as Mock).mockResolvedValue(mockValidation);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/validate',
        {
          method: 'POST',
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockValidation);
    });

    it('should handle validation failure', async () => {
      const { POST } = await import('../admin/claims/[id]/validate/route');
      const { validateClaimForFiling } = await import(
        '@/lib/claim-filing-service'
      );

      const mockValidation = {
        success: false,
        error: 'Missing required documents',
        missingDocuments: ['boarding_pass'],
      };

      (validateClaimForFiling as Mock).mockResolvedValue(mockValidation);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/validate',
        {
          method: 'POST',
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(false);
    });
  });

  describe('POST /api/admin/claims/[id]/generate-submission', () => {
    it('should generate airline submission', async () => {
      const { POST } = await import(
        '../admin/claims/[id]/generate-submission/route'
      );
      const { generateAirlineSubmission } = await import(
        '@/lib/claim-filing-service'
      );

      const mockSubmission = {
        success: true,
        submission: {
          type: 'web_form',
          url: 'https://www.britishairways.com/en-gb/information/legal/eu261',
          body: 'Generated submission content',
          formData: {
            'Full Name': 'John Doe',
            'Flight Number': 'BA123',
          },
        },
      };

      (generateAirlineSubmission as Mock).mockResolvedValue(mockSubmission);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/generate-submission',
        {
          method: 'POST',
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSubmission);
    });
  });

  describe('PUT /api/admin/claims/[id]/status', () => {
    it('should update claim status', async () => {
      const { PUT } = await import('../admin/claims/[id]/status/route');
      const { updateClaimStatus } = await import(
        '../../../lib/claim-filing-service'
      );

      (updateClaimStatus as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'filed',
            notes: 'Claim filed with airline',
          }),
        }
      );
      const response = await PUT(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateClaimStatus).toHaveBeenCalledWith(
        'CLM001',
        'filed',
        undefined,
        'Claim filed with airline'
      );
    });

    it('should handle status update failure', async () => {
      const { PUT } = await import('../admin/claims/[id]/status/route');
      const { updateClaimStatus } = await import(
        '../../../lib/claim-filing-service'
      );

      (updateClaimStatus as Mock).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'filed',
          }),
        }
      );
      const response = await PUT(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/claims/[id]/file', () => {
    it('should mark claim as filed', async () => {
      const { POST } = await import('../admin/claims/[id]/file/route');
      const { markClaimAsFiled } = await import(
        '../../../lib/claim-filing-service'
      );

      (markClaimAsFiled as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/file',
        {
          method: 'POST',
          body: JSON.stringify({
            airlineReference: 'BA-REF-123',
            filedBy: 'admin@example.com',
            filingMethod: 'web_form',
          }),
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(markClaimAsFiled).toHaveBeenCalledWith(
        'CLM001',
        'BA-REF-123',
        'admin@example.com',
        'web_form'
      );
    });
  });

  describe('POST /api/admin/claims/[id]/follow-up', () => {
    it('should schedule follow-up', async () => {
      const { POST } = await import('../admin/claims/[id]/follow-up/route');
      const { scheduleFollowUp } = await import(
        '../../../lib/claim-filing-service'
      );

      (scheduleFollowUp as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/follow-up',
        {
          method: 'POST',
          body: JSON.stringify({
            followUpDate: '2024-02-15',
          }),
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(scheduleFollowUp).toHaveBeenCalledWith('CLM001', '2024-02-15');
    });
  });

  describe('GET /api/admin/airlines', () => {
    it('should return all airline configurations', async () => {
      const { GET } = await import('@/app/api/admin/airlines/route');
      const { getAllAirlineConfigs } = await import(
        '../../../lib/airline-config'
      );

      const mockAirlines = [
        mockAirlineConfig,
        { ...mockAirlineConfig, airlineCode: 'FR' },
      ];
      (getAllAirlineConfigs as Mock).mockReturnValue(mockAirlines);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/airlines'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.airlines).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    it('should filter airlines by submission method', async () => {
      const { GET } = await import('@/app/api/admin/airlines/route');
      const { getAllAirlineConfigs } = await import(
        '../../../lib/airline-config'
      );

      const mockAirlines = [
        mockAirlineConfig,
        { ...mockAirlineConfig, airlineCode: 'FR', submissionMethod: 'email' },
      ];
      (getAllAirlineConfigs as Mock).mockReturnValue(mockAirlines);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/airlines?submissionMethod=email'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.airlines).toHaveLength(1);
      expect(data.data.airlines[0].submissionMethod).toBe('email');
    });
  });

  describe('GET /api/admin/airlines/[code]', () => {
    it('should return specific airline configuration', async () => {
      const { GET } = await import('@/app/api/admin/airlines/[code]/route');
      const { getAirlineConfig } = await import('../../../lib/airline-config');

      (getAirlineConfig as Mock).mockReturnValue(mockAirlineConfig);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/airlines/BA'
      );
      const response = await GET(request, { params: { code: 'BA' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.airlineCode).toBe('BA');
    });

    it('should return 404 for non-existent airline', async () => {
      const { GET } = await import('@/app/api/admin/airlines/[code]/route');
      const { getAirlineConfig } = await import('../../../lib/airline-config');

      (getAirlineConfig as Mock).mockReturnValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/airlines/UNKNOWN'
      );
      const response = await GET(request, { params: { code: 'UNKNOWN' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Airline configuration not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const { PUT } = await import('../admin/claims/[id]/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/status',
        {
          method: 'PUT',
          body: 'invalid json',
        }
      );
      const response = await PUT(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle missing required fields', async () => {
      const { POST } = await import('../admin/claims/[id]/file/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/CLM001/file',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request, { params: { id: 'CLM001' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle service errors gracefully', async () => {
      const { GET } = await import('../admin/claims/route');
      const { getClaimsByStatus } = await import('../../../lib/airtable');

      (getClaimsByStatus as Mock).mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Error fetching claims');
    });
  });
});
