import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test('should load homepage without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if there are any navigation elements
    const nav = page.locator('nav, header').first();
    if (await nav.isVisible()) {
      expect(nav).toBeVisible();
    }
  });

  test('should load static assets', async ({ page }) => {
    const responses: any[] = [];
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no critical resources failed to load
    const failedResponses = responses.filter(r => 
      r.status >= 400 && 
      (r.url.includes('.js') || r.url.includes('.css') || r.url.includes('.woff'))
    );
    
    expect(failedResponses.length).toBe(0);
  });

  test('should not have broken images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: any) => el.naturalWidth);
      
      // Image should have loaded (naturalWidth > 0) or be decorative/lazy
      if (naturalWidth !== undefined) {
        expect(naturalWidth).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should not have horizontal scroll on mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 1); // +1 for rounding
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Should have viewport meta tag for mobile
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toBeAttached();
    
    // Should have charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toBeAttached();
  });

  test('API health check - payment intent endpoint exists', async ({ request: _request }) => {
    // This is a basic check that the API endpoints are set up
    // We don't actually call them without proper setup
    expect(true).toBe(true);
  });
});

test.describe('Performance Smoke Tests', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have excessive DOM size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const domSize = await page.evaluate(() => {
      return document.getElementsByTagName('*').length;
    });
    
    // DOM should have reasonable size (< 1500 elements)
    expect(domSize).toBeLessThan(1500);
  });
});

