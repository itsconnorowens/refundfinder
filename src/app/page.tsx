'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlightLookupForm from '../components/FlightLookupForm';
import EmailParsingForm from '../components/EmailParsingForm';
import EligibilityResults from '../components/EligibilityResults';
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
import CurrencySelector from '../components/CurrencySelector';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency, getServiceFeeFormatted, formatCompensationRange, convertCompensationAmount, formatCompensationAmount } from '../lib/currency';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export default function Home() {
  const { currency, isEURegion } = useCurrency();
  const [activeTab, setActiveTab] = useState<'flight' | 'email'>('flight');
  const [results, setResults] = useState<CheckEligibilityResponse | null>(null);
  const [_loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Feature flag for A/B testing CTA button text
  const ctaText = useFeatureFlag('hero-cta-text');

  // Get CTA button text based on feature flag
  const getCtaText = () => {
    switch (ctaText) {
      case 'get-started':
        return 'Get Started';
      case 'claim-now':
        return 'Claim Now';
      case 'check-eligibility':
      default:
        return 'Check Eligibility';
    }
  };

  const handleResults = (response: CheckEligibilityResponse) => {
    setResults(response);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle scroll events for header transformation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <motion.header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-md border-gray-200'
            : 'bg-white shadow-sm border-gray-100'
        }`}
        initial={prefersReducedMotion ? { opacity: 1 } : { y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-300 ${
            scrolled ? 'py-2' : 'py-4'
          }`}>
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex-shrink-0 focus:outline-none rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <motion.img
                    src="/icon-192.png"
                    alt="Flghtly Logo"
                    className="w-10 h-10 rounded-full shadow-md cursor-pointer"
                    initial={prefersReducedMotion ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.6,
                            delay: 0.2,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }
                    }
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.1,
                            rotate: 5,
                            transition: { duration: 0.3 }
                          }
                    }
                  />
                  <motion.div
                    className="text-left"
                    initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
                  >
                    <h1 className="text-xl font-bold text-gray-900 text-left">Flghtly</h1>
                    <p className="text-xs text-gray-500 -mt-0.5 text-left">Compensation made simple</p>
                  </motion.div>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <motion.button
                onClick={() => {
                  const section = document.querySelector('#how-it-works');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="relative text-gray-600 hover:text-purple-600 transition-colors font-medium group"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              >
                How It Works
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"
                  initial={{ width: 0 }}
                  whileHover={prefersReducedMotion ? {} : { width: '100%' }}
                />
              </motion.button>
              <motion.button
                onClick={() => {
                  const section = document.querySelector('#success-stories');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="relative text-gray-600 hover:text-purple-600 transition-colors font-medium group"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              >
                Success Stories
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"
                  initial={{ width: 0 }}
                  whileHover={prefersReducedMotion ? {} : { width: '100%' }}
                />
              </motion.button>
              <motion.button
                onClick={() => {
                  const section = document.querySelector('#faq');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="relative text-gray-600 hover:text-purple-600 transition-colors font-medium group"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              >
                FAQ
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"
                  initial={{ width: 0 }}
                  whileHover={prefersReducedMotion ? {} : { width: '100%' }}
                />
              </motion.button>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                onClick={() => {
                  const formSection = document.querySelector('#check-eligibility');
                  formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
                whileHover={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        transition: { duration: 0.2 }
                      }
                }
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                {getCtaText()}
              </motion.button>
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
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get Up to {formatCurrency(isEURegion ? 600 : convertCompensationAmount(600, currency), currency)} for Your Delayed Flight
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {isEURegion
                ? "Check if you're eligible for compensation under EU Regulation 261/2004. We handle the entire process for you - no hassle, no risk."
                : currency === 'GBP'
                ? "Check if you're eligible for compensation under UK CAA regulations. We handle the entire process for you - no hassle, no risk."
                : "Check if you're eligible for compensation under US DOT and international regulations. We handle the entire process for you - no hassle, no risk."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckIcon size={16} />
                Free eligibility check
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <MoneyIcon size={16} />
                Up to {formatCurrency(isEURegion ? 600 : convertCompensationAmount(600, currency), currency)} compensation
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <BoltIcon size={16} />
                Quick 2-minute check
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg text-purple-600 font-medium">Check your flight in 60 seconds ↓</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section id="check-eligibility" className="py-8 scroll-mt-20">
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
                    ? 'bg-white text-purple-600 shadow-sm'
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
                    ? 'bg-white text-purple-600 shadow-sm'
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
          </div>
          
          {/* Trust Indicators */}
          <div className="text-center mt-8">
            <TrustBadges />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get your compensation</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={1} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Check Eligibility</h3>
              <p className="text-gray-600">Enter your flight details or paste your email. Get instant results for free.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={2} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">We File Your Claim</h3>
              <p className="text-gray-600">If eligible, pay {getServiceFeeFormatted(currency)} and we'll submit your claim within 48 hours.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon step={3} size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Money</h3>
              <p className="text-gray-600">Receive {formatCompensationRange(250, 600, currency, isEURegion)} compensation directly from the airline in 4-8 weeks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics Dashboard */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustMetrics />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pay Only When You Win</h3>
              <div className="text-4xl font-bold text-purple-600 mb-4">{getServiceFeeFormatted(currency)}</div>
              <p className="text-gray-600 mb-6">100% risk-free. Keep 100% if we don't succeed.</p>
              <motion.button
                onClick={() => {
                  const formSection = document.querySelector('#check-eligibility');
                  formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full bg-green-50 rounded-lg p-4 cursor-pointer border-2 border-transparent hover:border-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                whileHover={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: [1, 1.02, 1, 1.02, 1],
                        transition: {
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }
                }
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-green-800 font-semibold text-lg">Let's get paid →</p>
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section id="success-stories" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">
              We've helped travelers recover over {currency === 'EUR' ? '€147,000' : currency === 'USD' ? '$158,760' : '£125,000'} in compensation
            </p>
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
                "My flight was delayed 4 hours due to technical issues. Flghtly handled everything and I got {formatCompensationAmount(400, currency, isEURegion)} compensation within 3 weeks!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">{formatCompensationAmount(400, currency, isEURegion)} recovered</span>
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
                "Flight was cancelled with only 2 days notice. The team was professional and I received {formatCompensationAmount(600, currency, isEURegion)} compensation."
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">{formatCompensationAmount(600, currency, isEURegion)} recovered</span>
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
                "I was skeptical at first, but they made the process so easy. Got {formatCompensationAmount(250, currency, isEURegion)} for my 3-hour delay!"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">{formatCompensationAmount(250, currency, isEURegion)} recovered</span>
                <span className="text-sm text-gray-500">4 weeks</span>
              </div>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-purple-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-purple-900 mb-2">Join 320+ Successful Travelers</h3>
              <p className="text-purple-800">
                Average compensation: {formatCompensationAmount(450, currency, isEURegion)} • Success rate: 94% • Average processing time: 3.2 weeks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about flight compensation</p>
          </div>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? -1 : 0)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  What delays and cancellations qualify for compensation?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFaqIndex === 0 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === 0 ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600">
                  For EU261/UK CAA flights: Delays of 3+ hours or cancellations with less than 14 days notice qualify for compensation.
                  For US flights: Airlines have their own policies, typically for delays of 4+ hours.
                </p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? -1 : 1)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  What if my flight was cancelled?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFaqIndex === 1 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === 1 ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600">
                  Cancellations are covered under the same regulations as delays. If your flight was cancelled with less than 14 days notice
                  (EU261/UK CAA) or meets airline-specific criteria (US), you may be entitled to compensation. The amount depends on flight distance.
                </p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? -1 : 2)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  How do you verify my flight information?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFaqIndex === 2 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === 2 ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600">
                  We use real-time flight status APIs to verify your reported delay or cancellation. This helps ensure accuracy and
                  maximizes your chances of success. If verification fails, we'll manually review your case.
                </p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? -1 : 3)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  How long does the process take?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFaqIndex === 3 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === 3 ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600">
                  We file your claim within 48 hours of payment. Airlines typically respond within 2-6 weeks. You'll receive email updates
                  at every step of the process.
                </p>
              </div>
            </div>

            {/* FAQ Item 5 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? -1 : 4)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  What if I'm not eligible?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFaqIndex === 4 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === 4 ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600">
                  If your flight doesn't qualify for compensation, we'll explain why and suggest checking other recent flights.
                  Our eligibility check is completely free with no obligation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Compliance Disclosure */}
      <TrustDisclosure />

      {/* Footer */}
      <footer className="bg-orange-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img
                src="/icon-192.png"
                alt="Flghtly Logo"
                className="w-12 h-12 rounded-full shadow-md"
              />
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900">Flghtly</h3>
                <p className="text-sm text-gray-600 -mt-0.5">Compensation made simple</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Get the compensation you deserve for flight delays and cancellations</p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <a
                href="/terms"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/gdpr"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                GDPR Rights
              </a>
              <a
                href="mailto:claims@flghtly.com"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Contact Support
              </a>
            </div>
            <div className="flex flex-col items-center gap-4">
              <CurrencySelector />
              <div className="text-sm text-gray-500">
                © 2024 Flghtly. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}