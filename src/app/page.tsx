'use client';

import React, { useState, useEffect } from 'react';
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
import { MobileMenu } from '../components/MobileMenu';
import { InlineErrorBoundary } from '../components/ErrorBoundary';
import TrustDisclosure from '../components/trust-disclosure';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'flight' | 'email'>('flight');
  const [results, setResults] = useState<CheckEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleResults = (response: CheckEligibilityResponse) => {
    setResults(response);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  // Handle keyboard events (Escape to close menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <img
                    src="/icon-192.png"
                    alt="Flghtly Logo"
                    className="w-10 h-10 rounded-xl shadow-md"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Flghtly</h1>
                    <p className="text-xs text-gray-500 -mt-0.5">Compensation made simple</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => {
                  const section = document.querySelector('#how-it-works');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('#pricing');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('#faq');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                FAQ
              </button>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => {
                  const formSection = document.querySelector('#eligibility-form');
                  formSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Check Eligibility
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-600 hover:text-gray-900 p-2"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

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
      <section id="eligibility-form" className="py-8">
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
            <InlineErrorBoundary context="eligibility-form">
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
            </InlineErrorBoundary>

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
                "My flight was delayed 4 hours due to technical issues. Flghtly handled everything and I got €400 compensation within 3 weeks!"
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
          <div id="pricing" className="mt-16 max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
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
      <section id="faq" className="py-20 bg-gray-50">
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

      {/* Trust & Compliance Disclosure */}
      <TrustDisclosure />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img
                src="/icon-192.png"
                alt="Flghtly Logo"
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <div className="text-left">
                <h3 className="text-2xl font-bold">Flghtly</h3>
                <p className="text-sm text-gray-400 -mt-0.5">Compensation made simple</p>
              </div>
            </div>
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
                href="mailto:claims@flghtly.com" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact Support
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Flghtly. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}