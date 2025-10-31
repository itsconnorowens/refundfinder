import { NextResponse } from 'next/server';
import { runParseTests, testCustomEmail } from '@/lib/test-parse-email';
import { isAnthropicConfigured } from '@/lib/parse-flight-email';
import { logger } from '@/lib/logger';

/**
 * GET /api/test-parse
 *
 * Test the Claude flight email parser with sample emails
 */
export async function GET() {
  try {
    // Check if API is configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Claude API is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
        },
        { status: 503 }
      );
    }

    // Run tests
    const results = await runParseTests();

    // Calculate summary
    const successCount = Object.values(results).filter(
      (r: any) => r.success
    ).length;
    const totalCount = Object.keys(results).length;
    const avgDuration =
      Object.values(results).reduce((sum, r: any) => sum + r.duration, 0) /
      totalCount;

    return NextResponse.json({
      success: true,
      summary: {
        successCount,
        totalCount,
        successRate: Math.round((successCount / totalCount) * 100),
        avgDuration: Math.round(avgDuration),
      },
      results,
    });
  } catch (error) {
    logger.error('Error running parse tests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while running tests',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-parse
 *
 * Test the Claude flight email parser with a custom email
 *
 * Request body:
 * {
 *   "emailText": "Your custom email content..."
 * }
 */
export async function POST(request: Request) {
  try {
    // Check if API is configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Claude API is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { emailText } = body;

    // Validate input
    if (!emailText || typeof emailText !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email text is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Test with custom email
    const startTime = Date.now();
    const result = await testCustomEmail(emailText);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: !!result,
      data: result,
      duration,
      message: result
        ? 'Successfully parsed flight details'
        : 'Could not parse flight details from the provided email',
    });
  } catch (error) {
    logger.error('Error testing custom email:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while testing the email',
      },
      { status: 500 }
    );
  }
}
