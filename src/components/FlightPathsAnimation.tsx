'use client';

// Tree-shake unused framer-motion features - import only what we need
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';

const EASING = [0.43, 0.13, 0.23, 0.96] as const;

// Mobile-first responsive configuration
type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveConfig {
  planeCount: number;
  particleCount: number;
  svgHeight: number;
  textPadding: string;
  deviceType: DeviceType;
  useSimplifiedPaths: boolean;
  touchSafeArea: number; // Bottom clearance in px
}

const useResponsiveConfig = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>({
    planeCount: 2,
    particleCount: 0,
    svgHeight: 400,
    textPadding: '20px',
    deviceType: 'mobile',
    useSimplifiedPaths: true,
    touchSafeArea: 80,
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      
      // Mobile-first: Base (320px - 767px)
      if (width < 768) {
        setConfig({
          planeCount: 2,
          particleCount: 0,
          svgHeight: 400,
          textPadding: '20px',
          deviceType: 'mobile',
          useSimplifiedPaths: true,
          touchSafeArea: 80,
        });
      }
      // Tablet: 768px - 1023px
      else if (width >= 768 && width < 1024) {
        setConfig({
          planeCount: 3,
          particleCount: 15,
          svgHeight: 500,
          textPadding: '40px',
          deviceType: 'tablet',
          useSimplifiedPaths: false,
          touchSafeArea: 0,
        });
      }
      // Desktop: 1024px+
      else {
        setConfig({
          planeCount: 3,
          particleCount: 30,
          svgHeight: 600,
          textPadding: '60px',
          deviceType: 'desktop',
          useSimplifiedPaths: false,
          touchSafeArea: 0,
        });
      }
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
};

// Define 3 flight paths with cubic bezier curves (C command)
// Start: 10% from left (120), 60% from top (360)
// End: 90% from right (1080), 40% from top (240)
const FLIGHT_PATHS = [
  {
    id: 1,
    // Desktop/Tablet: Gentle arc curving upward
    d: 'M 120,360 C 400,280 800,200 1080,240',
    // Mobile: Simplified gentler curve
    dMobile: 'M 120,300 C 400,250 800,230 1080,240',
    origin: { x: 120, y: 360 },
    originMobile: { x: 120, y: 300 },
    destination: { x: 1080, y: 240 },
    duration: 8,
    delay: 0,
  },
  {
    id: 2,
    // Desktop/Tablet: Gentle arc with slight downward curve
    d: 'M 120,360 C 450,400 750,300 1080,240',
    // Mobile: Simplified gentler curve
    dMobile: 'M 120,300 C 500,320 700,250 1080,240',
    origin: { x: 120, y: 360 },
    originMobile: { x: 120, y: 300 },
    destination: { x: 1080, y: 240 },
    duration: 12,
    delay: 2,
  },
  {
    id: 3,
    // Desktop/Tablet: Gentle arc with balanced curve
    d: 'M 120,360 C 350,320 850,260 1080,240',
    // Mobile: Simplified gentler curve
    dMobile: 'M 120,300 C 450,270 750,250 1080,240',
    origin: { x: 120, y: 360 },
    originMobile: { x: 120, y: 300 },
    destination: { x: 1080, y: 240 },
    duration: 10,
    delay: 5,
  },
];

// Calculate points along a cubic bezier curve
function getCubicBezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) {
  const mt = 1 - t;
  const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
  const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
  return { x, y };
}

