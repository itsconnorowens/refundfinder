import { NextRequest, NextResponse } from 'next/server';
import {
  getClaimsByStatus,
  getClaimsReadyToFile,
  getClaimsNeedingFollowUp,
  getOverdueClaims,
  ClaimStatus,
} from '@/lib/airtable';
import {
  validateClaimForFiling,
  generateAirlineSubmission,
  markClaimAsFiled,
  updateClaimStatus,
  getClaimFilingStats,
  processAutomaticClaimPreparation,
} from '@/lib/claim-filing-service';
import { getAllAirlineConfigs } from '@/lib/airline-config';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';

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

/**
 * GET /api/admin/claims/ready-to-file
 * Get all claims ready to file
 */
export async function GET_READY_TO_FILE() {
  try {
    const records = await getClaimsReadyToFile();
    const claims = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    return NextResponse.json({
      success: true,
      data: { claims },
    });
  } catch (error) {
    console.error('Error fetching claims ready to file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims ready to file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/claims/stats
 * Get claim filing statistics
 */
export async function GET_STATS() {
  try {
    const stats = await getClaimFilingStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching claim stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim stats' },
      { status: 500 }
    );
  }
}
