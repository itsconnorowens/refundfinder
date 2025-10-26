import FlightPathsAnimation from '@/components/FlightPathsAnimation';

/**
 * Example hero section integrating the enhanced flight paths animation
 * Shows real-world usage for a flight compensation service
 */
export default function HeroExamplePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden">
        {/* Content Layer */}
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Get Up To <span className="text-[#FFB627]">€600</span> For Your
                Delayed Flight
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
                We handle the paperwork while you track your claim in
                real-time. Join thousands of travelers who&apos;ve recovered
                what they&apos;re owed.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-[#00D9B5] text-slate-950 font-semibold rounded-lg hover:bg-[#00BF9F] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Check My Flight
                </button>
                <button className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-200 border border-slate-700">
                  How It Works
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-[#00D9B5]">
                    98%
                  </div>
                  <div className="text-sm text-slate-400">Success Rate</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-[#00D9B5]">
                    €2M+
                  </div>
                  <div className="text-sm text-slate-400">Recovered</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-[#00D9B5]">
                    10k+
                  </div>
                  <div className="text-sm text-slate-400">Happy Clients</div>
                </div>
              </div>
            </div>

            {/* Right: Animation */}
            <div className="order-first lg:order-last">
              <FlightPathsAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-900 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose RefundFinder?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-[#00D9B5] text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Automated Tracking
              </h3>
              <p className="text-slate-400">
                Our system continuously monitors your flights and automatically
                detects when you&apos;re eligible for compensation.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-[#FFB627] text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Win, No Fee
              </h3>
              <p className="text-slate-400">
                We only get paid when you do. Our success is tied to yours,
                ensuring we fight hard for every claim.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-[#00D9B5] text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Fast Payouts
              </h3>
              <p className="text-slate-400">
                Most claims are processed within 30 days. Watch the
                compensation pulse as we deliver your money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works with Second Animation */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Claims Being Processed Right Now
          </h2>

          <div className="max-w-5xl mx-auto mb-12">
            <FlightPathsAnimation />
          </div>

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-slate-400">
              Watch live as claims (represented by drifting particles) are
              processed through our system. Each plane completing its journey
              represents compensation being delivered to travelers like you.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00D9B5]" />
                <span>Active Claims</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFB627]" />
                <span>Compensation Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-b from-[#0A2463] to-slate-950 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Your Compensation?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            It takes just 2 minutes to check if you&apos;re eligible. No
            upfront costs, no hidden fees.
          </p>
          <button className="px-10 py-5 bg-[#00D9B5] text-slate-950 font-bold text-lg rounded-lg hover:bg-[#00BF9F] transition-all duration-200 shadow-2xl hover:shadow-[#00D9B5]/50 transform hover:-translate-y-1">
            Check Eligibility Now
          </button>
        </div>
      </section>
    </div>
  );
}

