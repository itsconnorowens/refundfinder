'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plane, DollarSign, CheckCircle } from 'lucide-react';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import { HeroOverlayCard } from '@/components/HeroVariations';
import { EligibilityForm } from '@/components/EligibilityForm';

export default function Home() {
  const [showClaimForm] = useState(false);

  // Show claim form if user has started the process
  if (showClaimForm) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <ClaimSubmissionForm />
        </div>
      </div>
    );
  }

  return (
    <main>
      {/* Hero Section with Eligibility Form */}
      <EligibilityForm />

      {/* How It Works Section */}
      <section className="bg-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-400">
              Get your compensation in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-[#00D9B5]/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#00D9B5]" />
                </div>
                <CardTitle className="text-xl text-white">1. Check Eligibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Enter your flight details in the form above. We&apos;ll instantly check if you&apos;re eligible for compensation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-[#FFB627]/10 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-[#FFB627]" />
                </div>
                <CardTitle className="text-xl text-white">2. We Handle It</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  We provide assistance with paperwork and claim submission. Pay upfront with our <strong className="text-[#00D9B5]">100% refund guarantee</strong> - if we can't file your claim successfully, you get your money back automatically.
                </p>
                <p className="text-yellow-400 text-sm mt-2">
                  <strong>Note:</strong> We provide assistance services only, not legal representation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-[#00D9B5]/10 rounded-full flex items-center justify-center mb-4">
                  <Plane className="w-8 h-8 text-[#00D9B5]" />
                </div>
                <CardTitle className="text-xl text-white">3. Get Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Receive your compensation within 30 days. Most claims are €250-€600 depending on flight distance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-950 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-400">
              Everything you need to know about flight delay compensation
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  What flights are eligible for compensation?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Flights delayed by 3+ hours within the EU, UK, or flights to/from these regions on covered carriers, are typically eligible for compensation under EU Regulation 261/2004 and UK CAA regulations. The amount ranges from €250-€600 (or £250-£520) depending on flight distance and delay duration. We provide assistance services only and cannot guarantee eligibility.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  How much compensation can I get?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Compensation amounts vary by flight distance and delay duration. Short flights (under 1,500km) can get €250/£250, medium flights (1,500-3,500km) can get €400/£400, and long flights (over 3,500km) can get €600/£520. We'll calculate your exact entitlement and provide assistance with your claim.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  What if the delay was due to weather or air traffic control?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Unfortunately, compensation is not available for delays caused by extraordinary circumstances like severe weather, air traffic control issues, or security threats. However, we&apos;ll assess your specific case to determine eligibility.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  How long does the process take?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Most cases are resolved within 2-6 months. We handle all communication with the airline and legal requirements. You&apos;ll receive updates throughout the process and payment once compensation is secured.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  What if my claim is unsuccessful?
                </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                If we're unable to file your claim successfully, you'll receive a <strong className="text-[#00D9B5]">100% automatic refund</strong> of our $49 service fee. This includes cases where we can't file within 48 hours, if your claim is rejected due to our error, or if you request a refund within 24 hours of payment. We're confident in our success rate, but we guarantee your money back if we can't deliver.
              </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  How does the refund guarantee work?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Our refund guarantee is automatic and covers several scenarios: if we don't file your claim within 48 hours, if your claim is rejected due to our error, if you request a refund within 24 hours of payment, or if we determine your flight isn't eligible after payment. Refunds are processed automatically through Stripe and typically appear in your account within 5-10 business days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  What are my data protection rights?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  EU and UK residents have specific rights under GDPR/UK GDPR, including access to your data, correction of errors, deletion, and data portability. You also have the right to withdraw from our service within 14 days. Visit our <a href="/gdpr" className="text-[#00D9B5] underline">GDPR Rights page</a> to exercise these rights.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer Section */}
      <section className="bg-slate-950 py-8">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-200 mb-3">
                Important Legal Disclaimer
              </h3>
              <div className="text-yellow-100 text-sm space-y-2">
                <p>
                  <strong>Service Nature:</strong> RefundFinder provides assistance services only. We are not a law firm and do not provide legal advice or representation.
                </p>
                <p>
                  <strong>Eligibility:</strong> Compensation eligibility depends on various factors including flight route, delay duration, and circumstances. We provide initial assessments, but final determination rests with the airline.
                </p>
                <p>
                  <strong>International Compliance:</strong> We comply with applicable consumer protection laws including GDPR (EU), UK GDPR (UK), and other relevant regulations. See our <a href="/privacy" className="underline hover:text-yellow-200">Privacy Policy</a> and <a href="/terms" className="underline hover:text-yellow-200">Terms of Service</a> for details.
                </p>
                <p>
                  <strong>Consumer Rights:</strong> EU/UK residents have the right to withdraw from this service within 14 days of purchase. See our <a href="/gdpr" className="underline hover:text-yellow-200">GDPR Rights page</a> for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="text-center bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Your Compensation?
            </h2>
            <p className="text-xl text-slate-400 mb-4">
              Join thousands of passengers who have successfully claimed their flight delay compensation
            </p>
            <div className="bg-slate-700/50 rounded-lg p-4 mb-8 border border-slate-600">
              <p className="text-[#00D9B5] font-semibold text-lg mb-2">✓ 100% Refund Guarantee</p>
              <p className="text-slate-300 text-sm">
                Pay upfront with confidence. If we can't file your claim successfully, you get your $49 back automatically.
              </p>
            </div>
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-[#00D9B5] hover:bg-[#00D9B5]/90 text-slate-950 font-semibold"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Check Your Eligibility Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">✈️ RefundFinder</h3>
            <p className="text-slate-400 mb-6">
              Get the compensation you deserve for flight delays and cancellations
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <a 
                href="/terms" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="/privacy" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/gdpr" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                GDPR Rights
              </a>
              <a 
                href="mailto:support@refundfinder.com" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact Support
              </a>
            </div>
            <div className="text-sm text-slate-500">
              © 2024 RefundFinder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}