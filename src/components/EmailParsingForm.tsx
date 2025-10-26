'use client';

import { useState } from 'react';
import { CheckEligibilityResponse } from '../types/api';

interface EmailParsingFormProps {
  onResults: (results: CheckEligibilityResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function EmailParsingForm({ onResults, onLoading }: EmailParsingFormProps) {
  const [formData, setFormData] = useState({
    emailContent: '',
    passengerEmail: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.emailContent.trim()) {
      newErrors.emailContent = 'Email content is required';
    } else if (formData.emailContent.trim().length < 50) {
      newErrors.emailContent = 'Please paste the complete email content (at least 50 characters)';
    }

    if (!formData.passengerEmail.trim()) {
      newErrors.passengerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.passengerEmail.trim())) {
      newErrors.passengerEmail = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: formData.emailContent.trim(),
          passengerEmail: formData.passengerEmail.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim()
        }),
      });

      const result: CheckEligibilityResponse = await response.json();
      onResults(result);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      onResults({
        success: false,
        error: 'Failed to check eligibility. Please try again.',
        method: 'email_parsing'
      });
    } finally {
      onLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const sampleEmail = `Subject: Flight Delay Notification - TK157

Dear Passenger,

We regret to inform you that your flight TK157 from Istanbul (IST) to Miami (MIA) on October 26, 2025 has been delayed by 34 minutes due to operational reasons.

Scheduled departure: 01:55 UTC
Actual departure: 02:28 UTC

We apologize for any inconvenience.

Turkish Airlines`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Flight Email</h2>
        <p className="text-gray-600">Paste your flight delay or cancellation email below</p>
      </div>

      {/* Email Content */}
      <div>
        <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700 mb-2">
          Flight Email Content *
        </label>
        <textarea
          id="emailContent"
          value={formData.emailContent}
          onChange={(e) => handleInputChange('emailContent', e.target.value)}
          placeholder={sampleEmail}
          rows={12}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
            errors.emailContent ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.emailContent && (
          <p className="mt-1 text-sm text-red-600">{errors.emailContent}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          💡 <strong>Tip:</strong> Copy and paste the entire email including the subject line and any delay/cancellation details.
        </p>
      </div>

      {/* Passenger Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Passenger Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="John"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Doe"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label htmlFor="passengerEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="passengerEmail"
              value={formData.passengerEmail}
              onChange={(e) => handleInputChange('passengerEmail', e.target.value)}
              placeholder="john@example.com"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.passengerEmail ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.passengerEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.passengerEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📧 What emails work best?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Flight delay notifications from airlines</li>
          <li>• Flight cancellation emails</li>
          <li>• Booking confirmations with delay information</li>
          <li>• Any email mentioning your flight number and delay/cancellation details</li>
        </ul>
      </div>

      <div className="flex justify-center pt-6">
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
        >
          Analyze My Email
        </button>
      </div>
    </form>
  );
}
