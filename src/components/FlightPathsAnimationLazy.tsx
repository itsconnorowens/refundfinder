'use client';

import dynamic from 'next/dynamic';

// Lazy load the FlightPathsAnimation with no SSR
// Shows static gradient during load
const FlightPathsAnimation = dynamic(
  () => import('./FlightPathsAnimation'),
  {
    ssr: false, // Disable server-side rendering for better performance
    loading: () => (
      <div
        className="w-full relative animate-pulse"
        style={{
          aspectRatio: '16/9',
          maxWidth: '100%',
        }}
      >
        {/* Static gradient placeholder during load */}
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0A2463" />
              <stop offset="100%" stopColor="#051440" />
            </linearGradient>
          </defs>
          <rect width="1200" height="600" fill="url(#loadingGradient)" />
          
          {/* Subtle loading indicator */}
          <text
            x="600"
            y="300"
            textAnchor="middle"
            fill="#6B7280"
            fontSize="16"
            fontFamily="system-ui, -apple-system, sans-serif"
            opacity="0.5"
          >
            Loading animation...
          </text>
        </svg>
      </div>
    ),
  }
);

export default FlightPathsAnimation;

