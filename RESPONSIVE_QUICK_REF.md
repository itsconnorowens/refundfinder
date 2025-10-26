# Mobile-First Responsive - Quick Reference

## 📱 Breakpoints at a Glance

| Device | Width | Planes | Particles | Height | Paths |
|--------|-------|--------|-----------|--------|-------|
| **Mobile** | <768px | 2 | 0 | 400px | Simplified |
| **Tablet** | 768-1023px | 3 | 15 | 500px | Full |
| **Desktop** | ≥1024px | 3 | 30 | 600px | Full |

---

## 🎯 Mobile-First Features

### Mobile (Base):
```
✅ 2 planes (performance)
✅ 0 particles (battery life)
✅ Simplified curves (faster rendering)
✅ 400px canvas
✅ 80px touch-safe area
✅ 20px padding
```

### Tablet:
```
✅ 3 planes
✅ 15 particles
✅ Full cubic bezier
✅ 500px canvas
✅ No touch clearance
✅ 40px padding
```

### Desktop:
```
✅ 3 planes
✅ 30 particles
✅ Full cubic bezier
✅ 600px canvas
✅ No touch clearance
✅ 60px padding
```

---

## 💻 Code Example

```tsx
import FlightPathsAnimation from '@/components/FlightPathsAnimation';

// Automatically responsive - no configuration needed!
<FlightPathsAnimation />
```

---

## 🎨 Tailwind Classes

```tsx
// Mobile-first padding
className="px-5 sm:px-10 lg:px-15"
// 20px → 40px → 60px

// Mobile-first typography
className="text-3xl sm:text-4xl lg:text-5xl"
// Small → Medium → Large

// Mobile-first grid
className="grid sm:grid-cols-2 lg:grid-cols-3"
// 1 col → 2 cols → 3 cols
```

---

## 🧪 Quick Test

1. Open `/mobile-demo`
2. Resize browser window
3. Watch adaptive behavior:
   - <768px: See 2 planes, no particles
   - 768-1023px: See 3 planes, 15 particles
   - ≥1024px: See 3 planes, 30 particles

---

## 📊 Performance Impact

**Mobile Savings:**
- 50% fewer planes
- 100% fewer particles
- 33% smaller canvas
- Simpler calculations
- Better battery life

**Desktop Enhancement:**
- Full visual richness
- Maximum particles
- Largest canvas
- Complete experience

---

## ✅ What's Automatic

The component automatically handles:
- ✅ Plane count adjustment
- ✅ Particle system on/off
- ✅ Path simplification
- ✅ Canvas resizing
- ✅ Touch-safe areas
- ✅ Smooth transitions
- ✅ Resize events

**No manual configuration needed!**

---

## 🚀 Demo URLs

| URL | Purpose |
|-----|---------|
| `/mobile-demo` | Responsive showcase |
| `/flight-demo` | Feature showcase |
| `/performance-demo` | Performance testing |
| `/hero-example` | Real-world integration |

---

**Status**: ✅ Production Ready  
**Version**: 2.2 (Mobile-First)  
**Date**: October 25, 2025

