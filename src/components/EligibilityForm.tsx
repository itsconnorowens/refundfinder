'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FlightPathsAnimation from './FlightPathsAnimation';

interface EligibilityFormData {
  // Option 1: Email paste
  emailText: string;
  
  // Option 2: Manual entry
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason: string;
}

export function EligibilityForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<EligibilityFormData>({
    emailText: '',
    flightNumber: '',
    airline: '',
    departureDate: '',
    departureAirport: '',
    arrivalAirport: '',
    delayDuration: '',
    delayReason: ''
  });
  
  const [inputMethod, setInputMethod] = useState<'email' | 'manual'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [parsedFlight, setParsedFlight] = useState<Partial<EligibilityFormData> | null>(null);

  const handleInputChange = (field: keyof EligibilityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleEmailParse = async () => {
    if (!formData.emailText.trim()) {
      setError('Please paste your flight confirmation email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/parse-flight-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailText: formData.emailText
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Pre-fill manual form with parsed data
        setFormData(prev => ({
          ...prev,
          flightNumber: data.data.flightNumber || '',
          airline: data.data.airline || '',
          departureDate: data.data.departureDate || '',
          departureAirport: data.data.departureAirport || '',
          arrivalAirport: data.data.arrivalAirport || '',
          delayDuration: data.data.delayDuration || '',
          delayReason: data.data.delayReason || '',
        }));
        setParsedFlight(data.data);
        setInputMethod('manual');
      } else {
        setError('Could not extract flight details. Please enter them manually.');
        setInputMethod('manual');
      }
    } catch (error) {
      console.error('Error parsing email:', error);
      setError('Failed to parse email. Please enter details manually.');
      setInputMethod('manual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEligibility = async () => {
    // Validate required fields with better error messages
    const missingFields = [];
    if (!formData.flightNumber?.trim()) missingFields.push('Flight Number');
    if (!formData.airline?.trim()) missingFields.push('Airline');
    if (!formData.departureDate?.trim()) missingFields.push('Departure Date');
    if (!formData.departureAirport?.trim()) missingFields.push('Departure Airport');
    if (!formData.arrivalAirport?.trim()) missingFields.push('Arrival Airport');
    if (!formData.delayDuration?.trim()) missingFields.push('Delay Duration');
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: formData.flightNumber,
          airline: formData.airline,
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport,
          delayDuration: formData.delayDuration,
          delayReason: formData.delayReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to results page with data
        const params = new URLSearchParams({
          eligible: data.result.eligible.toString(),
          amount: data.result.amount,
          message: data.result.message,
          regulation: data.result.regulation,
          reason: data.result.reason || '',
          flightNumber: formData.flightNumber,
          airline: formData.airline,
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport,
          delayDuration: formData.delayDuration
        });
        
        router.push(`/results?${params.toString()}`);
      } else {
        const errorMessage = data.message || data.error || 'Failed to check eligibility';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Failed to check eligibility. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Animation (z-0) */}
      <div className="absolute inset-0 z-0">
        <FlightPathsAnimation />
      </div>

      {/* Gradient Overlay (z-5) - Lighter to show animation */}
      <div className="absolute inset-0 z-5 bg-linear-to-br from-slate-950/30 via-slate-950/10 to-slate-950/40" />

      {/* Content with Floating Card (z-20) */}
      <div className="relative z-20 container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="flex items-center justify-center min-h-screen py-12">
          <div className="max-w-2xl w-full">
            {/* Floating Card */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12">
              <div className="text-center space-y-6">
                <div className="inline-block px-4 py-2 bg-[#00D9B5]/10 border border-[#00D9B5]/30 rounded-full text-[#00D9B5] text-sm font-semibold mb-4">
                  🚀 Join 320+ Travelers Who Got Paid
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  Flight Delayed 3+ Hours?
                  <br />
                  <span className="text-[#00D9B5]">Get Your €250-€600</span>
                  <br />
                  Compensation in 30 Days
                </h1>

                <p className="text-lg text-slate-400">
                  We handle the airline paperwork so you don't have to. 
                  <br />
                  <span className="text-[#00D9B5] font-semibold">Pay $49 upfront with 100% money-back guarantee.</span>
                </p>

                {/* Input Method Selection */}
                <div className="flex space-x-2 bg-slate-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setInputMethod('email')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      inputMethod === 'email'
                        ? 'bg-[#00D9B5] text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Email
                  </button>
                  <button
                    onClick={() => setInputMethod('manual')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      inputMethod === 'manual'
                        ? 'bg-[#00D9B5] text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Enter Manually
                  </button>
                </div>

                {/* Email Paste Option */}
                {inputMethod === 'email' && (
                  <div className="space-y-4">
                    <Textarea
                      value={formData.emailText}
                      onChange={(e) => handleInputChange('emailText', e.target.value)}
                      placeholder="Paste your flight confirmation email here..."
                      className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                    />
                    <Button
                      onClick={handleEmailParse}
                      disabled={isLoading || !formData.emailText.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Parsing...' : 'Extract Flight Details'}
                    </Button>
                  </div>
                )}

                {/* Manual Entry Option */}
                {inputMethod === 'manual' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="flightNumber" className="text-sm font-medium text-white">
                          Flight Number *
                        </Label>
                        <Input
                          id="flightNumber"
                          value={formData.flightNumber}
                          onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                          placeholder="e.g., BA123"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="airline" className="text-sm font-medium text-white">
                          Airline *
                        </Label>
                        <Input
                          id="airline"
                          value={formData.airline}
                          onChange={(e) => handleInputChange('airline', e.target.value)}
                          placeholder="e.g., British Airways"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="departureDate" className="text-sm font-medium text-white">
                          Departure Date *
                        </Label>
                        <Input
                          id="departureDate"
                          type="date"
                          value={formData.departureDate}
                          onChange={(e) => handleInputChange('departureDate', e.target.value)}
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white focus:border-[#00D9B5]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="delayDuration" className="text-sm font-medium text-white">
                          Delay Duration *
                        </Label>
                        <Input
                          id="delayDuration"
                          value={formData.delayDuration}
                          onChange={(e) => handleInputChange('delayDuration', e.target.value)}
                          placeholder="e.g., 4 hours"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="departureAirport" className="text-sm font-medium text-white">
                          Departure Airport *
                        </Label>
                        <Input
                          id="departureAirport"
                          value={formData.departureAirport}
                          onChange={(e) => handleInputChange('departureAirport', e.target.value.toUpperCase())}
                          placeholder="e.g., LHR"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="arrivalAirport" className="text-sm font-medium text-white">
                          Arrival Airport *
                        </Label>
                        <Input
                          id="arrivalAirport"
                          value={formData.arrivalAirport}
                          onChange={(e) => handleInputChange('arrivalAirport', e.target.value.toUpperCase())}
                          placeholder="e.g., JFK"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delayReason" className="text-sm font-medium text-white">
                        Reason for Delay (Optional)
                      </Label>
                      <Input
                        id="delayReason"
                        value={formData.delayReason}
                        onChange={(e) => handleInputChange('delayReason', e.target.value)}
                        placeholder="e.g., Technical issues, weather"
                        className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5]"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}

                {/* Parsed Flight Info */}
                {parsedFlight && (
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-green-400 font-medium mb-2">✓ Flight Details Extracted</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-300">
                      <div>Flight: {parsedFlight.flightNumber}</div>
                      <div>Airline: {parsedFlight.airline}</div>
                      <div>Date: {parsedFlight.departureDate}</div>
                      <div>Route: {parsedFlight.departureAirport} → {parsedFlight.arrivalAirport}</div>
                    </div>
                    <p className="text-sm text-green-400 mt-2">
                      Please add the delay duration to continue.
                    </p>
                  </div>
                )}

                {/* Check Eligibility Button */}
                <Button
                  onClick={handleCheckEligibility}
                  disabled={isLoading || (inputMethod === 'manual' && (!formData.flightNumber || !formData.airline || !formData.departureDate || !formData.departureAirport || !formData.arrivalAirport || !formData.delayDuration))}
                  className="w-full px-6 py-4 bg-[#00D9B5] text-slate-950 font-bold text-lg rounded-lg hover:bg-[#00BF9F] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9B5]/40"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950 mr-2"></div>
                      Checking Eligibility...
                    </>
                  ) : (
                    'Check My Eligibility'
                  )}
                </Button>

                <p className="text-sm text-slate-500">
                  ✓ Free eligibility check • ✓ No credit card required • ✓ Secure & private
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
