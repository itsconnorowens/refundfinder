'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';

function ClaimPageContent() {
  const searchParams = useSearchParams();
  
  // Get pre-filled data from URL params
  const flightNumber = searchParams.get('flightNumber') || '';
  const airline = searchParams.get('airline') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const departureAirport = searchParams.get('departureAirport') || '';
  const arrivalAirport = searchParams.get('arrivalAirport') || '';
  const delayDuration = searchParams.get('delayDuration') || '';

  // Pre-fill localStorage with flight data if provided
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

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <ClaimSubmissionForm />
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