// Parse cubic bezier path to get control points
function parsePath(d: string) {
  const match = d.match(/M ([\d.]+),([\d.]+) C ([\d.]+),([\d.]+) ([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/);
  if (!match) return null;
  return {
    p0: { x: parseFloat(match[1]), y: parseFloat(match[2]) },
    p1: { x: parseFloat(match[3]), y: parseFloat(match[4]) },
    p2: { x: parseFloat(match[5]), y: parseFloat(match[6]) },
    p3: { x: parseFloat(match[7]), y: parseFloat(match[8]) },
  };
}

function AnimatedPlane({
  path,
  shouldAnimate,
  onReachDestination,
  useMobilePath,
}: {
  path: typeof FLIGHT_PATHS[0];
  shouldAnimate: boolean;
  onReachDestination?: () => void;
  useMobilePath?: boolean;
}) {
  const pathD = useMobilePath ? path.dMobile : path.d;
  const origin = useMobilePath ? path.originMobile : path.origin;
  const [position, setPosition] = useState({ x: origin.x, y: origin.y });
  const points = parsePath(pathD);

  useEffect(() => {
    if (!shouldAnimate || !points) return;

    let animationFrame: number;
    let startTime: number | null = null;
    let lastProgress = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const delayedTime = elapsed - path.delay * 1000;

      if (delayedTime >= 0) {
        const progress = ((delayedTime % (path.duration * 1000)) / (path.duration * 1000));
        
        // Apply custom easing
        const easedProgress = cubicBezier(progress, EASING[0], EASING[1], EASING[2], EASING[3]);
        
        const newPos = getCubicBezierPoint(easedProgress, points.p0, points.p1, points.p2, points.p3);
        setPosition(newPos);

        // Trigger compensation pulse when reaching destination (progress crosses from high to low)
        if (lastProgress > 0.95 && progress < 0.1 && onReachDestination) {
          onReachDestination();
        }
        lastProgress = progress;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [shouldAnimate, points, path.delay, path.duration, onReachDestination]);

  return (
    <circle
      cx={position.x}
      cy={position.y}
      r="8"
      fill="#00D9B5"
      opacity={shouldAnimate ? 1 : 0}
    >
      <animate
        attributeName="opacity"
        values="0.7;1;0.7"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
  );
}

// Cubic bezier easing function
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // Simplified approximation for animation purposes
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

  // Newton-Raphson iteration for better precision
  let t2 = t;
  for (let i = 0; i < 4; i++) {
    const x = sampleCurveX(t2) - t;
    if (Math.abs(x) < 1e-5) break;
    const dx = 3 * ax * t2 * t2 + 2 * bx * t2 + cx;
    if (Math.abs(dx) < 1e-6) break;
    t2 -= x / dx;
  }

  return sampleCurveY(t2);
}

// Particle system for ambient effect with GPU acceleration
function ParticleSystem({ 
  shouldAnimate, 
  count 
}: { 
  shouldAnimate: boolean;
  count: number;
}) {
  // Memoize particles to prevent recalculation on every render (React purity rules)
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 1200,
      y: 600 + Math.random() * 100,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
      size: 1 + Math.random() * 2,
    })),
    [count] // Recalculate only when count changes
  );

  return (
    <g opacity="0.4">
      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r={particle.size}
          fill="rgba(0, 217, 181, 0.6)"
          style={{
            // GPU acceleration - use transform instead of y position
            willChange: shouldAnimate ? 'transform, opacity' : 'auto',
            transform: 'translateZ(0)',
          }}
          initial={{ y: particle.y, opacity: 0 }}
          animate={
            shouldAnimate
              ? {
                  y: [particle.y, -100],
                  opacity: [0, 0.8, 0.8, 0],
                }
              : { y: particle.y, opacity: 0 }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </g>
  );
}

// Compensation pulse effect with GPU acceleration
function CompensationPulse({
  x,
  y,
  trigger,
}: {
  x: number;
  y: number;
  trigger: number;
}) {
  return (
    <motion.circle
      key={trigger}
      cx={x}
      cy={y}
      r="8"
      fill="none"
      stroke="#FFB627"
      strokeWidth="3"
      style={{
        // GPU acceleration
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{
        duration: 1.2,
        ease: 'easeOut',
      }}
    />
  );
}

// Static fallback for reduced motion preference
function StaticFlightIllustration() {
  return (
    <svg
      viewBox="0 0 1200 600"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="skyGradientStatic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0A2463" />
          <stop offset="100%" stopColor="#051440" />
        </linearGradient>
        <filter id="glowStatic">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="1200" height="600" fill="url(#skyGradientStatic)" />

      {/* World Map Layer (static) */}
      <g opacity="1" filter="url(#glowStatic)">
        {/* North America */}
        <path
          d="M 50,250 Q 80,200 120,180 L 150,170 Q 180,175 200,190 L 220,210 Q 240,240 250,270 L 260,310 Q 250,350 240,380 L 220,420 Q 200,440 180,450 L 150,460 Q 120,455 100,440 L 80,420 Q 60,380 55,340 L 50,300 Q 48,275 50,250 Z"
          fill="rgba(148, 163, 184, 0.12)"
          stroke="none"
        />
        {/* Europe */}
        <path
          d="M 580,180 Q 590,170 605,165 L 625,168 Q 640,175 650,190 L 660,210 Q 665,230 670,250 L 680,280 Q 685,310 680,340 L 670,370 Q 660,390 645,405 L 625,415 Q 605,420 585,415 L 565,405 Q 550,390 545,370 L 540,340 Q 538,310 542,280 L 550,250 Q 560,220 575,195 L 580,180 Z M 620,155 Q 630,148 640,150 L 650,155 Q 655,165 650,175 L 640,180 Q 630,178 625,170 L 620,155 Z"
          fill="rgba(148, 163, 184, 0.12)"
          stroke="none"
        />
      </g>

      {/* Static flight paths */}
      {FLIGHT_PATHS.map((path) => (
        <g key={path.id}>
          <path
            d={path.d}
            stroke="rgba(0, 217, 181, 0.3)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 4"
          />

          {/* Origin airport */}
          <circle
            cx={path.origin.x}
            cy={path.origin.y}
            r="6"
            fill="#FFB627"
            filter="url(#glowStatic)"
          />

          {/* Destination airport with subtle pulse */}
          <motion.circle
            cx={path.destination.x}
            cy={path.destination.y}
            r="6"
            fill="#FFB627"
            filter="url(#glowStatic)"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Static plane at mid-point */}
          <circle
            cx={(path.origin.x + path.destination.x) / 2}
            cy={(path.origin.y + path.destination.y) / 2 - 20}
            r="6"
            fill="#00D9B5"
            opacity="0.6"
          />
        </g>
      ))}

      {/* Static text indicator */}
      <text
        x="600"
        y="580"
        textAnchor="middle"
        fill="#6B7280"
        fontSize="14"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Animation paused (motion preferences detected)
      </text>
    </svg>
  );
}

