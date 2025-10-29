import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateClaimId } from "@/lib/claim-id";
import { logger } from "@/lib/logger";

// Initialize Stripe only if environment variables are available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      logger.error('Stripe not configured', undefined, { endpoint: '/api/create-payment-intent' });
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      logger.warn('Missing required fields for payment intent', { email, firstName, lastName });
      return NextResponse.json(
        { error: "Missing required fields" },
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

    logger.info('Creating payment intent', { claimId, email, firstName, lastName });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4900, // $49.00 in cents
      currency: "usd",
      metadata: {
        claimId,
        email,
        firstName,
        lastName,
      },
      automatic_payment_methods: {
        enabled: true,
      },
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
  } catch (error) {
    logger.error("Payment intent creation failed", error as Error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
