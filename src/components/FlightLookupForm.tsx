'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckEligibilityResponse } from '../types/api';
import AirportAutocomplete from './AirportAutocomplete';
import { validateAirportCode } from '@/lib/airports';

interface FlightLookupFormProps {
  onResults: (results: CheckEligibilityResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function FlightLookupForm({ onResults, onLoading }: FlightLookupFormProps) {
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    departureDate: '',
    departureAirport: '',
    arrivalAirport: '',
    delayHours: '',
    delayMinutes: '',
    delayReason: '',
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
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.flightNumber.trim()) {
      newErrors.flightNumber = 'Flight number is required';
    } else if (!/^[A-Z]{2,3}\d{1,4}$/i.test(formData.flightNumber.trim())) {
      newErrors.flightNumber = 'Please enter a valid flight number (e.g., TK157, AA123)';
    }

    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    } else {
      const selectedDate = new Date(formData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Allow dates from 1 year ago to 1 year in the future
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (selectedDate < oneYearAgo || selectedDate > oneYearFromNow) {
        newErrors.departureDate = 'Please select a date within the last year or next year';
      }
    }

    if (!formData.departureAirport.trim()) {
      newErrors.departureAirport = 'Departure airport is required';
    } else if (!validateAirportCode(formData.departureAirport.trim())) {
      newErrors.departureAirport = 'Please enter a valid airport code';
    }

    if (!formData.arrivalAirport.trim()) {
      newErrors.arrivalAirport = 'Arrival airport is required';
    } else if (!validateAirportCode(formData.arrivalAirport.trim())) {
      newErrors.arrivalAirport = 'Please enter a valid airport code';
    }

    if (!formData.airline.trim()) {
      newErrors.airline = 'Airline is required';
    }

    if (!formData.delayHours.trim() && !formData.delayMinutes.trim()) {
      newErrors.delayHours = 'Delay duration is required';
    } else {
      const hours = parseInt(formData.delayHours) || 0;
      const minutes = parseInt(formData.delayMinutes) || 0;
      if (hours === 0 && minutes === 0) {
        newErrors.delayHours = 'Please enter delay duration';
      }
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
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: formData.flightNumber.trim().toUpperCase(),
          airline: formData.airline.trim(),
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport.trim().toUpperCase(),
          arrivalAirport: formData.arrivalAirport.trim().toUpperCase(),
          delayDuration: `${formData.delayHours || 0} hours ${formData.delayMinutes || 0} minutes`,
          delayReason: formData.delayReason.trim(),
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
        method: 'flight_lookup'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Flight Details</h2>
        <p className="text-gray-600">We&apos;ll check if you&apos;re eligible for compensation</p>
        <p className="text-sm text-gray-500 mt-2">💡 Find this information on your boarding pass or confirmation email</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Flight Number */}
        <div>
          <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Flight Number *
          </label>
          <input
            type="text"
            id="flightNumber"
            value={formData.flightNumber}
            onChange={(e) => handleInputChange('flightNumber', e.target.value)}
            placeholder="e.g., UA2847 or BA456"
            className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
              errors.flightNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.flightNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.flightNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">💡 Found on your boarding pass or confirmation email</p>
        </div>

        {/* Departure Date */}
        <div>
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-2">
            Departure Date *
          </label>
          <input
            type="date"
            id="departureDate"
            value={formData.departureDate}
            onChange={(e) => handleInputChange('departureDate', e.target.value)}
            className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
              errors.departureDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">📅 When was your flight scheduled to depart?</p>
        </div>

        {/* Departure Airport */}
        <AirportAutocomplete
          value={formData.departureAirport}
          onChange={(value) => handleInputChange('departureAirport', value)}
          placeholder="e.g., LHR, JFK"
          error={errors.departureAirport}
          label="Departure Airport"
          required={true}
        />

        {/* Arrival Airport */}
        <AirportAutocomplete
          value={formData.arrivalAirport}
          onChange={(value) => handleInputChange('arrivalAirport', value)}
          placeholder="e.g., CDG, LAX"
          error={errors.arrivalAirport}
          label="Arrival Airport"
          required={true}
        />

        {/* Airline */}
        <div>
          <label htmlFor="airline" className="block text-sm font-medium text-gray-700 mb-2">
            Airline *
          </label>
          <input
            type="text"
            id="airline"
            value={formData.airline}
            onChange={(e) => handleInputChange('airline', e.target.value)}
            placeholder="Select your airline..."
            className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
              errors.airline ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.airline && (
            <p className="mt-1 text-sm text-red-600">{errors.airline}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">✈️ The airline operating your flight</p>
        </div>

        {/* Disruption Type */}
        <div>
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

        {/* Delay Duration - Only show for delays */}
        {formData.disruptionType === 'delay' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Duration *
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  id="delayHours"
                  value={formData.delayHours}
                  onChange={(e) => handleInputChange('delayHours', e.target.value)}
                  placeholder="Hours"
                  min="0"
                  max="24"
                  className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                    errors.delayHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  id="delayMinutes"
                  value={formData.delayMinutes}
                  onChange={(e) => handleInputChange('delayMinutes', e.target.value)}
                  placeholder="Minutes"
                  min="0"
                  max="59"
                  className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                    errors.delayHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            {errors.delayHours && (
              <p className="mt-1 text-sm text-red-600">{errors.delayHours}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">⏰ How long was your flight delayed from the original departure time?</p>
          </div>
        )}

        {/* Notice Given - Only show for cancellations */}
        {formData.disruptionType === 'cancellation' && (
          <div>
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
          <div>
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

        {/* Reason for Disruption */}
        <div>
          <label htmlFor="delayReason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for {formData.disruptionType === 'delay' ? 'Delay' : 'Cancellation'} (Optional)
          </label>
          <select
            id="delayReason"
            value={formData.delayReason}
            onChange={(e) => handleInputChange('delayReason', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select reason</option>
            <option value="Technical issues">Technical issues</option>
            <option value="Weather conditions">Weather conditions</option>
            <option value="Crew scheduling">Crew scheduling</option>
            <option value="Air traffic control">Air traffic control</option>
            <option value="Security issues">Security issues</option>
            <option value="Operational issues">Operational issues</option>
            <option value="Other">Other</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            This helps us determine if extraordinary circumstances apply
          </p>
        </div>
      </div>

      {/* Passenger Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Passenger Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

      <div className="flex justify-center pt-6">
        <motion.button
          type="submit"
          className="w-full md:w-auto px-8 py-4 md:py-4 bg-blue-600 text-white font-semibold rounded-lg focus:ring-4 focus:ring-blue-200 text-base min-h-[48px] relative overflow-hidden"
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
                <span>Checking...</span>
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
