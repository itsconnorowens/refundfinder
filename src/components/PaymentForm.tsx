'use client';

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getServiceFeeFormatted } from '@/lib/currency';

interface PaymentFormProps {
  formData?: any;
  eligibilityResults?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentFormContent({ formData, eligibilityResults, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent double submission
    if (hasSubmitted || loading) {
      console.warn('Payment already processing or submitted');
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setHasSubmitted(true);
    setLoading(true);
    setError(null);

    try {
      // Generate claim ID with idempotency
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7).toUpperCase();
      const claimId = `FL-${timestamp}-${randomStr}`;

      // Create idempotency key for duplicate prevention
      const email = formData?.passengerEmail || 'unknown@example.com';
      const idempotencyKey = `pi_${claimId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`.slice(0, 255);

      console.log('Creating payment intent for claim:', claimId);

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          claimId,
          firstName: formData?.firstName || 'Unknown',
          lastName: formData?.lastName || 'Unknown',
          currency,
          idempotencyKey,
          // Include all form data for claim creation
          formData,
          flightData: eligibilityResults?.flightData,
          eligibilityData: eligibilityResults?.eligibility,
          disruptionType: formData?.disruptionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      console.log('Confirming payment...');

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
        receipt_email: email,
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        setError(result.error.message || 'Payment failed');
        setHasSubmitted(false); // Allow retry on error
      } else if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded! Redirecting to document upload...');
        // Call onSuccess callback
        onSuccess();
        // Redirect to document upload page with payment intent ID
        router.push(`/claim/${claimId}/documents?paymentIntentId=${result.paymentIntent.id}`);
      } else {
        console.warn('Unexpected payment status:', result.paymentIntent?.status);
        setError('Payment status unclear. Please contact support.');
        setHasSubmitted(false);
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setHasSubmitted(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Payment</h3>
      </div>

      {/* Enhanced Trust Signals */}
      <div className="mb-6 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <h4 className="font-semibold text-green-900">100% Money-Back Guarantee</h4>
          </div>
          <p className="text-sm text-green-800">
            If we can't file your claim successfully, you'll receive a full automatic refund
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What You're Paying For</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Claim filing with airline
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              All paperwork handled
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Email updates at every step
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Expert review of your case
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Follow-up with airline if needed
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="text-green-600 mr-1">🔒</span>
            Secure payment via Stripe
          </div>
          <div className="flex items-center">
            <span className="text-blue-600 mr-1">✉️</span>
            Confirmation email sent immediately
          </div>
          <div className="flex items-center">
            <span className="text-orange-600 mr-1">⚡</span>
            Claim filed within 48 hours
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-lg p-3">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : `Pay ${getServiceFeeFormatted(currency)}`}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}

export default function PaymentForm({ formData, eligibilityResults, onSuccess, onCancel }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent
        formData={formData}
        eligibilityResults={eligibilityResults}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
