'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, Plane, Clock, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { getTestimonialByAmount, getRandomTestimonial } from '@/lib/testimonials';
import { TrustBadgeRow } from '@/components/TrustBadge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCompensationAmount } from '@/lib/currency';

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currency, isEURegion } = useCurrency();

  // Get results from URL params
  const eligible = searchParams.get('eligible') === 'true';
  const amount = searchParams.get('amount') || '€0';

  // Parse amount to get EUR value (e.g., "€600" -> 600)
  const amountEur = parseInt(amount.replace(/[^\d]/g, '')) || 0;
  const message = searchParams.get('message') || '';
  const regulation = searchParams.get('regulation') || '';
  const reason = searchParams.get('reason') || '';
  const flightNumber = searchParams.get('flightNumber') || '';
  const airline = searchParams.get('airline') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const departureAirport = searchParams.get('departureAirport') || '';
  const arrivalAirport = searchParams.get('arrivalAirport') || '';
  const delayDuration = searchParams.get('delayDuration') || '';

  const handleFileClaim = () => {
    // Navigate to claim form with pre-filled data
    const params = new URLSearchParams({
      flightNumber,
      airline,
      departureDate,
      departureAirport,
      arrivalAirport,
      delayDuration
    });
    
    router.push(`/claim?${params.toString()}`);
  };

  const handleCheckAnother = () => {
    router.push('/check-eligibility');
  };

  // Get relevant testimonial for eligible claims
  const relevantTestimonial = eligible ? getTestimonialByAmount(amountEur) || getRandomTestimonial() : null;

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Eligibility Results
          </h1>
          <p className="text-xl text-slate-400">
            Your flight compensation analysis
          </p>
        </div>

        {/* Results Card */}
        <Card className={`mb-8 ${eligible ? 'bg-green-900/20 border-green-500/20' : 'bg-red-900/20 border-red-500/20'}`}>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
              {eligible ? (
                <CheckCircle className="w-12 h-12 text-green-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>
            <CardTitle className={`text-3xl ${eligible ? 'text-green-400' : 'text-red-400'}`}>
              {eligible ? 'You\'re Eligible!' : 'Not Eligible'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Flight Summary */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Plane className="w-5 h-5 mr-2" />
                Flight Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-slate-300">
                  <Plane className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Flight:</span>
                  <span className="ml-2">{flightNumber}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <span className="font-medium">Airline:</span>
                  <span className="ml-2">{airline}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{departureDate}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Route:</span>
                  <span className="ml-2">{departureAirport} → {arrivalAirport}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">Delay:</span>
                  <span className="ml-2">{delayDuration}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <span className="font-medium">Regulation:</span>
                  <Badge variant="secondary" className="ml-2">{regulation}</Badge>
                </div>
              </div>
            </div>

            {/* Compensation Amount */}
            {eligible && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-8 h-8 text-green-400 mr-2" />
                    <span className="text-3xl font-bold text-green-400">{amount}</span>
                  </div>
                  <p className="text-green-300 text-lg">
                    Estimated Compensation
                  </p>
                  <p className="text-green-400 text-sm mt-2">
                    Based on {regulation} regulations
                  </p>
                </div>
              </div>
            )}

            {/* Reason for Ineligibility */}
            {!eligible && reason && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium mb-2">Why this flight isn't eligible:</h4>
                    <p className="text-red-300">{reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Trust Badges */}
              {eligible && (
                <div className="text-center mb-4">
                  <TrustBadgeRow className="justify-center" />
                </div>
              )}

              {/* Social Proof for Eligible Claims */}
              {eligible && relevantTestimonial && (
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <p className="text-slate-300 text-sm mb-2">
                      <span className="text-[#00D9B5] font-semibold">{relevantTestimonial.name}</span> recovered {formatCompensationAmount(relevantTestimonial.amountEur, currency, isEURegion)} from {relevantTestimonial.airline}
                    </p>
                    <p className="text-slate-400 text-xs italic">
                      "{relevantTestimonial.quote}"
                    </p>
                    <p className="text-[#00D9B5] text-xs mt-1">
                      ✓ Verified • {relevantTestimonial.timeline}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
              {eligible ? (
                <>
                  <Button
                    onClick={handleFileClaim}
                    className="flex-1 text-lg py-6 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    File My Claim - $49
                  </Button>
                  <Button
                    onClick={handleCheckAnother}
                    variant="outline"
                    className="flex-1 text-lg py-6 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
                    size="lg"
                  >
                    Check Another Flight
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleCheckAnother}
                    className="flex-1 text-lg py-6"
                    size="lg"
                  >
                    Check Another Flight
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="flex-1 text-lg py-6 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
                    size="lg"
                  >
                    Back to Home
                  </Button>
                </>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        {eligible && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">What Happens Next?</CardTitle>
              <CardDescription className="text-slate-400">
                Join 320+ travelers who have successfully claimed their compensation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Submit Your Claim</h3>
                  <p className="text-sm text-slate-400">
                    Pay $49 and provide your details and documents. We handle everything from here.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">We File With Airline</h3>
                  <p className="text-sm text-slate-400">
                    We submit your claim within 48 hours and handle all communication with the airline.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Get Your Money</h3>
                  <p className="text-sm text-slate-400">
                    Receive your compensation in 4-8 weeks. We only get paid if you do.
                  </p>
                </div>
              </div>

              {/* Success Statistics */}
              <div className="mt-8 bg-slate-700/50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#00D9B5]">94%</div>
                    <div className="text-xs text-slate-400">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#00D9B5]">48h</div>
                    <div className="text-xs text-slate-400">Filing Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#00D9B5]">3.2w</div>
                    <div className="text-xs text-slate-400">Avg Processing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#00D9B5]">€450</div>
                    <div className="text-xs text-slate-400">Avg Payout</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guarantee */}
        {eligible && (
          <div className="mt-8 text-center">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">100% Money-Back Guarantee</h3>
              <p className="text-slate-400 mb-4">
                If we're unable to file your claim successfully, you'll receive a full automatic refund.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>If we don't file within 48 hours</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>If claim rejected due to our error</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>If you request refund within 24 hours</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>If flight isn't eligible after payment</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9B5] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  );
}
