import { NextRequest, NextResponse } from 'next/server';
import { createClaim, createPayment } from '@/lib/airtable';
import { retrievePaymentIntent } from '@/lib/stripe-server';
import { captureError, setUser, addBreadcrumb, captureMessage } from '@/lib/error-tracking';
import { trackServerEvent, identifyServerUser } from '@/lib/posthog';
import { notifyNewClaim } from '@/lib/notification-service';
import { sendClaimConfirmationEmail } from '@/lib/email-service';
import { generateClaimId } from '@/lib/claim-id';
import { logger } from '@/lib/logger';
import { missingFieldsResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and FormData requests
    const contentType = request.headers.get('content-type') || '';
    let firstName, lastName, email, flightNumber, airline, departureDate;
    let departureAirport, arrivalAirport, delayDuration, delayReason;
    let paymentIntentId, boardingPassUrl, delayProofUrl, attribution;
    let boardingPassFile, delayProofFile;

    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
      email = body.email;
      flightNumber = body.flightNumber;
      airline = body.airline;
      departureDate = body.departureDate;
      departureAirport = body.departureAirport;
      arrivalAirport = body.arrivalAirport;
      delayDuration = body.delayDuration;
      delayReason = body.delayReason;
      paymentIntentId = body.paymentIntentId;
      boardingPassUrl = body.boardingPassUrl;
      delayProofUrl = body.delayProofUrl;
      attribution = body.attribution; // Marketing attribution data
    } else {
      // Handle FormData request
      const formData = await request.formData();
      firstName = formData.get('firstName') as string;
      lastName = formData.get('lastName') as string;
      email = formData.get('email') as string;
      flightNumber = formData.get('flightNumber') as string;
      airline = formData.get('airline') as string;
      departureDate = formData.get('departureDate') as string;
      departureAirport = formData.get('departureAirport') as string;
      arrivalAirport = formData.get('arrivalAirport') as string;
      delayDuration = formData.get('delayDuration') as string;
      delayReason = formData.get('delayReason') as string;
      paymentIntentId = formData.get('paymentIntentId') as string;
      boardingPassUrl = formData.get('boardingPassUrl') as string;
      delayProofUrl = formData.get('delayProofUrl') as string;
      boardingPassFile = formData.get('boardingPass') as any;
      delayProofFile = formData.get('delayProof') as any;
    }

    // Validate required form fields
    const missingFields: string[] = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!flightNumber) missingFields.push('flightNumber');
    if (!airline) missingFields.push('airline');
    if (!departureDate) missingFields.push('departureDate');
    if (!departureAirport) missingFields.push('departureAirport');
    if (!arrivalAirport) missingFields.push('arrivalAirport');
    if (!delayDuration) missingFields.push('delayDuration');
    if (!paymentIntentId) missingFields.push('paymentIntentId');

    if (missingFields.length > 0) {
      return missingFieldsResponse(missingFields);
    }

    // Validate required documents
    if (!boardingPassUrl || !delayProofUrl) {
      return validationErrorResponse(
        'documents',
        'Please upload both your boarding pass and delay proof documents',
        400
      );
    }

    // Validate file types (if files are provided via FormData)
    if (boardingPassFile && boardingPassFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(boardingPassFile.type)) {
        return validationErrorResponse(
          'boardingPass',
          'Invalid file type for boarding pass. Please upload a JPEG, PNG, or PDF file.',
          400
        );
      }
    }

    if (delayProofFile && delayProofFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(delayProofFile.type)) {
        return validationErrorResponse(
          'delayProof',
          'Invalid file type for delay proof. Please upload a JPEG, PNG, or PDF file.',
          400
        );
      }
    }

    // Verify payment was successful first
    let paymentIntent;
    try {
      paymentIntent = await retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        logger.warn('Payment not completed', { paymentIntentId, email });
        return validationErrorResponse(
          'payment',
          'Payment has not been completed. Please complete payment before submitting your claim.',
          400
        );
      }

      logger.info('Payment verified successfully', { paymentIntentId, amount: paymentIntent.amount });
    } catch (error: unknown) {
      logger.error('Error verifying payment', error as Error, { paymentIntentId, email });
      captureError(error, {
        level: 'error',
        tags: { operation: 'verify_payment', paymentIntentId },
        extra: { email },
      });
      return validationErrorResponse(
        'payment',
        'Unable to verify your payment. Please try again or contact support if the issue persists.',
        400
      );
    }

    // Get claim ID from Stripe payment intent metadata (generated during payment intent creation)
    const claimId = paymentIntent.metadata.claimId || generateClaimId();
    const timestamp = Date.now();
    const paymentId = `payment-${timestamp}`;

    logger.info('Creating new claim', { claimId, email, airline, flightNumber });

    // Set user context for error tracking
    setUser({
      email,
      name: `${firstName} ${lastName}`,
      id: claimId,
    });

    // Identify user in PostHog
    identifyServerUser(email, {
      firstName,
      lastName,
      email,
      claimId,
    });

    addBreadcrumb('Generating claim ID', 'claim', { claimId, paymentId });

    const estimatedCompensation = calculateEstimatedCompensation(
      departureAirport,
      arrivalAirport,
      delayDuration
    );

    // Create payment record in Airtable
    try {
      addBreadcrumb('Creating payment record', 'payment', { paymentId, claimId });
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
      logger.info('Payment record created', { paymentId, claimId, amount: paymentIntent.amount });
    } catch (error: unknown) {
      logger.error('Error creating payment record', error as Error, { paymentId, claimId, email, amount: paymentIntent.amount });
      captureError(error, {
        level: 'error',
        tags: { operation: 'create_payment', paymentId, claimId },
        extra: { email, amount: paymentIntent.amount },
      });
      // Continue even if Airtable fails - we have the payment in Stripe
    }

    // Create claim record in Airtable
    try {
      addBreadcrumb('Creating claim record', 'claim', { claimId, airline, flightNumber });
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

      // Track successful claim creation
      captureMessage('Claim created successfully', {
        level: 'info',
        tags: {
          operation: 'create_claim',
          airline,
          claimId,
          status: 'submitted'
        },
        extra: {
          email,
          flightNumber,
          estimatedCompensation
        },
      });

      // Track claim submission in PostHog
      trackServerEvent(email, 'claim_submitted', {
        claimId,
        airline,
        flightNumber,
        departureAirport,
        arrivalAirport,
        delayDuration,
        estimatedCompensation,
        paymentAmount: paymentIntent.amount / 100, // Convert cents to dollars
        status: 'submitted',
        // Include marketing attribution if available
        ...(attribution || {}),
      });

      // Send real-time notification for new claim
      await notifyNewClaim({
        claimId,
        email,
        airline,
        flightNumber,
        estimatedCompensation,
      });

      logger.info('Claim created successfully', { claimId, airline, flightNumber, estimatedCompensation });
    } catch (error: unknown) {
      logger.error('Error creating claim record', error as Error, { claimId, email, airline, flightNumber });
      captureError(error, {
        level: 'error',
        tags: { operation: 'create_claim', claimId },
        extra: { email, airline, flightNumber },
      });
      // Continue even if Airtable fails
    }

    // Send confirmation email (don't fail claim if email fails)
    try {
      addBreadcrumb('Sending confirmation email', 'email', { email, claimId });
      const emailResult = await sendClaimConfirmationEmail({
        email: email,
        firstName: firstName,
        claimId: claimId,
        flightNumber: flightNumber,
        airline: airline,
        departureDate: departureDate,
        departureAirport: departureAirport,
        arrivalAirport: arrivalAirport,
        delayDuration: delayDuration,
        estimatedCompensation: estimatedCompensation,
      });

      if (emailResult.success) {
        logger.info(`Confirmation email sent successfully via ${emailResult.provider}`, {
          messageId: emailResult.messageId,
          claimId,
          email,
          provider: emailResult.provider
        });
        captureMessage('Confirmation email sent', {
          level: 'info',
          tags: { operation: 'send_email', provider: emailResult.provider, claimId },
          extra: { email, messageId: emailResult.messageId },
        });
      } else {
        logger.warn('Failed to send confirmation email', { error: emailResult.error, claimId, email });
        captureError(new Error(emailResult.error || 'Email send failed'), {
          level: 'warning',
          tags: { operation: 'send_email', claimId },
          extra: { email },
        });
      }
    } catch (emailError) {
      logger.error('Failed to send confirmation email', emailError as Error, { claimId, email });
      captureError(emailError, {
        level: 'warning',
        tags: { operation: 'send_email', claimId },
        extra: { email },
      });
      // Log but don't fail the claim
    }

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
  } catch (error: unknown) {
    logger.error('Error processing claim', error as Error, {
      url: request.url,
      method: request.method,
    });
    captureError(error, {
      level: 'fatal',
      tags: { operation: 'process_claim' },
      extra: {
        url: request.url,
        method: request.method,
      },
    });
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
