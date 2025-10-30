'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Test component for verifying error boundaries
 * This component intentionally throws errors when buttons are clicked
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error: Error boundary is working correctly!');
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Error Boundary Test</h2>
      <p className="text-gray-600 mb-6">
        Click the button below to test the error boundary. This will intentionally throw an error
        to verify that the error boundary catches it and displays the fallback UI.
      </p>
      <Button
        onClick={() => setShouldThrow(true)}
        variant="destructive"
        className="w-full"
      >
        Throw Test Error
      </Button>
      <p className="text-sm text-gray-500 mt-4">
        If the error boundary is working, you should see a custom error UI instead of the default
        error page.
      </p>
    </div>
  );
}

/**
 * Async error test component
 * Tests error boundaries with async errors
 */
export function AsyncErrorTest() {
  const [loading, setLoading] = useState(false);

  const handleAsyncError = async () => {
    setLoading(true);
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Async test error')), 1000)
      );
    } catch (error) {
      // Re-throw to test error boundary
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Async Error Boundary Test</h2>
      <p className="text-gray-600 mb-6">
        Click the button below to test the error boundary with an async error.
      </p>
      <Button
        onClick={handleAsyncError}
        variant="destructive"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Throw Async Error'}
      </Button>
    </div>
  );
}
