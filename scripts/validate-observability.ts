#!/usr/bin/env tsx

/**
 * Observability Stack Validation Script
 *
 * This script validates that all observability services (Sentry, PostHog, BetterStack)
 * are properly integrated and working correctly.
 *
 * Usage:
 *   npx tsx scripts/validate-observability.ts
 */

import * as Sentry from '@sentry/nextjs';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  service: string;
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: ValidationResult[] = [];

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(service: string, check: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ service, check, status, message });

  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

  log(color, `  ${icon} ${check}: ${message}`);
}

async function validateEnvironmentVariables() {
  log('cyan', '\n🔍 Checking Environment Variables...\n');

  // Sentry
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    addResult('Sentry', 'DSN Configuration', 'pass', 'NEXT_PUBLIC_SENTRY_DSN is set');
  } else {
    addResult('Sentry', 'DSN Configuration', 'fail', 'NEXT_PUBLIC_SENTRY_DSN is missing');
  }

  // PostHog
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey) {
    addResult('PostHog', 'API Key', 'pass', 'NEXT_PUBLIC_POSTHOG_KEY is set');
  } else {
    addResult('PostHog', 'API Key', 'fail', 'NEXT_PUBLIC_POSTHOG_KEY is missing');
  }

  if (posthogHost) {
    addResult('PostHog', 'Host Configuration', 'pass', `NEXT_PUBLIC_POSTHOG_HOST is set to ${posthogHost}`);
  } else {
    addResult('PostHog', 'Host Configuration', 'fail', 'NEXT_PUBLIC_POSTHOG_HOST is missing');
  }

  // BetterStack
  const betterstackToken = process.env.BETTERSTACK_SOURCE_TOKEN;
  if (betterstackToken) {
    addResult('BetterStack', 'Source Token', 'pass', 'BETTERSTACK_SOURCE_TOKEN is set');
  } else {
    addResult('BetterStack', 'Source Token', 'warn', 'BETTERSTACK_SOURCE_TOKEN is missing (optional in development)');
  }
}

