import { NextRequest, NextResponse } from 'next/server';
import { processEmailWebhook } from '@/lib/monitoring-service';

/**
 * POST /api/webhooks/email
 * Webhook endpoint for email providers (SendGrid, Resend, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-provider') as 'sendgrid' | 'resend';

    if (!provider) {
      return NextResponse.json(
        { error: 'Email provider not specified' },
        { status: 400 }
      );
    }

    // Process the webhook
    const success = await processEmailWebhook(provider, body);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/email
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
  });
}
