# Hero Integration - Quick Reference

## 🎯 6 Hero Layouts

| Layout | Best For | Import |
|--------|----------|--------|
| **Centered** | Landing pages, general | `HeroWithAnimation` |
| **Full Background** | Dramatic entrances | `HeroFullBackground` |
| **Split Screen** | Feature explanations | `HeroSplitScreen` |
| **Contained** | Modern, clean look | `HeroContainedAnimation` |
| **Overlay Card** | Forms, signup | `HeroOverlayCard` |
| **Top Animation** | Visual hierarchy | `HeroTopAnimation` |

---

## 📦 Quick Start

```tsx
// Default hero
import HeroWithAnimation from '@/components/HeroWithAnimation';
<HeroWithAnimation />

// Variations
import { HeroSplitScreen } from '@/components/HeroVariations';
<HeroSplitScreen />
```

---

## 🎨 Z-Index Layers

```
z-0   Background Animation
z-10  Gradient Overlay
z-20  Main Content
z-30+ UI Elements
```

---

## 📐 Standard Structure

```tsx
<section className="relative min-h-screen bg-slate-950">
  {/* Background (z-0) */}
  <div className="absolute inset-0 z-0">
    <FlightPathsAnimation />
  </div>

  {/* Overlay (z-10) - Optional */}
  <div className="absolute inset-0 z-10 bg-linear-to-b from-slate-950/40 to-slate-950/60" />

  {/* Content (z-20) */}
  <div className="relative z-20">
    {/* Your content */}
  </div>
</section>
```

---

## 🎨 Gradient Overlay Opacity Guide

| Use Case | Opacity | Example |
|----------|---------|---------|
| **Light** | 20-40% | Animation visible, subtle overlay |
| **Medium** | 40-60% | Balanced visibility |
| **Strong** | 60-80% | Focus on text, animation subtle |

```tsx
{/* Light */}
from-slate-950/20 to-slate-950/40

{/* Medium */}
from-slate-950/40 to-slate-950/60

{/* Strong */}
from-slate-950/60 to-slate-950/80
```

---

## 📱 Responsive Padding

```tsx
// Mobile-first approach
className="px-5 sm:px-10 lg:px-15"
className="py-8 sm:py-12 lg:py-16"
```

---

## 🎨 Color Tokens

```tsx
bg-[#00D9B5]  // Teal (primary)
bg-[#FFB627]  // Gold (accent)
text-[#00D9B5]  // Teal text
text-[#FFB627]  // Gold text
```

---

## ✅ Checklist

Before deployment:
- ✅ Text readability over animation
- ✅ Mobile responsive
- ✅ Touch targets ≥44px
- ✅ 60fps animation
- ✅ Reduced motion support

---

## 🚀 Demo

```bash
npm run dev
# http://localhost:3000/hero-showcase
```

---

**Status**: ✅ Production Ready

