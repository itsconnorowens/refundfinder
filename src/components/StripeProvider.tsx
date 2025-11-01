'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Lazy initialization of Stripe to avoid build-time environment variable checks
let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> | null {
  if (!stripePromise) {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublishableKey) {
      console.error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined in environment variables'
      );
      return null;
    }

    stripePromise = loadStripe(stripePublishableKey);
  }

  return stripePromise;
}

interface StripeProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

export default function StripeProvider({
  clientSecret,
  children,
}: StripeProviderProps) {
  const [options, setOptions] = useState<StripeElementsOptions | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Stripe is properly configured
    const stripe = getStripePromise();
    if (stripe === null) {
      setStripeError('Payment system is not properly configured. Please contact support.');
      return;
    }

    if (clientSecret) {
      setOptions({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            },
            '.Input:focus': {
              border: '1px solid #2563eb',
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
            '.Label': {
              fontWeight: '500',
              marginBottom: '8px',
            },
          },
        },
      });
    }
  }, [clientSecret]);

  // Show error if Stripe is not configured
  if (stripeError) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Payment System Error
              </h3>
              <p className="text-red-700 text-sm">
                {stripeError}
              </p>
              <p className="text-red-600 text-xs mt-2">
                Error Code: STRIPE_CONFIG_MISSING
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stripePromise = getStripePromise();
  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

