'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import posthog from 'posthog-js';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import { FormErrorBoundary } from '@/components/FormErrorBoundary';
import { getAttributionProperties } from '@/lib/marketing-attribution';

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const formStartTime = useRef<number>(0);
  const [lastStepReached] = useState(1);
  const [hadErrors] = useState(false);

  // Get pre-filled data from URL params
  const flightNumber = searchParams.get('flightNumber') || '';
  const airline = searchParams.get('airline') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const departureAirport = searchParams.get('departureAirport') || '';
  const arrivalAirport = searchParams.get('arrivalAirport') || '';
  const delayDuration = searchParams.get('delayDuration') || '';

  useEffect(() => {
    formStartTime.current = Date.now();
  }, []);

  // Pre-fill localStorage with flight data if provided
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    if (flightNumber && airline && departureDate && departureAirport && arrivalAirport && delayDuration) {
      const prefillData = {
        flightNumber,
        airline,
        departureDate,
        departureAirport,
        arrivalAirport,
        delayDuration,
        // Set step to 1 to start at flight details
        currentStep: 1
      };

      // Only set if not already set (don't overwrite user's progress)
      if (!localStorage.getItem('claimFormData')) {
        localStorage.setItem('claimFormData', JSON.stringify(prefillData));
      }
    }
  }, [flightNumber, airline, departureDate, departureAirport, arrivalAirport, delayDuration]);

  // Track claim form started
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasPrefill = !!(flightNumber && airline && departureDate);
      posthog.capture('claim_form_started', {
        has_prefill: hasPrefill,
        source: hasPrefill ? 'eligibility_result' : 'direct_link',
        ...getAttributionProperties(), // Include marketing attribution
      });
    }
  }, []);

  // Track claim form abandoned
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnForm = (Date.now() - formStartTime.current) / 1000;
      // Only track abandonment if user spent at least 10 seconds on form
      if (typeof window !== 'undefined' && timeOnForm > 10) {
        posthog.capture('claim_form_abandoned', {
          last_step_reached: lastStepReached,
          time_on_form_seconds: Math.round(timeOnForm),
          had_errors: hadErrors,
          ...getAttributionProperties(), // Include marketing attribution
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lastStepReached, hadErrors]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <FormErrorBoundary
          formName="claim-submission"
          onRetry={() => window.location.reload()}
        >
          <ClaimSubmissionForm />
        </FormErrorBoundary>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9B5] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading claim form...</p>
        </div>
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  );
}
