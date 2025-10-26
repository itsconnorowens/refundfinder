// Optional Resend import - will be undefined if not installed
let Resend: any;
let resend: any;

try {
  const resendModule = require('resend');
  Resend = resendModule.Resend;
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.warn('Resend not installed, email notifications will be disabled');
  resend = null;
}

// Email templates for refund notifications
export interface RefundNotificationData {
  customerEmail: string;
  customerName: string;
  claimId: string;
  refundAmount: number; // in cents
  refundReason: string;
  refundId: string;
  stripeRefundId: string;
  estimatedRefundTime: string; // e.g., "5-10 business days"
}

export interface RefundNotificationTemplates {
  automaticRefund: (data: RefundNotificationData) => {
    subject: string;
    html: string;
    text: string;
  };
  manualRefund: (data: RefundNotificationData) => {
    subject: string;
    html: string;
    text: string;
  };
  refundProcessed: (data: RefundNotificationData) => {
    subject: string;
    html: string;
    text: string;
  };
}

// Email templates
const REFUND_TEMPLATES: RefundNotificationTemplates = {
  automaticRefund: (data) => ({
    subject: `Refund Processed - Claim ${data.claimId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 10px;">
          <h1 style="color: #00D9B5; margin: 0 0 20px 0; font-size: 24px;">Refund Processed</h1>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We've processed your refund for claim <strong>${data.claimId}</strong> as part of our 100% refund guarantee.
          </p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00D9B5; margin: 0 0 15px 0; font-size: 18px;">Refund Details</h3>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Amount:</strong> $${(data.refundAmount / 100).toFixed(2)}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Reason:</strong> ${data.refundReason}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Refund ID:</strong> ${data.refundId}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Processing Time:</strong> ${data.estimatedRefundTime}</p>
          </div>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            The refund has been processed through Stripe and should appear in your account within ${data.estimatedRefundTime}. 
            If you don't see the refund after this time, please check with your bank or contact us.
          </p>
          
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">
              <strong>Need help?</strong> Reply to this email or contact us at support@refundfinder.com
            </p>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; margin: 20px 0 0 0;">
            Thank you for using RefundFinder. We apologize that we couldn't successfully process your claim this time.
          </p>
        </div>
      </div>
    `,
    text: `
      Refund Processed - Claim ${data.claimId}
      
      Hi ${data.customerName},
      
      We've processed your refund for claim ${data.claimId} as part of our 100% refund guarantee.
      
      Refund Details:
      - Amount: $${(data.refundAmount / 100).toFixed(2)}
      - Reason: ${data.refundReason}
      - Refund ID: ${data.refundId}
      - Processing Time: ${data.estimatedRefundTime}
      
      The refund has been processed through Stripe and should appear in your account within ${data.estimatedRefundTime}.
      
      Need help? Contact us at support@refundfinder.com
      
      Thank you for using RefundFinder.
    `,
  }),

  manualRefund: (data) => ({
    subject: `Refund Request Processed - Claim ${data.claimId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 10px;">
          <h1 style="color: #00D9B5; margin: 0 0 20px 0; font-size: 24px;">Refund Request Processed</h1>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We've processed your refund request for claim <strong>${data.claimId}</strong>.
          </p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00D9B5; margin: 0 0 15px 0; font-size: 18px;">Refund Details</h3>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Amount:</strong> $${(data.refundAmount / 100).toFixed(2)}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Reason:</strong> ${data.refundReason}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Refund ID:</strong> ${data.refundId}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Processing Time:</strong> ${data.estimatedRefundTime}</p>
          </div>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            The refund has been processed and should appear in your account within ${data.estimatedRefundTime}.
          </p>
          
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">
              <strong>Need help?</strong> Reply to this email or contact us at support@refundfinder.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Refund Request Processed - Claim ${data.claimId}
      
      Hi ${data.customerName},
      
      We've processed your refund request for claim ${data.claimId}.
      
      Refund Details:
      - Amount: $${(data.refundAmount / 100).toFixed(2)}
      - Reason: ${data.refundReason}
      - Refund ID: ${data.refundId}
      - Processing Time: ${data.estimatedRefundTime}
      
      The refund has been processed and should appear in your account within ${data.estimatedRefundTime}.
      
      Need help? Contact us at support@refundfinder.com
    `,
  }),

  refundProcessed: (data) => ({
    subject: `Refund Completed - Claim ${data.claimId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 10px;">
          <h1 style="color: #00D9B5; margin: 0 0 20px 0; font-size: 24px;">Refund Completed</h1>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Your refund for claim <strong>${data.claimId}</strong> has been successfully processed and should now be visible in your account.
          </p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00D9B5; margin: 0 0 15px 0; font-size: 18px;">Refund Details</h3>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Amount:</strong> $${(data.refundAmount / 100).toFixed(2)}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Refund ID:</strong> ${data.refundId}</p>
            <p style="color: #e2e8f0; margin: 5px 0;"><strong>Stripe Refund ID:</strong> ${data.stripeRefundId}</p>
          </div>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            If you have any questions about this refund or need assistance with future claims, please don't hesitate to contact us.
          </p>
          
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">
              <strong>Need help?</strong> Reply to this email or contact us at support@refundfinder.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Refund Completed - Claim ${data.claimId}
      
      Hi ${data.customerName},
      
      Your refund for claim ${data.claimId} has been successfully processed and should now be visible in your account.
      
      Refund Details:
      - Amount: $${(data.refundAmount / 100).toFixed(2)}
      - Refund ID: ${data.refundId}
      - Stripe Refund ID: ${data.stripeRefundId}
      
      If you have any questions about this refund or need assistance with future claims, please don't hesitate to contact us.
      
      Need help? Contact us at support@refundfinder.com
    `,
  }),
};

