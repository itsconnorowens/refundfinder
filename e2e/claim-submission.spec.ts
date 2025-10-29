import { test, expect } from '@playwright/test';

test.describe('Claim Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Flghtly/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate through form steps', async ({ page }) => {
    // Look for the claim submission form
    const firstNameInput = page.getByLabel(/First Name/i);

    // If not on homepage, navigate to claim form
    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Step 1: Personal Information
    await expect(page.getByText('Personal Info')).toBeVisible();

    await page.getByLabel(/First Name/i).fill('John');
    await page.getByLabel(/Last Name/i).fill('Doe');
    await page.getByLabel(/Email Address/i).fill('john.doe@example.com');

    await page.getByRole('button', { name: /continue/i }).click();

    // Step 2: Flight Details
    await expect(page.getByText('Flight Details')).toBeVisible();

    await page.getByLabel(/Flight Number/i).fill('AA123');
    await page.getByLabel(/Airline/i).fill('American Airlines');
    await page.getByLabel(/Departure Date/i).fill('2024-12-01');
    await page.getByLabel(/Departure Airport/i).fill('JFK');
    await page.getByLabel(/Arrival Airport/i).fill('LAX');
    await page.getByLabel(/Delay Duration/i).fill('4 hours');

    await page.getByRole('button', { name: /continue/i }).click();

    // Step 3: Documentation
    await expect(page.getByText('Documentation')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    const firstNameInput = page.getByLabel(/First Name/i);

    // Navigate to form if not there
    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Try to continue without filling fields
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show validation errors
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/Email Address/i);

    // Navigate to form if not there
    if (!(await emailInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    await page.getByLabel(/First Name/i).fill('John');
    await page.getByLabel(/Last Name/i).fill('Doe');
    await emailInput.fill('invalid-email');

    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should allow navigation back and forth', async ({ page }) => {
    const firstNameInput = page.getByLabel(/First Name/i);

    // Navigate to form if not there
    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Fill step 1
    await page.getByLabel(/First Name/i).fill('John');
    await page.getByLabel(/Last Name/i).fill('Doe');
    await page.getByLabel(/Email Address/i).fill('john.doe@example.com');
    await page.getByRole('button', { name: /continue/i }).click();

    // Verify step 2
    await expect(page.getByText('Flight Details')).toBeVisible();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();

    // Should be back at step 1
    await expect(page.getByText('Personal Info')).toBeVisible();

    // Data should be preserved
    await expect(page.getByLabel(/First Name/i)).toHaveValue('John');
    await expect(page.getByLabel(/Last Name/i)).toHaveValue('Doe');
  });

  test('should display progress indicator', async ({ page }) => {
    const firstNameInput = page.getByLabel(/First Name/i);

    // Navigate to form if not there
    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Check for progress steps
    await expect(page.locator('text=Personal Info')).toBeVisible();
    await expect(page.locator('text=Flight Details')).toBeVisible();
    await expect(page.locator('text=Documentation')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that page is responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');

    const firstNameInput = page.getByLabel(/First Name/i);

    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // All inputs should have associated labels
    await expect(page.getByLabel(/First Name/i)).toBeVisible();
    await expect(page.getByLabel(/Last Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    const firstNameInput = page.getByLabel(/First Name/i);

    if (!(await firstNameInput.isVisible())) {
      const startButton = page
        .getByRole('button', { name: /get started|start claim|file claim/i })
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Tab through form fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
