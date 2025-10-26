import { NextRequest, NextResponse } from 'next/server';
import { processRefund } from '@/lib/stripe-server';
import {
  getPaymentByPaymentId,
  getClaimByClaimId,
  updatePayment,
  updateClaim,
  createRefund as createRefundRecord,
} from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, reason, processedBy, internalNotes } = body;

    // Validate required fields
    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing required field: claimId' },
        { status: 400 }
      );
    }

    // Get claim from Airtable
    const claimRecord = await getClaimByClaimId(claimId);
    if (!claimRecord) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Get payment ID from claim
    const paymentId = claimRecord.get('Payment ID');
    if (!paymentId) {
      return NextResponse.json(
        { error: 'No payment associated with this claim' },
        { status: 400 }
      );
    }

    // Get payment record
    const paymentRecord = await getPaymentByPaymentId(paymentId);
    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Check if already refunded
    const paymentStatus = paymentRecord.get('Status');
    if (
      paymentStatus === 'refunded' ||
      paymentStatus === 'partially_refunded'
    ) {
      return NextResponse.json(
        { error: 'Payment has already been refunded' },
        { status: 400 }
      );
    }

    // Get Stripe Payment Intent ID
    const stripePaymentIntentId = paymentRecord.get('Stripe Payment Intent ID');
    if (!stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Stripe Payment Intent ID not found' },
        { status: 400 }
      );
    }

    // Process refund in Stripe
    const refund = await processRefund(
      stripePaymentIntentId,
      reason || 'requested_by_customer',
      {
        claimId,
        refundReason: reason || 'Claim unsuccessful',
      }
    );

    // Update payment record
    await updatePayment(paymentRecord.id, {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundAmount: refund.amount,
      refundReason: reason || 'Claim unsuccessful',
      refundProcessedBy: processedBy || 'manual',
    });

    // Update claim status
    await updateClaim(claimRecord.id, {
      status: 'refunded',
      completedAt: new Date().toISOString(),
      internalNotes: internalNotes || `Refund processed: ${reason}`,
    });

    // Create refund record
    await createRefundRecord({
      refundId: `refund-${Date.now()}`,
      paymentId,
      claimId,
      stripeRefundId: refund.id,
      amount: refund.amount,
      reason: reason || 'Claim unsuccessful',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      processedBy: processedBy || 'manual',
      processedByUser: processedBy,
      createdAt: new Date().toISOString(),
      internalNotes,
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      {
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check refund eligibility
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId');

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing claimId parameter' },
        { status: 400 }
      );
    }

    // Get claim from Airtable
    const claimRecord = await getClaimByClaimId(claimId);
    if (!claimRecord) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const claimStatus = claimRecord.get('Status');
    const paymentId = claimRecord.get('Payment ID');

    if (!paymentId) {
      return NextResponse.json({
        eligible: false,
        reason: 'No payment associated with this claim',
      });
    }

    // Get payment record
    const paymentRecord = await getPaymentByPaymentId(paymentId);
    if (!paymentRecord) {
      return NextResponse.json({
        eligible: false,
        reason: 'Payment record not found',
      });
    }

    const paymentStatus = paymentRecord.get('Status');

    // Check if already refunded
    if (
      paymentStatus === 'refunded' ||
      paymentStatus === 'partially_refunded'
    ) {
      return NextResponse.json({
        eligible: false,
        reason: 'Payment has already been refunded',
        refundedAt: paymentRecord.get('Refunded At'),
      });
    }

    // Check if claim is eligible for refund
    const eligibleStatuses = ['rejected', 'submitted'];
    const isEligible = eligibleStatuses.includes(claimStatus);

    return NextResponse.json({
      eligible: isEligible,
      claimStatus,
      paymentStatus,
      amount: paymentRecord.get('Amount'),
      currency: paymentRecord.get('Currency'),
      reason: isEligible
        ? 'Claim is eligible for refund'
        : `Claim status '${claimStatus}' is not eligible for refund`,
    });
  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check refund eligibility' },
      { status: 500 }
    );
  }
}