/**
 * Send refund notification email
 */
export async function sendRefundNotification(
  type: keyof RefundNotificationTemplates,
  data: RefundNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.warn('Resend not configured, skipping email notification');
      return { success: false, error: 'Email service not configured' };
    }

    const template = REFUND_TEMPLATES[type](data);

    const result = await resend.emails.send({
      from: 'RefundFinder <noreply@refundfinder.com>',
      to: [data.customerEmail],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.error) {
      console.error('Error sending refund notification:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending refund notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send automatic refund notification
 */
export async function sendAutomaticRefundNotification(
  data: RefundNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendRefundNotification('automaticRefund', data);
}

/**
 * Send manual refund notification
 */
export async function sendManualRefundNotification(
  data: RefundNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendRefundNotification('manualRefund', data);
}

/**
 * Send refund processed notification
 */
export async function sendRefundProcessedNotification(
  data: RefundNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendRefundNotification('refundProcessed', data);
}

/**
 * Send batch refund notifications
 */
export async function sendBatchRefundNotifications(
  notifications: Array<{
    type: keyof RefundNotificationTemplates;
    data: RefundNotificationData;
  }>
): Promise<{
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    messageId?: string;
    error?: string;
    email: string;
  }>;
}> {
  const results = await Promise.all(
    notifications.map(async (notification) => {
      const result = await sendRefundNotification(
        notification.type,
        notification.data
      );
      return {
        ...result,
        email: notification.data.customerEmail,
      };
    })
  );

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    successful,
    failed,
    results,
  };
}

/**
 * Get refund notification data from claim and payment records
 */
export function createRefundNotificationData(
  claim: any,
  payment: any,
  refund: any,
  refundReason: string
): RefundNotificationData {
  const firstName = claim.get('user_first_name') || '';
  const lastName = claim.get('user_last_name') || '';
  const customerName = `${firstName} ${lastName}`.trim() || 'Valued Customer';

  return {
    customerEmail: payment.get('user_email') || claim.get('user_email'),
    customerName,
    claimId: claim.get('claim_id'),
    refundAmount: refund.amount || payment.get('amount'),
    refundReason,
    refundId: refund.refundId || refund.id,
    stripeRefundId: refund.stripeRefundId || refund.id,
    estimatedRefundTime: '5-10 business days',
  };
}
