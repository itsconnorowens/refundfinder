import FlightPathsAnimation from '@/components/FlightPathsAnimation';

export default function FlightDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold text-white">
            Flight Paths Animation v2.0
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Enhanced animated visualization with cubic bezier curves, compensation pulses,
            and a particle system. Watch planes deliver value at their destinations! ✨
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-[#00D9B5] font-semibold mb-2">✈️ 3 Flight Paths</div>
            <p className="text-slate-400">
              Cubic bezier curves with varied speeds (8s, 12s, 10s) and staggered delays
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-[#FFB627] font-semibold mb-2">💰 Compensation Pulse</div>
            <p className="text-slate-400">
              Gold rings expand from destinations when planes arrive, symbolizing value delivery
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-[#00D9B5] font-semibold mb-2">✨ 25 Particles</div>
            <p className="text-slate-400">
              Drifting upward to represent claims being processed (disabled on mobile)
            </p>
          </div>
        </div>

        {/* Animation Component */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          <FlightPathsAnimation />
        </div>

        {/* Technical Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Technical Details</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <p className="text-slate-300 font-semibold mb-2">Path Geometry</p>
              <ul className="space-y-1">
                <li>• Start: 10% from left, 60% from top</li>
                <li>• End: 90% from right, 40% from top</li>
                <li>• Cubic bezier with gentle arcs</li>
              </ul>
            </div>
            <div>
              <p className="text-slate-300 font-semibold mb-2">Performance</p>
              <ul className="space-y-1">
                <li>• Bundle size: ~35KB (gzipped)</li>
                <li>• 60fps via requestAnimationFrame</li>
                <li>• Viewport-based lazy loading</li>
              </ul>
            </div>
            <div>
              <p className="text-slate-300 font-semibold mb-2">Responsive</p>
              <ul className="space-y-1">
                <li>• &lt;768px: 2 planes (reduced motion)</li>
                <li>• &lt;480px: Particles disabled</li>
                <li>• 16:9 aspect ratio maintained</li>
              </ul>
            </div>
            <div>
              <p className="text-slate-300 font-semibold mb-2">Accessibility</p>
              <ul className="space-y-1">
                <li>• Respects prefers-reduced-motion</li>
                <li>• No interactive elements</li>
                <li>• Screen reader friendly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Spacer for scroll demo */}
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-slate-500">
              Scroll down to see lazy loading in action ↓
            </p>
            <p className="text-slate-600 text-sm">
              The animation below only starts when it enters the viewport
            </p>
          </div>
        </div>

        {/* Second instance to demonstrate lazy loading */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          <FlightPathsAnimation />
        </div>

        {/* Color Palette */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded" style={{ background: '#00D9B5' }} />
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Planes</span>
                <br />#00D9B5
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded" style={{ background: '#FFB627' }} />
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Airports</span>
                <br />#FFB627
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded" style={{ background: 'rgba(0, 217, 181, 0.2)' }} />
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Paths</span>
                <br />Teal @ 20%
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded bg-linear-to-b from-[#0A2463] to-[#051440]" />
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Sky</span>
                <br />Gradient
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-500 pb-8 space-y-2">
          <p className="text-slate-400 font-semibold">Try resizing your browser!</p>
          <p>
            ✓ Cubic bezier curves for smooth paths
            <br />
            ✓ Compensation pulses on destination arrival
            <br />
            ✓ Particle system (25 drifting dots)
            <br />
            ✓ Smart mobile optimizations
          </p>
        </div>
      </div>
    </div>
  );
}

