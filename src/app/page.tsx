'use client';

import { useState } from 'react';
import FlightLookupForm from '../components/FlightLookupForm';
import EmailParsingForm from '../components/EmailParsingForm';
import EligibilityResults from '../components/EligibilityResults';
import { CheckEligibilityResponse } from '../types/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'flight' | 'email'>('flight');
  const [results, setResults] = useState<CheckEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResults = (response: CheckEligibilityResponse) => {
    setResults(response);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">✈️ RefundFinder</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-gray-500 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900">Pricing</a>
              <a href="#contact" className="text-gray-500 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Get Compensation for
              <span className="text-blue-600"> Flight Delays</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Check if you're eligible for compensation under EU Regulation 261/2004. 
              We handle the entire process for you - no hassle, no risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                ✅ Free eligibility check
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                💰 Up to €600 compensation
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                ⚡ Quick 2-minute check
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('flight')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'flight'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✈️ Flight Details
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📧 Email Upload
              </button>
            </div>

            {/* Forms */}
            {activeTab === 'flight' ? (
              <FlightLookupForm onResults={handleResults} onLoading={handleLoading} />
            ) : (
              <EmailParsingForm onResults={handleResults} onLoading={handleLoading} />
            )}

            {/* Results */}
            {results && (
              <div className="mt-8">
                <EligibilityResults results={results} />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-white">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking your eligibility...
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get your compensation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Check Eligibility</h3>
              <p className="text-gray-600">Enter your flight details or upload your delay email. We'll check if you're eligible for compensation.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">We Handle Everything</h3>
              <p className="text-gray-600">If eligible, we'll submit your claim to the airline and handle all the paperwork for you.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Paid</h3>
              <p className="text-gray-600">Once approved, you'll receive your compensation directly. We only get paid if you win!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">No upfront costs, no hidden fees</p>
          </div>
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Success Fee Only</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">$49</div>
              <p className="text-gray-600 mb-6">Only if we win your case</p>
              <ul className="text-left space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Free eligibility check
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  We handle all paperwork
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Direct communication with airline
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  No win, no fee guarantee
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">✈️ RefundFinder</h3>
            <p className="text-gray-400 mb-4">Get the compensation you deserve for flight delays and cancellations</p>
            <div className="text-sm text-gray-500">
              © 2024 RefundFinder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
