import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { FeatureFlags, getDefaultFlagValue } from '@/lib/feature-flags';

/**
 * Hook to access feature flags from PostHog
 *
 * @param flagKey - The feature flag key (must be defined in FeatureFlags type)
 * @param options - Optional configuration
 * @returns The current value of the feature flag
 *
 * @example
 * ```tsx
 * // Boolean flag
 * const isNewHero = useFeatureFlag('new-homepage-hero');
 * if (isNewHero) {
 *   return <NewHeroSection />;
 * }
 *
 * // String variant flag
 * const ctaText = useFeatureFlag('hero-cta-text');
 * return <Button>{ctaText === 'claim-now' ? 'Claim Now' : 'Check Eligibility'}</Button>;
 *
 * // With tracking disabled
 * const showFeature = useFeatureFlag('new-feature', { trackExposure: false });
 * ```
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flagKey: K,
  options?: {
    /**
     * Whether to automatically track exposure events
     * Default: true
     */
    trackExposure?: boolean;
    /**
     * Fallback value if flag cannot be loaded
     * If not provided, uses default from feature-flags.ts
     */
    fallback?: FeatureFlags[K];
  }
): FeatureFlags[K] | undefined {
  const { trackExposure = true, fallback } = options || {};

  const [value, setValue] = useState<FeatureFlags[K] | undefined>(() => {
    // Get initial value from PostHog if available (SSR-safe)
    if (typeof window !== 'undefined') {
      const initialValue = posthog.getFeatureFlag(flagKey as string);
      if (initialValue !== undefined) {
        return initialValue as FeatureFlags[K];
      }
    }
    return fallback ?? getDefaultFlagValue(flagKey);
  });

  const [hasTrackedExposure, setHasTrackedExposure] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get current value
    const currentValue = posthog.getFeatureFlag(flagKey as string);
    if (currentValue !== undefined) {
      setValue(currentValue as FeatureFlags[K]);
    }

    // Track exposure event (only once per flag per session)
    if (trackExposure && !hasTrackedExposure && currentValue !== undefined) {
      posthog.capture('feature_flag_called', {
        flag_key: flagKey,
        flag_value: currentValue,
        flag_type: typeof currentValue,
      });
      setHasTrackedExposure(true);
    }

    // Listen for feature flag changes
    const onFeatureFlagsChange = () => {
      const newValue = posthog.getFeatureFlag(flagKey as string);
      if (newValue !== undefined) {
        setValue(newValue as FeatureFlags[K]);
      }
    };

    // Subscribe to flag updates
    posthog.onFeatureFlags(onFeatureFlagsChange);

    // Cleanup not needed as PostHog handles it
  }, [flagKey, trackExposure, hasTrackedExposure]);

  return value;
}

/**
 * Hook to check if a boolean feature flag is enabled
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value if flag is not set (default: false)
 * @returns Whether the flag is enabled
 *
 * @example
 * ```tsx
 * const showNewFeature = useFeatureFlagEnabled('new-feature');
 * if (showNewFeature) {
 *   return <NewFeature />;
 * }
 * ```
 */
export function useFeatureFlagEnabled(
  flagKey: keyof FeatureFlags,
  defaultValue: boolean = false
): boolean {
  const value = useFeatureFlag(flagKey);
  return value === true || (value === undefined && defaultValue);
}

/**
 * Hook to access multiple feature flags at once
 *
 * @param flagKeys - Array of feature flag keys
 * @returns Object mapping flag keys to their values
 *
 * @example
 * ```tsx
 * const flags = useFeatureFlags(['new-hero', 'dark-mode', 'simplified-form']);
 * if (flags['new-hero']) {
 *   // Show new hero
 * }
 * if (flags['dark-mode']) {
 *   // Apply dark theme
 * }
 * ```
 */
export function useFeatureFlags<K extends keyof FeatureFlags>(
  flagKeys: K[]
): Partial<Record<K, FeatureFlags[K]>> {
  const [flags, setFlags] = useState<Partial<Record<K, FeatureFlags[K]>>>(() => {
    if (typeof window === 'undefined') return {};

    const initialFlags: Partial<Record<K, FeatureFlags[K]>> = {};
    for (const key of flagKeys) {
      const value = posthog.getFeatureFlag(key as string);
      if (value !== undefined) {
        initialFlags[key] = value as FeatureFlags[K];
      } else {
        initialFlags[key] = getDefaultFlagValue(key);
      }
    }
    return initialFlags;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateFlags = () => {
      const updatedFlags: Partial<Record<K, FeatureFlags[K]>> = {};
      for (const key of flagKeys) {
        const value = posthog.getFeatureFlag(key as string);
        if (value !== undefined) {
          updatedFlags[key] = value as FeatureFlags[K];
        } else {
          updatedFlags[key] = getDefaultFlagValue(key);
        }
      }
      setFlags(updatedFlags);

      // Track exposure for all flags
      posthog.capture('feature_flags_called', {
        flags: Object.entries(updatedFlags).map(([key, value]) => ({
          key,
          value,
          type: typeof value,
        })),
      });
    };

    updateFlags();
    posthog.onFeatureFlags(updateFlags);
  }, [flagKeys]);

  return flags;
}

/**
 * Hook to perform actions when feature flags are loaded
 *
 * @param callback - Function to call when flags are loaded
 *
 * @example
 * ```tsx
 * useFeatureFlagsReady(() => {
 *   console.log('Feature flags loaded!');
 *   // Perform any initialization that depends on flags
 * });
 * ```
 */
export function useFeatureFlagsReady(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    posthog.onFeatureFlags(callback);
  }, [callback]);
}
