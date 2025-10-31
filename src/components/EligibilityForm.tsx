'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FlightPathsAnimation from './FlightPathsAnimation';
import AirlineAutocomplete from './AirlineAutocomplete';
import {
  validateFlightNumber,
  validateAirportCode,
  validateFlightDate,
  validateDelayDuration
} from '@/lib/validation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCompensationRange, getServiceFeeFormatted } from '@/lib/currency';
import { usePostHog } from 'posthog-js/react';
import { apiPost } from '@/lib/api-client';
import { ErrorMessage, RetryingMessage } from '@/components/ErrorMessage';
import type { ErrorCode, ErrorDetails } from '@/lib/error-codes';

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

// API Response types
interface EligibilityResult {
  isEligible: boolean;
  compensationAmount: string;
  regulation: string;
  reason: string;
  message: string;
}

interface CheckEligibilityResponse {
  success: boolean;
  data: {
    flightData: {
      flightNumber: string;
      airline: string;
      departureDate: string;
      departureAirport: string;
      arrivalAirport: string;
      delayDuration: string;
      delayReason?: string;
    };
    eligibility: EligibilityResult;
  };
}

export function EligibilityForm() {
  const router = useRouter();
  const { currency, isEURegion } = useCurrency();
  const posthog = usePostHog();
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
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [retryState, setRetryState] = useState<{ attempt: number; max: number } | null>(null);
  const [parsedFlight, setParsedFlight] = useState<Partial<EligibilityFormData> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [fieldValid, setFieldValid] = useState<{ [key: string]: boolean }>({});

  const handleInputChange = (field: keyof EligibilityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setErrorCode(null);
    setErrorDetails(null);
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field: keyof EligibilityFormData, value: string) => {
    let result: { valid: boolean; error?: string; normalized?: string } = { valid: true };

    switch (field) {
      case 'flightNumber':
        result = validateFlightNumber(value);
        break;
      case 'departureAirport':
      case 'arrivalAirport':
        result = validateAirportCode(value);
        break;
      case 'departureDate':
        result = validateFlightDate(value);
        break;
      case 'delayDuration':
        result = validateDelayDuration(value);
        // If normalized value is different, update form data
        if (result.normalized && result.normalized !== value) {
          setFormData(prev => ({ ...prev, [field]: result.normalized || value }));
        }
        break;
    }

    // Track validation errors
    if (!result.valid && result.error) {
      posthog.capture('eligibility_validation_error', {
        field,
        error: result.error,
        value: value.substring(0, 20), // Only first 20 chars for privacy
      });
    }

    setFieldErrors(prev => ({ ...prev, [field]: result.error || '' }));
    setFieldValid(prev => ({ ...prev, [field]: result.valid }));
    return result.valid;
  };

  const handleEmailParse = async () => {
    if (!formData.emailText.trim()) {
      setError('Please paste your flight confirmation email');
      return;
    }

    // Track email parse attempt
    posthog.capture('eligibility_email_parse_started', {
      emailLength: formData.emailText.length,
      timestamp: new Date().toISOString(),
    });

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
      console.log('📧 Email parsing response:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        console.log('📧 Parsed flight data:', JSON.stringify(data.data, null, 2));

        // Track successful email parse
        posthog.capture('eligibility_email_parse_success', {
          airline: data.data.airline || '',
          hasFlightNumber: !!(data.data.flightNumber || data.data.flight_number),
          hasDate: !!(data.data.departureDate || data.data.date),
          hasAirports: !!(data.data.departureAirport && data.data.arrivalAirport),
          fieldsExtracted: Object.keys(data.data).length,
        });

        // Pre-fill manual form with parsed data (handle both camelCase and snake_case)
        setFormData(prev => ({
          ...prev,
          flightNumber: data.data.flightNumber || data.data.flight_number || '',
          airline: data.data.airline || '',
          departureDate: data.data.departureDate || data.data.date || '',
          departureAirport: data.data.departureAirport || data.data.departure_airport || '',
          arrivalAirport: data.data.arrivalAirport || data.data.arrival_airport || '',
          delayDuration: data.data.delayDuration || data.data.delay_duration || '',
          delayReason: data.data.delayReason || data.data.delay_reason || '',
        }));
        setParsedFlight(data.data);
        setInputMethod('manual');
      } else {
        console.log('❌ Email parsing failed:', data.error);

        // Track failed email parse
        posthog.capture('eligibility_email_parse_failure', {
          reason: data.error || 'unknown',
          emailLength: formData.emailText.length,
        });

        setError('Could not extract flight details. Please enter them manually.');
        setInputMethod('manual');
      }
    } catch (error: unknown) {
      console.error('Error parsing email:', error);

      // Track email parse error
      posthog.capture('eligibility_email_parse_failure', {
        reason: 'exception',
        error: error instanceof Error ? error.message : String(error),
      });

      setError('Failed to parse email. Please enter details manually.');
      setInputMethod('manual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEligibility = async () => {
    // Validate all fields with comprehensive validation
    const fieldsToValidate: (keyof EligibilityFormData)[] = [
      'flightNumber',
      'departureDate',
      'departureAirport',
      'arrivalAirport',
      'delayDuration'
    ];

    let hasErrors = false;
    const newFieldErrors: { [key: string]: string } = {};

    // Validate each field
    for (const field of fieldsToValidate) {
      const isValid = validateField(field, formData[field]);
      if (!isValid) {
        hasErrors = true;
      }
    }

    // Check airline separately (it's not in validation functions)
    if (!formData.airline?.trim()) {
      newFieldErrors.airline = 'Airline is required';
      setFieldErrors(prev => ({ ...prev, airline: 'Airline is required' }));
      hasErrors = true;
    }

    if (hasErrors) {
      setError('Please correct the errors above before continuing');

      // Track form submission with validation errors
      posthog.capture('eligibility_check_validation_failed', {
        errorCount: Object.keys(newFieldErrors).length + Object.keys(fieldErrors).length,
        fields: Object.keys(newFieldErrors),
      });

      return;
    }

    // Track eligibility check submission
    posthog.capture('eligibility_check_submitted', {
      airline: formData.airline,
      departureAirport: formData.departureAirport,
      arrivalAirport: formData.arrivalAirport,
      delayDuration: formData.delayDuration,
      hasDelayReason: !!formData.delayReason,
      usedEmailParse: !!parsedFlight,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setError('');
    setErrorCode(null);
    setErrorDetails(null);
    setRetryState(null);

    const requestData = {
      flightNumber: formData.flightNumber,
      airline: formData.airline,
      departureDate: formData.departureDate,
      departureAirport: formData.departureAirport,
      arrivalAirport: formData.arrivalAirport,
      delayDuration: formData.delayDuration,
      delayReason: formData.delayReason
    };

    console.log('🚀 Frontend - Sending eligibility check request:', JSON.stringify(requestData, null, 2));

    // Make API request with automatic retry and error handling
    const response = await apiPost<CheckEligibilityResponse>(
      '/api/check-eligibility',
      requestData,
      {
        timeout: 30000, // 30 second timeout
        maxRetries: 2, // Retry up to 2 times on transient failures
        retryDelay: 1000, // 1 second between retries
        errorContext: {
          airline: formData.airline,
          route: `${formData.departureAirport}-${formData.arrivalAirport}`,
          delayDuration: formData.delayDuration,
        },
        onRetry: (attempt, max) => {
          console.log(`🔄 Retrying eligibility check... Attempt ${attempt}/${max}`);
          setRetryState({ attempt, max });
        },
      }
    );

    setIsLoading(false);
    setRetryState(null);

    console.log('📥 Frontend - Received response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✅ Frontend - Eligibility check successful');

      const eligibilityData = response.data.data.eligibility;

      // Track successful eligibility check
      posthog.capture('eligibility_check_completed', {
        eligible: eligibilityData.isEligible,
        amount: eligibilityData.compensationAmount,
        regulation: eligibilityData.regulation,
        airline: formData.airline,
        departureAirport: formData.departureAirport,
        arrivalAirport: formData.arrivalAirport,
        delayDuration: formData.delayDuration,
      });

      // Navigate to results page with data
      const params = new URLSearchParams({
        eligible: eligibilityData.isEligible.toString(),
        amount: eligibilityData.compensationAmount,
        message: eligibilityData.message,
        regulation: eligibilityData.regulation,
        reason: eligibilityData.reason || '',
        flightNumber: formData.flightNumber,
        airline: formData.airline,
        departureDate: formData.departureDate,
        departureAirport: formData.departureAirport,
        arrivalAirport: formData.arrivalAirport,
        delayDuration: formData.delayDuration
      });

      router.push(`/results?${params.toString()}`);
    } else {
      console.log('❌ Frontend - Eligibility check failed:', response.errorCode);

      // Track eligibility check failure
      posthog.capture('eligibility_check_failed', {
        errorCode: response.errorCode,
        errorCategory: response.errorDetails.category,
        errorSeverity: response.errorDetails.severity,
        airline: formData.airline,
        departureAirport: formData.departureAirport,
        arrivalAirport: formData.arrivalAirport,
      });

      // Set error state for ErrorMessage component
      setErrorCode(response.errorCode);
      setErrorDetails(response.errorDetails);
      setError(response.errorDetails.userMessage);
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
                  <span className="text-[#00D9B5]">Get Your {formatCompensationRange(250, 600, currency, isEURegion)}</span>
                  <br />
                  Compensation in 30 Days
                </h1>

                <p className="text-lg text-slate-400">
                  We handle the airline paperwork so you don't have to.
                  <br />
                  <span className="text-[#00D9B5] font-semibold">Pay {getServiceFeeFormatted(currency)} upfront with 100% money-back guarantee.</span>
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
                        <div className="relative">
                          <Input
                            id="flightNumber"
                            value={formData.flightNumber}
                            onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                            onBlur={(e) => validateField('flightNumber', e.target.value)}
                            placeholder="e.g., BA123"
                            className={`mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5] ${
                              fieldErrors.flightNumber ? 'border-red-500' : fieldValid.flightNumber ? 'border-green-500' : ''
                            }`}
                          />
                          {fieldValid.flightNumber && !fieldErrors.flightNumber && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                          )}
                        </div>
                        {fieldErrors.flightNumber && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.flightNumber}</p>
                        )}
                      </div>
                      
                      <div>
                        <AirlineAutocomplete
                          value={formData.airline}
                          onChange={(value) => {
                            handleInputChange('airline', value);
                            // Mark airline as valid when it has content
                            if (value.trim().length >= 2) {
                              setFieldValid(prev => ({ ...prev, airline: true }));
                              setFieldErrors(prev => ({ ...prev, airline: '' }));
                            } else {
                              setFieldValid(prev => ({ ...prev, airline: false }));
                            }
                          }}
                          onBlur={(value) => {
                            // Validate on blur
                            if (!value.trim()) {
                              setFieldErrors(prev => ({ ...prev, airline: 'Airline is required' }));
                              setFieldValid(prev => ({ ...prev, airline: false }));
                            } else if (value.trim().length < 2) {
                              setFieldErrors(prev => ({ ...prev, airline: 'Please enter at least 2 characters' }));
                              setFieldValid(prev => ({ ...prev, airline: false }));
                            }
                          }}
                          label="Airline"
                          required={true}
                          placeholder="e.g., British Airways, BA"
                          isValid={fieldValid.airline}
                          error={fieldErrors.airline}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="departureDate" className="text-sm font-medium text-white">
                          Departure Date *
                        </Label>
                        <div className="relative">
                          <Input
                            id="departureDate"
                            type="date"
                            value={formData.departureDate}
                            onChange={(e) => handleInputChange('departureDate', e.target.value)}
                            onBlur={(e) => validateField('departureDate', e.target.value)}
                            className={`mt-1 bg-slate-800/50 border-slate-700 text-white focus:border-[#00D9B5] ${
                              fieldErrors.departureDate ? 'border-red-500' : fieldValid.departureDate ? 'border-green-500' : ''
                            }`}
                          />
                          {fieldValid.departureDate && !fieldErrors.departureDate && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                          )}
                        </div>
                        {fieldErrors.departureDate && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.departureDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="delayDuration" className="text-sm font-medium text-white">
                          Delay Duration *
                        </Label>
                        <div className="relative">
                          <Input
                            id="delayDuration"
                            value={formData.delayDuration}
                            onChange={(e) => handleInputChange('delayDuration', e.target.value)}
                            onBlur={(e) => validateField('delayDuration', e.target.value)}
                            placeholder="e.g., 4 hours"
                            className={`mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5] ${
                              fieldErrors.delayDuration ? 'border-red-500' : fieldValid.delayDuration ? 'border-green-500' : ''
                            }`}
                          />
                          {fieldValid.delayDuration && !fieldErrors.delayDuration && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                          )}
                        </div>
                        {fieldErrors.delayDuration && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.delayDuration}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="departureAirport" className="text-sm font-medium text-white">
                          Departure Airport *
                        </Label>
                        <div className="relative">
                          <Input
                            id="departureAirport"
                            value={formData.departureAirport}
                            onChange={(e) => handleInputChange('departureAirport', e.target.value.toUpperCase())}
                            onBlur={(e) => validateField('departureAirport', e.target.value)}
                            placeholder="e.g., LHR"
                            maxLength={3}
                            className={`mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5] ${
                              fieldErrors.departureAirport ? 'border-red-500' : fieldValid.departureAirport ? 'border-green-500' : ''
                            }`}
                          />
                          {fieldValid.departureAirport && !fieldErrors.departureAirport && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                          )}
                        </div>
                        {fieldErrors.departureAirport && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.departureAirport}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="arrivalAirport" className="text-sm font-medium text-white">
                          Arrival Airport *
                        </Label>
                        <div className="relative">
                          <Input
                            id="arrivalAirport"
                            value={formData.arrivalAirport}
                            onChange={(e) => handleInputChange('arrivalAirport', e.target.value.toUpperCase())}
                            onBlur={(e) => validateField('arrivalAirport', e.target.value)}
                            placeholder="e.g., JFK"
                            maxLength={3}
                            className={`mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5] ${
                              fieldErrors.arrivalAirport ? 'border-red-500' : fieldValid.arrivalAirport ? 'border-green-500' : ''
                            }`}
                          />
                          {fieldValid.arrivalAirport && !fieldErrors.arrivalAirport && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                          )}
                        </div>
                        {fieldErrors.arrivalAirport && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.arrivalAirport}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delayReason" className="text-sm font-medium text-white">
                        Reason for Delay (Optional)
                      </Label>
                      <div className="relative">
                        <Input
                          id="delayReason"
                          value={formData.delayReason}
                          onChange={(e) => {
                            handleInputChange('delayReason', e.target.value);
                            // For optional field, mark as valid when it has content
                            if (e.target.value.trim()) {
                              setFieldValid(prev => ({ ...prev, delayReason: true }));
                            } else {
                              setFieldValid(prev => ({ ...prev, delayReason: false }));
                            }
                          }}
                          placeholder="e.g., Technical issues, weather"
                          className={`mt-1 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#00D9B5] ${
                            formData.delayReason.trim() ? 'border-green-500' : ''
                          }`}
                        />
                        {formData.delayReason.trim() && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Retry State Message */}
                {retryState && (
                  <RetryingMessage
                    attempt={retryState.attempt}
                    maxAttempts={retryState.max}
                  />
                )}

                {/* Error Message with Error Codes */}
                {errorCode && errorDetails && (
                  <ErrorMessage
                    errorCode={errorCode}
                    errorDetails={errorDetails}
                    context={{
                      airline: formData.airline,
                      route: `${formData.departureAirport}-${formData.arrivalAirport}`,
                      delayDuration: formData.delayDuration,
                    }}
                    onRetry={errorDetails.retryable ? handleCheckEligibility : undefined}
                  />
                )}

                {/* Fallback simple error for validation errors */}
                {error && !errorCode && (
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
