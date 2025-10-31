'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initializeAttribution } from '@/lib/marketing-attribution';

/**
 * PostHog client-side analytics provider
 * Wraps the app to enable PostHog tracking
 * Simplified to avoid SSR issues during build
 */

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only on client side after mount
    const initPostHog = async () => {
      if (typeof window === 'undefined') return;

      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (!posthogKey) return;

      try {
        const posthog = (await import('posthog-js')).default;

        // Check if PostHog was already initialized by the HTML snippet
        // The snippet sets __loaded flag when initialization is complete
        if ((window as any).posthog?.__loaded) {
          // PostHog already initialized by HTML snippet, just configure additional options
          if (process.env.NODE_ENV === 'development') {
            const devEnabled = process.env.NEXT_PUBLIC_POSTHOG_DEV_ENABLED === 'true';
            if (!devEnabled) {
              posthog.opt_out_capturing();
              console.log('PostHog: Already initialized by snippet. Development tracking disabled.');
            } else {
              console.log('PostHog: Already initialized by snippet. Development tracking enabled.');
            }
          }
          return;
        }

        // If not initialized by snippet, initialize via JS SDK (fallback)
        if (!(posthog as any).__flghtly_loaded) {
          posthog.init(posthogKey, {
            api_host: '/ingest',
            ui_host: 'https://us.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true,
            autocapture: true,
            loaded: (ph) => {
              // Only opt out in development if explicitly disabled
              // Set NEXT_PUBLIC_POSTHOG_DEV_ENABLED=true to enable tracking in dev
              if (process.env.NODE_ENV === 'development') {
                const devEnabled = process.env.NEXT_PUBLIC_POSTHOG_DEV_ENABLED === 'true';
                if (!devEnabled) {
                  ph.opt_out_capturing();
                  console.log('PostHog: Development tracking disabled. Set NEXT_PUBLIC_POSTHOG_DEV_ENABLED=true to enable.');
                } else {
                  console.log('PostHog: Development tracking enabled');
                }
              }
            },
          });
          (posthog as any).__flghtly_loaded = true;
        }
      } catch (error: unknown) {
        console.error('Failed to load PostHog:', error);
      }
    };

    initPostHog();

    // Initialize marketing attribution tracking
    // This captures UTM parameters, referrer, and landing page
    initializeAttribution();
  }, []);

  // Render children immediately to avoid hydration issues
  return <>{children}</>;
}

/**
 * PostHog pageview tracker
 * Call this component in your layout to track pageviews
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track pageview after navigation
    const trackPageview = async () => {
      if (typeof window === 'undefined' || !pathname) return;

      try {
        const posthog = (await import('posthog-js')).default;

        let url = window.origin + pathname;
        if (searchParams?.toString()) {
          url = url + `?${searchParams.toString()}`;
        }

        posthog.capture('$pageview', {
          $current_url: url,
        });
      } catch {
        // Silently fail if PostHog not available
      }
    };

    trackPageview();
  }, [pathname, searchParams]);

  return null;
}
