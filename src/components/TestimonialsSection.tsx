import { testimonials } from '@/lib/testimonials';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCompensationAmount, convertCompensationAmount } from '@/lib/currency';

interface TestimonialsSectionProps {
  className?: string;
}

export function TestimonialsSection({ className = "" }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currency, isEURegion } = useCurrency();

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  // Calculate total recovered amount dynamically
  const totalRecoveredEur = 147000;
  const totalRecovered = isEURegion
    ? totalRecoveredEur
    : convertCompensationAmount(totalRecoveredEur, currency);

  return (
    <section className={`bg-slate-950 py-20 ${className}`}>
      <div className="container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-slate-400">
            Join {testimonials.length * 64}+ travelers who have successfully claimed their compensation
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FB923C] mb-2">
              {formatCompensationAmount(totalRecovered, currency, isEURegion)}
            </div>
            <div className="text-slate-400">Total Recovered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FB923C] mb-2">320</div>
            <div className="text-slate-400">Happy Travelers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FB923C] mb-2">94%</div>
            <div className="text-slate-400">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FB923C] mb-2">3.2</div>
            <div className="text-slate-400">Weeks Avg</div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Quote */}
                <blockquote className="text-xl text-slate-300 italic">
                  "{currentTestimonial.quote}"
                </blockquote>

                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold text-white">{currentTestimonial.name}</span>
                    {currentTestimonial.verified && (
                      <span className="text-[#FB923C] text-sm">✓ Verified</span>
                    )}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {currentTestimonial.route} • {currentTestimonial.airline}
                  </div>
                  <div className="text-[#FB923C] font-semibold">
                    {formatCompensationAmount(currentTestimonial.amountEur, currency, isEURegion)} recovered in {currentTestimonial.timeline}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={prevTestimonial}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Dots */}
                  <div className="flex gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-[#FB923C]' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextTestimonial}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
