'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import FlightLookupForm from '../components/FlightLookupForm';
import EmailParsingForm from '../components/EmailParsingForm';
import EligibilityResults from '../components/EligibilityResults';
import FlightPathsAnimation from '../components/FlightPathsAnimation';
import { CheckEligibilityResponse } from '../types/api';
import { CheckIcon, MoneyIcon, BoltIcon, PlaneIcon, EmailIcon } from '../components/icons';
import { StarRating } from '../components/StarRating';
import { Avatar } from '../components/Avatar';
import { TrustBadges } from '../components/TrustBadges';
import { TrustMetrics } from '../components/TrustMetrics';
import { StepIcon } from '../components/icons';

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
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <PlaneIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">RefundFinder</h1>
                    <p className="text-xs text-gray-500 -mt-1">Flight Compensation</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <nav className="flex space-x-8">
                <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">How It Works</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</a>
                <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Contact</a>
              </nav>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckIcon size={16} className="text-green-500" />
                <span>Trusted by 320+ travelers</span>
              </div>
            </div>
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Animation */}
      <section className="relative py-12 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 opacity-10 sm:opacity-20">
          <FlightPathsAnimation />
        </div>
        
        {/* Light overlay to maintain readability */}
        <div className="absolute inset-0 z-5 bg-gradient-to-br from-blue-50/80 via-indigo-100/60 to-blue-50/80" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get Up to €600 for Your Delayed Flight
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Check if you're eligible for compensation under EU Regulation 261/2004. 
              We handle the entire process for you - no hassle, no risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckIcon size={16} />
                Free eligibility check
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <MoneyIcon size={16} />
                Up to €600 compensation
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <BoltIcon size={16} />
                Quick 2-minute check
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg text-blue-600 font-medium">Check your flight in 60 seconds ↓</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Eligibility — Free & Instant</h2>
            <p className="text-gray-600">Get your compensation estimate in under 60 seconds</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
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
                <div className="flex items-center justify-center gap-2">
                  <PlaneIcon size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Flight Details</div>
                    <div className="text-xs opacity-75">Manual — Enter details yourself</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <EmailIcon size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Email Upload</div>
                    <div className="text-xs opacity-75">Fastest — Paste your confirmation email</div>
                  </div>
                </div>
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
          
          {/* Trust Indicators */}
          <div className="text-center mt-8">
            <TrustBadges />
          </div>
        </div>
      </section>

      {/* Trust Metrics Dashboard */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustMetrics />
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">We've helped travelers recover over €147,000 in compensation</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <motion.div 
              className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center mb-4">
                <Avatar initials="SJ" color="blue" className="mr-3" />
                <div>
                  <h4 className="font-semibold">Sarah J.</h4>
                  <p className="text-sm text-gray-600">London → Paris</p>
                  <StarRating rating={5} size={14} className="mt-1" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "My flight was delayed 4 hours due to technical issues. RefundFinder handled everything and I got €400 compensation within 3 weeks!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€400 recovered</span>
                <span className="text-sm text-gray-500">3 weeks</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center mb-4">
                <Avatar initials="MR" color="green" className="mr-3" />
                <div>
                  <h4 className="font-semibold">Michael R.</h4>
                  <p className="text-sm text-gray-600">Frankfurt → New York</p>
                  <StarRating rating={5} size={14} className="mt-1" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "Flight was cancelled with only 2 days notice. The team was professional and I received €600 compensation."
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€600 recovered</span>
                <span className="text-sm text-gray-500">2 weeks</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center mb-4">
                <Avatar initials="AL" color="purple" className="mr-3" />
                <div>
                  <h4 className="font-semibold">Anna L.</h4>
                  <p className="text-sm text-gray-600">Amsterdam → Barcelona</p>
                  <StarRating rating={5} size={14} className="mt-1" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "I was skeptical at first, but they made the process so easy. Got €250 for my 3-hour delay!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">€250 recovered</span>
                <span className="text-sm text-gray-500">4 weeks</span>
              </div>
            </motion.div>
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get your compensation</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={1} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Check Eligibility</h3>
              <p className="text-gray-600">Enter your flight details or paste your email. Get instant results for free.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={2} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">We File Your Claim</h3>
              <p className="text-gray-600">If eligible, pay $49 and we'll submit your claim within 48 hours.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={3} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Money</h3>
              <p className="text-gray-600">Receive €250-€600 compensation directly from the airline in 4-8 weeks.</p>
            </div>
          </div>
          
          {/* Pricing Callout */}
          <div className="mt-16 max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Success Fee Only</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">$49</div>
              <p className="text-gray-600 mb-6">Only if we win your case</p>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ No win, no fee guarantee</p>
              </div>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How long does the process take?</h3>
              <p className="text-gray-600">
                We file your claim within 48 hours of payment. Airlines typically respond within 2-6 weeks. You'll receive email updates 
                at every step of the process.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if I'm not eligible?</h3>
              <p className="text-gray-600">
                If your flight doesn't qualify for compensation, we'll explain why and suggest checking other recent flights. 
                Our eligibility check is completely free with no obligation.
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