export default function FlightPathsAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const responsiveConfig = useResponsiveConfig();
  
  // Intersection Observer with 50% visibility threshold
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    amount: 0.5, // Component must be 50% visible
    once: false, // Re-trigger when scrolling back
  });
  
  // Only animate when in view AND motion is allowed
  const shouldAnimate = !prefersReducedMotion && isInView;
  
  // Track compensation pulse triggers for each path
  const [pulseTriggers, setPulseTriggers] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
  });

  const handleReachDestination = (pathId: number) => {
    setPulseTriggers((prev) => ({
      ...prev,
      [pathId]: prev[pathId] + 1,
    }));
  };

  // Return static fallback for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        className="w-full relative"
        style={{
          height: `${responsiveConfig.svgHeight}px`,
          maxWidth: '100%',
        }}
      >
        <StaticFlightIllustration />
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="w-full relative"
      style={{
        height: `${responsiveConfig.svgHeight}px`,
        maxWidth: '100%',
        // Touch-safe area on mobile (bottom clearance)
        paddingBottom: responsiveConfig.touchSafeArea > 0 
          ? `${responsiveConfig.touchSafeArea}px` 
          : 0,
        // GPU acceleration for container
        willChange: isInView ? 'opacity' : 'auto',
        transform: 'translateZ(0)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      <svg
        viewBox={`0 0 1200 ${responsiveConfig.svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A2463" />
            <stop offset="100%" stopColor="#051440" />
          </linearGradient>
          
          {/* Glow filter for airports */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Blur filter for map depth */}
          <filter id="mapBlur">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Background rectangle */}
        <rect width="1200" height={responsiveConfig.svgHeight} fill="url(#skyGradient)" />

        {/* World Map Layer (static, below flight paths) */}
        <g opacity="1" filter="url(#mapBlur)">
          {/* North America - Simplified west/east coast */}
          <path
            d="M 50,250 Q 80,200 120,180 L 150,170 Q 180,175 200,190 L 220,210 Q 240,240 250,270 L 260,310 Q 250,350 240,380 L 220,420 Q 200,440 180,450 L 150,460 Q 120,455 100,440 L 80,420 Q 60,380 55,340 L 50,300 Q 48,275 50,250 Z"
            fill="rgba(148, 163, 184, 0.12)"
            stroke="none"
          />

          {/* Europe - UK and Western Europe blob */}
          {(responsiveConfig.deviceType === 'tablet' || responsiveConfig.deviceType === 'desktop') && (
            <path
              d="M 580,180 Q 590,170 605,165 L 625,168 Q 640,175 650,190 L 660,210 Q 665,230 670,250 L 680,280 Q 685,310 680,340 L 670,370 Q 660,390 645,405 L 625,415 Q 605,420 585,415 L 565,405 Q 550,390 545,370 L 540,340 Q 538,310 542,280 L 550,250 Q 560,220 575,195 L 580,180 Z M 620,155 Q 630,148 640,150 L 650,155 Q 655,165 650,175 L 640,180 Q 630,178 625,170 L 620,155 Z"
              fill="rgba(148, 163, 184, 0.12)"
              stroke="none"
            />
          )}

          {/* Asia - Eastern outline suggestion */}
          {responsiveConfig.deviceType === 'desktop' && (
            <>
              <path
                d="M 920,200 Q 940,185 965,180 L 1000,185 Q 1030,195 1050,215 L 1070,240 Q 1080,270 1085,300 L 1088,340 Q 1085,380 1075,410 L 1060,440 Q 1040,460 1015,470 L 985,475 Q 955,470 930,455 L 910,435 Q 895,410 890,380 L 888,340 Q 890,300 900,265 L 910,230 Q 918,210 920,200 Z"
                fill="rgba(148, 163, 184, 0.12)"
                stroke="none"
              />
              {/* Japan/Islands suggestion */}
              <path
                d="M 1100,280 Q 1110,270 1120,275 L 1125,285 Q 1125,300 1120,310 L 1110,315 Q 1100,312 1098,300 L 1100,280 Z"
                fill="rgba(148, 163, 184, 0.12)"
                stroke="none"
              />
            </>
          )}

          {/* South America hint (desktop only) */}
          {responsiveConfig.deviceType === 'desktop' && (
            <path
              d="M 180,480 Q 200,470 220,475 L 240,490 Q 250,510 255,535 L 258,560 Q 255,580 245,595 L 230,600 Q 210,598 195,590 L 182,575 Q 175,555 178,530 L 180,480 Z"
              fill="rgba(148, 163, 184, 0.12)"
              stroke="none"
            />
          )}
        </g>

        {/* Particle system (claims being processed) */}
        {responsiveConfig.particleCount > 0 && (
          <ParticleSystem 
            shouldAnimate={shouldAnimate} 
            count={responsiveConfig.particleCount} 
          />
        )}

        {/* Flight paths */}
        {FLIGHT_PATHS.slice(0, responsiveConfig.planeCount).map((path) => {
          const pathD = responsiveConfig.useSimplifiedPaths ? path.dMobile : path.d;
          const origin = responsiveConfig.useSimplifiedPaths ? path.originMobile : path.origin;
          
          return (
          <g key={path.id}>
            {/* Path line */}
            <motion.path
              d={pathD}
              stroke="rgba(0, 217, 181, 0.2)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="8 4"
              style={{
                // GPU acceleration
                willChange: shouldAnimate ? 'opacity' : 'auto',
                transform: 'translateZ(0)',
              }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                shouldAnimate
                  ? {
                      pathLength: 1,
                      opacity: 1,
                    }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                pathLength: {
                  duration: 2,
                  delay: path.delay * 0.3,
                  ease: EASING,
                },
                opacity: {
                  duration: 0.5,
                  delay: path.delay * 0.3,
                },
              }}
            />

            {/* Origin airport - pulsing dot */}
            <motion.circle
              cx={origin.x}
              cy={origin.y}
              r="6"
              fill="#FFB627"
              filter="url(#glow)"
              style={{
                willChange: shouldAnimate ? 'transform' : 'auto',
                transform: 'translateZ(0)',
              }}
              initial={{ scale: 0 }}
              animate={
                shouldAnimate
                  ? {
                      scale: [0, 1, 1],
                    }
                  : { scale: 0 }
              }
              transition={{
                scale: {
                  duration: 0.6,
                  delay: path.delay * 0.3,
                  ease: EASING,
                },
              }}
            />
            <motion.circle
              cx={path.origin.x}
              cy={path.origin.y}
              r="6"
              fill="none"
              stroke="#FFB627"
              strokeWidth="2"
              style={{
                willChange: shouldAnimate ? 'transform, opacity' : 'auto',
                transform: 'translateZ(0)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                shouldAnimate
                  ? {
                      scale: [1, 2.5, 2.5],
                      opacity: [0.8, 0, 0],
                    }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                duration: 2,
                delay: path.delay * 0.3 + 0.6,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Destination airport - pulsing dot */}
            <motion.circle
              cx={path.destination.x}
              cy={path.destination.y}
              r="6"
              fill="#FFB627"
              filter="url(#glow)"
              style={{
                willChange: shouldAnimate ? 'transform' : 'auto',
                transform: 'translateZ(0)',
              }}
              initial={{ scale: 0 }}
              animate={
                shouldAnimate
                  ? {
                      scale: [0, 1, 1],
                    }
                  : { scale: 0 }
              }
              transition={{
                scale: {
                  duration: 0.6,
                  delay: path.delay * 0.3 + 0.2,
                  ease: EASING,
                },
              }}
            />
            <motion.circle
              cx={path.destination.x}
              cy={path.destination.y}
              r="6"
              fill="none"
              stroke="#FFB627"
              strokeWidth="2"
              style={{
                willChange: shouldAnimate ? 'transform, opacity' : 'auto',
                transform: 'translateZ(0)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                shouldAnimate
                  ? {
                      scale: [1, 2.5, 2.5],
                      opacity: [0.8, 0, 0],
                    }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                duration: 2,
                delay: path.delay * 0.3 + 0.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Compensation pulse effect */}
            {pulseTriggers[path.id] > 0 && (
              <CompensationPulse
                x={path.destination.x}
                y={path.destination.y}
                trigger={pulseTriggers[path.id]}
              />
            )}

            {/* Animated plane */}
            <AnimatedPlane
              path={path}
              shouldAnimate={shouldAnimate}
              onReachDestination={() => handleReachDestination(path.id)}
              useMobilePath={responsiveConfig.useSimplifiedPaths}
            />
          </g>
        );
        })}
      </svg>
    </motion.div>
  );
}

