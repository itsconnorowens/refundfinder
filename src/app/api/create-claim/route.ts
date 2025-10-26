import { NextRequest, NextResponse } from 'next/server';
import { createClaim, createPayment } from '@/lib/airtable';
import { retrievePaymentIntent } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract form fields
    const firstName = body.firstName;
    const lastName = body.lastName;
    const email = body.email;
    const flightNumber = body.flightNumber;
    const airline = body.airline;
    const departureDate = body.departureDate;
    const departureAirport = body.departureAirport;
    const arrivalAirport = body.arrivalAirport;
    const delayDuration = body.delayDuration;
    const delayReason = body.delayReason;

    // Extract payment information
    const paymentIntentId = body.paymentIntentId;

    // Extract file URLs (already uploaded to Vercel Blob)
    const boardingPassUrl = body.boardingPassUrl;
    const delayProofUrl = body.delayProofUrl;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !flightNumber ||
      !airline ||
      !departureDate ||
      !departureAirport ||
      !arrivalAirport ||
      !delayDuration ||
      !paymentIntentId ||
      !boardingPassUrl ||
      !delayProofUrl
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment was successful
    let paymentIntent;
    try {
      paymentIntent = await retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          {
            error:
              'Payment has not been completed. Please complete payment before submitting your claim.',
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment. Please contact support.' },
        { status: 400 }
      );
    }

    // Generate claim ID
    const timestamp = Date.now();
    const claimId = `claim-${timestamp}`;
    const paymentId = `payment-${timestamp}`;

    const estimatedCompensation = calculateEstimatedCompensation(
      departureAirport,
      arrivalAirport,
      delayDuration
    );

    // Create payment record in Airtable
    try {
      await createPayment({
        paymentId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        email,
        claimId,
        createdAt: new Date().toISOString(),
        succeededAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating payment record:', error);
      // Continue even if Airtable fails - we have the payment in Stripe
    }

    // Create claim record in Airtable
    try {
      await createClaim({
        claimId,
        firstName,
        lastName,
        email,
        flightNumber,
        airline,
        departureDate,
        departureAirport,
        arrivalAirport,
        delayDuration,
        delayReason: delayReason || '',
        status: 'submitted',
        estimatedCompensation,
        paymentId,
        submittedAt: new Date().toISOString(),
        boardingPassUrl,
        delayProofUrl,
      });
    } catch (error) {
      console.error('Error creating claim record:', error);
      // Continue even if Airtable fails
    }

    // TODO: Send confirmation email
    // TODO: Queue claim for processing

    return NextResponse.json({
      success: true,
      claimId,
      paymentId,
      message:
        "Claim submitted successfully! We'll file your claim within 10 business days and email you with every update.",
      estimatedCompensation,
      refundGuarantee:
        "If we're unable to file your claim successfully, you'll receive a 100% refund automatically.",
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateEstimatedCompensation(
  departureAirport: string,
  arrivalAirport: string,
  delayDuration: string
): string {
  // Simple compensation calculation based on distance and delay
  // This is a simplified version - in reality, you'd use proper distance calculations
  const delayHours = parseFloat(delayDuration.replace(/[^\d.]/g, '')) || 0;

  if (delayHours < 3) {
    return 'Not eligible (delay less than 3 hours)';
  }

  // Rough distance estimation based on common routes
  const isLongHaul = departureAirport.length > 3 || arrivalAirport.length > 3; // Simplified logic

  if (delayHours >= 4) {
    return isLongHaul ? '€600' : '€400';
  } else {
    return isLongHaul ? '€400' : '€250';
  }
}
