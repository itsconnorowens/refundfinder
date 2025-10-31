import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const result = await emailService.sendEmail({
      to,
      template: {
        subject: '✅ Flghtly Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #00D9B5;">✅ Email System Working!</h1>
            <p>Congratulations! Your Flghtly email system is properly configured and working.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Test Details:</h3>
              <p><strong>From:</strong> claims@flghtly.com</p>
              <p><strong>Provider:</strong> Resend</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>What's Working:</h3>
            <ul>
              <li>✅ Resend API configured correctly</li>
              <li>✅ Domain verified and authenticated</li>
              <li>✅ Email sending from claims@flghtly.com</li>
              <li>✅ Templates rendering properly</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Test email forwarding (send an email TO claims@flghtly.com)</li>
              <li>Set up Gmail "Send As" for replying</li>
              <li>Check deliverability at <a href="https://www.mail-tester.com/">mail-tester.com</a></li>
            </ol>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is a test email from your Flghtly application.
            </p>
          </div>
        `,
        text: `
✅ Email System Working!

Congratulations! Your Flghtly email system is properly configured and working.

Test Details:
- From: claims@flghtly.com
- Provider: Resend
- Sent at: ${new Date().toLocaleString()}

What's Working:
✅ Resend API configured correctly
✅ Domain verified and authenticated
✅ Email sending from claims@flghtly.com
✅ Templates rendering properly

Next Steps:
1. Test email forwarding (send an email TO claims@flghtly.com)
2. Set up Gmail "Send As" for replying
3. Check deliverability at https://www.mail-tester.com/

This is a test email from your Flghtly application.
        `,
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
        provider: result.provider,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
