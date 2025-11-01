import { NextRequest, NextResponse } from 'next/server';
import { retrievePaymentIntent } from '@/lib/stripe-server';
import { logger } from '@/lib/logger';
import { withErrorTracking } from '@/lib/error-tracking';

export const POST = withErrorTracking(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { claimId, paymentIntentId, boardingPassUrl, delayProofUrl, bookingReference } = body;

    if (!claimId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info('Finalizing claim', { claimId, paymentIntentId });

    // Retrieve payment intent to get all metadata
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      logger.warn('Payment not completed', { paymentIntentId, status: paymentIntent.status });
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Extract data from payment intent metadata
    const {
      email,
      firstName,
      lastName,
      disruptionType,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureDate,
      airline,
    } = paymentIntent.metadata;

    logger.info('Retrieved payment intent data', {
      claimId,
      email,
      flightNumber,
      airline,
    });

    // Now call the existing create-claim endpoint with all the data
    const createClaimResponse = await fetch(`${request.nextUrl.origin}/api/create-claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        flightNumber,
        airline,
        departureDate,
        departureAirport,
        arrivalAirport,
        delayDuration: '3+ hours', // TODO: Get actual delay duration from formData
        delayReason: disruptionType,
        paymentIntentId,
        boardingPassUrl: boardingPassUrl || 'pending',
        delayProofUrl: delayProofUrl || 'pending',
        // Optional fields
        ...(bookingReference && { bookingReference }),
      }),
    });

    if (!createClaimResponse.ok) {
      const errorData = await createClaimResponse.json();
      logger.error('Failed to create claim', new Error(errorData.error), {
        claimId,
        paymentIntentId,
      });
      return NextResponse.json(
        { error: errorData.error || 'Failed to create claim' },
        { status: createClaimResponse.status }
      );
    }

    const claimData = await createClaimResponse.json();

    logger.info('Claim finalized successfully', { claimId, paymentIntentId });

    return NextResponse.json({
      success: true,
      ...claimData,
    });
  } catch (error) {
    logger.error('Error finalizing claim', error);
    return NextResponse.json(
      { error: 'Failed to finalize claim', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { route: '/api/finalize-claim', tags: { service: 'claims' } });
