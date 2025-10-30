import { NextRequest, NextResponse } from 'next/server';
import { processEmailWebhook } from '@/lib/monitoring-service';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';

/**
 * POST /api/webhooks/email
 * Webhook endpoint for email providers (SendGrid, Resend, etc.)
 */
export const POST = withErrorTracking(async (request: NextRequest) => {
  const body = await request.json();
  const provider = request.headers.get('x-provider') as 'sendgrid' | 'resend';

  if (!provider) {
    return NextResponse.json(
      { error: 'Email provider not specified' },
      { status: 400 }
    );
  }

  addBreadcrumb('Processing email webhook', 'webhook', { provider });

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
}, { route: '/api/webhooks/email', tags: { service: 'webhook', operation: 'email_processing' } });

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
