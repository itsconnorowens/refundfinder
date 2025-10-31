import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { updateClaim, updatePayment, getClaimByClaimId } from '@/lib/airtable';
import { sendPaymentConfirmation } from '@/lib/email';
import { processAutomaticClaimPreparation } from '@/lib/claim-filing-service';
import { sendAdminReadyToFileAlert } from '@/lib/email-service';
import { withErrorTracking, addBreadcrumb, captureError, setUser } from '@/lib/error-tracking';
import { trackServerEvent } from '@/lib/posthog';
import { logger } from '@/lib/logger';

// Initialize Stripe only if environment variables are available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const POST = withErrorTracking(async (request: NextRequest) => {
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
    captureError(err, { level: 'warning', tags: { service: 'stripe', error_type: 'signature_verification' } });
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  addBreadcrumb('Processing Stripe webhook event', 'webhook', { event_type: event.type });

  let paymentIntent: Stripe.PaymentIntent | undefined;
  let failedPayment: Stripe.PaymentIntent | undefined;

  switch (event.type) {
    case 'payment_intent.succeeded':
      paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });

      // Set user context from payment metadata
      if (paymentIntent.metadata?.email) {
        setUser({
          email: paymentIntent.metadata.email,
          name: `${paymentIntent.metadata.firstName} ${paymentIntent.metadata.lastName}`
        });
      }

      try {
        // Update payment status in Airtable
        addBreadcrumb('Updating payment status', 'airtable', { paymentIntentId: paymentIntent.id });
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
              status: 'validated',
              validatedAt: new Date().toISOString(),
            });

            logger.info('Claim marked as validated after successful payment', { claimId });

            // Track payment completion in PostHog
            trackServerEvent(
              paymentIntent.metadata?.email || paymentIntent.id,
              'payment_completed',
              {
                claim_id: claimId,
                payment_intent_id: paymentIntent.id,
                amount_cents: paymentIntent.amount,
                currency: paymentIntent.currency,
              }
            );

            // Send payment confirmation email
            try {
              // Get claim details for email
              const claim = await getClaimByClaimId(claimId);
              if (claim) {
                await sendPaymentConfirmation({
                  claimId,
                  customerName: `${claim.fields.user_first_name} ${claim.fields.user_last_name}`,
                  customerEmail: claim.fields.user_email,
                  amount: '$49.00',
                  flightNumber: claim.fields.flight_number,
                  airline: claim.fields.airline,
                  departureDate: claim.fields.departure_date,
                  departureAirport: claim.fields.departure_airport,
                  arrivalAirport: claim.fields.arrival_airport,
                  delayDuration: claim.fields.delay_duration,
                });
                logger.info('Payment confirmation email sent', { claimId });

                // Process automatic claim preparation
                try {
                  const preparationSuccess =
                    await processAutomaticClaimPreparation(claimId);
                  if (preparationSuccess) {
                    logger.info('Claim automatically prepared for filing', { claimId });

                    // Send admin alert if there's an admin email configured
                    const adminEmail = process.env.ADMIN_EMAIL;
                    if (adminEmail) {
                      try {
                        await sendAdminReadyToFileAlert(adminEmail, {
                          claims: [
                            {
                              claimId: claim.fields.claim_id,
                              firstName: claim.fields.user_first_name,
                              lastName: claim.fields.user_last_name,
                              flightNumber: claim.fields.flight_number,
                              airline: claim.fields.airline,
                              departureDate: claim.fields.departure_date,
                              departureAirport: claim.fields.departure_airport,
                              arrivalAirport: claim.fields.arrival_airport,
                              delayDuration: claim.fields.delay_duration,
                            },
                          ],
                        });
                        logger.info('Admin alert sent', { claimId });
                      } catch (alertError) {
                        captureError(alertError, { level: 'warning', tags: { service: 'email', claim_id: claimId, alert_type: 'admin' } });
                        logger.error('Error sending admin alert', alertError, { claimId });
                        // Don't fail the webhook if admin alert fails
                      }
                    }
                  } else {
                    logger.warn('Automatic preparation failed for claim', { claimId });
                  }
                } catch (preparationError) {
                  captureError(preparationError, { level: 'warning', tags: { service: 'claim_filing', claim_id: claimId } });
                  logger.error('Error in automatic claim preparation', preparationError, { claimId });
                  // Don't fail the webhook if preparation fails
                }
              }
            } catch (emailError) {
              captureError(emailError, { level: 'warning', tags: { service: 'email', claim_id: claimId } });
              logger.error('Error sending payment confirmation email', emailError, { claimId });
              // Don't fail the webhook if email fails
            }
          }
        } catch (error) {
          captureError(error, { level: 'error', tags: { service: 'airtable', event_type: 'payment_succeeded' } });
          logger.error('Error updating payment/claim status', error);
          // Don't fail the webhook - log error but return success
        }
      break;

    case 'payment_intent.payment_failed':
      failedPayment = event.data.object as Stripe.PaymentIntent;
      logger.warn('Payment failed', { paymentIntentId: failedPayment.id });

      // Set user context from payment metadata
      if (failedPayment.metadata?.email) {
        setUser({
          email: failedPayment.metadata.email,
          name: `${failedPayment.metadata.firstName} ${failedPayment.metadata.lastName}`
        });
      }

      try {
        // Update payment status in Airtable
        addBreadcrumb('Updating failed payment status', 'airtable', { paymentIntentId: failedPayment.id });
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

          logger.info('Claim marked as failed payment', { claimId });
        }
      } catch (error) {
        captureError(error, { level: 'error', tags: { service: 'airtable', event_type: 'payment_failed' } });
        logger.error('Error updating failed payment status', error);
      }
      break;

    default:
      logger.debug('Unhandled event type', { eventType: event.type });
  }

  return NextResponse.json({ received: true });
}, { route: '/api/webhooks/stripe', tags: { service: 'stripe', type: 'webhook' } });
