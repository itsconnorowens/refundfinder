'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plane } from 'lucide-react';

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

export default function CheckEligibilityPage() {
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
          flightNumber: data.data.flight_number || '',
          airline: data.data.airline || '',
          departureDate: data.data.date || '',
          departureAirport: data.data.departure_airport || '',
          arrivalAirport: data.data.arrival_airport || '',
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
    // Validate required fields
    if (!formData.flightNumber || !formData.airline || !formData.departureDate || 
        !formData.departureAirport || !formData.arrivalAirport || !formData.delayDuration) {
      setError('Please fill in all required fields');
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
        setError(data.error || 'Failed to check eligibility');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Failed to check eligibility. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Check Your Flight Eligibility
          </h1>
          <p className="text-xl text-slate-400">
            Find out if you're entitled to compensation for your delayed flight
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Flight Details</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your flight information to check eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Method Selection */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={inputMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setInputMethod('email')}
                  className="flex-1"
                >
                  Paste Email
                </Button>
                <Button
                  variant={inputMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setInputMethod('manual')}
                  className="flex-1"
                >
                  Enter Manually
                </Button>
              </div>
            </div>

            {/* Email Paste Option */}
            {inputMethod === 'email' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailText" className="text-sm font-medium text-white">
                    Flight Confirmation Email
                  </Label>
                  <Textarea
                    id="emailText"
                    value={formData.emailText}
                    onChange={(e) => handleInputChange('emailText', e.target.value)}
                    placeholder="Paste your flight confirmation email here..."
                    className="mt-2 min-h-[200px] bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    We'll automatically extract flight details from your email
                  </p>
                </div>
                
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
              <div className="space-y-6">
                {/* Flight Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="flightNumber" className="text-sm font-medium text-white">
                      Flight Number *
                    </Label>
                    <Input
                      id="flightNumber"
                      value={formData.flightNumber}
                      onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                      placeholder="e.g., AA1234"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
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
                      placeholder="e.g., American Airlines"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
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
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
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
                      placeholder="e.g., 4 hours, 3.5 hours, 180 minutes"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
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
                      placeholder="e.g., JFK"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
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
                      placeholder="e.g., LAX"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Delay Reason */}
                <div>
                  <Label htmlFor="delayReason" className="text-sm font-medium text-white">
                    Reason for Delay (Optional)
                  </Label>
                  <Input
                    id="delayReason"
                    value={formData.delayReason}
                    onChange={(e) => handleInputChange('delayReason', e.target.value)}
                    placeholder="e.g., Technical issues, weather, crew delay"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    This helps us determine if extraordinary circumstances apply
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
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
                  Please review and add the delay duration to continue.
                </p>
              </div>
            )}

            {/* Check Eligibility Button */}
            <Button
              onClick={handleCheckEligibility}
              disabled={isLoading || inputMethod === 'manual' && (!formData.flightNumber || !formData.airline || !formData.departureDate || !formData.departureAirport || !formData.arrivalAirport || !formData.delayDuration)}
              className="w-full text-lg py-6"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Checking Eligibility...
                </>
              ) : (
                <>
                  <Plane className="w-5 h-5 mr-2" />
                  Check My Eligibility
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="text-center text-sm text-slate-400">
              <p>
                We check eligibility based on EU261 and US DOT regulations. 
                This is a free service with no obligation to file a claim.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
