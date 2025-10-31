import Stripe from 'stripe';
import { Currency, getServiceFee } from './currency';
import { logger } from '@/lib/logger';

// Lazy initialization of Stripe to avoid build-time environment variable checks
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables'
      );
    }

    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }

  return stripeInstance;
}

// Export a getter function instead of the instance directly
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Service fee configuration
export const SERVICE_FEE_AMOUNT = parseInt(
  process.env.SERVICE_FEE_AMOUNT || '4900',
  10
); // $49.00 in cents
export const SERVICE_FEE_CURRENCY = process.env.SERVICE_FEE_CURRENCY || 'usd';
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

/**
 * Create a Payment Intent for the claim submission
 * Uses Stripe Price ID for proper tax calculation via Stripe Tax
 */
export async function createPaymentIntent(
  email: string,
  claimId: string,
  currency: Currency = 'EUR',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  try {
    const stripe = getStripe();
    const amount = getServiceFee(currency);
    const currencyCode = currency.toLowerCase();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currencyCode,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: email,
      metadata: {
        claimId,
        service: 'flghtly',
        currency: currency,
        priceId: STRIPE_PRICE_ID || '',
        productId: process.env.STRIPE_PRODUCT_ID || '',
        ...metadata,
      },
      description: `Flghtly Service Fee - Claim ${claimId}`,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Retrieve a Payment Intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const stripe = getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.error('Error retrieving payment intent:', error);
    throw error;
  }
}

/**
 * Process a full refund
 */
export async function processRefund(
  paymentIntentId: string,
  reason?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Refund> {
  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        service: 'flghtly',
        ...metadata,
      },
    });

    return refund;
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw error;
  }
}

/**
 * Process a partial refund
 */
export async function processPartialRefund(
  paymentIntentId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Refund> {
  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        service: 'flghtly',
        ...metadata,
      },
    });

    return refund;
  } catch (error) {
    logger.error('Error processing partial refund:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    throw error;
  }
}

/**
 * Get payment method details
 */
export async function getPaymentMethodDetails(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  try {
    const stripe = getStripe();
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    logger.error('Error retrieving payment method:', error);
    throw error;
  }
}

/**
 * Create a customer in Stripe
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  try {
    const stripe = getStripe();
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        service: 'flghtly',
        ...metadata,
      },
    });
  } catch (error) {
    logger.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Search for a customer by email
 */
export async function findCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return customers.data[0] || null;
  } catch (error) {
    logger.error('Error finding customer:', error);
    throw error;
  }
}
