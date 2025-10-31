/**
 * End-to-End Tests for Flight Eligibility Form
 * Uses Playwright for real browser testing
 *
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Flight Eligibility Form - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Delay Claims', () => {
    test('should complete delay claim and show results', async ({ page }) => {
      // Step 1: Select delay
      await page.click('text=Flight Delayed');

      // Step 2: Fill departure date
      await page.fill('input[name="departureDate"]', '2024-01-15');

      // Step 3: Fill flight details
      await page.fill('input[name="flightNumber"]', 'BA123');
      await page.fill('input[name="airline"]', 'British Airways');
      await page.fill('input[placeholder*="Departure"]', 'LHR');
      await page.fill('input[placeholder*="Arrival"]', 'JFK');

      // Step 4: Check visual route grouping
      await expect(page.locator('text=✈️')).toBeVisible();

      // Step 5: Fill delay duration
      const hoursInput = page.locator('input').filter({ hasText: /hours/ }).first();
      const minutesInput = page.locator('input').filter({ hasText: /minutes/ }).first();
      await hoursInput.fill('4');
      await minutesInput.fill('30');

      // Step 6: Fill personal information
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="passengerEmail"]', 'john@example.com');

      // Step 7: Submit form
      await page.click('button:has-text("Check My Compensation")');

      // Step 8: Wait for results
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/check-eligibility') && resp.status() === 200
      );

      // Verify results page or callback
      await expect(page.locator('text=€600, text=$600')).toBeVisible({ timeout: 10000 });
    });

    test('should validate flight number format', async ({ page }) => {
      await page.click('text=Flight Delayed');

      // Enter invalid flight number
      await page.fill('input[name="flightNumber"]', '123');
      await page.blur('input[name="flightNumber"]');

      // Check for error message
      await expect(page.locator('text=Invalid flight number format')).toBeVisible();

      // Correct the error
      await page.fill('input[name="flightNumber"]', 'BA123');

      // Error should disappear
      await expect(page.locator('text=Invalid flight number format')).not.toBeVisible();
    });
  });

  test.describe('Cancellation Claims', () => {
    test('should auto-calculate notice period', async ({ page }) => {
      await page.click('text=Flight Cancelled');

      // Fill departure date
      await page.fill('input[name="departureDate"]', '2024-01-15');

      // Fill notification date (5 days before)
      await page.fill('input[name="notificationDate"]', '2024-01-10');

      // Wait for auto-calculation to appear
      await expect(page.locator('text=✓ Calculated: Less than 7 days notice')).toBeVisible();
      await expect(page.locator('text=5 days before departure')).toBeVisible();
    });

    test('should allow editing auto-calculated notice period', async ({ page }) => {
      await page.click('text=Flight Cancelled');

      await page.fill('input[name="departureDate"]', '2024-01-15');
      await page.fill('input[name="notificationDate"]', '2024-01-10');

      // Wait for auto-calculation
      await page.waitForSelector('text=✓ Calculated');

      // Click Edit button
      await page.click('button:has-text("Edit")');

      // Dropdown should appear
      await expect(page.locator('select[name="manualNoticeGiven"], select#manualNoticeGiven')).toBeVisible();

      // Change value
      await page.selectOption('select', '7-14 days');

      // Verify change
      const selectedValue = await page.locator('select').inputValue();
      expect(selectedValue).toBe('7-14 days');
    });

    test('should handle alternative flight with structured timing', async ({ page }) => {
      await page.click('text=Flight Cancelled');

      // Fill basic fields
      await page.fill('input[name="departureDate"]', '2024-01-15');
      await page.fill('input[name="flightNumber"]', 'BA123');
      await page.fill('input[name="airline"]', 'British Airways');
      await page.fill('input[placeholder*="Departure"]', 'LHR');
      await page.fill('input[placeholder*="Arrival"]', 'JFK');
      await page.fill('input[name="notificationDate"]', '2024-01-10');

      // Check alternative offered
      await page.check('text=Airline offered an alternative flight');

      // Alternative timing fields should appear
      await expect(page.locator('text=How much later did the alternative depart')).toBeVisible();

      // Fill structured timing
      const inputs = page.locator('input[type="number"]');
      await inputs.nth(0).fill('3');  // Departure hours
      await inputs.nth(1).fill('25'); // Departure minutes
      await inputs.nth(2).fill('2');  // Arrival hours
      await inputs.nth(3).fill('15'); // Arrival minutes

      // Check for calculated summary
      await expect(page.locator('text=✓ Calculated: Alternative departed')).toBeVisible();
      await expect(page.locator('text=3h 25m')).toBeVisible();
    });

    test('should support next day checkbox for alternative flight', async ({ page }) => {
      await page.click('text=Flight Cancelled');

      await page.fill('input[name="departureDate"]', '2024-01-15');
      await page.fill('input[name="notificationDate"]', '2024-01-10');
      await page.check('text=Airline offered an alternative flight');

      await page.waitForSelector('text=How much later did the alternative depart');

      // Check next day checkbox
      await page.check('text=Next day (+24h)');

      // Fill small hours value
      const inputs = page.locator('input[type="number"]');
      await inputs.nth(0).fill('2');

      // Summary should show "1 day(s)"
      await expect(page.locator('text=1 day(s)')).toBeVisible();
    });
  });

  test.describe('Denied Boarding Claims', () => {
    test('should show structured alternative delay tiers', async ({ page }) => {
      await page.click('text=Denied Boarding');

      // Check alternative offered
      await page.check('text=Airline offered an alternative flight');

      // Radio button options should appear
      await expect(page.locator('text=Within 1 hour')).toBeVisible();
      await expect(page.locator('text=1-2 hours (domestic) or 1-4 hours (international)')).toBeVisible();
      await expect(page.locator('text=2-4 hours')).toBeVisible();

      // Check compensation amounts are shown
      await expect(page.locator('text=$775')).toBeVisible();
      await expect(page.locator('text=$1,550')).toBeVisible();
    });

    test('should handle round-trip ticket price', async ({ page }) => {
      await page.click('text=Denied Boarding');

      // Fill ticket price
      await page.fill('input[name="ticketPrice"]', '900');

      // Check round-trip checkbox
      await page.check('text=This was a round-trip ticket');

      // Helper text should be visible
      await expect(page.locator('text=we\'ll calculate one-way equivalent')).toBeVisible();

      // Dollar sign should be visible
      await expect(page.locator('text=$').first()).toBeVisible();
    });

    test('should complete denied boarding claim successfully', async ({ page }) => {
      await page.click('text=Denied Boarding');

      // Fill all required fields
      await page.fill('input[name="departureDate"]', '2024-01-15');
      await page.fill('input[name="flightNumber"]', 'AA456');
      await page.fill('input[name="airline"]', 'American Airlines');
      await page.fill('input[placeholder*="Departure"]', 'JFK');
      await page.fill('input[placeholder*="Arrival"]', 'LAX');

      // Select involuntary
      await page.check('text=Involuntary');

      // Select reason
      await page.selectOption('select', 'overbooking');

      // Check alternative offered
      await page.check('text=Airline offered an alternative flight');

      // Select tier
      await page.check('text=1-2 hours');

      // Fill check-in time
      await page.fill('input[name="checkInTime"]', '10:30');

      // Fill ticket price
      await page.fill('input[name="ticketPrice"]', '450');

      // Fill personal info
      await page.fill('input[name="firstName"]', 'Bob');
      await page.fill('input[name="lastName"]', 'Johnson');
      await page.fill('input[name="passengerEmail"]', 'bob@example.com');

      // Submit
      await page.click('button:has-text("Check My Compensation")');

      // Wait for API response
      await page.waitForResponse((resp) => resp.url().includes('/api/check-eligibility'));
    });
  });

  test.describe('Downgrade Claims', () => {
    test('should show live compensation preview', async ({ page }) => {
      await page.click('text=Seat Downgrade');

      // Select classes
      await page.selectOption('select[name="classPaidFor"]', 'business');
      await page.selectOption('select[name="classReceived"]', 'economy');

      // Fill ticket price
      await page.fill('input[name="ticketPrice"]', '2500');

      // Live preview should appear
      await expect(page.locator('text=Estimated Refund')).toBeVisible();
      await expect(page.locator('text=$')).toBeVisible();
    });
  });

  test.describe('Collapsible Info Boxes', () => {
    test('should expand and collapse cancellation rights info', async ({ page }) => {
      await page.click('text=Flight Cancelled');

      // Info box should be collapsed
      await expect(page.locator('text=📖 Learn about your cancellation rights')).toBeVisible();
      await expect(page.locator('text=Less than 7 days notice: Usually eligible')).not.toBeVisible();

      // Click to expand
      await page.click('text=📖 Learn about your cancellation rights');

      // Content should be visible
      await expect(page.locator('text=Less than 7 days notice')).toBeVisible();

      // Click to collapse
      await page.click('text=📖 Learn about your cancellation rights');

      // Content should be hidden again
      await expect(page.locator('text=Less than 7 days notice: Usually eligible')).not.toBeVisible();
    });

    test('should expand EU rights info for denied boarding', async ({ page }) => {
      await page.click('text=Denied Boarding');

      // Expand EU rights box
      await page.click('text=🇪🇺 EU Regulation 261/2004');

      // Content should be visible
      await expect(page.locator('text=Up to €600')).toBeVisible();
      await expect(page.locator('text=Distance-based')).toBeVisible();
    });

    test('should expand US rights info for denied boarding', async ({ page }) => {
      await page.click('text=Denied Boarding');

      // Expand US rights box
      await page.click('text=🇺🇸 US DOT');

      // Content should be visible
      await expect(page.locator('text=200% of fare')).toBeVisible();
      await expect(page.locator('text=400% of fare')).toBeVisible();
    });
  });

  test.describe('Email Typo Detection', () => {
    test('should detect and suggest gmail typo', async ({ page }) => {
      await page.click('text=Flight Delayed');

      // Enter typo email
      await page.fill('input[name="passengerEmail"]', 'test@gmial.com');
      await page.blur('input[name="passengerEmail"]');

      // Should show suggestion
      await expect(page.locator('text=gmail.com')).toBeVisible();
    });
  });

  test.describe('Form State Persistence', () => {
    test('should maintain form state when switching disruption types', async ({ page }) => {
      await page.click('text=Flight Delayed');

      // Fill common fields
      await page.fill('input[name="flightNumber"]', 'BA123');
      await page.fill('input[name="airline"]', 'British Airways');

      // Switch to cancellation
      await page.click('text=Flight Cancelled');

      // Common fields should still be filled
      const flightNumber = await page.inputValue('input[name="flightNumber"]');
      const airline = await page.inputValue('input[name="airline"]');

      expect(flightNumber).toBe('BA123');
      expect(airline).toBe('British Airways');
    });
  });

  test.describe('Responsive Design', () => {
    test('should show mobile-appropriate airplane icon', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Mobile should show downward arrow
      await expect(page.locator('text=↓')).toBeVisible();
    });

    test('should show desktop airplane icon', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/');

      // Desktop should show horizontal arrow
      await expect(page.locator('text=✈️ →')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form
      await page.keyboard.press('Tab');  // First disruption type
      await page.keyboard.press('Space'); // Select it

      await page.keyboard.press('Tab');  // Move to next field

      // Form should be keyboard accessible
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'SELECT']).toContain(activeElement);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('text=Flight Delayed');

      // Check for ARIA labels
      const flightNumberLabel = await page.getAttribute('input[name="flightNumber"]', 'aria-label');
      expect(flightNumberLabel).toBeTruthy();
    });
  });
});
