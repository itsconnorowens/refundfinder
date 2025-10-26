/**
 * Example usage of FlightPathsAnimation component
 * 
 * This file demonstrates different ways to integrate the animation
 * into your application.
 */

import FlightPathsAnimation from './FlightPathsAnimation';

// Example 1: Simple usage in a hero section
export function HeroWithAnimation() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white">
              Track Your Flight Compensation
            </h1>
            <p className="text-xl text-slate-300">
              Get what you deserve when flights are delayed or cancelled.
            </p>
            <button className="px-8 py-3 bg-[#00D9B5] text-slate-950 font-semibold rounded-lg hover:bg-[#00BF9F] transition-colors">
              Check Eligibility
            </button>
          </div>
          <div className="lg:col-span-1">
            <FlightPathsAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}

// Example 2: Full-width banner
export function AnimatedBanner() {
  return (
    <div className="w-full bg-linear-to-b from-[#0A2463] to-slate-950">
      <div className="max-w-7xl mx-auto">
        <FlightPathsAnimation />
      </div>
    </div>
  );
}

// Example 3: Card with animation
export function FeatureCard() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900">
      <FlightPathsAnimation />
      <div className="p-6 space-y-4">
        <h3 className="text-2xl font-bold text-white">
          Global Coverage
        </h3>
        <p className="text-slate-300">
              We track flights worldwide and automatically detect when you&apos;re
              eligible for compensation.
        </p>
      </div>
    </div>
  );
}

// Example 4: Constrained width with custom container
export function ResponsiveExample() {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Mobile: Full width */}
      <div className="sm:hidden mb-8">
        <FlightPathsAnimation />
      </div>

      {/* Tablet and up: Constrained width */}
      <div className="hidden sm:block max-w-4xl mx-auto">
        <FlightPathsAnimation />
      </div>
    </div>
  );
}

// Example 5: Multiple instances with spacing
export function MultipleInstances() {
  return (
    <div className="space-y-24 py-12 bg-slate-950">
      <section>
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          How It Works
        </h2>
        <FlightPathsAnimation />
      </section>

      <section className="prose prose-invert mx-auto">
        {/* Your content here */}
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Global Network
        </h2>
        <FlightPathsAnimation />
      </section>
    </div>
  );
}

