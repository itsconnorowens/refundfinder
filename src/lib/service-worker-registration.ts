'use client';

import { logger } from '@/lib/logger';

/**
 * Register the service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    logger.info('[Service Worker] Not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log(
      '[Service Worker] Registered successfully:',
      registration.scope
    );

    // Check for updates periodically
    setInterval(
      async () => {
        await registration.update();
      },
      1000 * 60 * 60 * 24
    ); // Check once per day

    return registration;
  } catch (error: unknown) {
    logger.error('[Service Worker] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker (for testing)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      logger.info('[Service Worker] Unregistered successfully');
      return true;
    }
    return false;
  } catch (error: unknown) {
    logger.error('[Service Worker] Unregister failed:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active !== null;
  } catch {
    return false;
  }
}
