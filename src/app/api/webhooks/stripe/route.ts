import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, verifyWebhookSignature } from '@/lib/stripe-server';
import {
  getPaymentByIntentId,
  updatePayment,
  getClaimByClaimId,
  updateClaim,
  createRefund as createRefundRecord,
} from '@/lib/airtable';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'refund.created':
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      case 'refund.updated':
        await handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Get payment method details if available
    let cardBrand = '';
    let cardLast4 = '';

    if (paymentIntent.payment_method) {
      try {
        const paymentMethodId =
          typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method.id;
        const paymentMethod =
          await stripe.paymentMethods.retrieve(paymentMethodId);
        cardBrand = paymentMethod.card?.brand || '';
        cardLast4 = paymentMethod.card?.last4 || '';
      } catch (error) {
        console.error('Error retrieving payment method:', error);
      }
    }

    // Find payment record in Airtable
    const paymentRecord = await getPaymentByIntentId(paymentIntent.id);

    if (paymentRecord) {
      // Update payment status
      await updatePayment(paymentRecord.id, {
        status: 'succeeded',
        succeededAt: new Date().toISOString(),
        cardBrand,
        cardLast4,
      });

      // Update associated claim if exists
      const claimId = paymentIntent.metadata?.claimId;
      if (claimId) {
        const claimRecord = await getClaimByClaimId(claimId);
        if (claimRecord) {
          await updateClaim(claimRecord.id, {
            status: 'processing',
          });
        }
      }

      console.log('Payment record updated successfully');
    } else {
      console.warn('Payment record not found for intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const paymentRecord = await getPaymentByIntentId(paymentIntent.id);

    if (paymentRecord) {
      await updatePayment(paymentRecord.id, {
        status: 'failed',
      });

      console.log('Payment marked as failed');
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  try {
    if (!charge.payment_intent) {
      console.warn('No payment intent associated with charge');
      return;
    }

    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent.id;

    const paymentRecord = await getPaymentByIntentId(paymentIntentId);

    if (paymentRecord) {
      const refundAmount = charge.amount_refunded;
      const isFullRefund = refundAmount === charge.amount;

      await updatePayment(paymentRecord.id, {
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refundedAt: new Date().toISOString(),
        refundAmount,
      });

      // Update claim status to refunded if full refund
      if (isFullRefund) {
        const claimId = paymentRecord.get('Claim ID');
        if (claimId) {
          const claimRecord = await getClaimByClaimId(claimId);
          if (claimRecord) {
            await updateClaim(claimRecord.id, {
              status: 'refunded',
              completedAt: new Date().toISOString(),
            });
          }
        }
      }

      console.log('Refund processed successfully');
    }
  } catch (error) {
    console.error('Error handling charge refund:', error);
    throw error;
  }
}

/**
 * Handle refund created
 */
async function handleRefundCreated(refund: Stripe.Refund) {
  console.log('Refund created:', refund.id);

  try {
    if (!refund.payment_intent) {
      console.warn('No payment intent associated with refund');
      return;
    }

    const paymentIntentId =
      typeof refund.payment_intent === 'string'
        ? refund.payment_intent
        : refund.payment_intent.id;

    const paymentRecord = await getPaymentByIntentId(paymentIntentId);

    if (paymentRecord) {
      const claimId = paymentRecord.get('Claim ID') || '';
      const paymentId = paymentRecord.get('Payment ID') || '';

      // Create refund record
      await createRefundRecord({
        refundId: `refund-${Date.now()}`,
        paymentId,
        claimId,
        stripeRefundId: refund.id,
        amount: refund.amount,
        reason: refund.reason || 'requested_by_customer',
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        processedBy: 'automatic',
        createdAt: new Date().toISOString(),
      });

      console.log('Refund record created');
    }
  } catch (error) {
    console.error('Error handling refund creation:', error);
    throw error;
  }
}

/**
 * Handle refund updated
 */
async function handleRefundUpdated(refund: Stripe.Refund) {
  console.log('Refund updated:', refund.id, 'Status:', refund.status);

  // Additional refund status tracking can be added here if needed
}
