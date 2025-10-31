'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import { CheckEligibilityResponse } from '../types/api';
import { useFormAbandonment } from '@/hooks/useFormAbandonment';

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
    // Disruption type
    disruptionType: 'delay' as 'delay' | 'cancellation' | 'denied_boarding' | 'downgrade',
    // Cancellation fields
    noticeGiven: '',
    alternativeOffered: false,
    alternativeTiming: '',
    // Denied boarding fields
    boardingType: 'involuntary' as 'involuntary' | 'voluntary',
    checkedInOnTime: '',
    ticketPrice: '',
    // Downgrade fields
    classPaidFor: '',
    classReceived: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Track form abandonment
  const { markCompleted } = useFormAbandonment('email_parsing', formData, {
    disruption_type: formData.disruptionType,
  });

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

    // Validate denied boarding fields
    if (formData.disruptionType === 'denied_boarding') {
      if (!formData.checkedInOnTime) {
        newErrors.checkedInOnTime = 'Please indicate whether you checked in on time';
      }
      if (!formData.ticketPrice.trim() || parseFloat(formData.ticketPrice) <= 0) {
        newErrors.ticketPrice = 'Valid ticket price is required';
      }
    }

    // Validate downgrade fields
    if (formData.disruptionType === 'downgrade') {
      if (!formData.classPaidFor) {
        newErrors.classPaidFor = 'Original class is required';
      }
      if (!formData.classReceived) {
        newErrors.classReceived = 'Actual class received is required';
      }
      if (!formData.ticketPrice.trim() || parseFloat(formData.ticketPrice) <= 0) {
        newErrors.ticketPrice = 'Ticket price is required to calculate your refund';
      }
    }

    setErrors(newErrors);

    // Track validation errors if any
    if (Object.keys(newErrors).length > 0 && typeof window !== 'undefined') {
      Object.entries(newErrors).forEach(([field, error]) => {
        posthog.capture('form_validation_error', {
          form_name: 'email_parsing',
          field,
          error_message: error,
          disruption_type: formData.disruptionType,
        });
      });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Track email parsing started and eligibility check started
    if (typeof window !== 'undefined') {
      // Identify user
      posthog.identify(formData.passengerEmail.trim(), {
        email: formData.passengerEmail.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        identified_at: new Date().toISOString(),
        first_seen_via: 'email_parsing'
      });

      posthog.capture('email_parsing_started', {
        content_length: formData.emailContent.length,
        disruption_type: formData.disruptionType,
      });

      posthog.capture('eligibility_check_started', {
        method: 'email',
        disruption_type: formData.disruptionType,
      });
    }

    onLoading(true);
    setLoading(true);
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
          // Disruption type
          disruptionType: formData.disruptionType,
          // Cancellation fields
          noticeGiven: formData.noticeGiven,
          alternativeOffered: formData.alternativeOffered,
          alternativeTiming: formData.alternativeTiming.trim(),
          // Denied boarding fields
          boardingType: formData.boardingType,
          checkedInOnTime: formData.checkedInOnTime,
          ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
          // Downgrade fields
          classPaidFor: formData.classPaidFor,
          classReceived: formData.classReceived
        }),
      });

      const result: CheckEligibilityResponse = await response.json();

      // Track email parsing completed and eligibility check completed
      if (typeof window !== 'undefined') {
        if (result.success) {
          posthog.capture('email_parsing_completed', {
            content_length: formData.emailContent.length,
            disruption_type: formData.disruptionType,
            parsed_successfully: true
          });

          if (result.data?.eligibility) {
            posthog.capture('eligibility_check_completed', {
              eligible: result.data.eligibility.isEligible,
              compensation_amount: result.data.eligibility.compensationAmount,
              regulation: result.data.eligibility.regulation,
              disruption_type: formData.disruptionType,
              confidence: result.data.eligibility.confidence,
              method: 'email',
            });
          }
        } else {
          posthog.capture('email_parsing_failed', {
            content_length: formData.emailContent.length,
            error: result.error || 'Unknown error',
            disruption_type: formData.disruptionType,
          });
        }
      }

      // Mark form as completed (prevents abandonment tracking)
      markCompleted();

      onResults(result);
    } catch (error) {
      console.error('Error checking eligibility:', error);

      // Track parsing failure
      if (typeof window !== 'undefined') {
        posthog.capture('email_parsing_failed', {
          content_length: formData.emailContent.length,
          error: error instanceof Error ? error.message : 'Network or server error',
          disruption_type: formData.disruptionType,
        });
      }

      onResults({
        success: false,
        error: 'Failed to check eligibility. Please try again.',
        method: 'email_parsing'
      });
    } finally {
      onLoading(false);
      setLoading(false);
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What happened to your flight? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="disruptionType"
                value="delay"
                checked={formData.disruptionType === 'delay'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-3 w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="text-sm font-medium">Flight Delayed</span>
                <p className="text-xs text-gray-500">Flight departed late from scheduled time</p>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="disruptionType"
                value="cancellation"
                checked={formData.disruptionType === 'cancellation'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-3 w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="text-sm font-medium">Flight Cancelled</span>
                <p className="text-xs text-gray-500">Flight did not operate at all</p>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="disruptionType"
                value="denied_boarding"
                checked={formData.disruptionType === 'denied_boarding'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-3 w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="text-sm font-medium">Denied Boarding</span>
                <p className="text-xs text-gray-500">Not allowed to board despite valid ticket</p>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="disruptionType"
                value="downgrade"
                checked={formData.disruptionType === 'downgrade'}
                onChange={(e) => handleInputChange('disruptionType', e.target.value)}
                className="mr-3 w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="text-sm font-medium">Seat Downgrade</span>
                <p className="text-xs text-gray-500">Placed in lower class than booked</p>
              </div>
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

        {/* Denied Boarding Section */}
        {formData.disruptionType === 'denied_boarding' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Denied Boarding Information</h4>
              <p className="text-sm text-blue-800">Please provide additional details about the denied boarding incident.</p>
            </div>

            {/* Boarding Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Denied Boarding *
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="boardingType"
                    value="involuntary"
                    checked={formData.boardingType === 'involuntary'}
                    onChange={(e) => handleInputChange('boardingType', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4 accent-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium">Involuntary - You were denied boarding</span>
                    <p className="text-xs text-gray-500 mt-1">The airline refused to let you board despite having a valid ticket</p>
                  </div>
                </label>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="boardingType"
                    value="voluntary"
                    checked={formData.boardingType === 'voluntary'}
                    onChange={(e) => handleInputChange('boardingType', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4 accent-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium">Voluntary - You gave up your seat</span>
                    <p className="text-xs text-gray-500 mt-1">You volunteered to give up your seat for compensation</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Check-in Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Did you check in on time? *
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="checkedInOnTime"
                    value="yes"
                    checked={formData.checkedInOnTime === 'yes'}
                    onChange={(e) => handleInputChange('checkedInOnTime', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium">Yes, I checked in on time</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Within the airline's check-in deadline (typically 30-60 min domestic, 60-90 min international)
                    </p>
                  </div>
                </label>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="checkedInOnTime"
                    value="no"
                    checked={formData.checkedInOnTime === 'no'}
                    onChange={(e) => handleInputChange('checkedInOnTime', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium">No, I checked in late</span>
                    <p className="text-xs text-gray-500 mt-1">After the check-in deadline</p>
                  </div>
                </label>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="checkedInOnTime"
                    value="unsure"
                    checked={formData.checkedInOnTime === 'unsure'}
                    onChange={(e) => handleInputChange('checkedInOnTime', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium">I'm not sure</span>
                    <p className="text-xs text-gray-500 mt-1">I don't remember or wasn't aware of the deadline</p>
                  </div>
                </label>
              </div>
              {errors.checkedInOnTime && (
                <p className="mt-2 text-sm text-red-600">{errors.checkedInOnTime}</p>
              )}
            </div>

            {/* Ticket Price */}
            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Price (USD) *
              </label>
              <input
                type="number"
                id="ticketPrice"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                placeholder="e.g., 450"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.ticketPrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.ticketPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.ticketPrice}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Required for US DOT compensation calculation</p>
            </div>
          </div>
        )}

        {/* Downgrade Section */}
        {formData.disruptionType === 'downgrade' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Seat Downgrade Information</h4>
              <p className="text-sm text-purple-800">Downgrades are always eligible for refunds - no exceptions!</p>
            </div>

            {/* Class Paid For */}
            <div>
              <label htmlFor="classPaidFor" className="block text-sm font-medium text-gray-700 mb-2">
                Class You Paid For *
              </label>
              <select
                id="classPaidFor"
                value={formData.classPaidFor}
                onChange={(e) => handleInputChange('classPaidFor', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.classPaidFor ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select class</option>
                <option value="first">First Class</option>
                <option value="business">Business Class</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="economy">Economy Class</option>
              </select>
              {errors.classPaidFor && (
                <p className="mt-1 text-sm text-red-600">{errors.classPaidFor}</p>
              )}
            </div>

            {/* Class Received */}
            <div>
              <label htmlFor="classReceived" className="block text-sm font-medium text-gray-700 mb-2">
                Class You Actually Received *
              </label>
              <select
                id="classReceived"
                value={formData.classReceived}
                onChange={(e) => handleInputChange('classReceived', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.classReceived ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select class</option>
                <option value="first">First Class</option>
                <option value="business">Business Class</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="economy">Economy Class</option>
              </select>
              {errors.classReceived && (
                <p className="mt-1 text-sm text-red-600">{errors.classReceived}</p>
              )}
            </div>

            {/* Ticket Price */}
            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Price (USD) *
              </label>
              <input
                type="number"
                id="ticketPrice"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                placeholder="e.g., 2500"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.ticketPrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.ticketPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.ticketPrice}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Required to calculate your refund amount</p>
            </div>

            {/* Live Compensation Preview */}
            {formData.classPaidFor && formData.classReceived && formData.ticketPrice && parseFloat(formData.ticketPrice) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Estimated Refund</h4>
                <p className="text-2xl font-bold text-green-700">
                  ${(() => {
                    const price = parseFloat(formData.ticketPrice);
                    const distance = 3000; // Placeholder
                    let percentage = 0;

                    // Calculate percentage based on EU261/2004
                    if (formData.classPaidFor === 'first' && formData.classReceived === 'business') {
                      percentage = 0.30;
                    } else if (formData.classPaidFor === 'first' && formData.classReceived === 'premium_economy') {
                      percentage = 0.50;
                    } else if (formData.classPaidFor === 'first' && formData.classReceived === 'economy') {
                      percentage = 0.75;
                    } else if (formData.classPaidFor === 'business' && formData.classReceived === 'premium_economy') {
                      percentage = 0.30;
                    } else if (formData.classPaidFor === 'business' && formData.classReceived === 'economy') {
                      percentage = 0.50;
                    } else if (formData.classPaidFor === 'premium_economy' && formData.classReceived === 'economy') {
                      percentage = 0.30;
                    }

                    // EU261 distance-based refund
                    if (distance < 1500) {
                      percentage = percentage * 0.30;
                    } else if (distance < 3500) {
                      percentage = percentage * 0.50;
                    } else {
                      percentage = percentage * 0.75;
                    }

                    return (price * percentage).toFixed(2);
                  })()}
                </p>
                <p className="text-xs text-green-700 mt-1">Estimated based on typical flight distance</p>
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
              data-ph-capture-attribute-name-mask="true"
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
              data-ph-capture-attribute-name-mask="true"
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
              data-ph-capture-attribute-name-mask="true"
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
        <motion.button
          type="submit"
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg focus:ring-4 focus:ring-blue-200 min-h-[48px] text-base relative overflow-hidden"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          }}
        >
          <motion.span
            className="relative z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Parsing...</span>
              </div>
            ) : (
              "Check My Compensation →"
            )}
          </motion.span>
          
          {/* Ripple effect on click */}
          <motion.div
            className="absolute inset-0 bg-white opacity-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 0, opacity: 0 }}
            whileTap={{ 
              scale: [0, 1.2], 
              opacity: [0, 0.3, 0] 
            }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>
      </div>
    </form>
  );
}
