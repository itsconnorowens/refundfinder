import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentConfirmation, sendStatusUpdate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, testData } = body;

    if (type === 'payment-confirmation') {
      const success = await sendPaymentConfirmation({
        claimId: testData.claimId || 'test-claim-123',
        customerName: testData.customerName || 'John Doe',
        customerEmail: testData.customerEmail || 'test@example.com',
        amount: testData.amount || '$49.00',
        flightNumber: testData.flightNumber || 'BA123',
        airline: testData.airline || 'British Airways',
        departureDate: testData.departureDate || '2024-01-15',
        departureAirport: testData.departureAirport || 'LHR',
        arrivalAirport: testData.arrivalAirport || 'JFK',
        delayDuration: testData.delayDuration || '4 hours',
      });

      return NextResponse.json({
        success,
        message: success ? 'Payment confirmation email sent' : 'Failed to send email',
      });
    }

    if (type === 'status-update') {
      const success = await sendStatusUpdate({
        claimId: testData.claimId || 'test-claim-123',
        customerName: testData.customerName || 'John Doe',
        customerEmail: testData.customerEmail || 'test@example.com',
        status: testData.status || 'processing',
        message: testData.message || 'Your claim is being reviewed by our team.',
        nextSteps: testData.nextSteps || 'We will file your claim within 48 hours.',
      });

      return NextResponse.json({
        success,
        message: success ? 'Status update email sent' : 'Failed to send email',
      });
    }

    return NextResponse.json(
      { error: 'Invalid email type. Use "payment-confirmation" or "status-update"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error testing email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email testing API',
    endpoints: {
      'POST /api/test-email': 'Test email sending functionality',
    },
    usage: {
      'payment-confirmation': {
        type: 'payment-confirmation',
        testData: {
          claimId: 'test-claim-123',
          customerName: 'John Doe',
          customerEmail: 'test@example.com',
          amount: '$49.00',
          flightNumber: 'BA123',
          airline: 'British Airways',
          departureDate: '2024-01-15',
          departureAirport: 'LHR',
          arrivalAirport: 'JFK',
          delayDuration: '4 hours',
        },
      },
      'status-update': {
        type: 'status-update',
        testData: {
          claimId: 'test-claim-123',
          customerName: 'John Doe',
          customerEmail: 'test@example.com',
          status: 'processing',
          message: 'Your claim is being reviewed by our team.',
          nextSteps: 'We will file your claim within 48 hours.',
        },
      },
    },
  });
}
