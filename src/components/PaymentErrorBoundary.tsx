'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { CreditCard, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PaymentErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  onCancel?: () => void;
}

/**
 * Specialized error fallback for payment operations
 * Provides clear messaging for payment-related errors
 */
export function PaymentErrorFallback({
  error,
  onRetry,
  onCancel,
}: PaymentErrorFallbackProps) {
  const isStripeError = error?.message?.toLowerCase().includes('stripe');
  const isNetworkError =
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch');

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Payment Processing Error
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {isStripeError
          ? 'We encountered an issue with the payment processor. No charge has been made to your card.'
          : isNetworkError
            ? 'Unable to connect to our payment system. Please check your internet connection.'
            : 'An unexpected error occurred during payment processing. Your card has not been charged.'}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
          <p className="font-mono text-amber-800 dark:text-amber-300 break-words">
            {error.message}
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
        <div className="flex items-start gap-2">
          <CreditCard className="h-5 w-5 text-purple-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-blue-300">
              Your payment information is secure
            </p>
            <p className="text-sm text-purple-700 dark:text-blue-400 mt-1">
              No payment has been processed. You can safely try again or contact
              support if the issue persists.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-md transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Try Payment Again
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        Need help?{' '}
        <a
          href="mailto:support@flghtly.com"
          className="text-purple-600 dark:text-blue-400 hover:underline"
        >
          Contact Support
        </a>
      </p>
    </div>
  );
}

/**
 * Payment Error Boundary Component
 * Wraps payment-related components with specialized error handling
 */
interface PaymentErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function PaymentErrorBoundary({
  children,
  onRetry,
  onCancel,
}: PaymentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context="payment"
      fallback={
        <PaymentErrorFallback onRetry={onRetry} onCancel={onCancel} />
      }
      onError={(error, errorInfo) => {
        // Additional logging for payment errors
        console.error('Payment Error Boundary caught error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
