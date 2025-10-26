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
                  We handle all the paperwork and legal requirements. No win, no fee - we only get paid if you do.
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
                  Flights delayed by 3+ hours within the EU, or flights to/from the EU on EU carriers, are typically eligible for compensation under EU Regulation 261/2004. The amount ranges from €250 to €600 depending on flight distance and delay duration.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-slate-700">
                <AccordionTrigger className="text-white hover:text-[#00D9B5]">
                  How much compensation can I get?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Compensation amounts vary by flight distance and delay duration. Short flights (under 1,500km) can get €250, medium flights (1,500-3,500km) can get €400, and long flights (over 3,500km) can get €600. We&apos;ll calculate your exact entitlement.
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
                  If we&apos;re unable to secure compensation, you don&apos;t pay our fee. We only get paid when you get paid, so we&apos;re motivated to win your case.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of passengers who have successfully claimed their flight delay compensation
            </p>
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
    </main>
  );
}