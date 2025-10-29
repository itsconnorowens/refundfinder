#!/usr/bin/env node
/**
 * Quick Email Test - Send test email to your actual address
 */

async function sendTestEmail() {
  const testEmail = process.argv[2] || 'itsconnorowens@gmail.com';
  
  console.log(`\n🧪 Testing email system...`);
  console.log(`📧 Sending test email to: ${testEmail}\n`);

  try {
    // Import the email service
    const { emailService } = await import('./src/lib/email-service.ts');
    
    const result = await emailService.sendEmail({
      to: testEmail,
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
        `
      }
    });

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log(`📬 Message ID: ${result.messageId}`);
      console.log(`🚀 Provider: ${result.provider}`);
      console.log(`\n📧 Check your inbox at: ${testEmail}`);
      console.log(`📁 Also check your spam folder just in case\n`);
      console.log('Next: Test email forwarding by sending TO claims@flghtly.com\n');
    } else {
      console.log('❌ FAILED: Email not sent');
      console.log(`Error: ${result.error || 'Unknown error'}\n`);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure RESEND_API_KEY is set in .env.local');
    console.error('2. Verify domain is verified in Resend dashboard');
    console.error('3. Check Resend logs: https://resend.com/emails\n');
  }
}

sendTestEmail();

