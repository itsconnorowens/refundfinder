'use client';

import { useState } from 'react';
import { CheckEligibilityResponse, FlightData, EligibilityData } from '../types/api';
import PaymentForm from './PaymentForm';

interface EligibilityResultsProps {
  results: CheckEligibilityResponse;
}

export default function EligibilityResults({ results }: EligibilityResultsProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!results.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Unable to Check Eligibility</h3>
          </div>
        </div>
        <div className="text-red-700">
          <p>{results.error || 'An unexpected error occurred while checking your eligibility.'}</p>
          <p className="mt-2 text-sm">Please try again or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  const { data } = results;
  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">No Data Available</h3>
          </div>
        </div>
        <div className="text-yellow-700">
          <p>We couldn&apos;t retrieve flight data for your request.</p>
        </div>
      </div>
    );
  }

  const { flightData, eligibility, validation } = data;

  // Check if eligible for compensation
  const eligibilityData = eligibility as EligibilityData;
  const isEligible = eligibilityData?.isEligible;
  const compensationAmount = eligibilityData?.compensationAmount;
  const reason = eligibilityData?.reason || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Eligibility Results</h3>
        <p className="text-gray-600">Based on your flight information</p>
      </div>

      {/* Eligibility Status */}
      <div className={`rounded-lg p-6 ${
        isEligible
          ? 'bg-green-50 border border-green-200'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {isEligible ? (
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${
              isEligible ? 'text-green-800' : 'text-gray-800'
            }`}>
              {isEligible ? 'You May Be Eligible for Compensation!' : 'Not Eligible for Compensation'}
            </h3>
          </div>
        </div>

        <div className={`${isEligible ? 'text-green-700' : 'text-gray-700'}`}>
          {isEligible ? (
            <div>
              <p className="text-lg font-semibold mb-2">
                Potential Compensation: {compensationAmount || 'Up to €600'}
              </p>

              {/* Disruption Type Specific Information */}
              {eligibilityData?.disruptionType === 'delay' && (
                <p className="mb-4">
                  Based on EU Regulation 261/2004, you may be entitled to compensation for your flight delay.
                </p>
              )}

              {eligibilityData?.disruptionType === 'cancellation' && (
                <p className="mb-4">
                  Based on EU Regulation 261/2004, you may be entitled to compensation for your flight cancellation.
                </p>
              )}

              {eligibilityData?.disruptionType === 'denied_boarding' && (
                <div className="mb-4">
                  <p className="mb-2">
                    You are entitled to compensation for being denied boarding{eligibilityData?.deniedBoardingType === 'involuntary' ? ' involuntarily' : ''}.
                  </p>

                  {/* Denied Boarding Specific Details */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                    <h4 className="font-medium text-blue-900 mb-2">Denied Boarding Rights</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {eligibilityData?.deniedBoardingType === 'involuntary' ? (
                        <>
                          <li>• Involuntary denied boarding qualifies for full compensation</li>
                          <li>• Compensation is distance-based under EU261/2004</li>
                          <li>• You are also entitled to care (meals, hotel, transport)</li>
                          <li>• Choice between refund or alternative flight to final destination</li>
                        </>
                      ) : (
                        <>
                          <li>• Voluntary denied boarding - airline should have offered benefits</li>
                          <li>• You still have rights to alternative transport or refund</li>
                          <li>• Additional compensation depends on your agreement with airline</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {eligibilityData?.additionalRights && eligibilityData.additionalRights.length > 0 && (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-4 mt-3">
                      <h4 className="font-medium text-green-900 mb-2">Additional Rights</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        {eligibilityData.additionalRights.map((right: string, index: number) => (
                          <li key={index}>• {right}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {eligibilityData?.disruptionType === 'downgrade' && (
                <div className="mb-4">
                  <p className="mb-2 font-medium">
                    Great news! Downgrades are always eligible for refunds - no exceptions!
                  </p>

                  {/* Downgrade Specific Details */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
                    <h4 className="font-medium text-purple-900 mb-2">Downgrade Refund Details</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      {eligibilityData?.bookedClass && eligibilityData?.actualClass && (
                        <li>• You were downgraded from <strong>{eligibilityData.bookedClass}</strong> to <strong>{eligibilityData.actualClass}</strong></li>
                      )}
                      {eligibilityData?.fareDifferenceRefund && (
                        <li>• Estimated refund: <strong>${eligibilityData.fareDifferenceRefund}</strong></li>
                      )}
                      <li>• Refund percentage based on flight distance</li>
                      <li>• No extraordinary circumstances exemption applies</li>
                      <li>• Must be claimed within 7 days for full rights</li>
                    </ul>
                  </div>

                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 mt-3">
                    <h4 className="font-medium text-green-900 mb-2">Why This Amount?</h4>
                    <p className="text-sm text-green-800">
                      Under EU Regulation 261/2004, passengers downgraded to a lower class are entitled to a refund of:
                    </p>
                    <ul className="text-sm text-green-800 space-y-1 mt-2">
                      <li>• 30% of ticket price for flights under 1,500 km</li>
                      <li>• 50% of ticket price for flights 1,500-3,500 km</li>
                      <li>• 75% of ticket price for flights over 3,500 km</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* General Next Steps */}
              {eligibilityData?.disruptionType !== 'denied_boarding' && eligibilityData?.disruptionType !== 'downgrade' && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• We&apos;ll submit your claim to the airline</li>
                    <li>• Handle all paperwork and communication</li>
                    <li>• Keep you updated on progress via email</li>
                    <li>• Only charge if we successfully get you compensation</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2">
                <strong>Reason:</strong> {reason}
              </p>
              <p className="text-sm">
                Unfortunately, your flight doesn&apos;t meet the criteria for compensation under current regulations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flight Details */}
      {flightData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Flight Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Flight Number:</span>
              <span className="ml-2 text-gray-900">
                {(flightData as FlightData).flightNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Date:</span>
              <span className="ml-2 text-gray-900">
                {(flightData as FlightData).departureDate || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Route:</span>
              <span className="ml-2 text-gray-900">
                {(flightData as FlightData).departureAirport && (flightData as FlightData).arrivalAirport
                  ? `${(flightData as FlightData).departureAirport} → ${(flightData as FlightData).arrivalAirport}`
                  : 'N/A'
                }
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Status:</span>
              <span className="ml-2 text-gray-900">
                {(flightData as FlightData).status || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Details */}
      {validation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-blue-900 mb-4">Validation Details</h4>
          <div className="text-sm text-blue-800">
            <p>Method: {results.method === 'email_parsing' ? 'Email Parsing' : 'Flight Lookup'}</p>
            {validation && typeof validation === 'object' && 'isValid' in validation && (
              <p>Data Valid: {validation.isValid ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isEligible && (
        <div className="text-center space-y-4">
          {!showPaymentForm ? (
            <div>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-colors"
              >
                Proceed with Claim - $49 Success Fee
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Only charged if we successfully get you compensation
              </p>
            </div>
          ) : (
            <PaymentForm 
              onSuccess={() => {
                // Handle successful payment
                // Payment successful - handle success
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
        </div>
      )}

      {/* Try Again Button */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Check Another Flight
        </button>
      </div>
    </div>
  );
}
