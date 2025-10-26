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
    lastName: '',
    // New fields for cancellation support
    disruptionType: 'delay' as 'delay' | 'cancellation',
    noticeGiven: '',
    alternativeOffered: false,
    alternativeTiming: ''
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

    // Validate cancellation-specific fields
    if (formData.disruptionType === 'cancellation') {
      if (!formData.noticeGiven) {
        newErrors.noticeGiven = 'Notice period is required for cancellations';
      }
      if (formData.alternativeOffered && !formData.alternativeTiming.trim()) {
        newErrors.alternativeTiming = 'Alternative timing is required when alternative flight is offered';
      }
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
          lastName: formData.lastName.trim(),
          // New fields for cancellation support
          disruptionType: formData.disruptionType,
          noticeGiven: formData.noticeGiven,
          alternativeOffered: formData.alternativeOffered,
          alternativeTiming: formData.alternativeTiming.trim()
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
    <form onSubmit={handleSubmit} className="space-y-6 px-4 sm:px-0">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Upload Your Flight Email</h2>
        <p className="text-sm sm:text-base text-gray-600">Paste your flight delay or cancellation email below</p>
        <p className="text-sm text-gray-500 mt-2">⚡ Fastest method — AI extracts all details automatically</p>
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
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base ${
            errors.emailContent ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.emailContent && (
          <p className="mt-1 text-sm text-red-600">{errors.emailContent}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          💡 <strong>Tip:</strong> Copy and paste the entire email including the subject line and any delay/cancellation details.
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2"><strong>Example email format:</strong></p>
          <div className="text-xs text-gray-500 font-mono bg-white p-2 rounded border">
            Subject: Flight Delay Notification - TK157<br/>
            Dear Passenger,<br/>
            We regret to inform you that your flight TK157...<br/>
            <span className="text-blue-600">[rest of email content]</span>
          </div>
        </div>
      </div>

      {/* Additional Information for Cancellations */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        
        {/* Disruption Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What happened? *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="disruptionType"
                value="delay"
                checked={formData.disruptionType === 'delay'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Flight Delayed</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="disruptionType"
                value="cancellation"
                checked={formData.disruptionType === 'cancellation'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Flight Cancelled</span>
            </label>
          </div>
        </div>

        {/* Notice Given - Only show for cancellations */}
        {formData.disruptionType === 'cancellation' && (
          <div className="mb-6">
            <label htmlFor="noticeGiven" className="block text-sm font-medium text-gray-700 mb-2">
              When were you notified? *
            </label>
            <select
              id="noticeGiven"
              value={formData.noticeGiven}
              onChange={(e) => handleInputChange('noticeGiven', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.noticeGiven ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select notice period</option>
              <option value="< 7 days">Less than 7 days before departure</option>
              <option value="7-14 days">7-14 days before departure</option>
              <option value="> 14 days">More than 14 days before departure</option>
            </select>
            {errors.noticeGiven && (
              <p className="mt-1 text-sm text-red-600">{errors.noticeGiven}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              This affects your compensation eligibility
            </p>
          </div>
        )}

        {/* Alternative Flight Offered - Only show for cancellations */}
        {formData.disruptionType === 'cancellation' && (
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.alternativeOffered}
                onChange={(e) => handleInputChange('alternativeOffered', e.target.checked.toString())}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Airline offered alternative flight
              </span>
            </label>
            {formData.alternativeOffered && (
              <div className="mt-2">
                <label htmlFor="alternativeTiming" className="block text-sm font-medium text-gray-700 mb-2">
                  When was the alternative flight? *
                </label>
                <input
                  type="text"
                  id="alternativeTiming"
                  value={formData.alternativeTiming}
                  onChange={(e) => handleInputChange('alternativeTiming', e.target.value)}
                  placeholder="e.g., 2 hours later, next day"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.alternativeTiming ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.alternativeTiming && (
                  <p className="mt-1 text-sm text-red-600">{errors.alternativeTiming}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  This affects your compensation amount
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Passenger Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Passenger Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
              className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
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
              className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
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
              className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
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

      <div className="flex justify-center pt-6 pb-8 md:pb-0">
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors min-h-[48px] text-base"
        >
          Check My Compensation →
        </button>
      </div>
    </form>
  );
}
