import HeroWithAnimation from '@/components/HeroWithAnimation';
import {
  HeroFullBackground,
  HeroSplitScreen,
  HeroContainedAnimation,
  HeroOverlayCard,
  HeroTopAnimation,
} from '@/components/HeroVariations';

/**
 * Hero Showcase Page
 * Demonstrates all hero layout variations with z-index layering
 */
export default function HeroShowcasePage() {
  return (
    <div className="bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white font-bold text-xl">Hero Variations</h1>
            <div className="flex gap-4 text-sm">
              <a href="#centered" className="text-slate-400 hover:text-white transition-colors">
                Centered
              </a>
              <a href="#full-bg" className="text-slate-400 hover:text-white transition-colors">
                Full BG
              </a>
              <a href="#split" className="text-slate-400 hover:text-white transition-colors">
                Split
              </a>
              <a href="#contained" className="text-slate-400 hover:text-white transition-colors">
                Contained
              </a>
              <a href="#overlay" className="text-slate-400 hover:text-white transition-colors">
                Overlay
              </a>
              <a href="#top" className="text-slate-400 hover:text-white transition-colors">
                Top
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Intro Section */}
      <section className="pt-24 pb-12 px-5">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Hero Section Variations
          </h2>
          <p className="text-xl text-slate-400">
            6 different layouts with proper z-index layering for the
            FlightPathsAnimation component. Scroll down to explore each variant.
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              ✓ Z-index layered
            </div>
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              ✓ Mobile responsive
            </div>
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              ✓ Production ready
            </div>
          </div>
        </div>
      </section>

      {/* Variation 1: Centered (Default) */}
      <section id="centered" className="border-t-4 border-[#00D9B5]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              1. Centered Hero (Default)
            </h3>
            <p className="text-slate-400 mb-4">
              Centered content with animation background. Full-screen height with gradient overlay for text readability.
            </p>
            <div className="flex flex-wrap gap-3 text-sm mb-4">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-0: Animation</span>
              <span className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded">z-10: Gradient</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Content</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-30: Scroll indicator</span>
            </div>
          </div>
        </div>
        <HeroWithAnimation />
      </section>

      {/* Variation 2: Full Background */}
      <section id="full-bg" className="border-t-4 border-[#FFB627]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              2. Full Background
            </h3>
            <p className="text-slate-400 mb-4">
              Animation fills entire screen with stronger gradient overlay. Minimal content for maximum visual impact.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-0: Animation</span>
              <span className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded">z-10: Strong Gradient (60-80%)</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Content</span>
            </div>
          </div>
        </div>
        <HeroFullBackground />
      </section>

      {/* Variation 3: Split Screen */}
      <section id="split" className="border-t-4 border-[#00D9B5]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              3. Split Screen
            </h3>
            <p className="text-slate-400 mb-4">
              Content on left, animation on right (desktop). Stacked on mobile. Great for detailed copy.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-10: Animation (right)</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Content (left)</span>
              <span className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded">Grid Layout (lg:cols-2)</span>
            </div>
          </div>
        </div>
        <HeroSplitScreen />
      </section>

      {/* Variation 4: Contained Animation */}
      <section id="contained" className="border-t-4 border-[#FFB627]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              4. Contained Animation
            </h3>
            <p className="text-slate-400 mb-4">
              Animation in bordered card with content above and below. Clean, modern look.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-10: Animation Card</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Content</span>
              <span className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded">Card with border</span>
            </div>
          </div>
        </div>
        <HeroContainedAnimation />
      </section>

      {/* Variation 5: Overlay Card */}
      <section id="overlay" className="border-t-4 border-[#00D9B5]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              5. Overlay Card
            </h3>
            <p className="text-slate-400 mb-4">
              Floating glassmorphic card over animation background. Perfect for forms and signup.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-0: Animation BG</span>
              <span className="px-3 py-1 bg-slate-800 text-[#FFB627] rounded">z-5: Gradient</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Glassmorphic Card</span>
            </div>
          </div>
        </div>
        <HeroOverlayCard />
      </section>

      {/* Variation 6: Top Animation */}
      <section id="top" className="border-t-4 border-[#FFB627]">
        <div className="bg-slate-900 py-8 px-5">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              6. Top Animation
            </h3>
            <p className="text-slate-400 mb-4">
              Animation at top with content card below. Landing page style with clear visual hierarchy.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-slate-800 text-[#00D9B5] rounded">z-10: Animation (top 60vh)</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded">z-20: Content Card (negative margin)</span>
            </div>
          </div>
        </div>
        <HeroTopAnimation />
      </section>

      {/* Implementation Guide */}
      <section className="py-16 px-5 bg-slate-900">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Implementation Guide
          </h2>

          <div className="space-y-8">
            {/* Z-Index Layering */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Z-Index Layering Strategy
              </h3>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-slate-700 text-[#00D9B5] rounded text-sm font-mono">z-0</span>
                  <div>
                    <strong>Background Animation</strong>
                    <p className="text-sm text-slate-400">FlightPathsAnimation component</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-slate-700 text-[#FFB627] rounded text-sm font-mono">z-10</span>
                  <div>
                    <strong>Gradient Overlay (optional)</strong>
                    <p className="text-sm text-slate-400">Improves text readability, typically 20-60% opacity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm font-mono">z-20</span>
                  <div>
                    <strong>Main Content</strong>
                    <p className="text-sm text-slate-400">Text, buttons, forms, cards</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm font-mono">z-30+</span>
                  <div>
                    <strong>UI Elements</strong>
                    <p className="text-sm text-slate-400">Modals, tooltips, navigation, scroll indicators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Quick Start
              </h3>
              <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-[#00D9B5]">
{`import HeroWithAnimation from '@/components/HeroWithAnimation';

export default function HomePage() {
  return <HeroWithAnimation />;
}`}
                </code>
              </pre>
              <p className="text-sm text-slate-400 mt-3">
                Or import individual variations from <code className="text-[#00D9B5]">@/components/HeroVariations</code>
              </p>
            </div>

            {/* Best Practices */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Best Practices
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>Always use relative positioning for parent container</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>Add gradient overlay if text contrast is insufficient</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>Test on mobile devices for touch-safe areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>Use backdrop-blur for glassmorphic cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9B5]">✓</span>
                  <span>Keep z-index values consistent across project</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto max-w-4xl text-center text-slate-500 text-sm">
          <p>All hero variations are production-ready and fully responsive.</p>
          <p className="mt-2">Choose the layout that best fits your design needs.</p>
        </div>
      </footer>
    </div>
  );
}

