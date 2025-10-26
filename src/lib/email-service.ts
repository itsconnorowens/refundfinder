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
        fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@refundfinder.com',
        fromName: 'RefundFinder',
      });
    }

    // Add SendGrid as fallback if not primary
    if (this.config.provider !== 'sendgrid' && process.env.SENDGRID_API_KEY) {
      fallbacks.push({
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail:
          process.env.SENDGRID_FROM_EMAIL || 'noreply@refundfinder.com',
        fromName: 'RefundFinder',
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
        fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@refundfinder.com',
        fromName: 'RefundFinder',
      });
    }

    // Always add console as final fallback
    fallbacks.push({
      provider: 'console',
      fromEmail: 'noreply@refundfinder.com',
      fromName: 'RefundFinder',
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
        email: provider.fromEmail || 'noreply@refundfinder.com',
        name: provider.fromName || 'RefundFinder',
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
        from: `${provider.fromName || 'RefundFinder'} <${provider.fromEmail || 'noreply@refundfinder.com'}>`,
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
      from: `${provider.fromName || 'RefundFinder'} <${provider.fromEmail || 'noreply@refundfinder.com'}>`,
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
      `From: ${provider.fromName || 'RefundFinder'} <${provider.fromEmail || 'noreply@refundfinder.com'}>`
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
  const primaryProvider =
    (process.env.EMAIL_PROVIDER as EmailConfig['provider']) || 'console';

  const config: EmailConfig = {
    provider: primaryProvider,
    apiKey: process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@refundfinder.com',
    fromName: process.env.FROM_NAME || 'RefundFinder',
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
          {{#each nextSteps}}
          <li>{{this}}</li>
          {{/each}}
        </ol>

        <p>If you have any questions, please contact us at <a href="mailto:privacy@refundfinder.com">privacy@refundfinder.com</a>.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent regarding your GDPR data subject rights request. 
          RefundFinder - Flight Delay Compensation Assistance
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
{{#each nextSteps}}
- {{this}}
{{/each}}

If you have any questions, please contact us at privacy@refundfinder.com.

---
This email was sent regarding your GDPR data subject rights request.
RefundFinder - Flight Delay Compensation Assistance
    `,
  },

  claimConfirmation: {
    subject: 'Claim Submitted Successfully - {{flightNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Claim Submitted Successfully</h2>
        <p>Dear {{userName}},</p>
        <p>Thank you for using RefundFinder! We have successfully submitted your compensation claim.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Claim Details:</h3>
          <ul>
            <li><strong>Flight:</strong> {{flightNumber}} ({{airline}})</li>
            <li><li><strong>Date:</strong> {{flightDate}}</li>
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
          RefundFinder - Flight Delay Compensation Assistance<br>
          <a href="mailto:support@refundfinder.com">support@refundfinder.com</a>
        </p>
      </div>
    `,
    text: `
Claim Submitted Successfully

Dear {{userName}},

Thank you for using RefundFinder! We have successfully submitted your compensation claim.

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
RefundFinder - Flight Delay Compensation Assistance
support@refundfinder.com
    `,
  },

  refundNotification: {
    subject: 'Refund Processed - {{claimId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D9B5;">Refund Processed</h2>
        <p>Dear {{userName}},</p>
        <p>Your refund has been processed successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Refund Details:</h3>
          <ul>
            <li><strong>Claim ID:</strong> {{claimId}}</li>
            <li><strong>Refund Amount:</strong> $49</li>
            <li><strong>Reason:</strong> {{refundReason}}</li>
            <li><strong>Processed:</strong> {{refundDate}}</li>
          </ul>
        </div>

        <p>The refund will appear in your account within 5-10 business days, depending on your bank's processing time.</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          RefundFinder - Flight Delay Compensation Assistance<br>
          <a href="mailto:support@refundfinder.com">support@refundfinder.com</a>
        </p>
      </div>
    `,
    text: `
Refund Processed

Dear {{userName}},

Your refund has been processed successfully.

Refund Details:
- Claim ID: {{claimId}}
- Refund Amount: $49
- Reason: {{refundReason}}
- Processed: {{refundDate}}

The refund will appear in your account within 5-10 business days, depending on your bank's processing time.

---
RefundFinder - Flight Delay Compensation Assistance
support@refundfinder.com
    `,
  },
};

// Helper functions for common email operations
export async function sendGDPRConfirmation(
  email: string,
  requestData: any
): Promise<EmailResult> {
  const variables = {
    userName: email.split('@')[0],
    requestType: requestData.type,
    requestId: requestData.requestId,
    requestDate: new Date().toLocaleDateString(),
    nextSteps: requestData.nextSteps.join('\n'),
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
