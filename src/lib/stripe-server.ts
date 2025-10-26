import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
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
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: SERVICE_FEE_AMOUNT,
      currency: SERVICE_FEE_CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: email,
      metadata: {
        claimId,
        service: 'refund-finder',
        priceId: STRIPE_PRICE_ID || '',
        productId: process.env.STRIPE_PRODUCT_ID || '',
        ...metadata,
      },
      description: `Refund Finder Service Fee - Claim ${claimId}`,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
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
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
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
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        service: 'refund-finder',
        ...metadata,
      },
    });

    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
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
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        service: 'refund-finder',
        ...metadata,
      },
    });

    return refund;
  } catch (error) {
    console.error('Error processing partial refund:', error);
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
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
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
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
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
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        service: 'refund-finder',
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
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
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return customers.data[0] || null;
  } catch (error) {
    console.error('Error finding customer:', error);
    throw error;
  }
}
