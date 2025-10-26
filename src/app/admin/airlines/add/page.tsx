/**
 * Add New Airline Page
 * Admin interface for adding new airlines using templates
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface AirlineConfig {
  airlineName: string;
  airlineCode: string;
  submissionMethod: 'email' | 'web_form' | 'postal';
  claimEmail?: string;
  claimFormUrl?: string;
  postalAddress?: string;
  requiredDocuments: string[];
  requiredFields: string[];
  expectedResponseTime: string;
  followUpSchedule: string[];
  regulationCovered: string[];
  region: string;
  parentCompany?: string;
  contactPhone?: string;
  website?: string;
  specialInstructions?: string;
  aliases?: string[];
  isActive: boolean;
}

const TEMPLATES = [
  {
    id: 'major_eu_template',
    name: 'Major EU Airline',
    description: 'Lufthansa, Air France, KLM, etc.',
    estimatedTime: '10 minutes',
    difficulty: 'easy',
  },
  {
    id: 'low_cost_template',
    name: 'Low-Cost Airline',
    description: 'Ryanair, EasyJet, Wizz Air, etc.',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
  },
  {
    id: 'major_us_template',
    name: 'Major US Airline',
    description: 'American, Delta, United, etc.',
    estimatedTime: '12 minutes',
    difficulty: 'easy',
  },
  {
    id: 'major_asia_template',
    name: 'Major Asian Airline',
    description: 'Singapore, Emirates, Qatar, etc.',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
  },
];

const SETUP_STEPS = [
  { id: 'template', title: 'Choose Template', description: 'Select airline type template' },
  { id: 'basic_info', title: 'Basic Information', description: 'Airline name and details' },
  { id: 'submission_method', title: 'Submission Method', description: 'How claims are submitted' },
  { id: 'requirements', title: 'Requirements', description: 'Documents and fields needed' },
  { id: 'timelines', title: 'Timelines', description: 'Response times and follow-ups' },
  { id: 'additional_info', title: 'Additional Info', description: 'Contact details and notes' },
  { id: 'review', title: 'Review & Test', description: 'Validate configuration' },
];

export default function AddNewAirlinePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [airlineConfig, setAirlineConfig] = useState<Partial<AirlineConfig>>({
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: ['passenger_name', 'flight_number', 'departure_date', 'delay_duration'],
    regulationCovered: ['EU261'],
    region: 'Europe',
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testingChecklist, setTestingChecklist] = useState<Array<{
    id: string;
    description: string;
    completed: boolean;
    critical: boolean;
  }>>([]);

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Apply template defaults
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Apply template-specific defaults
      if (templateId === 'major_eu_template') {
        setAirlineConfig(prev => ({
          ...prev,
          submissionMethod: 'email',
          requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details', 'booking_confirmation'],
          expectedResponseTime: '2-4 weeks',
          followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
          region: 'Europe',
        }));
      } else if (templateId === 'low_cost_template') {
        setAirlineConfig(prev => ({
          ...prev,
          submissionMethod: 'web_form',
          requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
          expectedResponseTime: '3-6 weeks',
          followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
          region: 'Europe',
        }));
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setAirlineConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Template selection
        if (!selectedTemplate) {
          errors.template = 'Please select a template';
        }
        break;
      case 1: // Basic info
        if (!airlineConfig.airlineName) errors.airlineName = 'Airline name is required';
        if (!airlineConfig.airlineCode) errors.airlineCode = 'Airline code is required';
        break;
      case 2: // Submission method
        if (!airlineConfig.submissionMethod) errors.submissionMethod = 'Submission method is required';
        if (airlineConfig.submissionMethod === 'email' && !airlineConfig.claimEmail) {
          errors.claimEmail = 'Email address is required';
        }
        if (airlineConfig.submissionMethod === 'web_form' && !airlineConfig.claimFormUrl) {
          errors.claimFormUrl = 'Form URL is required';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/airlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airlineConfig),
      });

      if (response.ok) {
        // Success - redirect or show success message
        console.log('Airline configuration saved successfully');
      } else {
        console.error('Failed to save airline configuration');
      }
    } catch (error) {
      console.error('Error saving airline configuration:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Template selection
        return (
          <div className="space-y-4">
            <p className="text-gray-600">Choose a template that best matches the airline type:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{template.difficulty}</Badge>
                      <span className="text-sm text-gray-500">
                        <Clock className="inline h-4 w-4 mr-1" />
                        {template.estimatedTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1: // Basic information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="airlineName">Airline Name *</Label>
                <Input
                  id="airlineName"
                  value={airlineConfig.airlineName || ''}
                  onChange={(e) => handleInputChange('airlineName', e.target.value)}
                  placeholder="e.g., British Airways"
                />
                {validationErrors.airlineName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.airlineName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="airlineCode">Airline Code *</Label>
                <Input
                  id="airlineCode"
                  value={airlineConfig.airlineCode || ''}
                  onChange={(e) => handleInputChange('airlineCode', e.target.value.toUpperCase())}
                  placeholder="e.g., BA"
                  maxLength={3}
                />
                {validationErrors.airlineCode && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.airlineCode}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">Region</Label>
                <Select
                  value={airlineConfig.region || 'Europe'}
                  onValueChange={(value) => handleInputChange('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Asia-Pacific">Asia-Pacific</SelectItem>
                    <SelectItem value="Middle East">Middle East</SelectItem>
                    <SelectItem value="Africa">Africa</SelectItem>
                    <SelectItem value="South America">South America</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parentCompany">Parent Company</Label>
                <Input
                  id="parentCompany"
                  value={airlineConfig.parentCompany || ''}
                  onChange={(e) => handleInputChange('parentCompany', e.target.value)}
                  placeholder="e.g., International Airlines Group"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Submission method
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="submissionMethod">Submission Method *</Label>
              <Select
                value={airlineConfig.submissionMethod || ''}
                onValueChange={(value) => handleInputChange('submissionMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select submission method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="web_form">Web Form</SelectItem>
                  <SelectItem value="postal">Postal Mail</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.submissionMethod && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.submissionMethod}</p>
              )}
            </div>

            {airlineConfig.submissionMethod === 'email' && (
              <div>
                <Label htmlFor="claimEmail">Claim Email Address *</Label>
                <Input
                  id="claimEmail"
                  type="email"
                  value={airlineConfig.claimEmail || ''}
                  onChange={(e) => handleInputChange('claimEmail', e.target.value)}
                  placeholder="e.g., eu261@airline.com"
                />
                {validationErrors.claimEmail && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.claimEmail}</p>
                )}
              </div>
            )}

            {airlineConfig.submissionMethod === 'web_form' && (
              <div>
                <Label htmlFor="claimFormUrl">Claim Form URL *</Label>
                <Input
                  id="claimFormUrl"
                  value={airlineConfig.claimFormUrl || ''}
                  onChange={(e) => handleInputChange('claimFormUrl', e.target.value)}
                  placeholder="e.g., https://airline.com/compensation-claim"
                />
                {validationErrors.claimFormUrl && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.claimFormUrl}</p>
                )}
              </div>
            )}

            {airlineConfig.submissionMethod === 'postal' && (
              <div>
                <Label htmlFor="postalAddress">Postal Address *</Label>
                <Textarea
                  id="postalAddress"
                  value={airlineConfig.postalAddress || ''}
                  onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                  placeholder="Enter full postal address for claim submissions"
                  rows={3}
                />
              </div>
            )}
          </div>
        );

      case 3: // Requirements
        return (
          <div className="space-y-4">
            <div>
              <Label>Required Documents</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['boarding_pass', 'delay_proof', 'passenger_details', 'booking_confirmation'].map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      checked={airlineConfig.requiredDocuments?.includes(doc) || false}
                      onCheckedChange={(checked: boolean) => {
                        const docs = airlineConfig.requiredDocuments || [];
                        if (checked) {
                          handleInputChange('requiredDocuments', [...docs, doc]);
                        } else {
                          handleInputChange('requiredDocuments', docs.filter(d => d !== doc));
                        }
                      }}
                    />
                    <Label htmlFor={doc} className="text-sm">
                      {doc.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expectedResponseTime">Expected Response Time</Label>
              <Input
                id="expectedResponseTime"
                value={airlineConfig.expectedResponseTime || ''}
                onChange={(e) => handleInputChange('expectedResponseTime', e.target.value)}
                placeholder="e.g., 2-4 weeks"
              />
            </div>

            <div>
              <Label htmlFor="followUpSchedule">Follow-up Schedule (comma-separated)</Label>
              <Input
                id="followUpSchedule"
                value={airlineConfig.followUpSchedule?.join(', ') || ''}
                onChange={(e) => handleInputChange('followUpSchedule', e.target.value.split(',').map(s => s.trim()))}
                placeholder="e.g., 2 weeks, 4 weeks, 8 weeks"
              />
            </div>
          </div>
        );

      case 4: // Timelines
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={airlineConfig.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="e.g., +44 20 8738 5100"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={airlineConfig.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="e.g., https://www.airline.com"
              />
            </div>
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={airlineConfig.specialInstructions || ''}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special instructions for submitting claims to this airline..."
                rows={4}
              />
            </div>
          </div>
        );

      case 5: // Additional info
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aliases">Aliases (comma-separated)</Label>
              <Input
                id="aliases"
                value={airlineConfig.aliases?.join(', ') || ''}
                onChange={(e) => handleInputChange('aliases', e.target.value.split(',').map(s => s.trim()))}
                placeholder="e.g., British Air, BritishAirways, BAW"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={airlineConfig.isActive || false}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Airline is currently active</Label>
            </div>
          </div>
        );

      case 6: // Review
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Review your airline configuration before saving. Make sure all required fields are filled.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {airlineConfig.airlineName}</div>
                <div><strong>Code:</strong> {airlineConfig.airlineCode}</div>
                <div><strong>Region:</strong> {airlineConfig.region}</div>
                <div><strong>Submission Method:</strong> {airlineConfig.submissionMethod}</div>
                {airlineConfig.submissionMethod === 'email' && (
                  <div><strong>Email:</strong> {airlineConfig.claimEmail}</div>
                )}
                {airlineConfig.submissionMethod === 'web_form' && (
                  <div><strong>Form URL:</strong> {airlineConfig.claimFormUrl}</div>
                )}
                <div><strong>Response Time:</strong> {airlineConfig.expectedResponseTime}</div>
                <div><strong>Required Documents:</strong> {airlineConfig.requiredDocuments?.join(', ')}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Testing Checklist</h3>
              <div className="space-y-2">
                {testingChecklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked: boolean) => {
                        setTestingChecklist(prev => 
                          prev.map(i => i.id === item.id ? { ...i, completed: !!checked } : i)
                        );
                      }}
                    />
                    <Label className={`text-sm ${item.critical ? 'font-medium' : ''}`}>
                      {item.description}
                      {item.critical && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Airline</h1>
        <p className="text-gray-600">Configure a new airline for automated claim processing</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {SETUP_STEPS.length}</span>
          <span>{Math.round(((currentStep + 1) / SETUP_STEPS.length) * 100)}% Complete</span>
        </div>
        <Progress value={((currentStep + 1) / SETUP_STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold">{SETUP_STEPS[currentStep].title}</h2>
          <p className="text-gray-600">{SETUP_STEPS[currentStep].description}</p>
        </div>

        {currentStep < SETUP_STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (validateCurrentStep()) {
                handleNext();
              }
            }}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        )}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="list-disc list-inside mt-2">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
