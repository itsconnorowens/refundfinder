/**
 * Test script to verify BetterStack logging integration
 * Run with: npx tsx scripts/test-betterstack.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { logger } from '../src/lib/logger';

console.log('🧪 Testing BetterStack Logging Integration\n');

console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- BetterStack token configured:', !!process.env.BETTERSTACK_SOURCE_TOKEN);
console.log('- Token (first 10 chars):', process.env.BETTERSTACK_SOURCE_TOKEN?.substring(0, 10) + '...\n');

// Test different log levels
console.log('📝 Sending test logs...\n');

logger.info('BetterStack test - INFO level', {
  testType: 'integration_test',
  timestamp: new Date().toISOString(),
  route: '/test',
  operation: 'betterstack_verification',
});

logger.warn('BetterStack test - WARNING level', {
  testType: 'integration_test',
  message: 'This is a test warning',
  route: '/test',
});

logger.error('BetterStack test - ERROR level (this is just a test)', new Error('Test error - ignore this'), {
  testType: 'integration_test',
  route: '/test',
  operation: 'error_test',
});

// Test with request context
logger.info('BetterStack test - With request context', {
  requestId: 'test-' + Math.random().toString(36).substring(7),
  route: '/api/test',
  method: 'POST',
  userAgent: 'BetterStack Test Script',
  operation: 'test_request',
  testData: {
    foo: 'bar',
    baz: 123,
  },
});

console.log('✅ Test logs sent!\n');
console.log('⏱️  Wait 30-60 seconds for logs to appear in BetterStack dashboard\n');
console.log('📊 Check your BetterStack dashboard at: https://logs.betterstack.com\n');
console.log('🔍 Search for: testType:integration_test\n');
console.log('Note: In development mode, logs are only sent to console.');
console.log('To test BetterStack properly, set NODE_ENV=production when running this script:\n');
console.log('   NODE_ENV=production npx tsx scripts/test-betterstack.ts\n');
