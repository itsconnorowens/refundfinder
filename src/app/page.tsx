'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, Plane, DollarSign, CheckCircle } from 'lucide-react';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';

export default function Home() {
  const [emailText, setEmailText] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    date: '',
    delay: ''
  });

  const handleCheckEligibility = () => {
    // Handle eligibility check logic here
    console.log('Checking eligibility with email text:', emailText);
    // For demo purposes, show the claim form
    setShowClaimForm(true);
  };

  const handleManualSubmit = () => {
    // Handle manual form submission here
    console.log('Manual form data:', formData);
    // For demo purposes, show the claim form
    setShowClaimForm(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show claim form if user has started the process
  if (showClaimForm) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => setShowClaimForm(false)}
              className="mb-4"
            >
              ← Back to Home
            </Button>
          </div>
          <ClaimSubmissionForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Get Your Flight Delay Compensation in 3 Minutes
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Delayed 3+ hours? You could be owed up to $700. We handle the paperwork.
          </p>
          
          {/* Email Paste Section */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Flight</CardTitle>
              <CardDescription>
                Paste your flight confirmation email below and we&apos;ll check if you&apos;re eligible for compensation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email-text">Flight Confirmation Email</Label>
                <Textarea
                  id="email-text"
                  placeholder="Paste your flight confirmation email here..."
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="min-h-[120px] mt-2"
                />
              </div>
              <Button 
                onClick={handleCheckEligibility}
                className="w-full"
                size="lg"
              >
                Check Eligibility
              </Button>
            </CardContent>
          </Card>

          {/* Manual Entry Form */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Or Enter Details Manually</CardTitle>
                  <CardDescription>
                    Don&apos;t have your email? Enter your flight details manually
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="flex items-center gap-2"
                >
                  {showManualForm ? 'Hide' : 'Show'} Form
                  <ChevronDown className={`h-4 w-4 transition-transform ${showManualForm ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            {showManualForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="flight-number">Flight Number</Label>
                    <Input
                      id="flight-number"
                      placeholder="e.g., AA1234"
                      value={formData.flightNumber}
                      onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="airline">Airline</Label>
                    <Input
                      id="airline"
                      placeholder="e.g., American Airlines"
                      value={formData.airline}
                      onChange={(e) => handleInputChange('airline', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Flight Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delay">Delay Duration</Label>
                    <Input
                      id="delay"
                      placeholder="e.g., 4 hours"
                      value={formData.delay}
                      onChange={(e) => handleInputChange('delay', e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleManualSubmit}
                  className="w-full"
                  size="lg"
                >
                  Check Eligibility
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get your compensation in three simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">1. Check Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Paste your flight confirmation email or enter your flight details. We&apos;ll instantly check if you&apos;re eligible for compensation.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">2. Pay $49</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Only pay if you&apos;re eligible and want to proceed. Our fee is $49, and we only get paid if you get compensated.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Plane className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">3. We Do The Rest</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We handle all the paperwork, legal requirements, and negotiations with the airline. You just sit back and wait for your compensation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about flight delay compensation
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What flights are eligible for compensation?</AccordionTrigger>
              <AccordionContent>
                Flights delayed by 3+ hours within the EU, or flights to/from the EU on EU carriers, are typically eligible for compensation under EU Regulation 261/2004. The amount ranges from €250 to €600 depending on flight distance and delay duration.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How much compensation can I get?</AccordionTrigger>
              <AccordionContent>
                Compensation amounts vary by flight distance and delay duration. Short flights (under 1,500km) can get €250, medium flights (1,500-3,500km) can get €400, and long flights (over 3,500km) can get €600. We&apos;ll calculate your exact entitlement.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>What if the delay was due to weather or air traffic control?</AccordionTrigger>
              <AccordionContent>
                Unfortunately, compensation is not available for delays caused by extraordinary circumstances like severe weather, air traffic control issues, or security threats. However, we&apos;ll assess your specific case to determine eligibility.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>How long does the process take?</AccordionTrigger>
              <AccordionContent>
                Most cases are resolved within 2-6 months. We handle all communication with the airline and legal requirements. You&apos;ll receive updates throughout the process and payment once compensation is secured.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>What if my claim is unsuccessful?</AccordionTrigger>
              <AccordionContent>
                If we&apos;re unable to secure compensation, you don&apos;t pay our fee. We only get paid when you get paid, so we&apos;re motivated to win your case.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white rounded-2xl p-8 md:p-12 shadow-lg max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Your Compensation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of passengers who have successfully claimed their flight delay compensation
          </p>
          <Button size="lg" className="text-lg px-8 py-4">
            Check Your Eligibility Now
          </Button>
        </div>
      </section>
    </div>
  );
}
