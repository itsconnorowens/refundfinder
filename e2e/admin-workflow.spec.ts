import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up environment variables for testing
    await page.addInitScript(() => {
      process.env.ADMIN_PASSWORD = 'test-admin-password';
      process.env.ADMIN_EMAIL = 'admin@refundfinder.com';
    });
  });

  test.describe('Admin Authentication', () => {
    test('should redirect to login page when not authenticated', async ({
      page,
    }) => {
      await page.goto('/admin/claims');

      // Should redirect to login page
      await expect(page).toHaveURL('/admin/login');
      await expect(page.locator('h1')).toContainText('Admin Login');
    });

    test('should login successfully with correct password', async ({
      page,
    }) => {
      await page.goto('/admin/login');

      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Should redirect to claims dashboard
      await expect(page).toHaveURL('/admin/claims');
      await expect(page.locator('h1')).toContainText('Claims Dashboard');
    });

    test('should show error with incorrect password', async ({ page }) => {
      await page.goto('/admin/login');

      await page.fill('input[name="password"]', 'wrong-password');
      await page.click('button[type="submit"]');

      // Should stay on login page and show error
      await expect(page).toHaveURL('/admin/login');
      await expect(page.locator('.error')).toContainText('Invalid password');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/admin/claims');

      // Logout
      await page.click('button[data-testid="logout-button"]');

      // Should redirect to login page
      await expect(page).toHaveURL('/admin/login');
    });
  });

  test.describe('Claims Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/admin/claims');
    });

    test('should display claims dashboard with statistics', async ({
      page,
    }) => {
      await expect(page.locator('h1')).toContainText('Claims Dashboard');

      // Check for statistics cards
      await expect(page.locator('[data-testid="total-claims"]')).toBeVisible();
      await expect(page.locator('[data-testid="ready-to-file"]')).toBeVisible();
      await expect(page.locator('[data-testid="filed-claims"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="approved-claims"]')
      ).toBeVisible();
    });

    test('should filter claims by status', async ({ page }) => {
      // Test status filter dropdown
      await page.selectOption('select[name="status"]', 'ready_to_file');

      // Should show filtered results
      await expect(page.locator('[data-testid="claims-list"]')).toBeVisible();

      // All visible claims should have ready_to_file status
      const claimCards = page.locator('[data-testid="claim-card"]');
      const count = await claimCards.count();

      for (let i = 0; i < count; i++) {
        await expect(
          claimCards.nth(i).locator('[data-testid="claim-status"]')
        ).toContainText('Ready to File');
      }
    });

    test('should filter claims by airline', async ({ page }) => {
      // Test airline filter
      await page.fill('input[name="airline"]', 'British Airways');

      // Should show filtered results
      await expect(page.locator('[data-testid="claims-list"]')).toBeVisible();

      // All visible claims should be British Airways
      const claimCards = page.locator('[data-testid="claim-card"]');
      const count = await claimCards.count();

      for (let i = 0; i < count; i++) {
        await expect(
          claimCards.nth(i).locator('[data-testid="claim-airline"]')
        ).toContainText('British Airways');
      }
    });

    test('should search claims by claim ID', async ({ page }) => {
      // Test search functionality
      await page.fill('input[name="search"]', 'CLM001');

      // Should show filtered results
      await expect(page.locator('[data-testid="claims-list"]')).toBeVisible();

      // All visible claims should contain CLM001
      const claimCards = page.locator('[data-testid="claim-card"]');
      const count = await claimCards.count();

      for (let i = 0; i < count; i++) {
        await expect(
          claimCards.nth(i).locator('[data-testid="claim-id"]')
        ).toContainText('CLM001');
      }
    });

    test('should paginate through claims', async ({ page }) => {
      // Check if pagination controls are visible
      const pagination = page.locator('[data-testid="pagination"]');

      if (await pagination.isVisible()) {
        // Test next page
        await page.click('[data-testid="next-page"]');
        await expect(
          page.locator('[data-testid="current-page"]')
        ).toContainText('2');

        // Test previous page
        await page.click('[data-testid="prev-page"]');
        await expect(
          page.locator('[data-testid="current-page"]')
        ).toContainText('1');
      }
    });

    test('should display claim cards with correct information', async ({
      page,
    }) => {
      const claimCard = page.locator('[data-testid="claim-card"]').first();

      if (await claimCard.isVisible()) {
        // Check that all required information is displayed
        await expect(
          claimCard.locator('[data-testid="claim-id"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="passenger-name"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="flight-number"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="airline"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="departure-date"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="claim-status"]')
        ).toBeVisible();
        await expect(
          claimCard.locator('[data-testid="claim-amount"]')
        ).toBeVisible();
      }
    });
  });

  test.describe('Individual Claim Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to a specific claim
      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Navigate to a specific claim (assuming CLM001 exists)
      await page.goto('/admin/claims/CLM001');
    });

    test('should display claim details page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Claim Details');

      // Check for claim information sections
      await expect(
        page.locator('[data-testid="passenger-info"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="flight-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="delay-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-info"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="documents-section"]')
      ).toBeVisible();
    });

    test('should validate claim for filing', async ({ page }) => {
      await page.click('[data-testid="validate-claim-button"]');

      // Should show validation results
      await expect(
        page.locator('[data-testid="validation-results"]')
      ).toBeVisible();

      // Check for validation status
      const validationStatus = page.locator(
        '[data-testid="validation-status"]'
      );
      await expect(validationStatus).toBeVisible();
    });

    test('should generate airline submission', async ({ page }) => {
      await page.click('[data-testid="generate-submission-button"]');

      // Should show generated submission
      await expect(
        page.locator('[data-testid="generated-submission"]')
      ).toBeVisible();

      // Check for submission type and content
      await expect(
        page.locator('[data-testid="submission-type"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="submission-content"]')
      ).toBeVisible();
    });

    test('should update claim status', async ({ page }) => {
      // Open status update modal
      await page.click('[data-testid="update-status-button"]');

      // Select new status
      await page.selectOption('select[name="status"]', 'filed');

      // Add notes
      await page.fill('textarea[name="notes"]', 'Claim filed with airline');

      // Submit update
      await page.click('[data-testid="submit-status-update"]');

      // Should show success message
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Status updated successfully');
    });

    test('should mark claim as filed', async ({ page }) => {
      // Open file claim modal
      await page.click('[data-testid="file-claim-button"]');

      // Fill in filing details
      await page.fill('input[name="airlineReference"]', 'BA-REF-123');
      await page.fill('input[name="filedBy"]', 'admin@refundfinder.com');
      await page.selectOption('select[name="filingMethod"]', 'web_form');

      // Submit filing
      await page.click('[data-testid="submit-filing"]');

      // Should show success message
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Claim marked as filed');
    });

    test('should schedule follow-up', async ({ page }) => {
      // Open follow-up modal
      await page.click('[data-testid="schedule-follow-up-button"]');

      // Set follow-up date
      await page.fill('input[name="followUpDate"]', '2024-02-15');

      // Submit follow-up
      await page.click('[data-testid="submit-follow-up"]');

      // Should show success message
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Follow-up scheduled');
    });

    test('should display document attachments', async ({ page }) => {
      const documentsSection = page.locator(
        '[data-testid="documents-section"]'
      );

      if (await documentsSection.isVisible()) {
        // Check for document links
        await expect(
          documentsSection.locator('[data-testid="boarding-pass-link"]')
        ).toBeVisible();
        await expect(
          documentsSection.locator('[data-testid="delay-proof-link"]')
        ).toBeVisible();

        // Test document download
        await documentsSection
          .locator('[data-testid="boarding-pass-link"]')
          .click();
        // Note: In a real test, you'd verify the download started
      }
    });

    test('should show status history timeline', async ({ page }) => {
      const timeline = page.locator('[data-testid="status-timeline"]');

      if (await timeline.isVisible()) {
        // Check for timeline entries
        await expect(
          timeline.locator('[data-testid="timeline-entry"]')
        ).toBeVisible();

        // Check for status changes
        const entries = timeline.locator('[data-testid="timeline-entry"]');
        const count = await entries.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Airline Configuration Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Navigate to airlines page
      await page.goto('/admin/airlines');
    });

    test('should display airline configurations', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Airline Configurations');

      // Check for airline cards
      await expect(page.locator('[data-testid="airline-card"]')).toBeVisible();

      // Check for airline information
      const airlineCards = page.locator('[data-testid="airline-card"]');
      const count = await airlineCards.count();
      expect(count).toBeGreaterThan(0);

      // Check first airline card
      const firstCard = airlineCards.first();
      await expect(
        firstCard.locator('[data-testid="airline-name"]')
      ).toBeVisible();
      await expect(
        firstCard.locator('[data-testid="airline-code"]')
      ).toBeVisible();
      await expect(
        firstCard.locator('[data-testid="submission-method"]')
      ).toBeVisible();
    });

    test('should filter airlines by submission method', async ({ page }) => {
      // Filter by email submission method
      await page.selectOption('select[name="submissionMethod"]', 'email');

      // All visible airlines should use email submission
      const airlineCards = page.locator('[data-testid="airline-card"]');
      const count = await airlineCards.count();

      for (let i = 0; i < count; i++) {
        await expect(
          airlineCards.nth(i).locator('[data-testid="submission-method"]')
        ).toContainText('Email');
      }
    });

    test('should view airline details', async ({ page }) => {
      // Click on first airline card
      await page.locator('[data-testid="airline-card"]').first().click();

      // Should navigate to airline details
      await expect(
        page.locator('[data-testid="airline-details"]')
      ).toBeVisible();

      // Check for detailed information
      await expect(page.locator('[data-testid="airline-name"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="submission-method"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="required-documents"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="required-fields"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="expected-response-time"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="follow-up-schedule"]')
      ).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/admin/claims**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Error loading claims'
      );
    });

    test('should handle network errors', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/claims**', (route) => {
        route.abort();
      });

      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Failed to load claims'
      );
    });

    test('should handle invalid claim ID', async ({ page }) => {
      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Navigate to non-existent claim
      await page.goto('/admin/claims/NONEXISTENT');

      // Should show 404 error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Claim not found'
      );
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Should still work on mobile
      await expect(page.locator('h1')).toContainText('Claims Dashboard');

      // Check that mobile navigation works
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/login');
      await page.fill('input[name="password"]', 'test-admin-password');
      await page.click('button[type="submit"]');

      // Should work on tablet
      await expect(page.locator('h1')).toContainText('Claims Dashboard');
    });
  });
});
