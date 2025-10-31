/**
 * ErrorMessage Component
 *
 * A reusable, user-friendly error display component that shows:
 * - Categorized icons based on error type
 * - Clear, actionable error messages
 * - Error codes for support reference
 * - Suggested actions
 * - Copy error details functionality
 * - Severity-based styling
 */

'use client';

import { useState } from 'react';
import { type ErrorDetails, type ErrorCode, type ErrorSeverity } from '@/lib/error-codes';

export interface ErrorMessageProps {
  /**
   * Error code to display
   */
  errorCode: ErrorCode;

  /**
   * Error details object
   */
  errorDetails: ErrorDetails;

  /**
   * Additional context to include when copying error details
   */
  context?: Record<string, unknown>;

  /**
   * Callback when user clicks retry (if applicable)
   */
  onRetry?: () => void;

  /**
   * Whether to show the "Copy Error Details" button
   * @default true
   */
  showCopyButton?: boolean;

  /**
   * Whether to show the error code
   * @default true
   */
  showErrorCode?: boolean;

  /**
   * Whether to show suggested actions
   * @default true
   */
  showSuggestedAction?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * Get icon based on error category
 */
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'network':
      return '🌐';
    case 'server':
      return '🖥️';
    case 'timeout':
      return '⏱️';
    case 'validation':
      return '⚠️';
    case 'auth':
      return '🔒';
    case 'business':
      return '📋';
    case 'client':
      return '💻';
    default:
      return '❌';
  }
}

/**
 * Get background and border colors based on severity
 */
function getSeverityColors(severity: ErrorSeverity): {
  bg: string;
  border: string;
  text: string;
} {
  switch (severity) {
    case 'low':
      return {
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
      };
    case 'medium':
      return {
        bg: 'bg-orange-900/20',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
      };
    case 'high':
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-500/20',
        text: 'text-red-400',
      };
    case 'critical':
      return {
        bg: 'bg-red-950/40',
        border: 'border-red-600/30',
        text: 'text-red-300',
      };
    default:
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-500/20',
        text: 'text-red-400',
      };
  }
}

export function ErrorMessage({
  errorCode,
  errorDetails,
  context,
  onRetry,
  showCopyButton = true,
  showErrorCode = true,
  showSuggestedAction = true,
  className = '',
}: ErrorMessageProps) {
  const [copied, setCopied] = useState(false);

  const colors = getSeverityColors(errorDetails.severity);
  const icon = getCategoryIcon(errorDetails.category);

  /**
   * Copy error details to clipboard
   */
  const handleCopyError = async () => {
    const errorInfo = {
      errorCode,
      message: errorDetails.userMessage,
      technicalMessage: errorDetails.technicalMessage,
      category: errorDetails.category,
      severity: errorDetails.severity,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(errorInfo, null, 2);
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail if copy is not supported
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and error code */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none mt-0.5" aria-hidden="true">
            {icon}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${colors.text}`}>{errorDetails.userMessage}</p>
          </div>
        </div>
        {showErrorCode && (
          <code className={`text-xs font-mono ${colors.text} opacity-70 whitespace-nowrap`}>
            {errorCode}
          </code>
        )}
      </div>

      {/* Suggested action */}
      {showSuggestedAction && errorDetails.suggestedAction && (
        <div className="mt-2 mb-3">
          <p className={`text-xs ${colors.text} opacity-90`}>
            <span className="font-semibold">What to do: </span>
            {errorDetails.suggestedAction}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {errorDetails.retryable && onRetry && (
          <button
            onClick={onRetry}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${colors.text} hover:bg-white/10 border ${colors.border}`}
            type="button"
          >
            Try Again
          </button>
        )}
        {showCopyButton && (
          <button
            onClick={handleCopyError}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${colors.text} hover:bg-white/10 border ${colors.border}`}
            type="button"
            disabled={copied}
          >
            {copied ? '✓ Copied' : 'Copy Error Details'}
          </button>
        )}
      </div>

      {/* Support message for high/critical severity */}
      {(errorDetails.severity === 'high' || errorDetails.severity === 'critical') && (
        <div className={`mt-3 pt-3 border-t ${colors.border}`}>
          <p className={`text-xs ${colors.text} opacity-80`}>
            If this problem persists, please contact support and share error code{' '}
            <code className="font-mono font-semibold">{errorCode}</code>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified error message component for inline errors
 */
export function InlineErrorMessage({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

/**
 * Loading state component for when retries are in progress
 */
export function RetryingMessage({
  attempt,
  maxAttempts,
  className = '',
}: {
  attempt: number;
  maxAttempts: number;
  className?: string;
}) {
  return (
    <div
      className={`text-blue-400 text-sm bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
      <span>
        Retrying... Attempt {attempt} of {maxAttempts}
      </span>
    </div>
  );
}
