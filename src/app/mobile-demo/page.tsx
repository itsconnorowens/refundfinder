import FlightPathsAnimation from '@/components/FlightPathsAnimation';

/**
 * Mobile-First Responsive Design Demo
 * Showcases adaptive behavior across mobile, tablet, and desktop breakpoints
 */
export default function MobileDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="py-8 sm:py-12 lg:py-16 px-5 sm:px-10 lg:px-15">
        <div className="max-w-6xl mx-auto text-center space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Mobile-First Responsive Animation
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto">
            Adaptive design that automatically adjusts complexity based on device capabilities.
            Try resizing your browser!
          </p>
        </div>
      </section>

      {/* Breakpoint Indicator */}
      <section className="py-4 px-5 sm:px-10 lg:px-15">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 block sm:hidden" />
                <div className="w-3 h-3 rounded-full bg-green-500 hidden sm:block lg:hidden" />
                <div className="w-3 h-3 rounded-full bg-green-500 hidden lg:block" />
                <span className="text-white font-semibold">
                  <span className="sm:hidden">Mobile</span>
                  <span className="hidden sm:block lg:hidden">Tablet</span>
                  <span className="hidden lg:block">Desktop</span>
                </span>
              </div>
              
              <div className="text-sm text-slate-400">
                <span className="sm:hidden">320px - 767px</span>
                <span className="hidden sm:block lg:hidden">768px - 1023px</span>
                <span className="hidden lg:block">1024px+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Features Grid */}
      <section className="py-8 px-5 sm:px-10 lg:px-15">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
            Adaptive Features
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Planes */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#00D9B5] text-2xl mb-3">✈️</div>
              <h3 className="text-white font-semibold mb-2">Flight Planes</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: 2 planes</p>
                <p className="hidden sm:block lg:hidden">Tablet: 3 planes</p>
                <p className="hidden lg:block">Desktop: 3 planes</p>
              </div>
            </div>

            {/* Particles */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#FFB627] text-2xl mb-3">✨</div>
              <h3 className="text-white font-semibold mb-2">Particles</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: Disabled (0)</p>
                <p className="hidden sm:block lg:hidden">Tablet: 15 particles</p>
                <p className="hidden lg:block">Desktop: 30 particles</p>
              </div>
            </div>

            {/* SVG Height */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#00D9B5] text-2xl mb-3">📐</div>
              <h3 className="text-white font-semibold mb-2">Canvas Height</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: 400px</p>
                <p className="hidden sm:block lg:hidden">Tablet: 500px</p>
                <p className="hidden lg:block">Desktop: 600px</p>
              </div>
            </div>

            {/* Paths */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#FFB627] text-2xl mb-3">〰️</div>
              <h3 className="text-white font-semibold mb-2">Flight Paths</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: Simplified gentler curves</p>
                <p className="hidden sm:block lg:hidden">Tablet: Full cubic bezier</p>
                <p className="hidden lg:block">Desktop: Full cubic bezier</p>
              </div>
            </div>

            {/* Touch Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#00D9B5] text-2xl mb-3">👆</div>
              <h3 className="text-white font-semibold mb-2">Touch Safe</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: 80px bottom clearance</p>
                <p className="hidden sm:block lg:hidden">Tablet: No clearance needed</p>
                <p className="hidden lg:block">Desktop: No clearance needed</p>
              </div>
            </div>

            {/* Text Padding */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="text-[#FFB627] text-2xl mb-3">📝</div>
              <h3 className="text-white font-semibold mb-2">Text Padding</h3>
              <div className="text-sm text-slate-400 space-y-1">
                <p className="sm:hidden">Mobile: 20px</p>
                <p className="hidden sm:block lg:hidden">Tablet: 40px</p>
                <p className="hidden lg:block">Desktop: 60px</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Component */}
      <section className="py-8 px-5 sm:px-10 lg:px-15">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <FlightPathsAnimation />
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            <p className="sm:hidden">
              👆 Showing simplified mobile version with 2 planes
            </p>
            <p className="hidden sm:block lg:hidden">
              ✨ Showing tablet version with 3 planes and 15 particles
            </p>
            <p className="hidden lg:block">
              🚀 Showing full desktop version with 3 planes and 30 particles
            </p>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-8 px-5 sm:px-10 lg:px-15">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Mobile-First Implementation
          </h2>

          <div className="space-y-6">
            {/* Mobile (Base) */}
            <div>
              <h3 className="text-lg font-semibold text-[#00D9B5] mb-3">
                📱 Mobile (Base: 320px - 767px)
              </h3>
              <ul className="text-slate-400 space-y-2 ml-4 text-sm sm:text-base">
                <li>• 2 planes only (reduced complexity)</li>
                <li>• No particle system (better performance)</li>
                <li>• Simplified gentler curves (easier rendering)</li>
                <li>• 400px SVG height (optimized for small screens)</li>
                <li>• 80px touch-safe area at bottom</li>
                <li>• 20px text padding</li>
              </ul>
            </div>

            {/* Tablet */}
            <div>
              <h3 className="text-lg font-semibold text-[#FFB627] mb-3">
                📱 Tablet (768px - 1023px)
              </h3>
              <ul className="text-slate-400 space-y-2 ml-4 text-sm sm:text-base">
                <li>• 3 planes (full complexity)</li>
                <li>• 15 particles (moderate ambient effect)</li>
                <li>• Full cubic bezier curves</li>
                <li>• 500px SVG height</li>
                <li>• No touch-safe clearance</li>
                <li>• 40px text padding</li>
              </ul>
            </div>

            {/* Desktop */}
            <div>
              <h3 className="text-lg font-semibold text-[#00D9B5] mb-3">
                🖥️ Desktop (1024px+)
              </h3>
              <ul className="text-slate-400 space-y-2 ml-4 text-sm sm:text-base">
                <li>• 3 planes (full complexity)</li>
                <li>• 30 particles (full ambient effect)</li>
                <li>• Full cubic bezier curves</li>
                <li>• 600px SVG height (maximum detail)</li>
                <li>• No touch-safe clearance</li>
                <li>• 60px text padding</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tailwind Breakpoints */}
      <section className="py-8 px-5 sm:px-10 lg:px-15">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Tailwind Breakpoints Used
          </h2>

          <div className="space-y-4 text-sm sm:text-base">
            <div className="flex items-start gap-3">
              <code className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded font-mono text-sm">
                base
              </code>
              <div className="text-slate-400">
                Default styles (mobile-first) - Applied to all screen sizes
              </div>
            </div>

            <div className="flex items-start gap-3">
              <code className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded font-mono text-sm">
                sm:
              </code>
              <div className="text-slate-400">
                640px and up - Adjusts for small tablets
              </div>
            </div>

            <div className="flex items-start gap-3">
              <code className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded font-mono text-sm">
                md:
              </code>
              <div className="text-slate-400">
                768px and up - Tablet portrait and landscape
              </div>
            </div>

            <div className="flex items-start gap-3">
              <code className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded font-mono text-sm">
                lg:
              </code>
              <div className="text-slate-400">
                1024px and up - Desktop and larger screens
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <p className="text-slate-300 text-sm">
              <strong>Example:</strong> <code className="text-[#00D9B5]">py-8 sm:py-12 lg:py-16</code>
            </p>
            <p className="text-slate-400 text-sm mt-2">
              This applies 32px padding on mobile, 48px on tablet, and 64px on desktop.
            </p>
          </div>
        </div>
      </section>

      {/* Performance Benefits */}
      <section className="py-8 px-5 sm:px-10 lg:px-15">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Performance Benefits
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <h3 className="text-[#00D9B5] font-semibold mb-3">Mobile Optimizations</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>✅ 50% fewer planes to render</li>
                <li>✅ No particle system overhead</li>
                <li>✅ Simpler paths (faster calculations)</li>
                <li>✅ Smaller canvas (less memory)</li>
                <li>✅ Touch-optimized layout</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <h3 className="text-[#FFB627] font-semibold mb-3">Progressive Enhancement</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>✅ Tablet adds particles gradually</li>
                <li>✅ Desktop shows full complexity</li>
                <li>✅ Automatic adaptation on resize</li>
                <li>✅ No manual configuration needed</li>
                <li>✅ Smooth transitions between states</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Try It */}
      <section className="py-12 px-5 sm:px-10 lg:px-15 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Try It Yourself!
          </h2>
          <p className="text-slate-400">
            Resize your browser window or use DevTools responsive mode to see
            the animation adapt in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <span>📱</span>
              <span>Mobile: &lt; 768px</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span>📱</span>
              <span>Tablet: 768px - 1023px</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span>🖥️</span>
              <span>Desktop: ≥ 1024px</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

