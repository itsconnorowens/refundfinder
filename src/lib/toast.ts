import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification utilities using Sonner
 * Provides consistent toast notifications across the application
 */

export interface ToastOptions {
  description?: string;
  duration?: number;
}

export interface PromiseMessages {
  loading: string;
  success: string;
  error: string;
}

/**
 * Show a success toast notification
 * @param message - Main message to display
 * @param options - Optional toast options
 */
export function showSuccess(message: string, options?: ToastOptions): void {
  sonnerToast.success(message, {
    description: options?.description,
    duration: options?.duration || 3000,
  });
}

/**
 * Show an error toast notification
 * @param message - Main message to display
 * @param options - Optional toast options
 */
export function showError(message: string, options?: ToastOptions): void {
  sonnerToast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
  });
}

/**
 * Show a loading toast notification
 * Returns the toast ID for updating or dismissing later
 * @param message - Main message to display
 * @param options - Optional toast options
 * @returns Toast ID for updating or dismissing
 */
export function showLoading(message: string, options?: ToastOptions): string | number {
  return sonnerToast.loading(message, {
    description: options?.description,
    duration: Infinity,
  });
}

/**
 * Show an info toast notification
 * @param message - Main message to display
 * @param options - Optional toast options
 */
export function showInfo(message: string, options?: ToastOptions): void {
  sonnerToast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
  });
}

/**
 * Show a warning toast notification
 * @param message - Main message to display
 * @param options - Optional toast options
 */
export function showWarning(message: string, options?: ToastOptions): void {
  sonnerToast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4000,
  });
}

/**
 * Handle promise with automatic toast states
 * @param promise - Promise to handle
 * @param messages - Messages for each state
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: PromiseMessages
): void {
  sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}

/**
 * Dismiss a specific toast by ID
 * @param toastId - ID of toast to dismiss
 */
export function dismissToast(toastId: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all active toasts
 */
export function dismissAllToasts(): void {
  sonnerToast.dismiss();
}

// Export the entire sonner toast object for advanced usage
export const toast = sonnerToast;
