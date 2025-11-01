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
  const {
    email,
    firstName,
    lastName,
    currency = 'EUR',
    claimId: clientClaimId,
    idempotencyKey: clientIdempotencyKey,
    formData,
    flightData,
    disruptionType,
  } = body;

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

  // Use client-provided claim ID or generate new one
  const claimId = clientClaimId || generateClaimId();

  // Get service fee for the currency
  const amount = getServiceFee(currency as Currency);

  addBreadcrumb('Generating payment intent', 'payment', { claimId, email, currency, amount });
  logger.info('Creating payment intent', { claimId, email, firstName, lastName, currency, amount });

  // Use client-provided idempotency key or create one
  const idempotencyKey = clientIdempotencyKey || `pi_${claimId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`.slice(0, 255);

  // Prepare metadata - Stripe has a 500 char limit per metadata value
  const metadata: Record<string, string> = {
    claimId,
    email,
    firstName,
    lastName,
    currency,
    disruptionType: disruptionType || 'unknown',
    flightNumber: flightData?.flightNumber || formData?.flightNumber || '',
    departureAirport: flightData?.departureAirport || formData?.departureAirport || '',
    arrivalAirport: flightData?.arrivalAirport || formData?.arrivalAirport || '',
    departureDate: flightData?.departureDate || formData?.departureDate || '',
    airline: flightData?.airline || formData?.airline || '',
  };

  // Create payment intent with idempotency key
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    metadata,
    description: `Flight compensation claim: ${metadata.flightNumber} (${metadata.departureAirport} → ${metadata.arrivalAirport})`,
    receipt_email: email,
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
