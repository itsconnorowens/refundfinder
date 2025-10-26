'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import StripeProvider from '@/components/StripeProvider';
import PaymentStep from '@/components/PaymentStep';

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  
  // Step 2: Flight Details
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason: string;
  disruptionType?: 'delay' | 'cancellation';
  noticeGiven?: string;
  alternativeOffered?: boolean;
  alternativeTiming?: string;
  
  // Step 3: Verification
  verificationStatus?: 'pending' | 'verified' | 'unverified' | 'failed' | 'manual';
  verificationConfidence?: number;
  verificationMessage?: string;
  actualDelayMinutes?: number;
  
  // Step 4: Documentation
  boardingPass: File | null;
  delayProof: File | null;
  boardingPassUrl?: string;
  delayProofUrl?: string;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Your contact details' },
  { id: 2, title: 'Flight Details', description: 'Flight information' },
  { id: 3, title: 'Verification', description: 'Verify flight status' },
  { id: 4, title: 'Documentation', description: 'Upload required documents' },
  { id: 5, title: 'Review', description: 'Review your claim' },
  { id: 6, title: 'Payment', description: 'Secure payment' }
];

export default function ClaimSubmissionForm() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    flightNumber: '',
    airline: '',
    departureDate: '',
    departureAirport: '',
    arrivalAirport: '',
    delayDuration: '',
    delayReason: '',
    boardingPass: null,
    delayProof: null
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<string>('');
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});

  // Load form data from localStorage on mount and pre-fill from URL params
  useEffect(() => {
    // First, try to pre-fill from URL parameters
    const urlFlightNumber = searchParams.get('flightNumber');
    const urlAirline = searchParams.get('airline');
    const urlDepartureDate = searchParams.get('departureDate');
    const urlDepartureAirport = searchParams.get('departureAirport');
    const urlArrivalAirport = searchParams.get('arrivalAirport');
    const urlDelayDuration = searchParams.get('delayDuration');
    const urlDisruptionType = searchParams.get('disruptionType') as 'delay' | 'cancellation' | null;
    const urlNoticeGiven = searchParams.get('noticeGiven');
    const urlAlternativeOffered = searchParams.get('alternativeOffered') === 'true';
    const urlAlternativeTiming = searchParams.get('alternativeTiming');

    if (urlFlightNumber || urlAirline || urlDepartureDate) {
      // Pre-fill from URL parameters
      setFormData(prev => ({
        ...prev,
        flightNumber: urlFlightNumber || prev.flightNumber,
        airline: urlAirline || prev.airline,
        departureDate: urlDepartureDate || prev.departureDate,
        departureAirport: urlDepartureAirport || prev.departureAirport,
        arrivalAirport: urlArrivalAirport || prev.arrivalAirport,
        delayDuration: urlDelayDuration || prev.delayDuration,
        disruptionType: urlDisruptionType || prev.disruptionType,
        noticeGiven: urlNoticeGiven || prev.noticeGiven,
        alternativeOffered: urlAlternativeOffered || prev.alternativeOffered,
        alternativeTiming: urlAlternativeTiming || prev.alternativeTiming,
        verificationStatus: 'pending'
      }));
    } else {
      // Fall back to localStorage
      const savedData = localStorage.getItem('claimFormData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
  }, [searchParams]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('claimFormData', JSON.stringify(formData));
  }, [formData]);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step === 2) {
      if (!formData.flightNumber.trim()) newErrors.flightNumber = 'Flight number is required';
      if (!formData.airline.trim()) newErrors.airline = 'Airline is required';
      if (!formData.departureDate) newErrors.departureDate = 'Departure date is required';
      if (!formData.departureAirport.trim()) newErrors.departureAirport = 'Departure airport is required';
      if (!formData.arrivalAirport.trim()) newErrors.arrivalAirport = 'Arrival airport is required';
      if (!formData.delayDuration.trim()) newErrors.delayDuration = 'Delay duration is required';
    }

    if (step === 3) {
      // Verification step - no validation required
    }

    if (step === 4) {
      if (!formData.boardingPass) newErrors.boardingPass = 'Boarding pass is required';
      if (!formData.delayProof) newErrors.delayProof = 'Delay proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // If moving from step 2 to step 3, perform flight verification
      if (currentStep === 2) {
        await performFlightVerification();
      }
      
      // If moving from review to payment, create payment intent
      if (currentStep === 5 && !paymentClientSecret) {
        await createPaymentIntent();
      }
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const createPaymentIntent = async () => {
    setIsCreatingPaymentIntent(true);
    try {
      // Generate claim ID if not already created
      const newClaimId = `claim-${Date.now()}`;
      setClaimId(newClaimId);

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          claimId: newClaimId,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setPaymentClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const performFlightVerification = async () => {
    try {
      // Parse delay duration to get hours
      const delayMatch = formData.delayDuration.match(/(\d+(?:\.\d+)?)\s*hours?/);
      const delayHours = delayMatch ? parseFloat(delayMatch[1]) : 0;

      const response = await fetch('/api/verify-flight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: formData.flightNumber,
          flightDate: formData.departureDate,
          userReportedDelay: delayHours,
          userReportedType: formData.disruptionType || 'delay',
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify flight');
      }

      const verificationResult = await response.json();
      
      // Update form data with verification results
      setFormData(prev => ({
        ...prev,
        verificationStatus: verificationResult.status,
        verificationConfidence: verificationResult.confidence,
        verificationMessage: verificationResult.message,
        actualDelayMinutes: verificationResult.actualData?.delayMinutes
      }));

    } catch (error) {
      console.error('Flight verification error:', error);
      // Set verification as failed but allow user to proceed
      setFormData(prev => ({
        ...prev,
        verificationStatus: 'failed',
        verificationConfidence: 0,
        verificationMessage: 'Unable to verify flight status. Proceeding with your reported information.'
      }));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = async (file: File, type: 'boardingPass' | 'delayProof') => {
    // Clear any existing errors
    setErrors(prev => ({ ...prev, [type]: '' }));

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [type]: 'Please upload a PDF, JPG, or PNG file' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [type]: 'File size must be less than 5MB' }));
      return;
    }

    // Additional validation for image quality
    if (file.type.startsWith('image/')) {
      // Check if image is too small (less than 100KB might be too compressed)
      if (file.size < 100 * 1024) {
        setErrors(prev => ({ ...prev, [type]: 'Image quality appears too low. Please upload a higher quality image.' }));
        return;
      }
    }

    // Check filename for obvious issues
    if (file.name.length > 100) {
      setErrors(prev => ({ ...prev, [type]: 'Filename is too long. Please rename the file.' }));
      return;
    }

    setIsUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', type);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Store both the file object and the uploaded URL
        setFormData(prev => ({
          ...prev,
          [type]: file,
          [`${type}Url`]: result.url
        }));
        setErrors(prev => ({ ...prev, [type]: '' }));
        
        // Show success message
        console.log(`${type} uploaded successfully`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({ 
        ...prev, 
        [type]: 'Failed to upload file. Please try again.' 
      }));
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'boardingPass' | 'delayProof') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(type);
    } else if (e.type === 'dragleave') {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'boardingPass' | 'delayProof') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], type);
    }
  };

  const removeFile = (type: 'boardingPass' | 'delayProof') => {
    setFormData(prev => ({
      ...prev,
      [type]: null,
      [`${type}Url`]: undefined
    }));
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSubmitting(true);
    
    try {
      // Validate that files have been uploaded
      if (!formData.boardingPassUrl || !formData.delayProofUrl) {
        alert('Please ensure all files have been uploaded successfully before proceeding.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/create-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          flightNumber: formData.flightNumber,
          airline: formData.airline,
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport,
          delayDuration: formData.delayDuration,
          delayReason: formData.delayReason,
          paymentIntentId: paymentIntentId,
          boardingPassUrl: formData.boardingPassUrl,
          delayProofUrl: formData.delayProofUrl,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear form data from localStorage
        localStorage.removeItem('claimFormData');
        // Show success message
        alert(`✅ Claim submitted successfully!\n\n${result.message}\n\n${result.refundGuarantee}\n\nClaim ID: ${result.claimId}`);
        // Could redirect to a success page here
        window.location.href = '/';
      } else {
        throw new Error(result.error || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please contact support with your payment confirmation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  We&apos;ll use this to send you updates about your claim
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Flight Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flightNumber" className="text-sm font-medium">
                    Flight Number *
                  </Label>
                  <Input
                    id="flightNumber"
                    value={formData.flightNumber}
                    onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                    className={errors.flightNumber ? 'border-red-500' : ''}
                    placeholder="e.g., AA1234"
                  />
                  {errors.flightNumber && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.flightNumber}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="airline" className="text-sm font-medium">
                    Airline *
                  </Label>
                  <Input
                    id="airline"
                    value={formData.airline}
                    onChange={(e) => handleInputChange('airline', e.target.value)}
                    className={errors.airline ? 'border-red-500' : ''}
                    placeholder="e.g., American Airlines"
                  />
                  {errors.airline && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.airline}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="departureDate" className="text-sm font-medium">
                    Departure Date *
                  </Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    className={errors.departureDate ? 'border-red-500' : ''}
                  />
                  {errors.departureDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.departureDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="delayDuration" className="text-sm font-medium">
                    Delay Duration *
                  </Label>
                  <Input
                    id="delayDuration"
                    value={formData.delayDuration}
                    onChange={(e) => handleInputChange('delayDuration', e.target.value)}
                    className={errors.delayDuration ? 'border-red-500' : ''}
                    placeholder="e.g., 4 hours, 30 minutes"
                  />
                  {errors.delayDuration && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.delayDuration}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureAirport" className="text-sm font-medium">
                    Departure Airport *
                  </Label>
                  <Input
                    id="departureAirport"
                    value={formData.departureAirport}
                    onChange={(e) => handleInputChange('departureAirport', e.target.value)}
                    className={errors.departureAirport ? 'border-red-500' : ''}
                    placeholder="e.g., JFK"
                  />
                  {errors.departureAirport && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.departureAirport}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="arrivalAirport" className="text-sm font-medium">
                    Arrival Airport *
                  </Label>
                  <Input
                    id="arrivalAirport"
                    value={formData.arrivalAirport}
                    onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
                    className={errors.arrivalAirport ? 'border-red-500' : ''}
                    placeholder="e.g., LAX"
                  />
                  {errors.arrivalAirport && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.arrivalAirport}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="delayReason" className="text-sm font-medium">
                  Reason for Delay (Optional)
                </Label>
                <Input
                  id="delayReason"
                  value={formData.delayReason}
                  onChange={(e) => handleInputChange('delayReason', e.target.value)}
                  placeholder="e.g., Technical issues, weather, etc."
                />
                <p className="text-gray-500 text-sm mt-1">
                  Any additional information about why your flight was delayed
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Flight Verification</h3>
                <p className="text-gray-600">We're verifying your flight information...</p>
              </div>

              {formData.verificationStatus === 'pending' && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Verifying flight status...</span>
                </div>
              )}

              {formData.verificationStatus && formData.verificationStatus !== 'pending' && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start">
                    {formData.verificationStatus === 'verified' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                    ) : formData.verificationStatus === 'unverified' ? (
                      <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {formData.verificationStatus === 'verified' ? 'Flight Verified' : 
                         formData.verificationStatus === 'unverified' ? 'Partial Verification' : 
                         'Verification Failed'}
                      </h4>
                      <p className="text-gray-600 mb-3">{formData.verificationMessage}</p>
                      
                      {formData.verificationConfidence && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Confidence Level</span>
                            <span>{formData.verificationConfidence}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                formData.verificationConfidence >= 80 ? 'bg-green-500' :
                                formData.verificationConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${formData.verificationConfidence}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {formData.actualDelayMinutes && (
                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm text-gray-600 mb-1">Actual Flight Data:</p>
                          <p className="font-medium">
                            Delay: {Math.round(formData.actualDelayMinutes / 60 * 10) / 10} hours
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your claim will be filed with the airline within 48 hours</li>
                  <li>• You'll receive email updates at every step</li>
                  <li>• We'll handle all paperwork and follow-up</li>
                  <li>• If verification failed, we'll manually review your case</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Documentation */}
          {currentStep === 4 && (
            <div className="space-y-8">
              {/* Document Upload Guidance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Document Upload Guide</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Boarding Pass Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1 mb-3">
                      <li>• Must show flight number, date, and passenger name</li>
                      <li>• Must show departure and arrival airports</li>
                      <li>• Can be digital (PDF) or photo of physical pass</li>
                      <li>• Must be readable and not blurry</li>
                    </ul>
                    <div className="bg-white rounded p-3 border">
                      <p className="text-xs text-gray-600 mb-1">Example boarding pass should show:</p>
                      <p className="text-sm font-medium">Flight: AA1234 • Date: 15 Jan 2024 • Name: John Doe</p>
                      <p className="text-sm font-medium">Route: JFK → LAX</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Delay/Cancellation Proof</h4>
                    <ul className="text-sm text-blue-800 space-y-1 mb-3">
                      <li>• Screenshots of airline app/website</li>
                      <li>• Email notifications from airline</li>
                      <li>• Airport departure board photos</li>
                      <li>• Must show flight number, date, and status</li>
                    </ul>
                    <div className="bg-white rounded p-3 border">
                      <p className="text-xs text-gray-600 mb-1">Example proof should show:</p>
                      <p className="text-sm font-medium">Flight AA1234 • Delayed 4h 15m • 15 Jan 2024</p>
                      <p className="text-sm font-medium">Status: "Delayed" or "Cancelled"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boarding Pass Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Boarding Pass *
                </Label>
                <p className="text-gray-500 text-sm mb-4">
                  Upload your boarding pass (PDF, JPG, or PNG, max 5MB)
                </p>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive === 'boardingPass'
                      ? 'border-blue-500 bg-blue-50'
                      : errors.boardingPass
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'boardingPass')}
                  onDragLeave={(e) => handleDrag(e, 'boardingPass')}
                  onDragOver={(e) => handleDrag(e, 'boardingPass')}
                  onDrop={(e) => handleDrop(e, 'boardingPass')}
                >
                  {isUploading.boardingPass ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : formData.boardingPass ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">{formData.boardingPass.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {(formData.boardingPass.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                        {formData.boardingPassUrl && (
                          <Badge variant="outline" className="ml-2 text-green-600">
                            ✓ Uploaded
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('boardingPass')}
                        disabled={isUploading.boardingPass}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your boarding pass here, or{' '}
                        <label className="text-blue-600 cursor-pointer hover:underline">
                          browse files
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'boardingPass');
                              }
                            }}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
                {errors.boardingPass && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.boardingPass}
                  </p>
                )}
              </div>

              {/* Delay Proof Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Delay Proof *
                </Label>
                <p className="text-gray-500 text-sm mb-4">
                  Upload proof of delay (screenshot, email, or document - PDF, JPG, or PNG, max 5MB)
                </p>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive === 'delayProof'
                      ? 'border-blue-500 bg-blue-50'
                      : errors.delayProof
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'delayProof')}
                  onDragLeave={(e) => handleDrag(e, 'delayProof')}
                  onDragOver={(e) => handleDrag(e, 'delayProof')}
                  onDrop={(e) => handleDrop(e, 'delayProof')}
                >
                  {isUploading.delayProof ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : formData.delayProof ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">{formData.delayProof.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {(formData.delayProof.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                        {formData.delayProofUrl && (
                          <Badge variant="outline" className="ml-2 text-green-600">
                            ✓ Uploaded
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('delayProof')}
                        disabled={isUploading.delayProof}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your delay proof here, or{' '}
                        <label className="text-blue-600 cursor-pointer hover:underline">
                          browse files
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'delayProof');
                              }
                            }}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
                {errors.delayProof && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.delayProof}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Review Your Claim</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                      <p><span className="font-medium">Email:</span> {formData.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Flight Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Flight:</span> {formData.flightNumber}</p>
                      <p><span className="font-medium">Airline:</span> {formData.airline}</p>
                      <p><span className="font-medium">Date:</span> {formData.departureDate}</p>
                      <p><span className="font-medium">Route:</span> {formData.departureAirport} → {formData.arrivalAirport}</p>
                      <p><span className="font-medium">Delay:</span> {formData.delayDuration}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-green-600" />
                      Boarding Pass: {formData.boardingPass?.name}
                    </p>
                    <p className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-green-600" />
                      Delay Proof: {formData.delayProof?.name}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong> We&apos;ll file your claim within 10 business days and email you with every update. 
                  Our team will handle all communication with the airline and legal requirements.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>100% Refund Guarantee:</strong> If we&apos;re unable to file your claim successfully, you&apos;ll receive a full automatic refund.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Payment */}
          {currentStep === 6 && (
            <div>
              {isCreatingPaymentIntent ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing payment...</p>
                  </div>
                </div>
              ) : paymentClientSecret ? (
                <StripeProvider clientSecret={paymentClientSecret}>
                  <PaymentStep
                    email={formData.email}
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                    claimId={claimId}
                    amount={4900}
                    onPaymentSuccess={handlePaymentSuccess}
                    onBack={handleBack}
                  />
                </StripeProvider>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to initialize payment. Please try again.</p>
                  <Button onClick={createPaymentIntent} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons - Only show if not on payment step */}
          {currentStep !== 5 && (
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={isCreatingPaymentIntent}
                className="flex items-center"
              >
                {isCreatingPaymentIntent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Preparing...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
