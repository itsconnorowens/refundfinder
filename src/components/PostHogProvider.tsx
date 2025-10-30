'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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

        // Check if already initialized
        if (!(posthog as any).__flghtly_loaded) {
          posthog.init(posthogKey, {
            api_host: '/ingest',
            ui_host: 'https://us.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true,
            autocapture: true,
            loaded: (ph) => {
              if (process.env.NODE_ENV === 'development') {
                ph.opt_out_capturing();
              }
            },
          });
          (posthog as any).__flghtly_loaded = true;
        }
      } catch (error) {
        console.error('Failed to load PostHog:', error);
      }
    };

    initPostHog();
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
      } catch (error) {
        // Silently fail if PostHog not available
      }
    };

    trackPageview();
  }, [pathname, searchParams]);

  return null;
}
