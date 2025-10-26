import { test, expect } from '@playwright/test';

test.describe('Automated Claim Filing System', () => {
  test('Complete automated claim filing workflow', async ({ page }) => {
    // Navigate to claim submission page
    await page.goto('/claim');

    // Step 1: Personal Information
    await page.fill('[data-testid="firstName"]', 'John');
    await page.fill('[data-testid="lastName"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john.doe@example.com');
    await page.fill('[data-testid="phone"]', '+1234567890');

    await page.click('[data-testid="next-step"]');

    // Step 2: Flight Details
    await page.fill('[data-testid="flightNumber"]', 'LH456');
    await page.fill('[data-testid="airline"]', 'Lufthansa');
    await page.fill('[data-testid="departureDate"]', '2024-01-15');
    await page.fill('[data-testid="departureAirport"]', 'FRA');
    await page.fill('[data-testid="arrivalAirport"]', 'JFK');
    await page.fill('[data-testid="delayDuration"]', '4');

    await page.click('[data-testid="next-step"]');

    // Step 3: Documentation
    // Upload boarding pass
    const boardingPassFile = await page.locator('[data-testid="boardingPass"]');
    await boardingPassFile.setInputFiles({
      name: 'boarding-pass.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock boarding pass content'),
    });

    // Upload delay proof
    const delayProofFile = await page.locator('[data-testid="delayProof"]');
    await delayProofFile.setInputFiles({
      name: 'delay-proof.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock delay proof content'),
    });

    await page.click('[data-testid="next-step"]');

    // Step 4: Review
    await expect(page.locator('[data-testid="review-flight"]')).toContainText(
      'LH456'
    );
    await expect(page.locator('[data-testid="review-airline"]')).toContainText(
      'Lufthansa'
    );
    await expect(page.locator('[data-testid="review-delay"]')).toContainText(
      '4 hours'
    );

    await page.click('[data-testid="next-step"]');

    // Step 5: Payment
    await page.click('[data-testid="proceed-to-payment"]');

    // Mock successful payment
    await page.route('**/api/create-payment-intent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          clientSecret: 'pi_test_1234567890',
        }),
      });
    });

    // Mock Stripe payment success
    await page.route('**/api/create-claim', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          claimId: 'CLM_TEST_1234567890',
        }),
      });
    });

    // Complete payment flow
    await page.click('[data-testid="complete-payment"]');

    // Verify success page
    await expect(page).toHaveURL('/success');
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Claim submitted successfully'
    );
  });

  test('Admin dashboard displays automated filing metrics', async ({
    page,
  }) => {
    // Mock admin authentication
    await page.route('**/api/admin/claims/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalClaims: 150,
            claimsByStatus: {
              submitted: 25,
              validated: 20,
              documents_prepared: 15,
              ready_to_file: 10,
              filed: 30,
              airline_acknowledged: 20,
              monitoring: 15,
              airline_responded: 10,
              approved: 5,
            },
            readyToFile: 10,
            overdue: 5,
            needingFollowUp: 8,
          },
        }),
      });
    });

    await page.goto('/admin/claims');

    // Verify dashboard metrics
    await expect(page.locator('[data-testid="total-claims"]')).toContainText(
      '150'
    );
    await expect(page.locator('[data-testid="ready-to-file"]')).toContainText(
      '10'
    );
    await expect(page.locator('[data-testid="overdue"]')).toContainText('5');
    await expect(
      page.locator('[data-testid="needing-followup"]')
    ).toContainText('8');
  });

  test('Automated filing cron job processes ready claims', async ({ page }) => {
    // Mock cron job endpoint
    await page.route('**/api/cron/process-automatic-filing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            processedClaims: 5,
            filedClaims: 3,
            followUpsSent: 2,
            errors: 0,
          },
        }),
      });
    });

    // Trigger cron job
    const response = await page.request.post(
      '/api/cron/process-automatic-filing',
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.processedClaims).toBeGreaterThan(0);
  });

  test('Email tracking webhook updates claim status', async ({ page }) => {
    // Mock email webhook
    await page.route('**/api/webhooks/email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Email event processed',
        }),
      });
    });

    // Simulate email delivery event
    const response = await page.request.post('/api/webhooks/email', {
      data: {
        event: 'delivered',
        messageId: 'msg_test_1234567890',
        claimId: 'CLM_TEST_1234567890',
        timestamp: new Date().toISOString(),
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Monitoring dashboard shows system health', async ({ page }) => {
    // Mock monitoring stats
    await page.route('**/api/monitoring/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            systemHealth: {
              status: 'healthy',
              uptime: '99.9%',
              responseTime: '150ms',
            },
            emailDelivery: {
              sentToday: 45,
              delivered: 42,
              bounced: 2,
              failed: 1,
              deliveryRate: '93.3%',
            },
            slaCompliance: {
              totalClaims: 150,
              withinSLA: 140,
              breached: 10,
              complianceRate: '93.3%',
            },
            activeAlerts: 2,
            recentErrors: 1,
          },
        }),
      });
    });

    await page.goto('/admin/monitoring');

    // Verify monitoring metrics
    await expect(page.locator('[data-testid="system-status"]')).toContainText(
      'healthy'
    );
    await expect(page.locator('[data-testid="delivery-rate"]')).toContainText(
      '93.3%'
    );
    await expect(page.locator('[data-testid="sla-compliance"]')).toContainText(
      '93.3%'
    );
    await expect(page.locator('[data-testid="active-alerts"]')).toContainText(
      '2'
    );
  });
});
