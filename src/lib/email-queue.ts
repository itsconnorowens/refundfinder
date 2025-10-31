import { logger } from '@/lib/logger';

/**
 * Email Queue System for Reliable Email Delivery
 * Handles retries, failures, and fallback mechanisms
 */

export interface QueuedEmail {
  id: string;
  to: string;
  template: string;
  variables: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retry';
  error?: string;
}

export interface EmailQueueConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  processingInterval: number; // milliseconds
}

class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private config: EmailQueueConfig;

  constructor(
    config: EmailQueueConfig = {
      maxRetries: 3,
      retryDelay: 30000, // 30 seconds
      batchSize: 10,
      processingInterval: 10000, // 10 seconds
    }
  ) {
    this.config = config;
    this.startProcessing();
  }

  async addEmail(
    to: string,
    template: string,
    variables: Record<string, any> = {},
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedEmail: QueuedEmail = {
      id: emailId,
      to,
      template,
      variables,
      priority,
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Add to queue based on priority
    if (priority === 'high') {
      this.queue.unshift(queuedEmail);
    } else {
      this.queue.push(queuedEmail);
    }

    logger.info('Email queued: ${emailId} ( priority)', { priority: priority });
    return emailId;
  }

  private startProcessing(): void {
    if (this.processing) return;

    this.processing = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.processing) {
      try {
        const batch = this.getNextBatch();

        if (batch.length > 0) {
          await this.processBatch(batch);
        }

        // Wait before next processing cycle
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.processingInterval)
        );
      } catch (error: unknown) {
        logger.error('Error in email queue processing:', error);
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.processingInterval)
        );
      }
    }
  }

  private getNextBatch(): QueuedEmail[] {
    const pendingEmails = this.queue.filter(
      (email) =>
        email.status === 'pending' ||
        (email.status === 'retry' && email.attempts < email.maxAttempts)
    );

    // Sort by priority and creation time
    pendingEmails.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return pendingEmails.slice(0, this.config.batchSize);
  }

  private async processBatch(batch: QueuedEmail[]): Promise<void> {
    const promises = batch.map((email) => this.processEmail(email));
    await Promise.allSettled(promises);
  }

  private async processEmail(email: QueuedEmail): Promise<void> {
    try {
      email.status = 'processing';
      email.attempts++;
      email.lastAttempt = new Date().toISOString();

      logger.info('Processing email ${email.id} (attempt )', { attempts: email.attempts });

      // Import email service dynamically to avoid circular dependencies
      const { emailService, emailTemplates } = await import('./email-service');

      const template =
        emailTemplates[email.template as keyof typeof emailTemplates];
      if (!template) {
        throw new Error(`Template not found: ${email.template}`);
      }

      const result = await emailService.sendEmail({
        to: email.to,
        template,
        variables: email.variables,
      });

      if (result.success) {
        email.status = 'sent';
        logger.info(`Email sent successfully`, {
          emailId: email.id,
          provider: result.provider,
          operation: 'email'
        });
      } else {
        throw new Error(result.error || 'Unknown email error');
      }
    } catch (error: unknown) {
      logger.error(`Failed to send email`, error, {
        emailId: email.id,
        operation: 'email'
      });

      email.error = error instanceof Error ? error.message : 'Unknown error';

      if (email.attempts >= email.maxAttempts) {
        email.status = 'failed';
        logger.error(`Email failed permanently`, undefined, {
          emailId: email.id,
          attempts: email.attempts,
          operation: 'email'
        });
      } else {
        email.status = 'retry';
        logger.info(`Email will be retried`, {
          emailId: email.id,
          attempt: email.attempts,
          maxAttempts: email.maxAttempts,
          operation: 'email'
        });

        // Schedule retry with delay
        setTimeout(() => {
          if (email.status === 'retry') {
            email.status = 'pending';
          }
        }, this.config.retryDelay);
      }
    }
  }

  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    retry: number;
  } {
    const statusCounts = this.queue.reduce(
      (acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: this.queue.length,
      pending: statusCounts.pending || 0,
      processing: statusCounts.processing || 0,
      sent: statusCounts.sent || 0,
      failed: statusCounts.failed || 0,
      retry: statusCounts.retry || 0,
    };
  }

  getFailedEmails(): QueuedEmail[] {
    return this.queue.filter((email) => email.status === 'failed');
  }

  retryFailedEmail(emailId: string): boolean {
    const email = this.queue.find((e) => e.id === emailId);
    if (!email || email.status !== 'failed') {
      return false;
    }

    email.status = 'pending';
    email.attempts = 0;
    email.error = undefined;

    logger.info('Email  queued for retry', { emailId: emailId });
    return true;
  }

  clearSentEmails(): void {
    this.queue = this.queue.filter((email) => email.status !== 'sent');
    logger.info('Cleared sent emails from queue');
  }

  stopProcessing(): void {
    this.processing = false;
    logger.info('Email queue processing stopped');
  }
}

// Global email queue instance
export const emailQueue = new EmailQueue();

// Helper functions for common email operations
export async function queueGDPRConfirmation(
  email: string,
  requestData: any,
  priority: 'high' | 'normal' | 'low' = 'high'
): Promise<string> {
  return emailQueue.addEmail(
    email,
    'gdprRequestConfirmation',
    {
      userName: email.split('@')[0],
      requestType: requestData.type,
      requestId: requestData.requestId,
      requestDate: new Date().toLocaleDateString(),
      nextSteps: requestData.nextSteps,
    },
    priority
  );
}

export async function queueClaimConfirmation(
  email: string,
  claimData: any,
  priority: 'high' | 'normal' | 'low' = 'high'
): Promise<string> {
  return emailQueue.addEmail(
    email,
    'claimConfirmation',
    {
      userName: claimData.firstName || email.split('@')[0],
      flightNumber: claimData.flightNumber,
      airline: claimData.airline,
      flightDate: claimData.departureDate,
      departureAirport: claimData.departureAirport,
      arrivalAirport: claimData.arrivalAirport,
      delayDuration: claimData.delayDuration,
      estimatedAmount: claimData.estimatedAmount || '€250-€600',
    },
    priority
  );
}

export async function queueRefundNotification(
  email: string,
  refundData: any,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<string> {
  return emailQueue.addEmail(
    email,
    'refundNotification',
    {
      userName: refundData.firstName || email.split('@')[0],
      claimId: refundData.claimId,
      refundReason: refundData.reason,
      refundDate: new Date().toLocaleDateString(),
    },
    priority
  );
}

// API endpoint for queue management
export async function getEmailQueueStatus() {
  return emailQueue.getQueueStatus();
}

export function retryFailedEmail(emailId: string) {
  return emailQueue.retryFailedEmail(emailId);
}

export async function getFailedEmails() {
  return emailQueue.getFailedEmails();
}
