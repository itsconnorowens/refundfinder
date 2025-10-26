'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

// Lazy initialization of Stripe to avoid build-time environment variable checks
let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!stripePublishableKey) {
      throw new Error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined in environment variables'
      );
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

  useEffect(() => {
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

  if (!options) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Elements stripe={getStripePromise()} options={options}>
      {children}
    </Elements>
  );
}

