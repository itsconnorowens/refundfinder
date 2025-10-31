/**
 * Feature Flags System using PostHog
 *
 * This module provides type-safe feature flags for A/B testing and gradual rollouts.
 *
 * Usage:
 * 1. Define your flags in the FeatureFlags type below
 * 2. Create the flag in PostHog UI with the same key
 * 3. Use the useFeatureFlag hook in components
 *
 * Example:
 * ```tsx
 * const heroVariant = useFeatureFlag('new-homepage-hero');
 * if (heroVariant === 'variant-b') {
 *   return <NewHeroSection />;
 * }
 * ```
 */

/**
 * Define all feature flags here for type safety
 *
 * Format:
 * 'flag-key': boolean | string | number
 *
 * Examples:
 * - Boolean flags: Simple on/off toggles
 * - String flags: Multiple variants (A/B/C testing)
 * - Number flags: Percentage-based rollouts
 */
export type FeatureFlags = {
  // Homepage experiments
  'new-homepage-hero': boolean;
  'hero-cta-text': 'check-eligibility' | 'get-started' | 'claim-now';
  'trust-badges-visible': boolean;
  'show-testimonials': boolean;

  // Form experiments
  'simplified-eligibility-form': boolean;
  'multi-step-form': boolean;
  'inline-validation': boolean;
  'auto-save-form': boolean;

  // UI/UX experiments
  'dark-mode': boolean;
  'compact-layout': boolean;
  'floating-cta': boolean;

  // Pricing experiments
  'show-service-fee-upfront': boolean;
  'pricing-comparison': boolean;

  // Features
  'email-parsing-enabled': boolean;
  'real-time-validation': boolean;
  'document-ocr': boolean;
  'chat-support': boolean;
};

/**
 * Default values for feature flags
 * Used as fallback if PostHog is not loaded or flag doesn't exist
 */
export const DEFAULT_FLAG_VALUES: Partial<FeatureFlags> = {
  'new-homepage-hero': false,
  'hero-cta-text': 'check-eligibility',
  'trust-badges-visible': true,
  'show-testimonials': true,
  'simplified-eligibility-form': false,
  'multi-step-form': true,
  'inline-validation': true,
  'auto-save-form': false,
  'dark-mode': false,
  'compact-layout': false,
  'floating-cta': false,
  'show-service-fee-upfront': true,
  'pricing-comparison': false,
  'email-parsing-enabled': true,
  'real-time-validation': true,
  'document-ocr': false,
  'chat-support': false,
};

/**
 * Get the default value for a feature flag
 */
export function getDefaultFlagValue<K extends keyof FeatureFlags>(
  flagKey: K
): FeatureFlags[K] | undefined {
  return DEFAULT_FLAG_VALUES[flagKey] as FeatureFlags[K] | undefined;
}

/**
 * Type guard to check if a value is a valid feature flag key
 */
export function isFeatureFlagKey(key: string): key is keyof FeatureFlags {
  return key in DEFAULT_FLAG_VALUES;
}

/**
 * Feature flag metadata for documentation
 */
export interface FeatureFlagMetadata {
  name: keyof FeatureFlags;
  description: string;
  type: 'boolean' | 'string' | 'number';
  variants?: string[];
  defaultValue: any;
  impact: 'low' | 'medium' | 'high';
  category: 'experiment' | 'feature' | 'ui' | 'pricing';
}

/**
 * Feature flag registry with metadata
 * Useful for documentation and management
 */
export const FEATURE_FLAG_REGISTRY: FeatureFlagMetadata[] = [
  {
    name: 'new-homepage-hero',
    description: 'Tests new hero section with updated messaging',
    type: 'boolean',
    defaultValue: false,
    impact: 'high',
    category: 'experiment',
  },
  {
    name: 'hero-cta-text',
    description: 'A/B test for CTA button text',
    type: 'string',
    variants: ['check-eligibility', 'get-started', 'claim-now'],
    defaultValue: 'check-eligibility',
    impact: 'medium',
    category: 'experiment',
  },
  {
    name: 'trust-badges-visible',
    description: 'Show/hide trust badges on homepage',
    type: 'boolean',
    defaultValue: true,
    impact: 'medium',
    category: 'ui',
  },
  {
    name: 'simplified-eligibility-form',
    description: 'Reduced fields version of eligibility form',
    type: 'boolean',
    defaultValue: false,
    impact: 'high',
    category: 'experiment',
  },
  {
    name: 'show-service-fee-upfront',
    description: 'Display service fee prominently vs hiding until checkout',
    type: 'boolean',
    defaultValue: true,
    impact: 'high',
    category: 'pricing',
  },
  {
    name: 'email-parsing-enabled',
    description: 'Enable email parsing feature for flight extraction',
    type: 'boolean',
    defaultValue: true,
    impact: 'low',
    category: 'feature',
  },
  {
    name: 'document-ocr',
    description: 'Enable OCR for automatic document parsing',
    type: 'boolean',
    defaultValue: false,
    impact: 'medium',
    category: 'feature',
  },
];

/**
 * Get feature flag metadata by key
 */
export function getFeatureFlagMetadata(
  flagKey: keyof FeatureFlags
): FeatureFlagMetadata | undefined {
  return FEATURE_FLAG_REGISTRY.find((flag) => flag.name === flagKey);
}
