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
    departureDate: '',
    departureAirport: '',
    arrivalAirport: '',
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
      if (selectedDate < today) {
        newErrors.departureDate = 'Please select a future date';
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
          departureDate: formData.departureDate,
          departureAirport: formData.departureAirport.trim().toUpperCase(),
          arrivalAirport: formData.arrivalAirport.trim().toUpperCase(),
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
