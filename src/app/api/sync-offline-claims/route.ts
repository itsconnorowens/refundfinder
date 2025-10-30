import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingClaims,
  markClaimAsSynced,
  markClaimAsFailed,
} from '@/lib/offline-storage';

/**
 * API endpoint to sync offline claims
 * Called by service worker when connection is restored
 */
export async function POST(_request: NextRequest) {
  try {
    const pendingClaims = await getPendingClaims();

    if (pendingClaims.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No offline claims to sync',
        synced: 0,
      });
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const claim of pendingClaims) {
      try {
        // Mark as syncing
        await markClaimAsSyncing(claim.claimId);

        // Attempt to submit the claim
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/create-claim`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...claim.formData,
              boardingPassUrl: claim.files.boardingPass,
              delayProofUrl: claim.files.delayProof,
              isOfflineSync: true,
            }),
          }
        );

        if (response.ok) {
          await markClaimAsSynced(claim.claimId);
          syncedCount++;
        } else {
          const errorData = await response.json();
          await markClaimAsFailed(
            claim.claimId,
            errorData.error || 'Sync failed'
          );
          failedCount++;
          errors.push(`Claim ${claim.claimId}: ${errorData.error}`);
        }
      } catch (error) {
        console.error(`Error syncing claim ${claim.claimId}:`, error);
        await markClaimAsFailed(
          claim.claimId,
          error instanceof Error ? error.message : 'Unknown error'
        );
        failedCount++;
        errors.push(
          `Claim ${claim.claimId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} of ${pendingClaims.length} claims`,
      synced: syncedCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in sync-offline-claims endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to mark claim as syncing
 * (separate from offline-storage exports to avoid circular dependency)
 */
async function markClaimAsSyncing(claimId: string): Promise<void> {
  // Re-import to avoid circular dependency issues
  const { db } = await import('@/lib/offline-storage');
  await db.claims.where('claimId').equals(claimId).modify({
    status: 'syncing',
  });
}
