import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateClaimId } from "@/lib/claim-id";
import { logger } from "@/lib/logger";
import { withErrorTracking, setUser, addBreadcrumb } from "@/lib/error-tracking";
import { Currency, getServiceFee } from "@/lib/currency";

// Initialize Stripe only if environment variables are available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

export const POST = withErrorTracking(async (request: NextRequest) => {
  if (!stripe) {
    logger.error('Stripe not configured', undefined, { endpoint: '/api/create-payment-intent' });
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { email, firstName, lastName, currency = 'EUR' } = body;

  // Set user context for error tracking
  setUser({ email, name: `${firstName} ${lastName}` });

  // Validate required fields
  if (!email || !firstName || !lastName) {
    logger.warn('Missing required fields for payment intent', { email, firstName, lastName });
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate currency
  if (!['EUR', 'USD', 'GBP'].includes(currency)) {
    logger.warn('Invalid currency', { currency });
    return NextResponse.json(
      { error: "Invalid currency" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.warn('Invalid email format', { email });
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // Generate claim ID for payment intent metadata
  const claimId = generateClaimId();

  // Get service fee for the currency
  const amount = getServiceFee(currency as Currency);

  addBreadcrumb('Generating payment intent', 'payment', { claimId, email, currency, amount });
  logger.info('Creating payment intent', { claimId, email, firstName, lastName, currency, amount });

  // Create idempotency key to prevent duplicate charges
  // Using claimId + email ensures that retries return the same payment intent
  const idempotencyKey = `pi_${claimId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`.slice(0, 255);

  // Create payment intent with idempotency key
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    metadata: {
      claimId,
      email,
      firstName,
      lastName,
      currency,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  }, {
    idempotencyKey, // Prevents duplicate payment intents if user retries
  });

  logger.info('Payment intent created successfully', {
    paymentIntentId: paymentIntent.id,
    claimId,
    email
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    claimId, // Return the claim ID to the client
  });
}, { route: '/api/create-payment-intent', tags: { service: 'stripe' } });
