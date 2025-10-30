'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import posthog from 'posthog-js';
import { setUser } from '@/lib/error-tracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail, Clock, DollarSign, Plane, FileText, Calendar } from 'lucide-react';
import { ClaimStatusModal } from '@/components/ClaimStatusModal';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get claim ID from URL params (required - generated server-side)
  const claimId = searchParams.get('claim_id');
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent_id');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Set user context in Sentry with claim ID
    if (claimId) {
      setUser({
        id: claimId,
      });

      // Track payment completion
      posthog.capture('payment_completed', {
        claim_id: claimId,
        payment_intent_id: paymentIntentId || undefined,
        session_id: sessionId || undefined,
      });
    }

    // Clear any stored form data
    localStorage.removeItem('claimFormData');
  }, [claimId, paymentIntentId, sessionId]);

  // Show error if claim ID is missing
  if (!claimId) {
    return (
      <div className="min-h-screen bg-slate-950 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error: Missing Claim ID</h2>
              <p className="text-slate-400 mb-6">
                We couldn't find your claim ID. Please contact support at claims@flghtly.com with your payment confirmation.
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleFileAnother = () => {
    router.push('/check-eligibility');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Claim Submitted Successfully!
          </h1>
          <p className="text-xl text-slate-400">
            We've received your payment and claim details
          </p>
        </div>

        {/* Success Card */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white mb-2">
              Payment Confirmed
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your claim is now being processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Claim Details */}
            <div className="bg-slate-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Claim Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-slate-300">
                  <span className="font-medium">Claim ID:</span>
                  <Badge variant="secondary" className="ml-2 font-mono">{claimId}</Badge>
                </div>
                <div className="flex items-center text-slate-300">
                  <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Service Fee:</span>
                  <span className="ml-2">$49.00</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Submitted:</span>
                  <span className="ml-2">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Status:</span>
                  <Badge className="ml-2 bg-blue-600">Processing</Badge>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">What Happens Next?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">We Review Your Claim</h4>
                  <p className="text-sm text-slate-400">
                    Our team reviews your documents and flight details to ensure everything is complete.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">We File With Airline</h4>
                  <p className="text-sm text-slate-400">
                    We submit your claim to the airline within 48 hours and handle all communication.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">You Get Updates</h4>
                  <p className="text-sm text-slate-400">
                    We email you with every update and notify you when compensation is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-8 bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Expected Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center text-slate-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Claim submitted and payment confirmed (Today)</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">Claim filed with airline (Within 48 hours)</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm">Airline acknowledgment (2-4 weeks)</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-sm">Compensation payment (4-8 weeks)</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 bg-green-900/20 border border-green-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Stay Updated
              </h3>
              <p className="text-green-300 mb-4">
                We'll email you with updates about your claim. Check your email for confirmation and next steps.
              </p>
              <div className="text-sm text-green-400">
                <p><strong>Email:</strong> claims@flghtly.com</p>
                <p><strong>Reference:</strong> {claimId}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <ClaimStatusModal claimId={claimId} />
              <Button
                onClick={handleFileAnother}
                className="flex-1 text-lg py-6"
                size="lg"
              >
                File Another Claim
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guarantee */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">100% Refund Guarantee</h3>
              <p className="text-slate-400">
                If we're unable to file your claim successfully, you'll receive a full automatic refund within 48 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9B5] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
