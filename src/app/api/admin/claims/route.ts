import { NextRequest, NextResponse } from 'next/server';
import { getClaimsByStatus, ClaimStatus } from '@/lib/airtable';
import { withErrorTracking } from '@/lib/error-tracking';

/**
 * GET /api/admin/claims
 * List claims with filters
 */
export const GET = withErrorTracking(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ClaimStatus | null;
    const airline = searchParams.get('airline');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let claims: any[] = [];

    if (status) {
      const records = await getClaimsByStatus(status);
      claims = records.map((record) => ({
        id: record.id,
        ...record.fields,
      }));
    } else {
      // Get all claims (this would need to be implemented in airtable.ts)
      // For now, get claims from different statuses
      const allStatuses: ClaimStatus[] = [
        'submitted',
        'validated',
        'documents_prepared',
        'ready_to_file',
        'filed',
        'airline_acknowledged',
        'monitoring',
        'airline_responded',
        'approved',
        'rejected',
        'completed',
      ];

      for (const status of allStatuses) {
        const records = await getClaimsByStatus(status);
        claims.push(
          ...records.map((record) => ({
            id: record.id,
            ...record.fields,
          }))
        );
      }
    }

    // Filter by airline if specified
    if (airline) {
      claims = claims.filter((claim) =>
        claim.airline?.toLowerCase().includes(airline.toLowerCase())
      );
    }

    // Sort by submission date (newest first)
    claims.sort(
      (a, b) =>
        new Date(b.submitted_at || 0).getTime() -
        new Date(a.submitted_at || 0).getTime()
    );

    // Apply pagination
    const paginatedClaims = claims.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        claims: paginatedClaims,
        total: claims.length,
        limit,
        offset,
        hasMore: offset + limit < claims.length,
      },
    });
}, { route: '/api/admin/claims', tags: { service: 'admin', operation: 'claim_management' } });
