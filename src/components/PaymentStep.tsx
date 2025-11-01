'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import posthog from 'posthog-js';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Lock, ShieldCheck } from 'lucide-react';
import { TrustBadgeRow } from './TrustBadge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, convertCompensationAmount } from '@/lib/currency';

interface PaymentStepProps {
  email: string;
  firstName: string;
  lastName: string;
  claimId: string;
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export default function PaymentStep({
  email,
  firstName,
  lastName,
  claimId: _claimId,
  amount,
  onPaymentSuccess,
  onBack,
}: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { currency, isEURegion } = useCurrency();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Prevent double submission

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    // Elements are ready
    setPaymentReady(true);
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Prevent double submission
    if (hasSubmitted || isProcessing) {
      console.warn('Payment already processing or submitted');
      return;
    }

    setHasSubmitted(true);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Get origin safely for SSR compatibility
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${origin}/claim-submitted`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Track payment error
        console.error('Stripe payment error:', error);
        if (typeof window !== 'undefined') {
          posthog.capture('payment_failed', {
            error_type: error.type || 'stripe_error',
            error_code: error.code || 'unknown',
            error_message: error.message || 'Payment failed',
            amount_cents: amount,
            currency,
          });
        }
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        setHasSubmitted(false); // Allow retry on error
      } else if (paymentIntent) {
        // Log payment intent status for debugging
        console.log('Payment Intent Status:', paymentIntent.status);

        // Handle different payment statuses
        if (paymentIntent.status === 'succeeded') {
          // Payment successful
          console.log('Payment succeeded:', paymentIntent.id);
          onPaymentSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'processing') {
          // Payment is processing (common for certain payment methods)
          console.log('Payment processing:', paymentIntent.id);
          setErrorMessage('Your payment is being processed. This may take a few moments. Please check your email for confirmation.');
          setIsProcessing(false);
          setHasSubmitted(false); // Allow user to check status or contact support
          // Could optionally call onPaymentSuccess here depending on your flow
        } else if (paymentIntent.status === 'requires_action') {
          // Should not happen with redirect: 'if_required', but handle just in case
          console.warn('Payment requires action:', paymentIntent.status);
          setErrorMessage('Additional authentication is required. Please try again.');
          setIsProcessing(false);
          setHasSubmitted(false); // Allow retry
        } else {
          // Track incomplete payment
          console.error('Unexpected payment status:', paymentIntent.status);
          if (typeof window !== 'undefined') {
            posthog.capture('payment_failed', {
              error_type: 'incomplete_payment',
              error_message: 'Payment could not be completed',
              payment_status: paymentIntent.status,
              amount_cents: amount,
              currency,
            });
          }
          setErrorMessage(`Payment status: ${paymentIntent.status}. Please check your email or contact support.`);
          setIsProcessing(false);
          setHasSubmitted(false); // Allow retry
        }
      } else {
        // No error and no payment intent - unexpected
        console.error('No error and no payment intent returned');
        setErrorMessage('Unable to confirm payment. Please try again.');
        setIsProcessing(false);
        setHasSubmitted(false); // Allow retry
      }
    } catch (err: unknown) {
      logger.error('Payment error', err);
      // Track unexpected error
      if (typeof window !== 'undefined') {
        posthog.capture('payment_failed', {
          error_type: 'unexpected_error',
          error_message: err instanceof Error ? err.message : 'An unexpected error occurred',
          amount_cents: amount,
          currency,
        });
      }
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
      setHasSubmitted(false); // Allow retry
    }
  };

  // Format amount based on user's currency
  const formatAmountDisplay = (cents: number) => {
    return formatCurrency(cents / 100, currency);
  };

  // Get average payout in user's currency
  const averagePayout = isEURegion ? 450 : convertCompensationAmount(450, currency);

  return (
    <div className="space-y-6">
      {/* Trust Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <TrustBadgeRow className="justify-center" />
      </div>

      {/* Success Statistics */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">You're in Good Company</h3>
          <p className="text-sm text-gray-600">Join 320+ travelers who have successfully claimed their compensation</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600">320+</div>
            <div className="text-xs text-gray-500">Claims Processed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">94%</div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">48h</div>
            <div className="text-xs text-gray-500">Filing Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(averagePayout, currency)}</div>
            <div className="text-xs text-gray-500">Avg Payout</div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Lock className="w-5 h-5 mr-2 text-purple-600" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Complete your payment to submit your claim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-blue-200">
              <span className="text-gray-700">Service Fee</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatAmountDisplay(amount)}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">Tax included in price</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheck className="w-5 h-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">
                    100% Money-Back Guarantee
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    If we're unable to successfully file your claim within 48 hours,
                    you'll receive a full automatic refund. No questions asked.
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>If we don't file within 48 hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>If claim rejected due to our error</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>If you request refund within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>If flight isn't eligible after payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your payment details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stripe Payment Element */}
            <div className="min-h-[200px]">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      name: `${firstName} ${lastName}`,
                      email: email,
                    },
                  },
                }}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 text-sm">
                      Payment Error
                    </p>
                    <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start text-sm text-gray-600">
                <Lock className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <p>
                  Your payment information is encrypted and secure. We never store
                  your card details. Powered by Stripe.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={!stripe || !paymentReady || isProcessing}
                className="bg-purple-500 hover:bg-purple-600 min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatAmountDisplay(amount)}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          By completing this payment, you agree to our terms of service and
          privacy policy.
        </p>
      </div>
    </div>
  );
}

