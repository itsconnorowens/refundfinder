import Dexie, { Table } from 'dexie';
import { logger } from '@/lib/logger';

export interface OfflineClaim {
  id?: number;
  claimId: string;
  formData: any;
  files: {
    boardingPass?: string;
    delayProof?: string;
  };
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
  errorMessage?: string;
}

class OfflineDatabase extends Dexie {
  claims!: Table<OfflineClaim>;

  constructor() {
    super('FlghtlyDB');
    this.version(1).stores({
      claims: '++id, claimId, status, createdAt',
    });
  }
}

export const db = new OfflineDatabase();

/**
 * Save claim data to offline storage
 */
export async function saveOfflineClaim(
  claimData: Omit<OfflineClaim, 'id'>
): Promise<number> {
  try {
    const id = await db.claims.add({
      ...claimData,
      status: 'pending',
      createdAt: new Date(),
    });

    logger.info('[Offline Storage] Saved claim:', { claimId: claimData.claimId });

    // Trigger background sync
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration && registration.sync) {
          await (registration.sync as any).register('sync-claims');
        }
      } catch (error) {
        console.error(
          '[Offline Storage] Service Worker sync not available:',
          error
        );
      }
    }

    return id;
  } catch (error) {
    logger.error('[Offline Storage] Error saving claim:', error);
    throw error;
  }
}

/**
 * Get all pending claims that need to be synced
 */
export async function getPendingClaims(): Promise<OfflineClaim[]> {
  try {
    const claims = await db.claims.where('status').equals('pending').toArray();

    return claims;
  } catch (error) {
    logger.error('[Offline Storage] Error fetching pending claims:', error);
    return [];
  }
}

/**
 * Get all synced claims
 */
export async function getSyncedClaims(): Promise<OfflineClaim[]> {
  try {
    const claims = await db.claims.where('status').equals('synced').toArray();

    return claims;
  } catch (error) {
    logger.error('[Offline Storage] Error fetching synced claims:', error);
    return [];
  }
}

/**
 * Mark claim as synced
 */
export async function markClaimAsSynced(claimId: string): Promise<void> {
  try {
    await db.claims.where('claimId').equals(claimId).modify({
      status: 'synced',
      syncedAt: new Date(),
    });

    logger.info('[Offline Storage] Marked claim as synced:', { claimId: claimId });
  } catch (error) {
    logger.error('[Offline Storage] Error marking claim as synced:', error);
    throw error;
  }
}

/**
 * Mark claim as failed
 */
export async function markClaimAsFailed(
  claimId: string,
  errorMessage: string
): Promise<void> {
  try {
    await db.claims.where('claimId').equals(claimId).modify({
      status: 'failed',
      errorMessage,
    });

    logger.info('[Offline Storage] Marked claim as failed:', { claimId: claimId });
  } catch (error) {
    logger.error('[Offline Storage] Error marking claim as failed:', error);
    throw error;
  }
}

/**
 * Mark claim as syncing
 */
export async function markClaimAsSyncing(claimId: string): Promise<void> {
  try {
    await db.claims.where('claimId').equals(claimId).modify({
      status: 'syncing',
    });
  } catch (error) {
    logger.error('[Offline Storage] Error marking claim as syncing:', error);
    throw error;
  }
}

/**
 * Delete synced claims older than 30 days
 */
export async function cleanupOldClaims(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const claimsToDelete = await db.claims
      .where('status')
      .equals('synced')
      .filter((claim) =>
        claim.syncedAt ? claim.syncedAt < thirtyDaysAgo : false
      )
      .toArray();

    let deleted = 0;
    for (const claim of claimsToDelete) {
      if (claim.id) {
        await db.claims.delete(claim.id);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info('[Offline Storage] Cleaned up  old claims', { deleted: deleted });
    }
  } catch (error) {
    logger.error('[Offline Storage] Error cleaning up claims:', error);
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  pending: number;
  synced: number;
  failed: number;
  total: number;
}> {
  try {
    const total = await db.claims.count();
    const pending = await db.claims.where('status').equals('pending').count();
    const synced = await db.claims.where('status').equals('synced').count();
    const failed = await db.claims.where('status').equals('failed').count();

    return {
      pending,
      synced,
      failed,
      total,
    };
  } catch (error) {
    logger.error('[Offline Storage] Error getting stats:', error);
    return {
      pending: 0,
      synced: 0,
      failed: 0,
      total: 0,
    };
  }
}

/**
 * Check if offline storage is available
 */
export function isOfflineStorageAvailable(): boolean {
  try {
    if (!window.indexedDB) {
      return false;
    }
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Clear all offline storage (for testing/debugging)
 */
export async function clearOfflineStorage(): Promise<void> {
  try {
    await db.claims.clear();
    logger.info('[Offline Storage] Cleared all offline storage');
  } catch (error) {
    logger.error('[Offline Storage] Error clearing storage:', error);
    throw error;
  }
}
