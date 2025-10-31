import FlightPathsAnimation from './FlightPathsAnimation';

/**
 * Hero section with integrated FlightPathsAnimation
 * Proper z-index layering for background animation with content overlay
 */
export default function HeroWithAnimation() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Animation Layer (z-0) */}
      <div className="absolute inset-0 z-0">
        <FlightPathsAnimation />
      </div>

      {/* Optional Gradient Overlay for Better Text Readability (z-10) */}
      <div className="absolute inset-0 z-10 bg-linear-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60" />

      {/* Content Layer (z-20) */}
      <div className="relative z-20 container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl text-center space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Get Up To{' '}
              <span className="text-[#FFB627]">€600</span>{' '}
              For Your Delayed Flight
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto">
              We handle the paperwork while you track your claim in real-time.
              Join thousands of travelers who&apos;ve recovered what they&apos;re owed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-[#FB923C] text-slate-950 font-semibold text-lg rounded-lg hover:bg-[#F97316] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#FB923C]/30 transform hover:-translate-y-0.5">
                Check My Flight
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white font-semibold text-lg rounded-lg hover:bg-slate-700/80 transition-all duration-200 border border-slate-700">
                How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:gap-12 pt-8 lg:pt-12">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FB923C] mb-2">
                  98%
                </div>
                <div className="text-sm sm:text-base text-slate-400">
                  Success Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FB923C] mb-2">
                  €2M+
                </div>
                <div className="text-sm sm:text-base text-slate-400">
                  Recovered
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FB923C] mb-2">
                  10k+
                </div>
                <div className="text-sm sm:text-base text-slate-400">
                  Happy Clients
                </div>
              </div>
            </div>

            {/* Social Proof / Trust Indicators */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FFB627]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FB923C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FFB627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>2 Min Setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (z-30) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 hidden lg:block">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}

