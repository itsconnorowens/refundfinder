import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { updateClaim, updatePayment, getClaimByClaimId } from '@/lib/airtable';
import { sendPaymentConfirmation } from '@/lib/email';

// Initialize Stripe only if environment variables are available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        try {
          // Update payment status in Airtable
          await updatePayment(paymentIntent.id, {
            status: 'succeeded',
            succeededAt: new Date().toISOString(),
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          });

          // Update claim status if claimId is in metadata
          const claimId = paymentIntent.metadata?.claimId;
          if (claimId) {
            await updateClaim(claimId, {
              status: 'processing',
            });

            console.log(
              `Claim ${claimId} marked as processing after successful payment`
            );

            // Send payment confirmation email
            try {
              // Get claim details for email
              const claim = await getClaimByClaimId(claimId);
              if (claim) {
                await sendPaymentConfirmation({
                  claimId,
                  customerName: `${claim.firstName} ${claim.lastName}`,
                  customerEmail: claim.email,
                  amount: '$49.00',
                  flightNumber: claim.flightNumber,
                  airline: claim.airline,
                  departureDate: claim.departureDate,
                  departureAirport: claim.departureAirport,
                  arrivalAirport: claim.arrivalAirport,
                  delayDuration: claim.delayDuration,
                });
                console.log(`Payment confirmation email sent for claim ${claimId}`);
              }
            } catch (emailError) {
              console.error('Error sending payment confirmation email:', emailError);
              // Don't fail the webhook if email fails
            }
          }
        } catch (error) {
          console.error('Error updating payment/claim status:', error);
          // Don't fail the webhook - log error but return success
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);

        try {
          // Update payment status in Airtable
          await updatePayment(failedPayment.id, {
            status: 'failed',
            stripePaymentIntentId: failedPayment.id,
          });

          // Update claim status if claimId is in metadata
          const claimId = failedPayment.metadata?.claimId;
          if (claimId) {
            await updateClaim(claimId, {
              status: 'submitted',
            });

            console.log(`Claim ${claimId} marked as failed payment`);
          }
        } catch (error) {
          console.error('Error updating failed payment status:', error);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
