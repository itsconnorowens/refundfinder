/**
 * Email parsing result cache using LRU (Least Recently Used) strategy
 *
 * This cache stores parsed email results to avoid redundant API calls to Claude.
 * - Uses SHA-256 hash of email content as cache key
 * - Maximum 100 cached results
 * - 1-hour TTL (time to live)
 * - Maximum 5MB total cache size
 *
 * Note: In-memory cache will reset on serverless function cold starts.
 * For production with high traffic, consider upgrading to Vercel KV (Redis).
 */

import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import { logger } from './logger';
import type { EmailParseResult } from './parse-flight-email';

// Create LRU cache instance
const cache = new LRUCache<string, EmailParseResult>({
  max: 100, // Maximum 100 cached results
  ttl: 1000 * 60 * 60, // 1 hour TTL
  maxSize: 5000000, // Maximum 5MB total cache size
  sizeCalculation: (value) => {
    // Calculate size based on JSON string length
    return JSON.stringify(value).length;
  },
  // Update access time on get (LRU behavior)
  updateAgeOnGet: true,
  // Update access time on has check
  updateAgeOnHas: true,
});

/**
 * Generate a cache key from email content
 */
function generateCacheKey(emailContent: string): string {
  return createHash('sha256')
    .update(emailContent.trim())
    .digest('hex');
}

/**
 * Get cached parse result for an email
 *
 * @param emailContent - The raw email content
 * @returns Cached result if found, undefined otherwise
 */
export function getCachedParse(emailContent: string): EmailParseResult | undefined {
  const cacheKey = generateCacheKey(emailContent);
  const cached = cache.get(cacheKey);

  if (cached) {
    logger.info('Email parse cache hit', {
      cacheKey: cacheKey.substring(0, 16) + '...',
      emailLength: emailContent.length,
      cacheSize: cache.size,
      route: 'email-parse-cache',
    });
  } else {
    logger.info('Email parse cache miss', {
      cacheKey: cacheKey.substring(0, 16) + '...',
      emailLength: emailContent.length,
      cacheSize: cache.size,
      route: 'email-parse-cache',
    });
  }

  return cached;
}

/**
 * Store a parse result in the cache
 *
 * @param emailContent - The raw email content
 * @param result - The parse result to cache
 */
export function setCachedParse(emailContent: string, result: EmailParseResult): void {
  // Only cache successful results with reasonable confidence
  if (!result.success || (result.confidence && result.confidence < 0.5)) {
    logger.info('Skipping cache for low confidence or failed result', {
      success: result.success,
      confidence: result.confidence,
      route: 'email-parse-cache',
    });
    return;
  }

  const cacheKey = generateCacheKey(emailContent);
  cache.set(cacheKey, result);

  logger.info('Email parse result cached', {
    cacheKey: cacheKey.substring(0, 16) + '...',
    emailLength: emailContent.length,
    confidence: result.confidence,
    cacheSize: cache.size,
    calculatedSize: cache.calculatedSize,
    route: 'email-parse-cache',
  });
}

/**
 * Clear the entire cache
 * Useful for testing or manual cache invalidation
 */
export function clearCache(): void {
  const previousSize = cache.size;
  cache.clear();

  logger.info('Email parse cache cleared', {
    previousSize,
    route: 'email-parse-cache',
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    calculatedSize: cache.calculatedSize,
    maxSize: cache.max,
    maxBytes: 5000000,
  };
}
