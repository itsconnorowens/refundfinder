import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailQueueStatus,
  retryFailedEmail,
  getFailedEmails,
  emailQueue,
} from '@/lib/email-queue';
import { emailService } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status': {
        const status = getEmailQueueStatus();
        return NextResponse.json({
          success: true,
          data: status,
        });
      }

      case 'failed': {
        const failedEmails = getFailedEmails();
        return NextResponse.json({
          success: true,
          data: failedEmails,
        });
      }

      case 'test': {
        // Test email functionality
        const testResult = await emailService.sendEmail({
          to: 'test@example.com',
          template: {
            subject: 'Test Email',
            html: '<p>This is a test email from Flghtly.</p>',
            text: 'This is a test email from Flghtly.',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Test email sent',
          data: testResult,
        });
      }

      default:
        return NextResponse.json({
          success: true,
          message: 'Email Management API',
          endpoints: {
            'GET /api/email?action=status': 'Get email queue status',
            'GET /api/email?action=failed': 'Get failed emails',
            'GET /api/email?action=test': 'Send test email',
            'POST /api/email/retry': 'Retry failed email',
            'POST /api/email/clear': 'Clear sent emails',
          },
        });
    }
  } catch (error: unknown) {
    logger.error('Error in email management API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  route: '/api/email',
  tags: { service: 'email', operation: 'email_management' }
});

export const POST = withErrorTracking(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action, emailId } = body;

    switch (action) {
      case 'retry': {
        if (!emailId) {
          return NextResponse.json(
            { error: 'Email ID is required' },
            { status: 400 }
          );
        }

        const retryResult = retryFailedEmail(emailId);
        if (retryResult) {
          return NextResponse.json({
            success: true,
            message: `Email ${emailId} queued for retry`,
          });
        } else {
          return NextResponse.json(
            { error: 'Email not found or not failed' },
            { status: 404 }
          );
        }
      }

      case 'clear': {
        emailQueue.clearSentEmails();
        return NextResponse.json({
          success: true,
          message: 'Sent emails cleared from queue',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    logger.error('Error in email management POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  route: '/api/email',
  tags: { service: 'email', operation: 'email_actions' }
});
