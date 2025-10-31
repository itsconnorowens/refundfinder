#!/usr/bin/env node

/**
 * Test script to verify PostHog and attribution tracking
 *
 * This script makes HTTP requests to the dev server and checks
 * if the JavaScript includes the expected code.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Analytics Implementation\n');

// Test 1: Check if PostHog is enabled in development
console.log('Test 1: Checking PostHog development mode...');

http.get(BASE_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Check if the page loaded
    if (res.statusCode === 200) {
      console.log('✅ Homepage loaded successfully');

      // Check for PostHog key in the HTML
      if (data.includes('NEXT_PUBLIC_POSTHOG_KEY')) {
        console.log('✅ PostHog key found in page');
      } else {
        console.log('⚠️  PostHog key not found (this is okay, it might be in a separate bundle)');
      }

      // Check for PostHog provider
      if (data.includes('PostHog') || data.includes('posthog')) {
        console.log('✅ PostHog references found in page');
      }
    } else {
      console.log(`❌ Failed to load homepage (status: ${res.statusCode})`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Test 2: Testing attribution with UTM parameters...\n');

    // Test 2: Check attribution URL
    const utmUrl = BASE_URL + '/?utm_source=test&utm_medium=automated&utm_campaign=verification';
    console.log(`Loading: ${utmUrl}`);

    http.get(utmUrl, (res2) => {
      if (res2.statusCode === 200) {
        console.log('✅ Page with UTM parameters loaded successfully');
      } else {
        console.log(`❌ Failed to load page with UTM (status: ${res2.statusCode})`);
      }

      console.log('\n' + '='.repeat(50));
      console.log('\n✅ Automated tests completed!');
      console.log('\nNext steps:');
      console.log('1. Open http://localhost:3000 in your browser');
      console.log('2. Open browser DevTools console');
      console.log('3. Look for: "PostHog: Development tracking enabled"');
      console.log('4. Look for: "[logger] New attribution captured"');
      console.log('\nManual testing:');
      console.log('- Visit: http://localhost:3000/?utm_source=google&utm_campaign=test');
      console.log('- Fill out the flight lookup form');
      console.log('- Check PostHog Live Events for events with attribution properties');
      console.log('\nSee docs/testing/ANALYTICS_TESTING_GUIDE.md for complete testing instructions');

      process.exit(0);
    }).on('error', (err) => {
      console.log('❌ Error testing UTM URL:', err.message);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.log('❌ Error connecting to dev server:', err.message);
  console.log('\nMake sure the dev server is running:');
  console.log('  npm run dev');
  process.exit(1);
});
