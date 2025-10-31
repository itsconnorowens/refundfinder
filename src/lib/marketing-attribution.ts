/**
 * Marketing Attribution Service
 *
 * Captures and persists marketing attribution data including:
 * - UTM parameters (source, medium, campaign, content, term)
 * - Referrer information
 * - Landing page
 *
 * Attribution is stored in cookies with a 30-day window and
 * integrated with PostHog for analytics.
 */

import { logger } from './logger';

export interface MarketingAttribution {
  // UTM Parameters
  utm_source?: string;      // e.g., 'google', 'facebook', 'email'
  utm_medium?: string;      // e.g., 'cpc', 'social', 'email'
  utm_campaign?: string;    // e.g., 'summer_sale', 'launch'
  utm_content?: string;     // e.g., 'banner_ad', 'text_link'
  utm_term?: string;        // e.g., 'flight_compensation'

  // Additional attribution data
  referrer?: string;        // The referring URL
  landing_page?: string;    // First page visited

  // Metadata
  first_seen?: string;      // ISO timestamp of first visit
  last_seen?: string;       // ISO timestamp of last visit
}

// Cookie name for storing attribution
const ATTRIBUTION_COOKIE = 'flghtly_attribution';
const ATTRIBUTION_EXPIRY_DAYS = 30; // 30-day attribution window

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string | URL): Partial<MarketingAttribution> {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const params = urlObj.searchParams;

  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  };
}

/**
 * Get attribution data from cookies (client-side)
 */
export function getAttribution(): MarketingAttribution | null {
  if (typeof window === 'undefined') return null;

  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${ATTRIBUTION_COOKIE}=`))
    ?.split('=')[1];

  if (!cookieValue) return null;

  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch (error) {
    logger.warn('Failed to parse attribution cookie', { error });
    return null;
  }
}

/**
 * Set attribution data in cookies (client-side)
 */
export function setAttribution(attribution: MarketingAttribution): void {
  if (typeof window === 'undefined') return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + ATTRIBUTION_EXPIRY_DAYS);

  const cookieValue = encodeURIComponent(JSON.stringify(attribution));
  document.cookie = `${ATTRIBUTION_COOKIE}=${cookieValue}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

  logger.debug('Attribution data saved', { attribution });
}

/**
 * Capture attribution data from current page load
 * Should be called on first page load
 *
 * @returns The captured or updated attribution data
 */
export function captureAttribution(): MarketingAttribution | null {
  if (typeof window === 'undefined') return null;

  // Check if we already have attribution
  const existingAttribution = getAttribution();

  // Extract UTM params from current URL
  const utmParams = extractUTMParams(window.location.href);
  const hasUTMParams = Object.values(utmParams).some(v => v !== undefined);

  // Get referrer (only if from external site)
  const referrer = document.referrer && !document.referrer.includes(window.location.host)
    ? document.referrer
    : undefined;
  const landingPage = window.location.pathname + window.location.search;

  const now = new Date().toISOString();

  // If we have existing attribution
  if (existingAttribution) {
    // Only update if we have new UTM params (don't overwrite with empty values)
    if (hasUTMParams) {
      const updatedAttribution: MarketingAttribution = {
        ...existingAttribution,
        ...utmParams,
        last_seen: now,
      };

      setAttribution(updatedAttribution);
      logger.info('Attribution updated with new UTM params', { attribution: updatedAttribution });
      return updatedAttribution;
    }

    // Just update last_seen
    const updatedAttribution = {
      ...existingAttribution,
      last_seen: now,
    };
    setAttribution(updatedAttribution);
    return updatedAttribution;
  }

  // First time visitor - create new attribution
  const newAttribution: MarketingAttribution = {
    ...utmParams,
    referrer,
    landing_page: landingPage,
    first_seen: now,
    last_seen: now,
  };

  setAttribution(newAttribution);
  logger.info('New attribution captured', { attribution: newAttribution });
  return newAttribution;
}

/**
 * Clear attribution data
 */
export function clearAttribution(): void {
  if (typeof window === 'undefined') return;

  document.cookie = `${ATTRIBUTION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  logger.debug('Attribution data cleared');
}

/**
 * Track attribution event in PostHog
 * Called when attribution is first captured or updated
 */
export async function trackAttributionEvent(attribution: MarketingAttribution): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const posthog = (await import('posthog-js')).default;

    // Only track if we have meaningful attribution data
    const hasData = attribution.utm_source || attribution.utm_medium || attribution.utm_campaign || attribution.referrer;

    if (hasData) {
      // Capture the event
      posthog.capture('marketing_attribution_captured', {
        ...attribution,
      });

      // Set as super properties so ALL future events include attribution
      posthog.register({
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        referrer: attribution.referrer,
        landing_page: attribution.landing_page,
      });

      // Set initial attribution as person properties (only set once per user)
      if (posthog.people) {
        posthog.people.set_once({
          initial_utm_source: attribution.utm_source,
          initial_utm_medium: attribution.utm_medium,
          initial_utm_campaign: attribution.utm_campaign,
          initial_utm_content: attribution.utm_content,
          initial_utm_term: attribution.utm_term,
          initial_referrer: attribution.referrer,
          initial_landing_page: attribution.landing_page,
          first_seen_at: attribution.first_seen,
        });
      }

      logger.debug('Attribution event tracked in PostHog and set as super properties', { attribution });
    }
  } catch (error) {
    // Silently fail if PostHog not available
    logger.warn('Failed to track attribution in PostHog', { error });
  }
}

/**
 * Get attribution properties for including in other events
 * Returns a flattened object suitable for event properties
 *
 * Use this to add attribution context to conversion events like:
 * - eligibility_check_started
 * - claim_form_started
 * - claim_submitted
 */
export function getAttributionProperties(): Record<string, any> {
  const attribution = getAttribution();
  if (!attribution) return {};

  return {
    attribution_source: attribution.utm_source,
    attribution_medium: attribution.utm_medium,
    attribution_campaign: attribution.utm_campaign,
    attribution_content: attribution.utm_content,
    attribution_term: attribution.utm_term,
    attribution_referrer: attribution.referrer,
    attribution_landing_page: attribution.landing_page,
    attribution_first_seen: attribution.first_seen,
  };
}

/**
 * Initialize attribution tracking
 * Should be called once on app initialization (e.g., in root layout or provider)
 */
export function initializeAttribution(): void {
  if (typeof window === 'undefined') return;

  const attribution = captureAttribution();

  // Track the attribution event if this is a new visitor or has UTM params
  if (attribution) {
    const hasUTMParams = attribution.utm_source || attribution.utm_medium || attribution.utm_campaign;
    const isNewVisitor = attribution.first_seen === attribution.last_seen;

    if (hasUTMParams || (isNewVisitor && attribution.referrer)) {
      trackAttributionEvent(attribution);
    }
  }
}