async function validateSentryIntegration() {
  log('cyan', '\n🔍 Validating Sentry Integration...\n');

  try {
    // Check if Sentry is initialized
    const client = Sentry.getClient();

    if (client) {
      addResult('Sentry', 'Client Initialization', 'pass', 'Sentry client is initialized');

      // Check DSN
      const options = client.getOptions();
      if (options.dsn) {
        addResult('Sentry', 'DSN Loaded', 'pass', 'Sentry DSN is loaded');
      } else {
        addResult('Sentry', 'DSN Loaded', 'fail', 'Sentry DSN not loaded');
      }

      // Check environment
      if (options.environment) {
        addResult('Sentry', 'Environment', 'pass', `Environment: ${options.environment}`);
      } else {
        addResult('Sentry', 'Environment', 'warn', 'Environment not configured');
      }
    } else {
      addResult('Sentry', 'Client Initialization', 'fail', 'Sentry client not initialized');
    }

    // Test error capture
    try {
      Sentry.captureMessage('Observability validation test message', 'info');
      addResult('Sentry', 'Message Capture', 'pass', 'Test message sent successfully');
    } catch (error) {
      addResult('Sentry', 'Message Capture', 'fail', `Failed to send message: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  } catch (error) {
    addResult('Sentry', 'Integration Check', 'fail', `Error checking Sentry: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function validatePostHogIntegration() {
  log('cyan', '\n🔍 Validating PostHog Integration...\n');

  try {
    // Dynamic import to avoid server-side issues
    const { PostHog } = await import('posthog-node');

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || !posthogHost) {
      addResult('PostHog', 'Configuration', 'fail', 'PostHog not configured');
      return;
    }

    // Initialize PostHog client for testing
    const posthog = new PostHog(posthogKey, {
      host: posthogHost,
    });

    addResult('PostHog', 'Client Creation', 'pass', 'PostHog client created successfully');

    // Test event capture
    try {
      posthog.capture({
        distinctId: 'validation-script',
        event: 'observability_validation_test',
        properties: {
          timestamp: new Date().toISOString(),
          source: 'validation-script',
        },
      });

      await posthog.shutdown();

      addResult('PostHog', 'Event Capture', 'pass', 'Test event sent successfully');
    } catch (error) {
      addResult('PostHog', 'Event Capture', 'fail', `Failed to send event: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  } catch (error) {
    addResult('PostHog', 'Integration Check', 'fail', `Error checking PostHog: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function validateFileStructure() {
  log('cyan', '\n🔍 Validating File Structure...\n');

  const fs = await import('fs');
  const path = await import('path');

  // Check for key files
  const filesToCheck = [
    { path: 'src/lib/error-tracking.ts', name: 'Error Tracking Library' },
    { path: 'src/lib/logger.ts', name: 'Logger Library' },
    { path: 'src/lib/posthog.ts', name: 'PostHog Server Library' },
    { path: 'src/lib/betterstack-client.ts', name: 'BetterStack Client' },
    { path: 'src/components/ErrorBoundary.tsx', name: 'Error Boundary Component' },
    { path: 'src/components/PostHogProvider.tsx', name: 'PostHog Provider' },
    { path: 'sentry.client.config.ts', name: 'Sentry Client Config' },
    { path: 'sentry.server.config.ts', name: 'Sentry Server Config' },
  ];

  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      addResult('File Structure', file.name, 'pass', `Found at ${file.path}`);
    } else {
      addResult('File Structure', file.name, 'fail', `Missing: ${file.path}`);
    }
  }
}

async function validateAPIRoutes() {
  log('cyan', '\n🔍 Checking API Routes with Error Tracking...\n');

  const fs = await import('fs');
  const path = await import('path');

  const apiDir = path.join(process.cwd(), 'src/app/api');

  if (!fs.existsSync(apiDir)) {
    addResult('API Routes', 'Directory Check', 'fail', 'API directory not found');
    return;
  }

  // Recursively find all route.ts files
  function findRouteFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }

    return files;
  }

  const routeFiles = findRouteFiles(apiDir);
  let routesWithErrorTracking = 0;
  let totalRoutes = 0;

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    totalRoutes++;

    if (content.includes('withErrorTracking')) {
      routesWithErrorTracking++;
    }
  }

  const percentage = Math.round((routesWithErrorTracking / totalRoutes) * 100);

  if (percentage >= 80) {
    addResult('API Routes', 'Error Tracking Coverage', 'pass', `${routesWithErrorTracking}/${totalRoutes} routes (${percentage}%) use withErrorTracking`);
  } else if (percentage >= 50) {
    addResult('API Routes', 'Error Tracking Coverage', 'warn', `${routesWithErrorTracking}/${totalRoutes} routes (${percentage}%) use withErrorTracking`);
  } else {
    addResult('API Routes', 'Error Tracking Coverage', 'fail', `Only ${routesWithErrorTracking}/${totalRoutes} routes (${percentage}%) use withErrorTracking`);
  }
}

function printSummary() {
  log('cyan', '\n📊 Validation Summary\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;
  const total = results.length;

  log('green', `✓ Passed: ${passed}/${total}`);
  if (warnings > 0) log('yellow', `⚠ Warnings: ${warnings}/${total}`);
  if (failed > 0) log('red', `✗ Failed: ${failed}/${total}`);

  console.log('\n');

  // Group results by service
  const services = [...new Set(results.map((r) => r.service))];

  for (const service of services) {
    const serviceResults = results.filter((r) => r.service === service);
    const servicePassed = serviceResults.filter((r) => r.status === 'pass').length;
    const serviceFailed = serviceResults.filter((r) => r.status === 'fail').length;

    const status =
      serviceFailed === 0
        ? servicePassed === serviceResults.length
          ? '✓ Healthy'
          : '⚠ Degraded'
        : '✗ Issues';

    const color = serviceFailed === 0 ? (servicePassed === serviceResults.length ? 'green' : 'yellow') : 'red';

    log(color, `${service}: ${status} (${servicePassed}/${serviceResults.length} checks passed)`);
  }

  console.log('\n');

  // Recommendations
  if (failed > 0) {
    log('yellow', '💡 Recommendations:\n');

    const failedChecks = results.filter((r) => r.status === 'fail');
    const recommendations = new Set<string>();

    for (const check of failedChecks) {
      if (check.service === 'Sentry' && check.check.includes('DSN')) {
        recommendations.add('• Set NEXT_PUBLIC_SENTRY_DSN in your .env.local file');
      }
      if (check.service === 'PostHog' && check.check.includes('API Key')) {
        recommendations.add('• Set NEXT_PUBLIC_POSTHOG_KEY in your .env.local file');
      }
      if (check.service === 'PostHog' && check.check.includes('Host')) {
        recommendations.add('• Set NEXT_PUBLIC_POSTHOG_HOST in your .env.local file');
      }
      if (check.service === 'BetterStack') {
        recommendations.add('• Set BETTERSTACK_SOURCE_TOKEN for production logging');
      }
    }

    recommendations.forEach((rec) => log('yellow', rec));
    console.log('\n');
  }

  // Exit code based on results
  process.exit(failed > 0 ? 1 : 0);
}

async function main() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '   Observability Stack Validation');
  log('blue', '═══════════════════════════════════════════════════════════\n');

  await validateEnvironmentVariables();
  await validateFileStructure();
  await validateSentryIntegration();
  await validatePostHogIntegration();
  await validateAPIRoutes();

  printSummary();
}

main().catch((error) => {
  log('red', `\n✗ Validation script failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  process.exit(1);
});
