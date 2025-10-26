import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClaim, createPayment } from '@/lib/airtable';
import { retrievePaymentIntent } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const flightNumber = formData.get('flightNumber') as string;
    const airline = formData.get('airline') as string;
    const departureDate = formData.get('departureDate') as string;
    const departureAirport = formData.get('departureAirport') as string;
    const arrivalAirport = formData.get('arrivalAirport') as string;
    const delayDuration = formData.get('delayDuration') as string;
    const delayReason = formData.get('delayReason') as string;

    // Extract payment information
    const paymentIntentId = formData.get('paymentIntentId') as string;

    // Extract files
    const boardingPass = formData.get('boardingPass') as File;
    const delayProof = formData.get('delayProof') as File;

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
      !paymentIntentId
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

    // Validate files
    if (!boardingPass || !delayProof) {
      return NextResponse.json(
        { error: 'Missing required documents' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (
      !allowedTypes.includes(boardingPass.type) ||
      !allowedTypes.includes(delayProof.type)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file sizes (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (boardingPass.size > maxSize || delayProof.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const boardingPassFilename = `boarding-pass-${timestamp}-${boardingPass.name}`;
    const delayProofFilename = `delay-proof-${timestamp}-${delayProof.name}`;

    // Save files
    const boardingPassPath = join(uploadsDir, boardingPassFilename);
    const delayProofPath = join(uploadsDir, delayProofFilename);

    const boardingPassBuffer = Buffer.from(await boardingPass.arrayBuffer());
    const delayProofBuffer = Buffer.from(await delayProof.arrayBuffer());

    await writeFile(boardingPassPath, boardingPassBuffer);
    await writeFile(delayProofPath, delayProofBuffer);

    // Generate claim ID
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
        boardingPassFilename,
        delayProofFilename,
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
