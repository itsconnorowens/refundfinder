import { processRefund } from './stripe-server';
import { logger } from '@/lib/logger';
import {
  getClaimByClaimId,
  getPaymentByPaymentId,
  updateClaim,
  updatePayment,
  createRefund as createRefundRecord,
  getOverdueClaims,
  ClaimStatus,
  RefundRecord,
} from './airtable';
import {
  sendAutomaticRefundNotification,
  createRefundNotificationData,
} from './refund-notifications';

// Refund trigger types
export type RefundTrigger =
  | 'claim_not_filed_deadline'
  | 'claim_rejected_by_airline'
  | 'insufficient_documentation'
  | 'ineligible_flight'
  | 'customer_request'
  | 'system_error'
  | 'duplicate_claim';

// Refund configuration
export const REFUND_CONFIG = {
  // Automatic refund triggers
  CLAIM_FILING_DEADLINE_HOURS: 48, // 48 hours to file claim
  CUSTOMER_REQUEST_DEADLINE_HOURS: 24, // 24 hours for customer-initiated refunds

  // Refund reasons mapping
  REFUND_REASONS: {
    claim_not_filed_deadline: 'Claim not filed within 48 hours',
    claim_rejected_by_airline: 'Claim rejected by airline',
    insufficient_documentation: 'Insufficient documentation provided',
    ineligible_flight: 'Flight not eligible for compensation',
    customer_request: 'Customer requested refund',
    system_error: 'System error prevented claim filing',
    duplicate_claim: 'Duplicate claim detected',
  } as const,

  // Success criteria for avoiding refunds
  SUCCESS_CRITERIA: {
    CLAIM_FILED_WITHIN_DEADLINE: true,
    DOCUMENTATION_COMPLETE: true,
    ELIGIBLE_FLIGHT: true,
    NO_DUPLICATE_CLAIMS: true,
  },
} as const;

export interface RefundDecision {
  shouldRefund: boolean;
  trigger: RefundTrigger | null;
  reason: string;
  confidence: number; // 0-1 confidence in refund decision
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  stripeRefundId?: string;
  amount?: number;
  error?: string;
  decision: RefundDecision;
}

/**
 * Analyze a claim to determine if it should be automatically refunded
 */
