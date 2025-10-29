import { NextRequest, NextResponse } from 'next/server';
import { captureError, captureMessage } from '@/lib/error-tracking';

/**
 * Test endpoint for Sentry integration
 * Visit: http://localhost:3000/api/test-sentry
 */
export async function GET(request: NextRequest) {
  try {
    // Test capturing a message
    captureMessage('Sentry test message - monitoring system is working!', {
      level: 'info',
      tags: {
        test: 'true',
        endpoint: 'test-sentry',
      },
    });

    // Uncomment to test error capturing
    // throw new Error('Test error for Sentry');

    return NextResponse.json({
      success: true,
      message: 'Sentry test message sent! Check your Sentry dashboard.',
      instructions: [
        '1. Go to https://sentry.io/organizations/con-codes/projects/flghtly/',
        '2. Check the Issues tab for the test message',
        '3. Uncomment the throw error line to test error tracking',
      ],
    });
  } catch (error) {
    captureError(error, {
      level: 'error',
      tags: {
        test: 'true',
        endpoint: 'test-sentry',
      },
    });

    return NextResponse.json(
      {
        error: 'Test error captured and sent to Sentry',
        message: 'Check your Sentry dashboard for this error',
      },
      { status: 500 }
    );
  }
}
