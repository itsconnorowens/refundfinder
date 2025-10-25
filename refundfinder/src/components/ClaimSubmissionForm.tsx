'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

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
  
  // Step 3: Documentation
  boardingPass: File | null;
  delayProof: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Your contact details' },
  { id: 2, title: 'Flight Details', description: 'Flight information' },
  { id: 3, title: 'Documentation', description: 'Upload required documents' },
  { id: 4, title: 'Review & Submit', description: 'Confirm your claim' }
];

export default function ClaimSubmissionForm() {
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

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('claimFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

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

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (file: File, type: 'boardingPass' | 'delayProof') => {
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

    handleInputChange(type, file);
    setErrors(prev => ({ ...prev, [type]: '' }));
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
    handleInputChange(type, null);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('flightNumber', formData.flightNumber);
      formDataToSend.append('airline', formData.airline);
      formDataToSend.append('departureDate', formData.departureDate);
      formDataToSend.append('departureAirport', formData.departureAirport);
      formDataToSend.append('arrivalAirport', formData.arrivalAirport);
      formDataToSend.append('delayDuration', formData.delayDuration);
      formDataToSend.append('delayReason', formData.delayReason);
      
      if (formData.boardingPass) {
        formDataToSend.append('boardingPass', formData.boardingPass);
      }
      if (formData.delayProof) {
        formDataToSend.append('delayProof', formData.delayProof);
      }

      const response = await fetch('/api/create-claim', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        // Clear form data from localStorage
        localStorage.removeItem('claimFormData');
        // Redirect or show success message
        alert('Claim submitted successfully! We&apos;ll file your claim within 48 hours and email you with every update.');
      } else {
        throw new Error('Failed to submit claim');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
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

          {/* Step 3: Documentation */}
          {currentStep === 3 && (
            <div className="space-y-8">
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
                  {formData.boardingPass ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">{formData.boardingPass.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {(formData.boardingPass.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('boardingPass')}
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
                  {formData.delayProof ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">{formData.delayProof.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {(formData.delayProof.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('delayProof')}
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

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
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
                  <strong>What happens next:</strong> We&apos;ll file your claim within 48 hours and email you with every update. 
                  Our team will handle all communication with the airline and legal requirements.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
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
            
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Claim & Pay
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
