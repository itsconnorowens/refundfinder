'use client';

import { useState } from 'react';
import FlightLookupForm from '../components/FlightLookupForm';
import EmailParsingForm from '../components/EmailParsingForm';
import EligibilityResults from '../components/EligibilityResults';
import FlightPathsAnimation from '../components/FlightPathsAnimation';
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

      {/* Hero Section with Animation */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 opacity-20">
          <FlightPathsAnimation />
        </div>
        
        {/* Light overlay to maintain readability */}
        <div className="absolute inset-0 z-5 bg-gradient-to-br from-blue-50/80 via-indigo-100/60 to-blue-50/80" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Check Eligibility</h3>
              <p className="text-gray-600">Enter your flight details or upload your delay/cancellation email. We'll check if you're eligible for compensation.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">We Verify Your Flight</h3>
              <p className="text-gray-600">We verify your flight status using real-time data to ensure accuracy and maximize your chances of success.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay Only If Eligible</h3>
              <p className="text-gray-600">If eligible, pay our $49 service fee and we'll submit your claim to the airline within 48 hours.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Updates & Compensation</h3>
              <p className="text-gray-600">Receive email updates at every step. Once approved, you'll get your compensation directly from the airline.</p>
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

      {/* Success Stories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">We've helped travelers recover over €147,000 in compensation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sarah J.</h4>
                  <p className="text-sm text-gray-600">London → Paris</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "My flight was delayed 4 hours due to technical issues. RefundFinder handled everything and I got €400 compensation within 3 weeks!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€400 recovered</span>
                <span className="text-sm text-gray-500">3 weeks</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">MR</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michael R.</h4>
                  <p className="text-sm text-gray-600">Frankfurt → New York</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "Flight was cancelled with only 2 days notice. The team was professional and I received €600 compensation."
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€600 recovered</span>
                <span className="text-sm text-gray-500">2 weeks</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">AL</span>
                </div>
                <div>
                  <h4 className="font-semibold">Anna L.</h4>
                  <p className="text-sm text-gray-600">Amsterdam → Barcelona</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "I was skeptical at first, but they made the process so easy. Got €250 for my 3-hour delay!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€250 recovered</span>
                <span className="text-sm text-gray-500">4 weeks</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Join 320+ Successful Travelers</h3>
              <p className="text-blue-800">
                Average compensation: €450 • Success rate: 94% • Average processing time: 3.2 weeks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about flight compensation</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What delays and cancellations qualify for compensation?</h3>
              <p className="text-gray-600">
                For EU261/UK CAA flights: Delays of 3+ hours or cancellations with less than 14 days notice qualify for compensation. 
                For US flights: Airlines have their own policies, typically for delays of 4+ hours.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if my flight was cancelled?</h3>
              <p className="text-gray-600">
                Cancellations are covered under the same regulations as delays. If your flight was cancelled with less than 14 days notice 
                (EU261/UK CAA) or meets airline-specific criteria (US), you may be entitled to compensation. The amount depends on flight distance.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do you verify my flight information?</h3>
              <p className="text-gray-600">
                We use real-time flight status APIs to verify your reported delay or cancellation. This helps ensure accuracy and 
                maximizes your chances of success. If verification fails, we'll manually review your case.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What's your refund policy?</h3>
              <p className="text-gray-600">
                We offer a 100% money-back guarantee. If we can't file your claim successfully or you're not satisfied with our service, 
                you'll receive a full automatic refund of the $49 service fee.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How long does the process take?</h3>
              <p className="text-gray-600">
                We file your claim within 48 hours of payment. Airlines typically respond within 2-6 weeks. You'll receive email updates 
                at every step of the process.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Do I need to provide documents?</h3>
              <p className="text-gray-600">
                Yes, you'll need to upload your boarding pass and proof of delay/cancellation (like screenshots or airline emails). 
                We'll guide you through the document requirements during the claim process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                Important Legal Disclaimer
              </h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <p>
                  <strong>Service Nature:</strong> RefundFinder provides assistance services only. We are not a law firm and do not provide legal advice or representation.
                </p>
                <p>
                  <strong>Eligibility:</strong> Compensation eligibility depends on various factors including flight route, delay duration, and circumstances. We provide initial assessments, but final determination rests with the airline.
                </p>
                <p>
                  <strong>International Compliance:</strong> We comply with applicable consumer protection laws including GDPR (EU), UK GDPR (UK), and other relevant regulations. See our <a href="/privacy" className="underline hover:text-yellow-900">Privacy Policy</a> and <a href="/terms" className="underline hover:text-yellow-900">Terms of Service</a> for details.
                </p>
                <p>
                  <strong>Consumer Rights:</strong> EU/UK residents have the right to withdraw from this service within 14 days of purchase. See our <a href="/gdpr" className="underline hover:text-yellow-900">GDPR Rights page</a> for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GDPR Compliance Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Data Protection Rights</h2>
            <p className="text-xl text-gray-600">We respect your privacy and comply with international data protection laws</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">EU/UK GDPR Rights</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                <li>• <strong>Correction:</strong> Correct inaccurate or incomplete data</li>
                <li>• <strong>Deletion:</strong> Request deletion of your data</li>
                <li>• <strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li>• <strong>Withdrawal:</strong> Withdraw consent within 14 days</li>
              </ul>
              <div className="mt-4">
                <a 
                  href="/gdpr" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Exercise Your Rights
                </a>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-green-900 mb-3">Data Security & Privacy</h3>
              <ul className="text-green-800 space-y-2 text-sm">
                <li>• <strong>Encryption:</strong> All data encrypted in transit and at rest</li>
                <li>• <strong>Minimal Collection:</strong> Only collect necessary flight data</li>
                <li>• <strong>Secure Storage:</strong> Data stored in EU-compliant servers</li>
                <li>• <strong>No Sharing:</strong> Never sell or share your personal data</li>
                <li>• <strong>Retention:</strong> Data deleted after claim completion</li>
              </ul>
              <div className="mt-4">
                <a 
                  href="/privacy" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Read Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">✈️ RefundFinder</h3>
            <p className="text-gray-400 mb-6">Get the compensation you deserve for flight delays and cancellations</p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <a 
                href="/terms" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="/privacy" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/gdpr" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                GDPR Rights
              </a>
              <a 
                href="mailto:support@refundfinder.com" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact Support
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 RefundFinder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}