# FlightPathsAnimation Component

A performant, accessible animated SVG component that visualizes flight paths with moving planes and pulsing airport markers.

## Features

✅ **Smooth Animations**: 3 planes moving along bezier curves with custom easing  
✅ **Staggered Timing**: Organic feel with delayed start times (0s, 2s, 4s)  
✅ **Accessibility**: Full prefers-reduced-motion support  
✅ **Lazy Loading**: Only animates when in viewport using Framer Motion's viewport detection  
✅ **Responsive**: Maintains 2:1 aspect ratio across all screen sizes  
✅ **Lightweight**: ~30KB including Framer Motion (gzipped)

## Technical Specifications

### Colors
- **Flight Paths**: `rgba(0, 217, 181, 0.2)` - Teal at 20% opacity
- **Planes**: `#00D9B5` - Vibrant teal
- **Airports**: `#FFB627` - Gold with glow filter
- **Background**: Linear gradient from `#0A2463` to `#051440`

### Animation Parameters
- **Easing**: `[0.43, 0.13, 0.23, 0.96]` (custom cubic-bezier)
- **Durations**: 
  - Path 1: 8 seconds
  - Path 2: 10 seconds
  - Path 3: 9 seconds
- **Delays**: 0s, 2s, 4s (staggered)
- **Loop**: Infinite
- **Pulse Animation**: 2s duration for airport markers

### Viewport
- **SVG viewBox**: `1200 x 600`
- **Aspect Ratio**: `2:1`
- **Responsive**: Scales proportionally with `preserveAspectRatio="xMidYMid meet"`

## Usage

```tsx
import FlightPathsAnimation from '@/components/FlightPathsAnimation';

export default function MyPage() {
  return (
    <div className="w-full max-w-6xl">
      <FlightPathsAnimation />
    </div>
  );
}
```

## Accessibility

The component automatically respects the user's `prefers-reduced-motion` setting:
- When enabled: Animations are disabled, static view is shown
- When disabled: Full animations play

## Performance

- Uses `requestAnimationFrame` for smooth plane movement
- Viewport detection prevents off-screen animations
- No unnecessary re-renders
- Optimized SVG with minimal DOM nodes
- Lazy loads with fade-in effect

## Browser Support

Requires:
- Modern browsers with SVG support
- JavaScript enabled
- Framer Motion compatible environment (Next.js 13+, React 18+)

## Demo

Visit `/flight-demo` to see the component in action with multiple instances demonstrating lazy loading.

## Customization

To modify flight paths, edit the `FLIGHT_PATHS` array in the component:

```tsx
const FLIGHT_PATHS = [
  {
    id: 1,
    d: 'M x1,y1 Q cx,cy x2,y2', // SVG quadratic bezier path
    origin: { x: x1, y: y1 },
    destination: { x: x2, y: y2 },
    duration: 8, // seconds
    delay: 0, // seconds
  },
  // ... more paths
];
```

## Dependencies

- `framer-motion`: For animations and viewport detection
- `react`: Core framework
- Next.js: For 'use client' directive

