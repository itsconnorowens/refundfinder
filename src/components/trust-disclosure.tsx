'use client'

import { useState } from 'react'
import { Shield, Lock, CheckCircle, Globe, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function TrustDisclosure() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Collapsed State - Trust Badge Bar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left transition-all duration-300 hover:shadow-md rounded-lg bg-white border border-gray-200 p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-expanded={isExpanded}
          >
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Transparent</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">EU-Compliant</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
              Secure, Compliant & Transparent Flight Compensation
            </h2>

            {/* Key Benefits Summary */}
            <p className="text-center text-gray-600 text-sm sm:text-base mb-3">
              Full GDPR compliance • EU-compliant servers • 14-day withdrawal right • No data selling
            </p>

            {/* Expand Indicator */}
            <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
              <span>Learn more about your rights and our commitment</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* Expanded State - Three Pillars of Trust */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isExpanded ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="grid md:grid-cols-3 gap-6">
              {/* Column 1: Who We Are */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Who We Are</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Service Nature</p>
                    <p>Flghtly provides assistance services only. We are not a law firm and do not provide legal advice or representation.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">What We Offer</p>
                    <p>We assess your flight delay and file compensation claims on your behalf with a 100% refund guarantee if we don&apos;t succeed.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Eligibility</p>
                    <p>Compensation depends on flight route, delay duration, and circumstances. We provide initial assessments, but final determination rests with the airline.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/terms"
                    className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors w-full sm:w-auto"
                  >
                    Read Terms of Service
                  </Link>
                </div>
              </div>

              {/* Column 2: Data Security */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Data Security</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">How We Protect You:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>End-to-end encryption</strong> in transit and at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Minimal data collection</strong> - only flight details needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>EU-compliant servers</strong> for data storage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Strict no-sharing policy</strong> - never sell your data</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/privacy"
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors w-full sm:w-auto"
                  >
                    Read Privacy Policy
                  </Link>
                </div>
              </div>

              {/* Column 3: Your Rights */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Your Rights</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">14-Day Withdrawal</p>
                    <p>EU/UK residents can withdraw from this service within 14 days of purchase, no questions asked.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">GDPR Data Rights:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Access</strong> your personal data</li>
                      <li>• <strong>Correct</strong> inaccurate information</li>
                      <li>• <strong>Delete</strong> your data</li>
                      <li>• <strong>Export</strong> your data</li>
                      <li>• <strong>Withdraw</strong> consent anytime</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/gdpr"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
                  >
                    Exercise Your Rights
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
