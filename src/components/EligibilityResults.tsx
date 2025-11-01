'use client';

import { useState } from 'react';
import posthog from 'posthog-js';
import { CheckEligibilityResponse, FlightData, EligibilityData } from '../types/api';
import PaymentForm from './PaymentForm';
import { parseApiError, formatErrorForDisplay } from '@/lib/error-messages';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, convertCompensationAmount } from '@/lib/currency';
import { getAttributionProperties } from '@/lib/marketing-attribution';

interface EligibilityResultsProps {
  results: CheckEligibilityResponse;
  formData?: any;
}

export default function EligibilityResults({ results, formData }: EligibilityResultsProps) {
  const { currency, isEURegion } = useCurrency();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleFileClaimClick = () => {
    // Track file claim button click
    if (typeof window !== 'undefined' && results.data?.eligibility && results.data?.flightData) {
      const eligibilityData = results.data.eligibility as EligibilityData;
      const flightData = results.data.flightData as FlightData;

      // Extract airline and route info for group analytics
      const airlineCode = flightData.flightNumber ? flightData.flightNumber.match(/^[A-Z]{2,3}/)?.[0] || '' : '';
      const routeId = flightData.departureAirport && flightData.arrivalAirport
        ? `${flightData.departureAirport}-${flightData.arrivalAirport}`
        : '';

      // Set up group analytics if we have airline/route data
      if (airlineCode) {
        posthog.group('airline', airlineCode, {
          airline_code: airlineCode,
        });
      }

      if (routeId) {
        posthog.group('route', routeId, {
          route_id: routeId,
          origin_airport: flightData.departureAirport,
          destination_airport: flightData.arrivalAirport,
        });
      }

      posthog.capture('file_claim_clicked', {
        compensation_amount: eligibilityData.compensationAmount,
        regulation: eligibilityData.regulation,
        disruption_type: eligibilityData.disruptionType,
        confidence: eligibilityData.confidence,
        airline: airlineCode,
        route: routeId,
        ...getAttributionProperties(), // Include marketing attribution
        // Add groups to event if available
        ...(airlineCode || routeId ? {
          $groups: {
            ...(airlineCode && { airline: airlineCode }),
            ...(routeId && { route: routeId }),
          },
        } : {}),
      });
    }
    setShowPaymentForm(true);
  };

  if (!results.success) {
    // Parse the error to get user-friendly details
    const errorDetails = parseApiError(results);
    const { title, message, guidanceList } = formatErrorForDisplay(errorDetails);

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">{title}</h3>
          </div>
        </div>
        <div className="text-red-700">
          <p className="font-medium">{message}</p>

          {/* Display guidance if available */}
          {guidanceList && guidanceList.length > 0 && (
            <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-900 mb-2">What to do next:</h4>
              <ul className="text-sm space-y-1.5">
                {guidanceList.map((guidance, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-red-600">•</span>
                    <span>{guidance}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rate limit specific info */}
          {results.retryAfter && (
            <p className="mt-3 text-sm font-medium">
              Try again in {Math.ceil(results.retryAfter / 60)} minute{Math.ceil(results.retryAfter / 60) > 1 ? 's' : ''}
            </p>
          )}
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

  const { flightData, eligibility, validation: _validation } = data;

  // Check if eligible for compensation
  const eligibilityData = eligibility as EligibilityData;
  const isEligible = eligibilityData?.isEligible;
  const compensationAmount = eligibilityData?.compensationAmount;
  const reason = eligibilityData?.reason || 'Unknown';

  // Format compensation amount based on user's currency
  const getFormattedCompensation = () => {
    if (!compensationAmount) {
      // Default to max compensation if not specified
      const eurAmount = 600;
      if (isEURegion) {
        return formatCurrency(eurAmount, 'EUR');
      } else {
        const convertedAmount = convertCompensationAmount(eurAmount, currency);
        return formatCurrency(convertedAmount, currency);
      }
    }

    // Parse EUR amount from string like "€600" or "600"
    if (typeof compensationAmount === 'string') {
      const eurAmountMatch = compensationAmount.match(/\d+/);
      if (eurAmountMatch) {
        const eurAmount = parseInt(eurAmountMatch[0]);
        if (isEURegion) {
          return formatCurrency(eurAmount, 'EUR');
        } else {
          const convertedAmount = convertCompensationAmount(eurAmount, currency);
          return formatCurrency(convertedAmount, currency);
        }
      }
      return compensationAmount;
    }

    // If it's a number, treat it as EUR amount
    const eurAmount = Number(compensationAmount);
    if (!isNaN(eurAmount)) {
      if (isEURegion) {
        return formatCurrency(eurAmount, 'EUR');
      } else {
        const convertedAmount = convertCompensationAmount(eurAmount, currency);
        return formatCurrency(convertedAmount, currency);
      }
    }

    return String(compensationAmount);
  };

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
                Potential Compensation: Up to {getFormattedCompensation()}
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

      {/* Action Buttons */}
      {isEligible && (
        <div className="text-center space-y-4">
          {!showPaymentForm ? (
            <div>
              <button
                onClick={handleFileClaimClick}
                className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-colors"
              >
                Proceed with Claim - $49 Success Fee
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Fully refunded if we don&apos;t secure your compensation
              </p>
            </div>
          ) : (
            <PaymentForm
              formData={formData}
              eligibilityResults={results.data}
              onSuccess={() => {
                // Handle successful payment
                // Payment successful - handle success
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
