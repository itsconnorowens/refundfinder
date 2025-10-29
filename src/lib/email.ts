import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
} else {
  console.warn(
    'SendGrid API key not configured. SendGrid email sending will be disabled.'
  );
}

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn(
    'Resend API key not configured. Resend email sending will be disabled.'
  );
}

// Email templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface PaymentConfirmationData {
  claimId: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
}

export interface StatusUpdateData {
  claimId: string;
  customerName: string;
  customerEmail: string;
  status: 'processing' | 'filed' | 'approved' | 'rejected' | 'completed';
  message: string;
  nextSteps?: string;
}

/**
 * Payment confirmation email template
 */
export function getPaymentConfirmationTemplate(
  data: PaymentConfirmationData
): EmailTemplate {
  return {
    subject: `Payment Confirmed - Claim ${data.claimId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
            .claim-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00D9B5; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .next-steps { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .button { display: inline-block; background: #00D9B5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Payment Confirmed!</h1>
              <p>Your claim has been successfully submitted</p>
            </div>
            
            <div class="content">
              <h2>Hello ${data.customerName},</h2>
              
              <p>Great news! We've received your payment and your flight delay compensation claim is now being processed.</p>
              
              <div class="claim-details">
                <h3>Claim Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Claim ID:</span>
                  <span class="detail-value">${data.claimId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service Fee:</span>
                  <span class="detail-value">${data.amount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Flight:</span>
                  <span class="detail-value">${data.flightNumber} (${data.airline})</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${data.departureDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Route:</span>
                  <span class="detail-value">${data.departureAirport} → ${data.arrivalAirport}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Delay:</span>
                  <span class="detail-value">${data.delayDuration}</span>
                </div>
              </div>
              
              <div class="next-steps">
                <h3>What Happens Next?</h3>
                <ol>
                  <li><strong>Review (Today):</strong> Our team reviews your claim and documents</li>
                  <li><strong>File (Within 48 hours):</strong> We submit your claim to ${data.airline}</li>
                  <li><strong>Follow-up (2-4 weeks):</strong> We handle all communication with the airline</li>
                  <li><strong>Payment (4-8 weeks):</strong> You receive your compensation</li>
                </ol>
              </div>
              
              <p><strong>Important:</strong> We'll email you with every update. No action needed from you - we handle everything!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:claims@flghtly.com?subject=Claim ${data.claimId}" class="button">
                  Contact Support
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Questions? Reply to this email or contact us at claims@flghtly.com</p>
              <p>Flghtly - We fight for your flight delay compensation</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Payment Confirmed - Claim ${data.claimId}

Hello ${data.customerName},

Great news! We've received your payment and your flight delay compensation claim is now being processed.

CLAIM DETAILS:
- Claim ID: ${data.claimId}
- Service Fee: ${data.amount}
- Flight: ${data.flightNumber} (${data.airline})
- Date: ${data.departureDate}
- Route: ${data.departureAirport} → ${data.arrivalAirport}
- Delay: ${data.delayDuration}

WHAT HAPPENS NEXT:
1. Review (Today): Our team reviews your claim and documents
2. File (Within 48 hours): We submit your claim to ${data.airline}
3. Follow-up (2-4 weeks): We handle all communication with the airline
4. Payment (4-8 weeks): You receive your compensation

Important: We'll email you with every update. No action needed from you - we handle everything!

Questions? Contact us at claims@flghtly.com

Flghtly - We fight for your flight delay compensation
    `,
  };
}

/**
 * Status update email template
 */
export function getStatusUpdateTemplate(data: StatusUpdateData): EmailTemplate {
  const statusMessages = {
    processing: 'Your claim is being reviewed by our team',
    filed: 'Your claim has been filed with the airline',
    approved: 'Great news! Your compensation has been approved',
    rejected: 'Unfortunately, your claim was not successful',
    completed: 'Your claim has been completed',
  };

  const statusIcons = {
    processing: '⏳',
    filed: '📋',
    approved: '🎉',
    rejected: '❌',
    completed: '✅',
  };

  return {
    subject: `Claim ${data.claimId} - ${statusMessages[data.status]}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Claim Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-icon { font-size: 48px; margin-bottom: 20px; }
            .status-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00D9B5; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="status-icon">${statusIcons[data.status]}</div>
              <h1>Claim Status Update</h1>
              <p>${statusMessages[data.status]}</p>
            </div>
            
            <div class="content">
              <h2>Hello ${data.customerName},</h2>
              
              <p>${data.message}</p>
              
              <div class="status-details">
                <h3>Claim ${data.claimId}</h3>
                <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
                <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              ${
                data.nextSteps
                  ? `
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                  <h3>Next Steps</h3>
                  <p>${data.nextSteps}</p>
                </div>
              `
                  : ''
              }
              
              <p>We'll continue to keep you updated on any changes to your claim.</p>
            </div>
            
            <div class="footer">
              <p>Questions? Reply to this email or contact us at claims@flghtly.com</p>
              <p>Flghtly - We fight for your flight delay compensation</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Claim ${data.claimId} - ${statusMessages[data.status]}

Hello ${data.customerName},

${data.message}

CLAIM DETAILS:
- Claim ID: ${data.claimId}
- Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
- Updated: ${new Date().toLocaleDateString()}

${data.nextSteps ? `NEXT STEPS:\n${data.nextSteps}\n` : ''}

We'll continue to keep you updated on any changes to your claim.

Questions? Contact us at claims@flghtly.com

Flghtly - We fight for your flight delay compensation
    `,
  };
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  fromEmail: string = 'claims@flghtly.com',
  fromName: string = 'Flghtly'
): Promise<boolean> {
  if (!sendGridApiKey) {
    console.warn('SendGrid not configured. Email not sent.');
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation(
  data: PaymentConfirmationData
): Promise<boolean> {
  const template = getPaymentConfirmationTemplate(data);
  return await sendEmail(data.customerEmail, template);
}

/**
 * Send status update email
 */
export async function sendStatusUpdate(
  data: StatusUpdateData
): Promise<boolean> {
  const template = getStatusUpdateTemplate(data);
  return await sendEmail(data.customerEmail, template);
}
