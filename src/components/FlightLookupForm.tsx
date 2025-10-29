'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckEligibilityResponse } from '../types/api';
import AirportAutocomplete from './AirportAutocomplete';
import AirlineAutocomplete from './AirlineAutocomplete';
import {
  validateFlightNumber,
  validateAirportCode,
  validateFlightDate,
  validateDelayDuration,
  validateEmail
} from '@/lib/validation';

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
    // Disruption type fields
    disruptionType: 'delay' as 'delay' | 'cancellation' | 'denied_boarding' | 'downgrade',
    // Cancellation fields
    notificationDate: '',
    noticeGiven: '',
    alternativeOffered: false,
    alternativeFlightNumber: '',
    alternativeDepartureTime: '',
    alternativeArrivalTime: '',
    alternativeTiming: '',
    careProvided: {
      meals: false,
      hotel: false,
      transport: false,
      communication: false
    },
    passengerChoice: '',
    // Denied boarding fields
    boardingType: 'involuntary' as 'involuntary' | 'voluntary',
    volunteersRequested: false,
    deniedBoardingReason: '',
    alternativeArrivalDelay: '',
    checkInTime: '',
    ticketPrice: '',
    // Downgrade fields
    classPaidFor: '',
    classReceived: '',
    downgradeTiming: '',
    downgradeReason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fieldValid, setFieldValid] = useState<Record<string, boolean>>({});
  const [emailSuggestion, setEmailSuggestion] = useState<string>('');

  const validateField = (field: string, value: string) => {
    let result: { valid: boolean; error?: string; suggestion?: string } = { valid: true };

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
      case 'passengerEmail':
        result = validateEmail(value);
        if (result.suggestion) {
          setEmailSuggestion(result.suggestion);
        } else {
          setEmailSuggestion('');
        }
        break;
    }

    if (result.error) {
      setErrors(prev => ({ ...prev, [field]: result.error || '' }));
      setFieldValid(prev => ({ ...prev, [field]: false }));
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
      setFieldValid(prev => ({ ...prev, [field]: result.valid }));
    }

    return result.valid;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Use validation functions
    const flightNumberResult = validateFlightNumber(formData.flightNumber.trim());
    if (!flightNumberResult.valid) {
      newErrors.flightNumber = flightNumberResult.error || 'Invalid flight number';
    }

    const dateResult = validateFlightDate(formData.departureDate);
    if (!dateResult.valid) {
      newErrors.departureDate = dateResult.error || 'Invalid date';
    }

    const departureResult = validateAirportCode(formData.departureAirport.trim());
    if (!departureResult.valid) {
      newErrors.departureAirport = departureResult.error || 'Invalid airport code';
    }

    const arrivalResult = validateAirportCode(formData.arrivalAirport.trim());
    if (!arrivalResult.valid) {
      newErrors.arrivalAirport = arrivalResult.error || 'Invalid airport code';
    }

    if (!formData.airline.trim()) {
      newErrors.airline = 'Airline is required';
    }

    // Validate delay duration for delays
    if (formData.disruptionType === 'delay') {
      if (!formData.delayHours.trim() && !formData.delayMinutes.trim()) {
        newErrors.delayHours = 'Delay duration is required';
      } else {
        const hours = parseInt(formData.delayHours) || 0;
        const minutes = parseInt(formData.delayMinutes) || 0;
        if (hours === 0 && minutes === 0) {
          newErrors.delayHours = 'Please enter delay duration';
        }
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

    // Validate denied boarding fields
    if (formData.disruptionType === 'denied_boarding') {
      if (!formData.deniedBoardingReason) {
        newErrors.deniedBoardingReason = 'Reason for denied boarding is required';
      }
      if (!formData.checkInTime) {
        newErrors.checkInTime = 'Check-in time is required for denied boarding claims';
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
      if (!formData.downgradeTiming) {
        newErrors.downgradeTiming = 'When the downgrade occurred is required';
      }
    }

    const emailResult = validateEmail(formData.passengerEmail.trim());
    if (!emailResult.valid) {
      newErrors.passengerEmail = emailResult.error || 'Invalid email';
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
          // Disruption type
          disruptionType: formData.disruptionType,
          // Cancellation fields
          notificationDate: formData.notificationDate,
          noticeGiven: formData.noticeGiven,
          alternativeOffered: formData.alternativeOffered,
          alternativeFlightNumber: formData.alternativeFlightNumber.trim(),
          alternativeDepartureTime: formData.alternativeDepartureTime,
          alternativeArrivalTime: formData.alternativeArrivalTime,
          alternativeTiming: formData.alternativeTiming.trim(),
          careProvided: formData.careProvided,
          passengerChoice: formData.passengerChoice,
          // Denied boarding fields
          boardingType: formData.boardingType,
          volunteersRequested: formData.volunteersRequested,
          deniedBoardingReason: formData.deniedBoardingReason,
          alternativeArrivalDelay: formData.alternativeArrivalDelay,
          checkInTime: formData.checkInTime,
          ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
          // Downgrade fields
          classPaidFor: formData.classPaidFor,
          classReceived: formData.classReceived,
          downgradeTiming: formData.downgradeTiming,
          downgradeReason: formData.downgradeReason
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
    // Clear field valid indicator
    if (fieldValid[field]) {
      setFieldValid(prev => ({ ...prev, [field]: false }));
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
          <div className="relative">
            <input
              type="text"
              id="flightNumber"
              value={formData.flightNumber}
              onChange={(e) => handleInputChange('flightNumber', e.target.value)}
              onBlur={(e) => validateField('flightNumber', e.target.value)}
              placeholder="e.g., BA123"
              className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                errors.flightNumber ? 'border-red-500' : fieldValid.flightNumber ? 'border-green-500' : 'border-gray-300'
              }`}
            />
            {fieldValid.flightNumber && !errors.flightNumber && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xl">✓</span>
            )}
          </div>
          {errors.flightNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.flightNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Found on your boarding pass or confirmation email</p>
        </div>

        {/* Departure Date */}
        <div>
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-2">
            Departure Date *
          </label>
          <div className="relative">
            <input
              type="date"
              id="departureDate"
              value={formData.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              onBlur={(e) => validateField('departureDate', e.target.value)}
              className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                errors.departureDate ? 'border-red-500' : fieldValid.departureDate ? 'border-green-500' : 'border-gray-300'
              }`}
            />
            {fieldValid.departureDate && !errors.departureDate && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xl">✓</span>
            )}
          </div>
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">When was your flight scheduled to depart?</p>
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
        <AirlineAutocomplete
          value={formData.airline}
          onChange={(value) => handleInputChange('airline', value)}
          label="Airline"
          required={true}
          placeholder="e.g., British Airways, BA"
          error={errors.airline}
        />
        <p className="mt-1 text-xs text-gray-500">✈️ The airline operating your flight</p>

        {/* Disruption Type */}
        <div className="md:col-span-2">
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
                className="mr-3 w-4 h-4"
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
                className="mr-3 w-4 h-4"
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
                className="mr-3 w-4 h-4"
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
                className="mr-3 w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium">Seat Downgrade</span>
                <p className="text-xs text-gray-500">Placed in lower class than booked</p>
              </div>
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

      </div>

      {/* CANCELLATION SECTION - Enhanced */}
      {formData.disruptionType === 'cancellation' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

            {/* Notification Date */}
            <div>
              <label htmlFor="notificationDate" className="block text-sm font-medium text-gray-700 mb-2">
                When were you notified of the cancellation? *
              </label>
              <input
                type="date"
                id="notificationDate"
                value={formData.notificationDate}
                onChange={(e) => handleInputChange('notificationDate', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.notificationDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.notificationDate && (
                <p className="mt-1 text-sm text-red-600">{errors.notificationDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">📅 The date you received the cancellation notice</p>
            </div>

            {/* Notice Period */}
            <div>
              <label htmlFor="noticeGiven" className="block text-sm font-medium text-gray-700 mb-2">
                How much notice did you get? *
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
              <p className="mt-1 text-xs text-gray-500">🕐 This affects your compensation eligibility</p>
            </div>

            {/* Alternative Flight Checkbox */}
            <div className="md:col-span-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.alternativeOffered}
                  onChange={(e) => setFormData(prev => ({ ...prev, alternativeOffered: e.target.checked }))}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Airline offered an alternative flight
                </span>
              </label>
            </div>

            {/* Alternative Flight Details - Show if checked */}
            {formData.alternativeOffered && (
              <>
                <div>
                  <label htmlFor="alternativeFlightNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Flight Number
                  </label>
                  <input
                    type="text"
                    id="alternativeFlightNumber"
                    value={formData.alternativeFlightNumber}
                    onChange={(e) => handleInputChange('alternativeFlightNumber', e.target.value)}
                    placeholder="e.g., BA123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="alternativeTiming" className="block text-sm font-medium text-gray-700 mb-2">
                    When was the alternative? *
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
                  <p className="mt-1 text-xs text-gray-500">⏰ This affects your compensation amount</p>
                </div>

                <div>
                  <label htmlFor="alternativeDepartureTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Departure Time
                  </label>
                  <input
                    type="time"
                    id="alternativeDepartureTime"
                    value={formData.alternativeDepartureTime}
                    onChange={(e) => handleInputChange('alternativeDepartureTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="alternativeArrivalTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Arrival Time
                  </label>
                  <input
                    type="time"
                    id="alternativeArrivalTime"
                    value={formData.alternativeArrivalTime}
                    onChange={(e) => handleInputChange('alternativeArrivalTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Care Provided */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What care did the airline provide?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.careProvided.meals}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      careProvided: { ...prev.careProvided, meals: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Meals</span>
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.careProvided.hotel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      careProvided: { ...prev.careProvided, hotel: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Hotel</span>
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.careProvided.transport}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      careProvided: { ...prev.careProvided, transport: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Transport</span>
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.careProvided.communication}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      careProvided: { ...prev.careProvided, communication: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Calls/emails</span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">These are your rights under EU261, separate from compensation</p>
            </div>

            {/* Passenger Choice */}
            <div className="md:col-span-2">
              <label htmlFor="passengerChoice" className="block text-sm font-medium text-gray-700 mb-2">
                What did you choose to do?
              </label>
              <select
                id="passengerChoice"
                value={formData.passengerChoice}
                onChange={(e) => handleInputChange('passengerChoice', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your choice</option>
                <option value="refund">Requested full refund</option>
                <option value="re-routing">Accepted re-routing/alternative flight</option>
                <option value="both">Both - refund for original, paid for new</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">This helps us understand your situation better</p>
            </div>

            {/* Informational Box */}
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Your Rights for Cancellations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Compensation depends on notice period and alternative flight timing</li>
                <li>• Less than 7 days notice: Usually eligible for full compensation</li>
                <li>• You always have the right to a refund OR alternative flight</li>
                <li>• Airlines must provide care (meals, hotel) during waiting time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DENIED BOARDING SECTION */}
      {formData.disruptionType === 'denied_boarding' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Denied Boarding Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

            {/* Boarding Type */}
            <div className="md:col-span-2">
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
                    className="mr-3 mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium">Involuntary - You were denied boarding</span>
                    <p className="text-xs text-gray-500 mt-1">The airline refused to let you board even though you had a valid ticket and checked in on time</p>
                  </div>
                </label>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="boardingType"
                    value="voluntary"
                    checked={formData.boardingType === 'voluntary'}
                    onChange={(e) => handleInputChange('boardingType', e.target.value)}
                    className="mr-3 mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium">Voluntary - You gave up your seat</span>
                    <p className="text-xs text-gray-500 mt-1">You volunteered to give up your seat in exchange for benefits offered by the airline</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Volunteers Requested */}
            <div className="md:col-span-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.volunteersRequested}
                  onChange={(e) => setFormData(prev => ({ ...prev, volunteersRequested: e.target.checked }))}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Did the airline ask for volunteers before denying boarding?
                </span>
              </label>
              <p className="mt-2 text-xs text-gray-500 px-3">Airlines are required to ask for volunteers first in overbooking situations</p>
            </div>

            {/* Denied Boarding Reason */}
            <div>
              <label htmlFor="deniedBoardingReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Denied Boarding *
              </label>
              <select
                id="deniedBoardingReason"
                value={formData.deniedBoardingReason}
                onChange={(e) => handleInputChange('deniedBoardingReason', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.deniedBoardingReason ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select reason</option>
                <option value="overbooking">Overbooking - Flight oversold</option>
                <option value="aircraft_change">Aircraft change - Smaller plane</option>
                <option value="weight_restrictions">Weight/balance restrictions</option>
                <option value="operational">Operational reasons</option>
                <option value="other">Other reason</option>
              </select>
              {errors.deniedBoardingReason && (
                <p className="mt-1 text-sm text-red-600">{errors.deniedBoardingReason}</p>
              )}
            </div>

            {/* Alternative Arrival Delay */}
            <div>
              <label htmlFor="alternativeArrivalDelay" className="block text-sm font-medium text-gray-700 mb-2">
                How late did the alternative flight arrive?
              </label>
              <input
                type="text"
                id="alternativeArrivalDelay"
                value={formData.alternativeArrivalDelay}
                onChange={(e) => handleInputChange('alternativeArrivalDelay', e.target.value)}
                placeholder="e.g., 2 hours, same day, next day"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">⏰ Arriving within 2-4 hours may reduce compensation</p>
            </div>

            {/* Check-in Time */}
            <div>
              <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-2">
                What time did you check in? *
              </label>
              <input
                type="time"
                id="checkInTime"
                value={formData.checkInTime}
                onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.checkInTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.checkInTime && (
                <p className="mt-1 text-sm text-red-600">{errors.checkInTime}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">🕐 Must be within check-in deadline to be eligible</p>
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
              <p className="mt-1 text-xs text-gray-500">💰 Required for US DOT compensation calculation</p>
            </div>

            {/* EU Rights Info Box */}
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">EU Regulation 261/2004 - Denied Boarding Rights</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Up to €600 compensation for involuntary denied boarding</li>
                <li>• Distance-based: €250 (under 1,500km), €400 (1,500-3,500km), €600 (over 3,500km)</li>
                <li>• 50% reduction if alternative arrives within 2-4 hours of original</li>
                <li>• Right to care: meals, hotel, transport during waiting time</li>
                <li>• Choice between refund or alternative flight to final destination</li>
              </ul>
            </div>

            {/* US Rights Info Box */}
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">US DOT - Involuntary Bumping Compensation</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Airlines must ask for volunteers before denying boarding involuntarily</li>
                <li>• 0-1 hour delay: No compensation required</li>
                <li>• 1-2 hours delay (domestic) / 1-4 hours (international): 200% of fare (max $775)</li>
                <li>• 2+ hours delay (domestic) / 4+ hours (international): 400% of fare (max $1,550)</li>
                <li>• Compensation must be paid immediately at the airport</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DOWNGRADE SECTION */}
      {formData.disruptionType === 'downgrade' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seat Downgrade Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

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
              <p className="mt-1 text-xs text-gray-500">💰 Required to calculate your refund amount</p>
            </div>

            {/* Live Compensation Preview */}
            {formData.classPaidFor && formData.classReceived && formData.ticketPrice && parseFloat(formData.ticketPrice) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Estimated Refund</h4>
                <p className="text-2xl font-bold text-green-700">
                  ${(() => {
                    const price = parseFloat(formData.ticketPrice);
                    const distance = 3000; // Placeholder - should be calculated based on route
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
                      percentage = percentage * 0.30; // 30% of fare
                    } else if (distance < 3500) {
                      percentage = percentage * 0.50; // 50% of fare
                    } else {
                      percentage = percentage * 0.75; // 75% of fare
                    }

                    return (price * percentage).toFixed(2);
                  })()}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {(() => {
                    const distance = 3000;
                    if (distance < 1500) return '30% refund for flights under 1,500 km';
                    if (distance < 3500) return '50% refund for flights 1,500-3,500 km';
                    return '75% refund for flights over 3,500 km';
                  })()}
                </p>
              </div>
            )}

            {/* Downgrade Timing */}
            <div>
              <label htmlFor="downgradeTiming" className="block text-sm font-medium text-gray-700 mb-2">
                When did the downgrade happen? *
              </label>
              <select
                id="downgradeTiming"
                value={formData.downgradeTiming}
                onChange={(e) => handleInputChange('downgradeTiming', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.downgradeTiming ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select timing</option>
                <option value="booking">At booking / weeks before flight</option>
                <option value="check-in">At check-in / airport</option>
                <option value="boarding">During boarding</option>
                <option value="in-flight">After boarding / in-flight</option>
              </select>
              {errors.downgradeTiming && (
                <p className="mt-1 text-sm text-red-600">{errors.downgradeTiming}</p>
              )}
            </div>

            {/* Downgrade Reason */}
            <div>
              <label htmlFor="downgradeReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason Given (if any)
              </label>
              <select
                id="downgradeReason"
                value={formData.downgradeReason}
                onChange={(e) => handleInputChange('downgradeReason', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select reason</option>
                <option value="overbooking">Overbooking in higher class</option>
                <option value="aircraft_change">Aircraft change</option>
                <option value="seat_malfunction">Seat malfunction</option>
                <option value="operational">Operational reasons</option>
                <option value="not_given">No reason given</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Informational Box */}
            <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Great News About Downgrades!</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Downgrades have NO extraordinary circumstances exemption</li>
                <li>• You are ALWAYS eligible for a refund - no exceptions</li>
                <li>• Refund amount: 30% (under 1,500km), 50% (1,500-3,500km), 75% (over 3,500km)</li>
                <li>• Must be requested within 7 days for full refund rights</li>
                <li>• This is IN ADDITION to any voluntary compensation from the airline</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Reason for Disruption - Universal field */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

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
            <div className="relative">
              <input
                type="email"
                id="passengerEmail"
                value={formData.passengerEmail}
                onChange={(e) => handleInputChange('passengerEmail', e.target.value)}
                onBlur={(e) => validateField('passengerEmail', e.target.value)}
                placeholder="john@example.com"
                className={`w-full px-4 py-4 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                  errors.passengerEmail ? 'border-red-500' : fieldValid.passengerEmail ? 'border-green-500' : 'border-gray-300'
                }`}
              />
              {fieldValid.passengerEmail && !errors.passengerEmail && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xl">✓</span>
              )}
            </div>
            {emailSuggestion && (
              <p className="mt-1 text-sm text-blue-600">
                Did you mean <button
                  type="button"
                  onClick={() => {
                    handleInputChange('passengerEmail', emailSuggestion);
                    setEmailSuggestion('');
                  }}
                  className="underline font-medium"
                >{emailSuggestion}</button>?
              </p>
            )}
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
