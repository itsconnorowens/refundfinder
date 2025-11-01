import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the airtable module
vi.mock('../../../lib/airtable', () => ({
  getClaimsNeedingFollowUp: vi.fn(),
  getOverdueClaims: vi.fn(),
}));

// Mock the email-service module
vi.mock('../../../lib/email-service', () => ({
  sendAdminOverdueAlert: vi.fn(),
  emailService: {
    sendEmail: vi.fn(),
  },
  emailTemplates: {},
}));

describe('Cron Job Integration Tests', () => {
  const mockOverdueClaim = {
    id: 'rec123',
    fields: {
      claim_id: 'CLM001',
      user_first_name: 'John',
      user_last_name: 'Doe',
      flight_number: 'BA123',
      airline: 'British Airways',
      departure_date: '2024-01-15',
      submitted_at: '2024-01-10T10:00:00Z',
      status: 'ready_to_file',
    },
  };

  const mockFollowUpClaim = {
    id: 'rec456',
    fields: {
      claim_id: 'CLM002',
      user_first_name: 'Jane',
      user_last_name: 'Smith',
      flight_number: 'FR456',
      airline: 'Ryanair',
      departure_date: '2024-01-20',
      status: 'monitoring',
      next_follow_up_date: '2024-01-25',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env.CRON_SECRET = 'test-cron-secret';
    process.env.ADMIN_EMAIL = 'admin@flghtly.com';
  });

  describe('POST /api/cron/check-follow-ups', () => {
    it('should process overdue claims and send alerts', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims } = await import('../../../lib/airtable');
      const { sendAdminOverdueAlert } = await import(
        '../../../lib/email-service'
      );

      (getOverdueClaims as Mock).mockResolvedValue([mockOverdueClaim]);
      (sendAdminOverdueAlert as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Follow-up check completed');
      expect(data.results.overdueClaims).toBe(1);
      expect(data.results.alertsSent).toBe(1);

      expect(sendAdminOverdueAlert).toHaveBeenCalledWith('admin@flghtly.com', {
        claims: [
          {
            claimId: 'CLM001',
            firstName: 'John',
            lastName: 'Doe',
            flightNumber: 'BA123',
            airline: 'British Airways',
            departureDate: '2024-01-15',
            submittedAt: '2024-01-10T10:00:00Z',
            status: 'ready_to_file',
          },
        ],
      });
    });

    it('should process follow-up claims and send alerts', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getClaimsNeedingFollowUp, getOverdueClaims } = await import(
        '../../../lib/airtable'
      );
      const { emailService } = await import('../../../lib/email-service');

      (getClaimsNeedingFollowUp as Mock).mockResolvedValue([mockFollowUpClaim]);
      (getOverdueClaims as Mock).mockResolvedValue([]); // No overdue claims
      (emailService.sendEmail as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.followUpClaims).toBe(1);
      expect(data.results.alertsSent).toBe(1);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@flghtly.com',
          template: expect.objectContaining({
            subject: expect.stringContaining('Follow-up Required'),
          }),
        })
      );
    });

    it('should process both overdue and follow-up claims', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims, getClaimsNeedingFollowUp } = await import(
        '../../../lib/airtable'
      );
      const { sendAdminOverdueAlert, emailService } = await import(
        '../../../lib/email-service'
      );

      (getOverdueClaims as Mock).mockResolvedValue([mockOverdueClaim]);
      (getClaimsNeedingFollowUp as Mock).mockResolvedValue([mockFollowUpClaim]);
      (sendAdminOverdueAlert as Mock).mockResolvedValue(true);
      (emailService.sendEmail as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.overdueClaims).toBe(1);
      expect(data.results.followUpClaims).toBe(1);
      expect(data.results.alertsSent).toBe(2);
    });

    it('should handle no claims needing action', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims, getClaimsNeedingFollowUp } = await import(
        '../../../lib/airtable'
      );

      (getOverdueClaims as Mock).mockResolvedValue([]);
      (getClaimsNeedingFollowUp as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.overdueClaims).toBe(0);
      expect(data.results.followUpClaims).toBe(0);
      expect(data.results.alertsSent).toBe(0);
    });

    it('should require valid authorization', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBeDefined();
    });

    it('should handle missing authorization header', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBeDefined();
    });

    it('should handle missing cron secret environment variable', async () => {
      delete process.env.CRON_SECRET;

      const { POST } = await import('../cron/check-follow-ups/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBeDefined();
    });

    it('should handle missing admin email configuration', async () => {
      delete process.env.ADMIN_EMAIL;

      const { POST } = await import('../cron/check-follow-ups/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('No admin email configured');
    });

    it('should handle email sending failures gracefully', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims } = await import('../../../lib/airtable');
      const { sendAdminOverdueAlert } = await import(
        '../../../lib/email-service'
      );

      (getOverdueClaims as Mock).mockResolvedValue([mockOverdueClaim]);
      (sendAdminOverdueAlert as Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.errors).toHaveLength(1);
      expect(data.results.errors[0]).toContain(
        'Failed to check overdue claims'
      );
    });

    it('should handle database errors gracefully', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims } = await import('../../../lib/airtable');

      (getOverdueClaims as Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.errors).toHaveLength(1);
      expect(data.results.errors[0]).toContain(
        'Failed to check overdue claims'
      );
    });

    it('should group follow-up claims by airline', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getClaimsNeedingFollowUp, getOverdueClaims } = await import(
        '../../../lib/airtable'
      );
      const { emailService } = await import('../../../lib/email-service');

      const multipleClaims = [
        mockFollowUpClaim,
        {
          id: 'rec789',
          fields: {
            claim_id: 'CLM003',
            user_first_name: 'Bob',
            user_last_name: 'Johnson',
            flight_number: 'FR789',
            airline: 'Ryanair',
            departure_date: '2024-01-22',
            status: 'monitoring',
            next_follow_up_date: '2024-01-27',
          },
        },
        {
          id: 'rec101',
          fields: {
            claim_id: 'CLM004',
            user_first_name: 'Alice',
            user_last_name: 'Brown',
            flight_number: 'BA456',
            airline: 'British Airways',
            departure_date: '2024-01-25',
            status: 'monitoring',
            next_follow_up_date: '2024-01-30',
          },
        },
      ];

      (getClaimsNeedingFollowUp as Mock).mockResolvedValue(multipleClaims);
      (getOverdueClaims as Mock).mockResolvedValue([]); // No overdue claims
      (emailService.sendEmail as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.followUpClaims).toBe(3);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@flghtly.com',
          template: expect.objectContaining({
            subject: expect.stringContaining('Follow-up Required'),
          }),
        })
      );
    });

    it('should calculate days overdue correctly', async () => {
      const { POST } = await import('../cron/check-follow-ups/route');
      const { getOverdueClaims, getClaimsNeedingFollowUp } = await import(
        '../../../lib/airtable'
      );
      const { sendAdminOverdueAlert } = await import(
        '../../../lib/email-service'
      );

      const oldClaim = {
        ...mockOverdueClaim,
        fields: {
          ...mockOverdueClaim.fields,
          submitted_at: '2024-01-01T10:00:00Z', // 15 days ago
        },
      };

      (getOverdueClaims as Mock).mockResolvedValue([oldClaim]);
      (getClaimsNeedingFollowUp as Mock).mockResolvedValue([]); // No follow-up claims
      (sendAdminOverdueAlert as Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(sendAdminOverdueAlert).toHaveBeenCalledWith('admin@flghtly.com', {
        claims: [
          {
            claimId: 'CLM001',
            firstName: 'John',
            lastName: 'Doe',
            flightNumber: 'BA123',
            airline: 'British Airways',
            departureDate: '2024-01-15',
            submittedAt: '2024-01-01T10:00:00Z',
            status: 'ready_to_file',
          },
        ],
      });
    });
  });

  describe('GET /api/cron/check-follow-ups', () => {
    it('should return health check status', async () => {
      const { GET } = await import('../cron/check-follow-ups/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/check-follow-ups'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Follow-up cron job is running');
      expect(data.timestamp).toBeDefined();
    });
  });
});
