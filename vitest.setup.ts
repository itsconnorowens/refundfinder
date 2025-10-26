import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.AIRTABLE_API_KEY = 'test_airtable_key';
  process.env.AIRTABLE_BASE_ID = 'test_base_id';
  process.env.ANTHROPIC_API_KEY = 'test_anthropic_key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
});

afterEach(() => {
  // Cleanup after each test
});

afterAll(() => {
  // Final cleanup
});