export async function analyzeRefundEligibility(
  claimId: string,
  trigger?: RefundTrigger
): Promise<RefundDecision> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return {
        shouldRefund: false,
        trigger: null,
        reason: 'Claim not found',
        confidence: 0,
      };
    }

    const claimStatus = claim.get('status') as ClaimStatus;
    const submittedAt = new Date(claim.get('submitted_at') as string);
    const paymentId = claim.get('payment_id') as string;

    // Check if already refunded
    if (claimStatus === 'refunded') {
      return {
        shouldRefund: false,
        trigger: null,
        reason: 'Already refunded',
        confidence: 1,
      };
    }

    // Check if payment exists
    if (!paymentId) {
      return {
        shouldRefund: false,
        trigger: null,
        reason: 'No payment associated with claim',
        confidence: 0,
      };
    }

    const payment = await getPaymentByPaymentId(paymentId);
    if (!payment) {
      return {
        shouldRefund: false,
        trigger: null,
        reason: 'Payment record not found',
        confidence: 0,
      };
    }

    const paymentStatus = payment.get('status') as string;
    if (
      paymentStatus === 'refunded' ||
      paymentStatus === 'partially_refunded'
    ) {
      return {
        shouldRefund: false,
        trigger: null,
        reason: 'Payment already refunded',
        confidence: 1,
      };
    }

    // Analyze based on trigger or automatic analysis
    if (trigger) {
      return analyzeSpecificTrigger(claim, payment, trigger);
    } else {
      return await analyzeAutomaticTriggers(claim, payment, submittedAt);
    }
  } catch (error) {
    logger.error('Error analyzing refund eligibility:', error);
    return {
      shouldRefund: false,
      trigger: null,
      reason: 'Analysis error',
      confidence: 0,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Analyze specific refund trigger
 */
function analyzeSpecificTrigger(
  claim: any,
  payment: any,
  trigger: RefundTrigger
): RefundDecision {
  const claimStatus = claim.get('status') as ClaimStatus;
  const submittedAt = new Date(claim.get('submitted_at') as string);
  const now = new Date();
  const hoursSinceSubmission =
    (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);

  switch (trigger) {
    case 'claim_not_filed_deadline':
      if (
        claimStatus === 'submitted' &&
        hoursSinceSubmission > REFUND_CONFIG.CLAIM_FILING_DEADLINE_HOURS
      ) {
        return {
          shouldRefund: true,
          trigger,
          reason: REFUND_CONFIG.REFUND_REASONS[trigger],
          confidence: 0.9,
          metadata: { hoursSinceSubmission },
        };
      }
      break;

    case 'claim_rejected_by_airline':
      if (claimStatus === 'rejected') {
        return {
          shouldRefund: true,
          trigger,
          reason: REFUND_CONFIG.REFUND_REASONS[trigger],
          confidence: 0.95,
          metadata: { rejectionReason: claim.get('rejection_reason') },
        };
      }
      break;

    case 'customer_request':
      if (
        hoursSinceSubmission <= REFUND_CONFIG.CUSTOMER_REQUEST_DEADLINE_HOURS
      ) {
        return {
          shouldRefund: true,
          trigger,
          reason: REFUND_CONFIG.REFUND_REASONS[trigger],
          confidence: 0.8,
          metadata: { hoursSinceSubmission },
        };
      }
      break;

    case 'insufficient_documentation':
      const boardingPassUrl = claim.get('boarding_pass_url');
      const delayProofUrl = claim.get('delay_proof_url');
      if (!boardingPassUrl || !delayProofUrl) {
        return {
          shouldRefund: true,
          trigger,
          reason: REFUND_CONFIG.REFUND_REASONS[trigger],
          confidence: 0.85,
          metadata: { boardingPassUrl, delayProofUrl },
        };
      }
      break;

    case 'ineligible_flight':
      const estimatedCompensation = claim.get('estimated_compensation');
      if (estimatedCompensation === 'Not eligible (delay less than 3 hours)') {
        return {
          shouldRefund: true,
          trigger,
          reason: REFUND_CONFIG.REFUND_REASONS[trigger],
          confidence: 0.9,
          metadata: { estimatedCompensation },
        };
      }
      break;

    case 'system_error':
      // This would be triggered by system monitoring
      return {
        shouldRefund: true,
        trigger,
        reason: REFUND_CONFIG.REFUND_REASONS[trigger],
        confidence: 0.7,
      };

    case 'duplicate_claim':
      // This would be detected by duplicate detection system
      return {
        shouldRefund: true,
        trigger,
        reason: REFUND_CONFIG.REFUND_REASONS[trigger],
        confidence: 0.8,
      };
  }

  return {
    shouldRefund: false,
    trigger: null,
    reason: `Trigger '${trigger}' conditions not met`,
    confidence: 0,
  };
}

/**
 * Analyze automatic refund triggers
 */
async function analyzeAutomaticTriggers(
  claim: any,
  payment: any,
  submittedAt: Date
): Promise<RefundDecision> {
  const claimStatus = claim.get('status') as ClaimStatus;
  const now = new Date();
  const hoursSinceSubmission =
    (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);

  // Check deadline trigger
  if (
    claimStatus === 'submitted' &&
    hoursSinceSubmission > REFUND_CONFIG.CLAIM_FILING_DEADLINE_HOURS
  ) {
    return {
      shouldRefund: true,
      trigger: 'claim_not_filed_deadline',
      reason: REFUND_CONFIG.REFUND_REASONS.claim_not_filed_deadline,
      confidence: 0.9,
      metadata: { hoursSinceSubmission },
    };
  }

  // Check rejection trigger
  if (claimStatus === 'rejected') {
    return {
      shouldRefund: true,
      trigger: 'claim_rejected_by_airline',
      reason: REFUND_CONFIG.REFUND_REASONS.claim_rejected_by_airline,
      confidence: 0.95,
      metadata: { rejectionReason: claim.get('rejection_reason') },
    };
  }

  // Check documentation trigger
  const boardingPassUrl = claim.get('boarding_pass_url');
  const delayProofUrl = claim.get('delay_proof_url');
  if (!boardingPassUrl || !delayProofUrl) {
    return {
      shouldRefund: true,
      trigger: 'insufficient_documentation',
      reason: REFUND_CONFIG.REFUND_REASONS.insufficient_documentation,
      confidence: 0.85,
      metadata: { boardingPassUrl, delayProofUrl },
    };
  }

  // Check eligibility trigger
  const estimatedCompensation = claim.get('estimated_compensation');
  if (estimatedCompensation === 'Not eligible (delay less than 3 hours)') {
    return {
      shouldRefund: true,
      trigger: 'ineligible_flight',
      reason: REFUND_CONFIG.REFUND_REASONS.ineligible_flight,
      confidence: 0.9,
      metadata: { estimatedCompensation },
    };
  }

  return {
    shouldRefund: false,
    trigger: null,
    reason: 'No automatic refund triggers met',
    confidence: 0.8,
  };
}

/**
 * Process an automatic refund
 */
export async function processAutomaticRefund(
  claimId: string,
  trigger?: RefundTrigger,
  processedBy: string = 'system'
): Promise<RefundResult> {
  try {
    // Analyze refund eligibility
    const decision = await analyzeRefundEligibility(claimId, trigger);

    if (!decision.shouldRefund) {
      return {
        success: false,
        error: decision.reason,
        decision,
      };
    }

    // Get claim and payment details
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
        decision,
      };
    }

    const paymentId = claim.get('payment_id') as string;
    const payment = await getPaymentByPaymentId(paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
        decision,
      };
    }

    const stripePaymentIntentId = payment.get(
      'stripe_payment_intent_id'
    ) as string;
    const amount = payment.get('amount') as number;

    // Process refund in Stripe
    const stripeRefund = await processRefund(
      stripePaymentIntentId,
      'requested_by_customer',
      {
        claimId,
        refundTrigger: decision.trigger || 'unknown',
        refundReason: decision.reason,
        processedBy,
        confidence: decision.confidence.toString(),
      }
    );

    // Generate refund ID
    const refundId = `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create refund record
    const refundRecord: RefundRecord = {
      refundId,
      paymentId,
      claimId,
      stripeRefundId: stripeRefund.id,
      amount: stripeRefund.amount,
      reason: decision.reason,
      status: stripeRefund.status === 'succeeded' ? 'succeeded' : 'pending',
      processedBy: 'automatic',
      processedByUser: processedBy,
      createdAt: new Date().toISOString(),
      succeededAt:
        stripeRefund.status === 'succeeded'
          ? new Date().toISOString()
          : undefined,
      internalNotes: `Automatic refund triggered by: ${decision.trigger}. Confidence: ${decision.confidence}`,
    };

    await createRefundRecord(refundRecord);

    // Update payment record
    await updatePayment(payment.id, {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundAmount: stripeRefund.amount,
      refundReason: decision.reason,
      refundProcessedBy: processedBy,
    });

    // Update claim status
    await updateClaim(claim.id, {
      status: 'refunded',
      completedAt: new Date().toISOString(),
      internalNotes: `Automatic refund processed. Reason: ${decision.reason}`,
    });

    // Send notification email
    try {
      const notificationData = createRefundNotificationData(
        claim,
        payment,
        {
          amount: stripeRefund.amount,
          refundId,
          stripeRefundId: stripeRefund.id,
        },
        decision.reason
      );

      await sendAutomaticRefundNotification(notificationData);
    } catch (emailError) {
      logger.error('Error sending refund notification:', emailError);
      // Don't fail the refund if email fails
    }

    return {
      success: true,
      refundId,
      stripeRefundId: stripeRefund.id,
      amount: stripeRefund.amount,
      decision,
    };
  } catch (error) {
    logger.error('Error processing automatic refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      decision: {
        shouldRefund: false,
        trigger: null,
        reason: 'Processing error',
        confidence: 0,
      },
    };
  }
}

/**
 * Get all claims that need automatic refunds
 */
export async function getClaimsNeedingAutomaticRefunds(): Promise<{
  overdueClaims: any[];
  rejectedClaims: any[];
  insufficientDocClaims: any[];
  ineligibleClaims: any[];
}> {
  try {
    // Get overdue claims (not filed within deadline)
    const overdueClaims = await getOverdueClaims(
      REFUND_CONFIG.CLAIM_FILING_DEADLINE_HOURS / 24
    );

    // Get rejected claims (this would need to be implemented in airtable.ts)
    const rejectedClaims: any[] = [];

    // Filter by specific criteria
    const insufficientDocClaims: any[] = [];
    const ineligibleClaims: any[] = [];

    // Process overdue claims for additional filtering
    for (const claim of overdueClaims) {
      const boardingPassUrl = claim.get('boarding_pass_url');
      const delayProofUrl = claim.get('delay_proof_url');
      const estimatedCompensation = claim.get('estimated_compensation');

      if (!boardingPassUrl || !delayProofUrl) {
        insufficientDocClaims.push(claim);
      }

      if (estimatedCompensation === 'Not eligible (delay less than 3 hours)') {
        ineligibleClaims.push(claim);
      }
    }

    return {
      overdueClaims: overdueClaims as any[],
      rejectedClaims: rejectedClaims as any[],
      insufficientDocClaims: insufficientDocClaims as any[],
      ineligibleClaims: ineligibleClaims as any[],
    };
  } catch (error) {
    logger.error('Error getting claims needing automatic refunds:', error);
    throw error;
  }
}

/**
 * Process batch automatic refunds
 */
export async function processBatchAutomaticRefunds(
  claimIds: string[],
  trigger: RefundTrigger,
  processedBy: string = 'system'
): Promise<{
  successful: RefundResult[];
  failed: RefundResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalAmount: number;
  };
}> {
  const results: RefundResult[] = [];

  // Process refunds in parallel (with rate limiting)
  const batchSize = 5; // Process 5 at a time to avoid rate limits
  for (let i = 0; i < claimIds.length; i += batchSize) {
    const batch = claimIds.slice(i, i + batchSize);
    const batchPromises = batch.map((claimId) =>
      processAutomaticRefund(claimId, trigger, processedBy)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to respect rate limits
    if (i + batchSize < claimIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalAmount = successful.reduce((sum, r) => sum + (r.amount || 0), 0);

  return {
    successful,
    failed,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      totalAmount,
    },
  };
}
