'use client';

import { useState } from 'react';
import { CheckEligibilityResponse } from '../types/api';

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
    lastName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    } else if (!/^[A-Z]{3}$/i.test(formData.departureAirport.trim())) {
      newErrors.departureAirport = 'Please enter a valid 3-letter airport code (e.g., IST, LHR)';
    }

    if (!formData.arrivalAirport.trim()) {
      newErrors.arrivalAirport = 'Arrival airport is required';
    } else if (!/^[A-Z]{3}$/i.test(formData.arrivalAirport.trim())) {
      newErrors.arrivalAirport = 'Please enter a valid 3-letter airport code (e.g., MIA, CDG)';
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
          flightNumber: formData.flightNumber.trim().toUpperCase(),
          airline: formData.airline.trim(),
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport.trim().toUpperCase(),
          arrivalAirport: formData.arrivalAirport.trim().toUpperCase(),
          delayDuration: `${formData.delayHours || 0} hours ${formData.delayMinutes || 0} minutes`,
          delayReason: formData.delayReason.trim(),
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
        method: 'flight_lookup'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Flight Details</h2>
        <p className="text-gray-600">We&apos;ll check if you&apos;re eligible for compensation</p>
        <p className="text-xs text-gray-500 mt-2">Form Version: 2.0 (with airline and delay fields)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            placeholder="e.g., TK157, AA123"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.flightNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.flightNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.flightNumber}</p>
          )}
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.departureDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
          )}
        </div>

        {/* Departure Airport */}
        <div>
          <label htmlFor="departureAirport" className="block text-sm font-medium text-gray-700 mb-2">
            Departure Airport *
          </label>
          <input
            type="text"
            id="departureAirport"
            value={formData.departureAirport}
            onChange={(e) => handleInputChange('departureAirport', e.target.value)}
            placeholder="e.g., IST, LHR"
            maxLength={3}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.departureAirport ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.departureAirport && (
            <p className="mt-1 text-sm text-red-600">{errors.departureAirport}</p>
          )}
        </div>

        {/* Arrival Airport */}
        <div>
          <label htmlFor="arrivalAirport" className="block text-sm font-medium text-gray-700 mb-2">
            Arrival Airport *
          </label>
          <input
            type="text"
            id="arrivalAirport"
            value={formData.arrivalAirport}
            onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
            placeholder="e.g., MIA, CDG"
            maxLength={3}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.arrivalAirport ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.arrivalAirport && (
            <p className="mt-1 text-sm text-red-600">{errors.arrivalAirport}</p>
          )}
        </div>

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
            placeholder="e.g., British Airways, American Airlines"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.airline ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.airline && (
            <p className="mt-1 text-sm text-red-600">{errors.airline}</p>
          )}
        </div>

        {/* Delay Duration */}
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.delayHours ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          {errors.delayHours && (
            <p className="mt-1 text-sm text-red-600">{errors.delayHours}</p>
          )}
        </div>

        {/* Delay Reason */}
        <div>
          <label htmlFor="delayReason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Delay (Optional)
          </label>
          <select
            id="delayReason"
            value={formData.delayReason}
            onChange={(e) => handleInputChange('delayReason', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select delay reason</option>
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

      <div className="flex justify-center pt-6">
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
        >
          Check My Eligibility
        </button>
      </div>
    </form>
  );
}
