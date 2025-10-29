/**
 * Email Service with Multiple Providers and Fallbacks
 * Supports SendGrid, Resend, Gmail SMTP, and console logging
 */

export interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'smtp' | 'console';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  variables?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    type: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

class EmailService {
  private config: EmailConfig;
  private fallbackProviders: EmailConfig[];

  constructor(config: EmailConfig) {
    this.config = config;
    this.fallbackProviders = this.getFallbackProviders();
  }

  private getFallbackProviders(): EmailConfig[] {
    const fallbacks: EmailConfig[] = [];

    // Add Resend as fallback if not primary
    if (this.config.provider !== 'resend' && process.env.RESEND_API_KEY) {
      fallbacks.push({
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || 'claims@flghtly.com',
        fromName: 'Flghtly',
      });
    }

    // Add SendGrid as fallback if not primary
    if (this.config.provider !== 'sendgrid' && process.env.SENDGRID_API_KEY) {
      fallbacks.push({
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'claims@flghtly.com',
        fromName: 'Flghtly',
      });
    }

    // Add SMTP as fallback
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      fallbacks.push({
        provider: 'smtp',
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        fromEmail: process.env.SMTP_FROM_EMAIL || 'claims@flghtly.com',
        fromName: 'Flghtly',
      });
    }

    // Always add console as final fallback
    fallbacks.push({
      provider: 'console',
      fromEmail: 'claims@flghtly.com',
      fromName: 'Flghtly',
    });

    return fallbacks;
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    const providers = [this.config, ...this.fallbackProviders];

    for (const provider of providers) {
      try {
        const result = await this.sendWithProvider(provider, emailData);
        if (result.success) {
          console.log(`Email sent successfully via ${provider.provider}`);
          return result;
        }
      } catch (error) {
        console.error(`Failed to send email via ${provider.provider}:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All email providers failed',
      provider: 'none',
    };
  }

  private async sendWithProvider(
    provider: EmailConfig,
    emailData: EmailData
  ): Promise<EmailResult> {
    const processedTemplate = this.processTemplate(
      emailData.template,
      emailData.variables
    );

    switch (provider.provider) {
      case 'sendgrid':
        return this.sendWithSendGrid(provider, emailData, processedTemplate);
      case 'resend':
        return this.sendWithResend(provider, emailData, processedTemplate);
      case 'smtp':
        return this.sendWithSMTP(provider, emailData, processedTemplate);
      case 'console':
        return this.sendWithConsole(provider, emailData, processedTemplate);
      default:
        throw new Error(`Unsupported email provider: ${provider.provider}`);
    }
  }

  private async sendWithSendGrid(
    provider: EmailConfig,
    emailData: EmailData,
    template: EmailTemplate
  ): Promise<EmailResult> {
    if (!provider.apiKey) {
      throw new Error('SendGrid API key not provided');
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(provider.apiKey);

    const msg = {
      to: emailData.to,
      from: {
        email: provider.fromEmail || 'claims@flghtly.com',
        name: provider.fromName || 'Flghtly',
      },
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'sendgrid',
    };
  }

  private async sendWithResend(
    provider: EmailConfig,
    emailData: EmailData,
    template: EmailTemplate
  ): Promise<EmailResult> {
    if (!provider.apiKey) {
      throw new Error('Resend API key not provided');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${provider.fromName || 'Flghtly'} <${provider.fromEmail || 'claims@flghtly.com'}>`,
        to: [emailData.to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id,
      provider: 'resend',
    };
  }

  private async sendWithSMTP(
    provider: EmailConfig,
    emailData: EmailData,
    template: EmailTemplate
  ): Promise<EmailResult> {
    if (!provider.smtpConfig) {
      throw new Error('SMTP configuration not provided');
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter({
      host: provider.smtpConfig.host,
      port: provider.smtpConfig.port,
      secure: provider.smtpConfig.secure,
      auth: provider.smtpConfig.auth,
    });

    const mailOptions = {
      from: `${provider.fromName || 'Flghtly'} <${provider.fromEmail || 'claims@flghtly.com'}>`,
      to: emailData.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
    };
  }

  private async sendWithConsole(
    provider: EmailConfig,
    emailData: EmailData,
    template: EmailTemplate
  ): Promise<EmailResult> {
    console.log('='.repeat(80));
    console.log('📧 EMAIL (Console Fallback)');
    console.log('='.repeat(80));
    console.log(`To: ${emailData.to}`);
    console.log(
      `From: ${provider.fromName || 'Flghtly'} <${provider.fromEmail || 'claims@flghtly.com'}>`
    );
    console.log(`Subject: ${template.subject}`);
    console.log('-'.repeat(40));
    console.log('HTML Content:');
    console.log(template.html);
    console.log('-'.repeat(40));
    console.log('Text Content:');
    console.log(template.text);
    console.log('='.repeat(80));

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: 'console',
    };
  }

  private processTemplate(
    template: EmailTemplate,
    variables?: Record<string, string>
  ): EmailTemplate {
    if (!variables) return template;

    let processedSubject = template.subject;
    let processedHtml = template.html;
    let processedText = template.text;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(
        new RegExp(placeholder, 'g'),
        value
      );
      processedHtml = processedHtml.replace(
        new RegExp(placeholder, 'g'),
        value
      );
      processedText = processedText.replace(
        new RegExp(placeholder, 'g'),
        value
      );
    });

    return {
      subject: processedSubject,
      html: processedHtml,
      text: processedText,
    };
  }
}

