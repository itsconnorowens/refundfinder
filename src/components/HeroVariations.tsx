import FlightPathsAnimation from './FlightPathsAnimation';

/**
 * Hero Layout Variation 1: Full Background
 * Animation fills entire background with strong gradient overlay
 */
export function HeroFullBackground() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Animation (z-0) */}
      <div className="absolute inset-0 z-0">
        <FlightPathsAnimation />
      </div>

      {/* Strong Gradient Overlay (z-10) */}
      <div className="absolute inset-0 z-10 bg-linear-to-b from-slate-950/60 via-slate-950/40 to-slate-950/80" />

      {/* Content (z-20) */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-5 sm:px-10">
        <div className="max-w-5xl text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white">
            Track Your Flight
            <br />
            <span className="text-[#FB923C]">Get Compensated</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Automated flight delay compensation. No upfront costs.
          </p>
          <button className="px-10 py-5 bg-[#FFB627] text-slate-950 font-bold text-lg rounded-lg hover:bg-[#E5A524] transition-all shadow-2xl hover:shadow-[#FFB627]/50">
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero Layout Variation 2: Split Screen
 * Content on left, animation on right (desktop), stacked (mobile)
 */
export function HeroSplitScreen() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen py-12 lg:py-0">
          {/* Content (Left Side) - z-20 */}
          <div className="relative z-20 space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FB923C]/10 border border-[#FB923C]/30 rounded-full text-[#FB923C] text-sm font-semibold">
              <span className="w-2 h-2 bg-[#FB923C] rounded-full animate-pulse" />
              Live Claims Processing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Flight Delayed?
              <br />
              You Deserve
              <br />
              <span className="text-[#FFB627]">Compensation</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-xl lg:max-w-none mx-auto lg:mx-0">
              EU law entitles you to up to €600 for flight delays over 3 hours.
              We make claiming it effortless.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
              <button className="px-8 py-4 bg-[#FB923C] text-slate-950 font-semibold rounded-lg hover:bg-[#F97316] transition-all shadow-lg">
                Check Eligibility
              </button>
              <button className="px-8 py-4 border border-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all">
                Learn More
              </button>
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-8 text-sm text-slate-500 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                ✓ No Win, No Fee
              </div>
              <div className="flex items-center gap-2">
                ✓ 2 Min Process
              </div>
              <div className="flex items-center gap-2">
                ✓ 98% Success
              </div>
            </div>
          </div>

          {/* Animation (Right Side) - z-10 */}
          <div className="relative z-10 order-1 lg:order-2">
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <FlightPathsAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero Layout Variation 3: Contained Animation
 * Animation in a card with content below/above
 */
export function HeroContainedAnimation() {
  return (
    <section className="relative min-h-screen bg-linear-to-b from-slate-950 to-slate-900 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-10 lg:px-15 py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          {/* Top Content */}
          <div className="text-center space-y-4 mb-8 lg:mb-12 relative z-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Your Flight Compensation
              <br />
              <span className="bg-linear-to-r from-[#FB923C] to-[#FFB627] bg-clip-text text-transparent">
                Delivered Automatically
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
              Watch claims being processed in real-time
            </p>
          </div>

          {/* Animation Card - z-10 */}
          <div className="relative z-10 w-full max-w-5xl mb-8 lg:mb-12">
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <FlightPathsAnimation />
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center space-y-6 relative z-20">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-5 bg-[#FB923C] text-slate-950 font-bold text-lg rounded-xl hover:bg-[#F97316] transition-all shadow-xl hover:shadow-2xl hover:shadow-[#FB923C]/40 transform hover:-translate-y-1">
                Start Your Claim
              </button>
              <button className="px-10 py-5 bg-slate-800 text-white font-semibold text-lg rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
                View Example
              </button>
            </div>

            <p className="text-sm text-slate-500">
              ⚡ Average payout: €450 • ⏱️ Processed in 30 days • 🔒 No upfront costs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero Layout Variation 4: Overlay with Card
 * Animation background with floating card overlay
 */
export function HeroOverlayCard() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Animation (z-0) */}
      <div className="absolute inset-0 z-0">
        <FlightPathsAnimation />
      </div>

      {/* Gradient Overlay (z-5) - Lighter to show animation */}
      <div className="absolute inset-0 z-5 bg-linear-to-br from-slate-950/30 via-slate-950/10 to-slate-950/40" />

      {/* Content with Floating Card (z-20) */}
      <div className="relative z-20 container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="flex items-center justify-center min-h-screen py-12">
          <div className="max-w-2xl w-full">
            {/* Floating Card */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12">
              <div className="text-center space-y-6">
                <div className="inline-block px-4 py-2 bg-[#FB923C]/10 border border-[#FB923C]/30 rounded-full text-[#FB923C] text-sm font-semibold mb-4">
                  🚀 Join 10,000+ Travelers
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  Check Your Flight
                  <br />
                  Compensation Now
                </h1>

                <p className="text-lg text-slate-400">
                  Enter your flight details and find out if you&apos;re eligible
                  for up to €600 in compensation
                </p>

                {/* Input Form */}
                <div className="space-y-4 pt-4">
                  <input
                    type="text"
                    placeholder="Flight number (e.g., BA123)"
                    className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#FB923C] transition-all"
                  />
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#FB923C] transition-all"
                  />
                  <button className="w-full px-6 py-4 bg-[#FB923C] text-slate-950 font-bold text-lg rounded-lg hover:bg-[#F97316] transition-all shadow-lg hover:shadow-xl hover:shadow-[#FB923C]/40">
                    Check Eligibility
                  </button>
                </div>

                <p className="text-sm text-slate-500">
                  ✓ Free check • ✓ No obligations • ✓ Secure & private
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero Layout Variation 5: Top Animation
 * Animation at top with content below (landing page style)
 */
export function HeroTopAnimation() {
  return (
    <section className="relative min-h-screen bg-slate-950">
      {/* Animation Section (z-10) */}
      <div className="relative z-10 h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
        <FlightPathsAnimation />
      </div>

      {/* Content Section (z-20) */}
      <div className="relative z-20 -mt-20 sm:-mt-32">
        <div className="container mx-auto px-5 sm:px-10 lg:px-15">
          <div className="max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 sm:p-10 lg:p-12">
              <div className="text-center space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                  Get Your Flight
                  <br />
                  <span className="text-[#FFB627]">Compensation</span> Today
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                  Delayed or cancelled flight? You could be owed up to €600 in
                  compensation under EU law.
                </p>

                <div className="grid sm:grid-cols-3 gap-6 pt-6">
                  <div className="p-6 bg-slate-800/50 rounded-xl">
                    <div className="text-3xl font-bold text-[#FB923C] mb-2">
                      Step 1
                    </div>
                    <p className="text-slate-400 text-sm">
                      Enter flight details
                    </p>
                  </div>
                  <div className="p-6 bg-slate-800/50 rounded-xl">
                    <div className="text-3xl font-bold text-[#FB923C] mb-2">
                      Step 2
                    </div>
                    <p className="text-slate-400 text-sm">
                      We handle the claim
                    </p>
                  </div>
                  <div className="p-6 bg-slate-800/50 rounded-xl">
                    <div className="text-3xl font-bold text-[#FFB627] mb-2">
                      Step 3
                    </div>
                    <p className="text-slate-400 text-sm">
                      Get compensated
                    </p>
                  </div>
                </div>

                <button className="px-12 py-5 bg-[#FB923C] text-slate-950 font-bold text-xl rounded-xl hover:bg-[#F97316] transition-all shadow-2xl hover:shadow-[#FB923C]/50 transform hover:-translate-y-1">
                  Start Your Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

