'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { FileQuestion, RefreshCw, Save } from 'lucide-react';

interface FormErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  onSaveDraft?: () => void;
}

/**
 * Specialized error fallback for form components
 * Provides options to retry or save draft
 */
export function FormErrorFallback({
  error,
  onRetry,
  onSaveDraft,
}: FormErrorFallbackProps) {
  const isValidationError = error?.message?.toLowerCase().includes('validation');
  const isNetworkError =
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch');

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
          <FileQuestion className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Form Error
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {isValidationError
          ? 'There was a problem validating your form data. Please check your entries and try again.'
          : isNetworkError
            ? 'Unable to submit the form due to a network issue. Your data has not been lost.'
            : 'An unexpected error occurred while processing your form. Your progress may have been saved.'}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
          <p className="font-mono text-red-800 dark:text-red-300 break-words">
            {error.message}
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
        <div className="flex items-start gap-2">
          <Save className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Your data is safe
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Form data is automatically saved to your browser. You won't lose
              your progress.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}

        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        If this problem persists, try clearing your browser cache or contact
        support.
      </p>
    </div>
  );
}

/**
 * Form Error Boundary Component
 * Wraps form components with specialized error handling
 */
interface FormErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  formName?: string;
}

export function FormErrorBoundary({
  children,
  onRetry,
  onSaveDraft,
  formName = 'form',
}: FormErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context={`form:${formName}`}
      fallback={
        <FormErrorFallback onRetry={onRetry} onSaveDraft={onSaveDraft} />
      }
      onError={(error, errorInfo) => {
        // Additional logging for form errors
        console.error(`Form Error Boundary (${formName}) caught error:`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          formName,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