// Initialize email service based on environment
function createEmailService(): EmailService {
  // Default to Resend if no provider specified and RESEND_API_KEY is available
  const primaryProvider =
    (process.env.EMAIL_PROVIDER as EmailConfig['provider']) ||
    (process.env.RESEND_API_KEY ? 'resend' : 'console');

  const config: EmailConfig = {
    provider: primaryProvider,
    apiKey:
      primaryProvider === 'resend'
        ? process.env.RESEND_API_KEY
        : process.env.SENDGRID_API_KEY,
    fromEmail:
      process.env.RESEND_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      'claims@flghtly.com',
    fromName: process.env.FROM_NAME || 'Flghtly',
  };

  return new EmailService(config);
}

export const emailService = createEmailService();

// Email templates
export const emailTemplates = {
  gdprRequestConfirmation: {
    subject: 'GDPR Request Received - {{requestType}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">GDPR Request Received</h2>
        <p>Dear {{userName}},</p>
        <p>We have received your {{requestType}} request and will process it within 30 days as required by GDPR.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Request ID:</strong> {{requestId}}</li>
            <li><strong>Type:</strong> {{requestType}}</li>
            <li><strong>Date:</strong> {{requestDate}}</li>
            <li><strong>Response Time:</strong> 30 days</li>
          </ul>
        </div>

        <h3>Next Steps:</h3>
        <ol>
          {{nextStepsHtml}}
        </ol>

        <p>If you have any questions, please contact us at <a href="mailto:privacy@flghtly.com">privacy@flghtly.com</a>.</p>

        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent regarding your GDPR data subject rights request.
          Flghtly - Flight Delay Compensation Assistance
        </p>
      </div>
    `,
    text: `
GDPR Request Received

Dear {{userName}},

We have received your {{requestType}} request and will process it within 30 days as required by GDPR.

Request Details:
- Request ID: {{requestId}}
- Type: {{requestType}}
- Date: {{requestDate}}
- Response Time: 30 days

Next Steps:
{{nextStepsText}}

If you have any questions, please contact us at privacy@flghtly.com.

---
This email was sent regarding your GDPR data subject rights request.
Flghtly - Flight Delay Compensation Assistance
    `,
  },

  claimConfirmation: {
    subject: 'Claim Submitted Successfully - {{flightNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Submitted Successfully</h2>
        <p>Dear {{userName}},</p>
        <p>Thank you for using Flghtly! We have successfully submitted your compensation claim.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Date:</strong> {{flightDate}}</li>
            <li><strong>Route:</strong> {{departureAirport}} → {{arrivalAirport}}</li>
            <li><strong>Delay:</strong> {{delayDuration}}</li>
            <li><strong>Estimated Compensation:</strong> {{estimatedAmount}}</li>
            <li><strong>Service Fee:</strong> $49</li>
          </ul>
        </div>

        <h3>What Happens Next:</h3>
        <ol>
          <li>We will file your claim with {{airline}} within 48 hours</li>
          <li>You will receive updates via email as we progress</li>
          <li>Most claims are resolved within 2-6 months</li>
          <li>You will receive compensation directly from the airline</li>
        </ol>

        <p><strong>Important:</strong> We provide assistance services only. We are not a law firm and do not provide legal advice.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Submitted Successfully

Dear {{userName}},

Thank you for using Flghtly! We have successfully submitted your compensation claim.

Claim Details:
- Flight: {{flightNumber}} ({{airline}})
- Date: {{flightDate}}
- Route: {{departureAirport}} → {{arrivalAirport}}
- Delay: {{delayDuration}}
- Estimated Compensation: {{estimatedAmount}}
- Service Fee: $49

What Happens Next:
1. We will file your claim with {{airline}} within 48 hours
2. You will receive updates via email as we progress
3. Most claims are resolved within 2-6 months
4. You will receive compensation directly from the airline

Important: We provide assistance services only. We are not a law firm and do not provide legal advice.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  claimFiledNotification: {
    subject: 'Your claim has been filed with {{airline}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Filed Successfully</h2>
        <p>Dear {{userName}},</p>
        <p>Great news! We've successfully filed your compensation claim with {{airline}}.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Date:</strong> {{flightDate}}</li>
            <li><strong>Route:</strong> {{departureAirport}} → {{arrivalAirport}}</li>
            <li><strong>Delay:</strong> {{delayDuration}}</li>
            <li><strong>Airline Reference:</strong> {{airlineReference}}</li>
            <li><strong>Filing Method:</strong> {{filingMethod}}</li>
          </ul>
        </div>

        <h3>What Happens Next:</h3>
        <ol>
          <li>{{airline}} will review your claim (typically {{expectedResponseTime}})</li>
          <li>We'll monitor the progress and follow up as needed</li>
          <li>You'll receive updates via email as we progress</li>
          <li>If approved, you'll receive compensation directly from {{airline}}</li>
        </ol>

        <p><strong>Important:</strong> We'll handle all follow-ups with {{airline}} on your behalf. You don't need to take any further action.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Filed Successfully

Dear {{userName}},

Great news! We've successfully filed your compensation claim with {{airline}}.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Date: {{flightDate}}
- Route: {{departureAirport}} → {{arrivalAirport}}
- Delay: {{delayDuration}}
- Airline Reference: {{airlineReference}}
- Filing Method: {{filingMethod}}

What Happens Next:
1. {{airline}} will review your claim (typically {{expectedResponseTime}})
2. We'll monitor the progress and follow up as needed
3. You'll receive updates via email as we progress
4. If approved, you'll receive compensation directly from {{airline}}

Important: We'll handle all follow-ups with {{airline}} on your behalf. You don't need to take any further action.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  airlineAcknowledgedNotification: {
    subject: '{{airline}} has acknowledged your claim',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Acknowledged</h2>
        <p>Dear {{userName}},</p>
        <p>{{airline}} has confirmed receipt of your compensation claim.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Airline Reference:</strong> {{airlineReference}}</li>
            <li><strong>Status:</strong> Under Review</li>
            <li><strong>Expected Response:</strong> {{expectedResponseTime}}</li>
          </ul>
        </div>

        <h3>Next Steps:</h3>
        <ol>
          <li>{{airline}} will review your claim and supporting documents</li>
          <li>We'll continue monitoring and follow up if needed</li>
          <li>You'll receive updates as the process progresses</li>
        </ol>

        <p>We'll keep you informed of any developments. Thank you for your patience!</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Acknowledged

Dear {{userName}},

{{airline}} has confirmed receipt of your compensation claim.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Airline Reference: {{airlineReference}}
- Status: Under Review
- Expected Response: {{expectedResponseTime}}

Next Steps:
1. {{airline}} will review your claim and supporting documents
2. We'll continue monitoring and follow up if needed
3. You'll receive updates as the process progresses

We'll keep you informed of any developments. Thank you for your patience!

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  statusUpdateNotification: {
    subject: 'Update: Your claim status has changed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Status Update</h2>
        <p>Dear {{userName}},</p>
        <p>We have an update on your compensation claim.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>New Status:</strong> {{newStatus}}</li>
            <li><strong>Previous Status:</strong> {{previousStatus}}</li>
            <li><strong>Update Date:</strong> {{updateDate}}</li>
          </ul>
        </div>

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Update Message:</h3>
          <p>{{updateMessage}}</p>
        </div>

        {{nextStepsSection}}

        <p>We'll continue to monitor your claim and keep you updated on any further developments.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Status Update

Dear {{userName}},

We have an update on your compensation claim.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- New Status: {{newStatus}}
- Previous Status: {{previousStatus}}
- Update Date: {{updateDate}}

Update Message:
{{updateMessage}}

{{nextStepsSectionText}}

We'll continue to monitor your claim and keep you updated on any further developments.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  adminReadyToFileAlert: {
    subject: 'Alert: {{count}} claim(s) ready to file',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Admin Alert: Claims Ready to File</h2>
        <p>You have {{count}} claim(s) ready for filing with airlines.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Ready to File Claims:</h3>
          <ul>
            {{claimsListHtml}}
          </ul>
        </div>

        <h3>Action Required:</h3>
        <ol>
          <li>Review each claim and generated submission materials</li>
          <li>Submit claims to respective airlines</li>
          <li>Update claim status to "filed" with airline reference</li>
          <li>Ensure 48-hour filing promise is met</li>
        </ol>

        <p><a href="/admin/claims?status=ready_to_file" style="background-color: #00D9B5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Ready Claims</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly Admin Dashboard<br>
          Generated: {{timestamp}}
        </p>
      </div>
    `,
    text: `
Admin Alert: Claims Ready to File

You have {{count}} claim(s) ready for filing with airlines.

Ready to File Claims:
{{claimsListText}}

Action Required:
1. Review each claim and generated submission materials
2. Submit claims to respective airlines
3. Update claim status to "filed" with airline reference
4. Ensure 48-hour filing promise is met

View all ready claims: /admin/claims?status=ready_to_file

---
Flghtly Admin Dashboard
Generated: {{timestamp}}
    `,
  },

  adminOverdueAlert: {
    subject: 'URGENT: {{count}} overdue claim(s) past 48-hour deadline',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">URGENT: Overdue Claims Alert</h2>
        <p style="color: #dc3545; font-weight: bold;">You have {{count}} claim(s) past the 48-hour filing deadline!</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>Overdue Claims:</h3>
          <ul>
            {{overdueClaimsListHtml}}
          </ul>
        </div>

        <h3>Immediate Action Required:</h3>
        <ol>
          <li><strong>File these claims immediately</strong> to meet our 48-hour promise</li>
          <li>Prioritize these claims over new submissions</li>
          <li>Consider refunding customers if filing is not possible</li>
          <li>Review process to prevent future delays</li>
        </ol>

        <p><a href="/admin/claims?overdue=true" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Overdue Claims</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly Admin Dashboard<br>
          Generated: {{timestamp}}
        </p>
      </div>
    `,
    text: `
URGENT: Overdue Claims Alert

You have {{count}} claim(s) past the 48-hour filing deadline!

Overdue Claims:
{{overdueClaimsListText}}

Immediate Action Required:
1. File these claims immediately to meet our 48-hour promise
2. Prioritize these claims over new submissions
3. Consider refunding customers if filing is not possible
4. Review process to prevent future delays

View all overdue claims: /admin/claims?overdue=true

---
Flghtly Admin Dashboard
Generated: {{timestamp}}
    `,
  },
  refundNotification: {
    subject: 'Refund Processed - {{claimId}}',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Processed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a; margin: 20px 0; }
        .claim-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Refund Processed</h1>
        <p>Your claim has been successfully refunded</p>
    </div>
    
    <div class="content">
        <p>Dear {{userName}},</p>
        
        <div class="highlight">
            <h3>🎉 Great News!</h3>
            <p>Your refund has been processed and should appear in your account within 5-7 business days.</p>
        </div>
        
        <div class="claim-details">
            <h3>Refund Details</h3>
            <p><strong>Claim ID:</strong> {{claimId}}</p>
            <p><strong>Refund Reason:</strong> {{refundReason}}</p>
            <p><strong>Processed Date:</strong> {{refundDate}}</p>
        </div>
        
        <p>Thank you for using Flghtly. We're glad we could help you get the compensation you deserve!</p>
        
        <p>If you have any questions about this refund, please don't hesitate to contact our support team.</p>
        
        <div class="footer">
            <p>Best regards,<br>The Flghtly Team</p>
            <p>This email was sent regarding claim {{claimId}}</p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
Refund Processed - {{claimId}}

Dear {{userName}},

🎉 Great News! Your refund has been processed and should appear in your account within 5-7 business days.

Refund Details:
- Claim ID: {{claimId}}
- Refund Reason: {{refundReason}}
- Processed Date: {{refundDate}}

Thank you for using Flghtly. We're glad we could help you get the compensation you deserve!

If you have any questions about this refund, please don't hesitate to contact our support team.

Best regards,
The Flghtly Team

This email was sent regarding claim {{claimId}}
    `,
  },

  claimValidatedNotification: {
    subject: 'Claim Validated - {{claimId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Validated</h2>
        <p>Dear {{userName}},</p>
        <p>Great news! We've verified your documents and your claim is ready for filing.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Date:</strong> {{departureDate}}</li>
            <li><strong>Route:</strong> {{departureAirport}} → {{arrivalAirport}}</li>
            <li><strong>Delay:</strong> {{delayDuration}}</li>
          </ul>
        </div>

        <h3>What Happens Next:</h3>
        <ol>
          <li>We'll file your claim with {{airline}} within 48 hours</li>
          <li>You'll receive confirmation once it's filed</li>
          <li>We'll handle all follow-ups with the airline</li>
        </ol>

        <p>No action needed from you - we'll take care of everything!</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Validated - {{claimId}}

Dear {{userName}},

Great news! We've verified your documents and your claim is ready for filing.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Date: {{departureDate}}
- Route: {{departureAirport}} → {{arrivalAirport}}
- Delay: {{delayDuration}}

What Happens Next:
1. We'll file your claim with {{airline}} within 48 hours
2. You'll receive confirmation once it's filed
3. We'll handle all follow-ups with the airline

No action needed from you - we'll take care of everything!

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  airlineRespondedNotification: {
    subject: 'Update from {{airline}} - {{claimId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Airline Response Received</h2>
        <p>Dear {{userName}},</p>
        <p>{{airline}} has responded to your compensation claim.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Airline Reference:</strong> {{airlineReference}}</li>
          </ul>
        </div>

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Airline Response:</h3>
          <p>{{responseMessage}}</p>
        </div>

        {{nextStepsSection}}

        <p>We'll continue to monitor your claim and keep you updated on any further developments.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Update from {{airline}} - {{claimId}}

Dear {{userName}},

{{airline}} has responded to your compensation claim.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Airline Reference: {{airlineReference}}

Airline Response:
{{responseMessage}}

{{nextStepsSectionText}}

We'll continue to monitor your claim and keep you updated on any further developments.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  claimApprovedNotification: {
    subject: '🎉 Claim Approved! - {{claimId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Claim Approved!</h2>
        <p>Dear {{userName}},</p>
        <p>Excellent news! {{airline}} has approved your compensation claim.</p>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3>Compensation Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Compensation Amount:</strong> {{compensationAmount}}</li>
            <li><strong>Airline Reference:</strong> {{airlineReference}}</li>
            <li><strong>Expected Payment:</strong> {{expectedPaymentTime}}</li>
          </ul>
        </div>

        <h3>What Happens Next:</h3>
        <ol>
          <li>{{airline}} will process your compensation payment</li>
          <li>You should receive payment within {{expectedPaymentTime}}</li>
          <li>Payment will be sent directly to your original payment method</li>
          <li>You'll receive confirmation from {{airline}} when payment is processed</li>
        </ol>

        <p><strong>Congratulations!</strong> You've successfully claimed your flight delay compensation.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
🎉 Claim Approved! - {{claimId}}

Dear {{userName}},

Excellent news! {{airline}} has approved your compensation claim.

Compensation Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Compensation Amount: {{compensationAmount}}
- Airline Reference: {{airlineReference}}
- Expected Payment: {{expectedPaymentTime}}

What Happens Next:
1. {{airline}} will process your compensation payment
2. You should receive payment within {{expectedPaymentTime}}
3. Payment will be sent directly to your original payment method
4. You'll receive confirmation from {{airline}} when payment is processed

Congratulations! You've successfully claimed your flight delay compensation.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },

  claimRejectedNotification: {
    subject: 'Claim Update - {{claimId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Claim Decision</h2>
        <p>Dear {{userName}},</p>
        <p>{{airline}} has reviewed your compensation claim and unfortunately, it was not approved.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><strong>Decision:</strong> Not Approved</li>
          </ul>
        </div>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Reason for Rejection:</h3>
          <p>{{rejectionReason}}</p>
        </div>

        {{appealOptionsSection}}

        {{refundProcessedSection}}

        <p>We're sorry this claim wasn't successful. If you have any questions, please don't hesitate to contact us.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Flghtly - Flight Delay Compensation Assistance<br>
          <a href="mailto:claims@flghtly.com">claims@flghtly.com</a>
        </p>
      </div>
    `,
    text: `
Claim Update - {{claimId}}

Dear {{userName}},

{{airline}} has reviewed your compensation claim and unfortunately, it was not approved.

Claim Details:
- Claim ID: {{claimId}}
- Flight: {{flightNumber}} ({{airline}})
- Decision: Not Approved

Reason for Rejection:
{{rejectionReason}}

{{appealOptionsSectionText}}

{{refundProcessedSectionText}}

We're sorry this claim wasn't successful. If you have any questions, please don't hesitate to contact us.

---
Flghtly - Flight Delay Compensation Assistance
claims@flghtly.com
    `,
  },
};

// Helper functions for common email operations
export async function sendGDPRConfirmation(
  email: string,
  requestData: any
): Promise<EmailResult> {
  const nextStepsArray = requestData.nextSteps || [];
  const nextStepsHtml = nextStepsArray.map((step: string) => `<li>${step}</li>`).join('');
  const nextStepsText = nextStepsArray.map((step: string) => `- ${step}`).join('\n');

  const variables = {
    userName: email.split('@')[0],
    requestType: requestData.type,
    requestId: requestData.requestId,
    requestDate: new Date().toLocaleDateString(),
    nextStepsHtml,
    nextStepsText,
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.gdprRequestConfirmation,
    variables,
  });
}

export async function sendClaimConfirmation(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    flightDate: claimData.departureDate,
    departureAirport: claimData.departureAirport,
    arrivalAirport: claimData.arrivalAirport,
    delayDuration: claimData.delayDuration,
    estimatedAmount: claimData.estimatedAmount || '€250-€600',
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.claimConfirmation,
    variables,
  });
}

export async function sendClaimConfirmationEmail(data: {
  email: string;
  firstName: string;
  claimId: string;
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  estimatedCompensation: string;
}): Promise<EmailResult> {
  const variables = {
    userName: data.firstName,
    flightNumber: data.flightNumber,
    airline: data.airline,
    flightDate: data.departureDate,
    departureAirport: data.departureAirport,
    arrivalAirport: data.arrivalAirport,
    delayDuration: data.delayDuration,
    estimatedAmount: data.estimatedCompensation,
    claimId: data.claimId,
  };

  return emailService.sendEmail({
    to: data.email,
    template: emailTemplates.claimConfirmation,
    variables,
  });
}

export async function sendRefundNotification(
  email: string,
  refundData: any
): Promise<EmailResult> {
  const variables = {
    userName: refundData.firstName || email.split('@')[0],
    claimId: refundData.claimId,
    refundReason: refundData.reason,
    refundDate: new Date().toLocaleDateString(),
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.refundNotification,
    variables,
  });
}

// New helper functions for claim filing emails
export async function sendClaimFiledNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    flightDate: claimData.departureDate,
    departureAirport: claimData.departureAirport,
    arrivalAirport: claimData.arrivalAirport,
    delayDuration: claimData.delayDuration,
    airlineReference: claimData.airlineReference,
    filingMethod: claimData.filingMethod,
    expectedResponseTime: claimData.expectedResponseTime || '2-4 weeks',
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.claimFiledNotification,
    variables,
  });
}

export async function sendAirlineAcknowledgedNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    airlineReference: claimData.airlineReference,
    expectedResponseTime: claimData.expectedResponseTime || '2-4 weeks',
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.airlineAcknowledgedNotification,
    variables,
  });
}

export async function sendStatusUpdateNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const nextStepsArray = claimData.nextSteps || [];
  const nextStepsSection = nextStepsArray.length > 0
    ? `<h3>Next Steps:</h3><ol>${nextStepsArray.map((step: string) => `<li>${step}</li>`).join('')}</ol>`
    : '';
  const nextStepsSectionText = nextStepsArray.length > 0
    ? `Next Steps:\n${nextStepsArray.map((step: string) => `- ${step}`).join('\n')}`
    : '';

  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    newStatus: claimData.newStatus,
    previousStatus: claimData.previousStatus,
    updateDate: new Date().toLocaleDateString(),
    updateMessage: claimData.updateMessage,
    nextStepsSection,
    nextStepsSectionText,
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.statusUpdateNotification,
    variables,
  });
}

export async function sendAdminReadyToFileAlert(
  adminEmail: string,
  claimsData: any
): Promise<EmailResult> {
  const claimsArray = claimsData.claims || [];
  const claimsListHtml = claimsArray.map((claim: any) => `
    <li>
      <strong>${claim.claimId}</strong> - ${claim.firstName} ${claim.lastName}<br>
      Flight: ${claim.flightNumber} (${claim.airline}) - ${claim.departureDate}<br>
      Route: ${claim.departureAirport} → ${claim.arrivalAirport}<br>
      Delay: ${claim.delayDuration}<br>
      <a href="/admin/claims/${claim.claimId}" style="color: #00D9B5;">View Details</a>
    </li>
  `).join('');

  const claimsListText = claimsArray.map((claim: any) => `
- ${claim.claimId} - ${claim.firstName} ${claim.lastName}
  Flight: ${claim.flightNumber} (${claim.airline}) - ${claim.departureDate}
  Route: ${claim.departureAirport} → ${claim.arrivalAirport}
  Delay: ${claim.delayDuration}
  View: /admin/claims/${claim.claimId}
  `).join('\n');

  const variables = {
    count: claimsArray.length,
    claimsListHtml,
    claimsListText,
    timestamp: new Date().toLocaleString(),
  };

  return emailService.sendEmail({
    to: adminEmail,
    template: emailTemplates.adminReadyToFileAlert,
    variables,
  });
}

export async function sendAdminOverdueAlert(
  adminEmail: string,
  claimsData: any
): Promise<EmailResult> {
  const claimsArray = claimsData.claims || [];
  const enrichedClaims = claimsArray.map((claim: any) => ({
    ...claim,
    daysOverdue: Math.floor(
      (Date.now() - new Date(claim.submittedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  }));

  const overdueClaimsListHtml = enrichedClaims.map((claim: any) => `
    <li>
      <strong>${claim.claimId}</strong> - ${claim.firstName} ${claim.lastName}<br>
      Flight: ${claim.flightNumber} (${claim.airline}) - ${claim.departureDate}<br>
      Submitted: ${claim.submittedAt} (${claim.daysOverdue} days ago)<br>
      Current Status: ${claim.status}<br>
      <a href="/admin/claims/${claim.claimId}" style="color: #dc3545; font-weight: bold;">URGENT: File Now</a>
    </li>
  `).join('');

  const overdueClaimsListText = enrichedClaims.map((claim: any) => `
- ${claim.claimId} - ${claim.firstName} ${claim.lastName}
  Flight: ${claim.flightNumber} (${claim.airline}) - ${claim.departureDate}
  Submitted: ${claim.submittedAt} (${claim.daysOverdue} days ago)
  Current Status: ${claim.status}
  URGENT: File Now - /admin/claims/${claim.claimId}
  `).join('\n');

  const variables = {
    count: enrichedClaims.length,
    overdueClaimsListHtml,
    overdueClaimsListText,
    timestamp: new Date().toLocaleString(),
  };

  return emailService.sendEmail({
    to: adminEmail,
    template: emailTemplates.adminOverdueAlert,
    variables,
  });
}

// Enhanced status update email functions
export async function sendClaimValidatedNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    departureDate: claimData.departureDate,
    departureAirport: claimData.departureAirport,
    arrivalAirport: claimData.arrivalAirport,
    delayDuration: claimData.delayDuration,
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.claimValidatedNotification,
    variables,
  });
}

export async function sendAirlineRespondedNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const nextStepsArray = claimData.nextSteps || [];
  const nextStepsSection = nextStepsArray.length > 0
    ? `<h3>Next Steps:</h3><ol>${nextStepsArray.map((step: string) => `<li>${step}</li>`).join('')}</ol>`
    : '';
  const nextStepsSectionText = nextStepsArray.length > 0
    ? `Next Steps:\n${nextStepsArray.map((step: string) => `- ${step}`).join('\n')}`
    : '';

  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    airlineReference: claimData.airlineReference,
    responseMessage: claimData.responseMessage,
    nextStepsSection,
    nextStepsSectionText,
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.airlineRespondedNotification,
    variables,
  });
}

export async function sendClaimApprovedNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    compensationAmount: claimData.compensationAmount,
    airlineReference: claimData.airlineReference,
    expectedPaymentTime: claimData.expectedPaymentTime || '2-4 weeks',
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.claimApprovedNotification,
    variables,
  });
}

export async function sendClaimRejectedNotification(
  email: string,
  claimData: any
): Promise<EmailResult> {
  const appealOptionsArray = claimData.appealOptions || [];
  const appealOptionsSection = appealOptionsArray.length > 0
    ? `<h3>Appeal Options:</h3><ol>${appealOptionsArray.map((option: string) => `<li>${option}</li>`).join('')}</ol>`
    : '';
  const appealOptionsSectionText = appealOptionsArray.length > 0
    ? `Appeal Options:\n${appealOptionsArray.map((option: string) => `- ${option}`).join('\n')}`
    : '';

  const refundProcessed = claimData.refundProcessed || false;
  const refundProcessedSection = refundProcessed
    ? `<div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <h3>Refund Processed</h3>
         <p>We've automatically processed a full refund of your service fee. You should see this in your account within 5-7 business days.</p>
       </div>`
    : '';
  const refundProcessedSectionText = refundProcessed
    ? `Refund Processed:\nWe've automatically processed a full refund of your service fee. You should see this in your account within 5-7 business days.`
    : '';

  const variables = {
    userName: claimData.firstName || email.split('@')[0],
    claimId: claimData.claimId,
    flightNumber: claimData.flightNumber,
    airline: claimData.airline,
    rejectionReason: claimData.rejectionReason,
    appealOptionsSection,
    appealOptionsSectionText,
    refundProcessedSection,
    refundProcessedSectionText,
  };

  return emailService.sendEmail({
    to: email,
    template: emailTemplates.claimRejectedNotification,
    variables,
  });
}

/**
 * Simple email sending helper for basic notifications
 * Used by notification-service and other simple email needs
 */
export async function sendEmail(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
}): Promise<EmailResult> {
  const template: EmailTemplate = {
    subject: data.subject,
    html: data.html,
    text: data.text || data.html.replace(/<[^>]*>/g, ''), // Simple HTML to text conversion
  };

  return emailService.sendEmail({
    to: data.to,
    template,
  });
}
