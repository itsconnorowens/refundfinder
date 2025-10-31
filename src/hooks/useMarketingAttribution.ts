/**
 * React Hook for Marketing Attribution
 *
 * Provides easy access to marketing attribution data and helpers
 * for tracking attribution in components.
 *
 * Usage:
 * ```tsx
 * const { attribution, getProperties, refresh } = useMarketingAttribution();
 *
 * // Get attribution properties for event tracking
 * posthog.capture('conversion_event', {
 *   ...getProperties(),
 *   // ... other event properties
 * });
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import {
  type MarketingAttribution,
  getAttribution,
  getAttributionProperties,
  initializeAttribution,
} from '@/lib/marketing-attribution';

export function useMarketingAttribution() {
  const [attribution, setAttribution] = useState<MarketingAttribution | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize attribution tracking on mount
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    // Initialize attribution (captures UTM params, referrer, etc.)
    initializeAttribution();

    // Get the attribution data
    const currentAttribution = getAttribution();
    setAttribution(currentAttribution);
    setIsInitialized(true);
  }, [isInitialized]);

  /**
   * Refresh attribution data from cookies
   * Useful if attribution might have been updated elsewhere
   */
  const refresh = () => {
    const currentAttribution = getAttribution();
    setAttribution(currentAttribution);
  };

  /**
   * Get flattened attribution properties for event tracking
   * Returns an object suitable for spreading into PostHog events
   */
  const getProperties = () => {
    return getAttributionProperties();
  };

  return {
    /**
     * Current attribution data
     */
    attribution,

    /**
     * Whether attribution tracking has been initialized
     */
    isInitialized,

    /**
     * Get attribution properties for event tracking
     * Returns flattened object with attribution_ prefixed keys
     */
    getProperties,

    /**
     * Refresh attribution data from cookies
     */
    refresh,

    /**
     * Check if user has marketing attribution data
     */
    hasAttribution: attribution !== null,

    /**
     * Check if user came from a marketing campaign (has UTM params)
     */
    isFromCampaign: Boolean(
      attribution?.utm_source || attribution?.utm_medium || attribution?.utm_campaign
    ),

    /**
     * Check if user came from an external referrer
     */
    hasReferrer: Boolean(attribution?.referrer),
  };
}
