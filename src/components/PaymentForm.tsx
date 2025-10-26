'use client';

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentFormContent({ onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com', // This would come from form data
          claimId: `claim_${Date.now()}`, // This would be generated
          firstName: 'John', // This would come from form data
          lastName: 'Doe' // This would come from form data
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch {
      setError('Payment failed. Please try again.');
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
        <p className="text-gray-600">Secure payment processing by Stripe</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-green-800 font-medium">Success Fee: $49</p>
            <p className="text-green-700 text-sm">Only charged if we win your case</p>
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
            {loading ? 'Processing...' : 'Pay $49'}
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

export default function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
