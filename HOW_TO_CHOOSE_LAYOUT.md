# How to Choose & Use Hero Layouts

## 🎯 Quick Selection Guide

### Choose Based on Your Goal

```
Need a form/signup?              → HeroOverlayCard
Need detailed feature copy?      → HeroSplitScreen
Want maximum visual drama?       → HeroFullBackground
General landing page?            → HeroWithAnimation (default)
Want clean/modern aesthetic?     → HeroContainedAnimation
Need step-by-step hierarchy?    → HeroTopAnimation
```

---

## 📦 Implementation Examples

### 1. HeroWithAnimation (Default - Centered)

**Best for:** General landing pages, marketing sites

**When to use:**
- ✅ You want a balanced design
- ✅ You have moderate amount of copy
- ✅ You want stats/social proof visible
- ✅ You need a versatile solution

**How to use:**
```tsx
// src/app/page.tsx
import HeroWithAnimation from '@/components/HeroWithAnimation';

export default function HomePage() {
  return <HeroWithAnimation />;
}
```

**Customize the text:**
```tsx
// Copy src/components/HeroWithAnimation.tsx
// Then edit the heading, description, and buttons
<h1>Your Custom Heading Here</h1>
<p>Your custom description</p>
```

---

### 2. HeroFullBackground

**Best for:** Brand showcases, dramatic entrances

**When to use:**
- ✅ You want animation to be the star
- ✅ You have minimal copy
- ✅ You want maximum visual impact
- ✅ Single clear CTA

**How to use:**
```tsx
import { HeroFullBackground } from '@/components/HeroVariations';

export default function HomePage() {
  return <HeroFullBackground />;
}
```

**What makes it different:**
- Stronger gradient overlay (60-80%)
- Larger typography
- Single prominent CTA
- More breathing room

---

### 3. HeroSplitScreen

**Best for:** Feature explanations, product pages, SaaS

**When to use:**
- ✅ You need to explain features
- ✅ You have longer copy
- ✅ You want animation visible but not dominant
- ✅ Desktop-first audience

**How to use:**
```tsx
import { HeroSplitScreen } from '@/components/HeroVariations';

export default function HomePage() {
  return <HeroSplitScreen />;
}
```

**Layout behavior:**
- **Desktop:** Content left, animation right (50/50)
- **Mobile:** Stacked (animation first, then content)

**Perfect for:**
- SaaS landing pages
- Product features
- Service explanations

---

### 4. HeroContainedAnimation

**Best for:** Modern clean design, multi-section pages

**When to use:**
- ✅ You want a polished look
- ✅ You have content above AND below animation
- ✅ You want clear visual boundaries
- ✅ You like card-based designs

**How to use:**
```tsx
import { HeroContainedAnimation } from '@/components/HeroVariations';

export default function HomePage() {
  return <HeroContainedAnimation />;
}
```

**Structure:**
```
┌─────────────────┐
│   Top Content   │
├─────────────────┤
│ ┌─────────────┐ │
│ │  Animation  │ │
│ └─────────────┘ │
├─────────────────┤
│ Bottom Content  │
└─────────────────┘
```

---

### 5. HeroOverlayCard

**Best for:** Signup pages, lead generation, forms

**When to use:**
- ✅ You have a form to display
- ✅ You want a "floating" effect
- ✅ You need glassmorphism aesthetic
- ✅ Focus on conversion

**How to use:**
```tsx
import { HeroOverlayCard } from '@/components/HeroVariations';

export default function SignupPage() {
  return <HeroOverlayCard />;
}
```

**Built-in form:**
- Flight number input
- Date picker
- Submit button
- Perfect starting point for your form

**To customize the form:**
1. Copy the component
2. Replace the inputs with your fields
3. Add your form handler

---

### 6. HeroTopAnimation

**Best for:** Landing pages with steps, process flows

**When to use:**
- ✅ You want animation as a "header"
- ✅ You need clear visual hierarchy
- ✅ You're showing steps/process
- ✅ You want content to stand out

**How to use:**
```tsx
import { HeroTopAnimation } from '@/components/HeroVariations';

export default function HomePage() {
  return <HeroTopAnimation />;
}
```

**Unique feature:**
- Animation takes 40-60% of viewport height
- Content card "overlaps" animation (negative margin)
- Great for showing 3-step processes

---

## 🔄 How to Switch Between Layouts

### Quick Switch

Just change the import:

```tsx
// Before
import HeroWithAnimation from '@/components/HeroWithAnimation';

// After
import { HeroSplitScreen } from '@/components/HeroVariations';

export default function HomePage() {
  return <HeroSplitScreen />; // Changed here
}
```

### Try Multiple Layouts

Want to test different layouts? Create a switcher:

```tsx
'use client';
import { useState } from 'react';
import HeroWithAnimation from '@/components/HeroWithAnimation';
import { HeroSplitScreen, HeroFullBackground } from '@/components/HeroVariations';

const LAYOUTS = {
  centered: HeroWithAnimation,
  split: HeroSplitScreen,
  fullBg: HeroFullBackground,
};

export default function HomePage() {
  const [layout, setLayout] = useState<keyof typeof LAYOUTS>('centered');
  const HeroComponent = LAYOUTS[layout];

  return (
    <main>
      {/* Layout Switcher (for testing) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => setLayout('centered')}>Centered</button>
        <button onClick={() => setLayout('split')}>Split</button>
        <button onClick={() => setLayout('fullBg')}>Full BG</button>
      </div>

      <HeroComponent />
    </main>
  );
}
```

---

## 🎨 Customization Guide

### Change Text Content

**Method 1: Direct Edit (Simple)**
1. Copy the component you want to use to your project
2. Edit the text directly in the JSX

```tsx
// Edit this in the component
<h1>Your Custom Heading</h1>
<p>Your custom description</p>
<button>Your CTA Text</button>
```

**Method 2: Props (Reusable)**

Create a wrapper that accepts props:

```tsx
// src/components/CustomHero.tsx
import HeroWithAnimation from './HeroWithAnimation';

interface CustomHeroProps {
  heading: string;
  description: string;
  ctaText: string;
}

export default function CustomHero({ heading, description, ctaText }: CustomHeroProps) {
  // Wrap and pass props to the hero component
  // You'll need to modify the base component to accept these props
  return <HeroWithAnimation heading={heading} description={description} ctaText={ctaText} />;
}
```

### Change Colors

Replace the color tokens:

```tsx
// Teal → Purple
className="bg-[#00D9B5]"  // Old
className="bg-purple-600"  // New

// Gold → Orange
className="text-[#FFB627]"  // Old
className="text-orange-500"  // New
```

### Adjust Gradient Overlay

Make animation more/less visible:

```tsx
// More visible (lighter overlay)
<div className="absolute inset-0 z-10 bg-linear-to-b from-slate-950/20 to-slate-950/40" />

// Less visible (darker overlay)
<div className="absolute inset-0 z-10 bg-linear-to-b from-slate-950/70 to-slate-950/90" />

// No overlay (full animation)
{/* Just remove the overlay div */}
```

### Change Height

```tsx
// Shorter hero (80vh)
className="min-h-[80vh]"

// Taller hero (120vh)
className="min-h-[120vh]"

// Fixed height
className="h-[700px]"
```

---

## 📱 Mobile Considerations

All layouts automatically adapt to mobile, but here are tips:

### Mobile Priority Layouts
- **Best:** HeroFullBackground, HeroContainedAnimation
- **Good:** HeroWithAnimation, HeroOverlayCard
- **Complex:** HeroSplitScreen (stacks on mobile, so content order matters)

### Mobile Testing
```tsx
// Preview mobile in browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select iPhone or custom dimensions
4. Scroll to test the hero
```

---

## ✅ Decision Matrix

| Layout | Visual Impact | Copy Space | Forms | Complexity | Mobile |
|--------|--------------|------------|-------|------------|--------|
| **Centered** | ⭐⭐⭐ | ⭐⭐⭐ | ❌ | Easy | ⭐⭐⭐⭐ |
| **Full Background** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ | Easy | ⭐⭐⭐⭐⭐ |
| **Split Screen** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | Medium | ⭐⭐⭐ |
| **Contained** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | Easy | ⭐⭐⭐⭐⭐ |
| **Overlay Card** | ⭐⭐⭐⭐ | ⭐⭐ | ✅ | Medium | ⭐⭐⭐⭐ |
| **Top Animation** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | Medium | ⭐⭐⭐ |

---

## 🎯 Real-World Examples

### Example 1: SaaS Product
```tsx
// Best choice: HeroSplitScreen
import { HeroSplitScreen } from '@/components/HeroVariations';
export default function HomePage() {
  return <HeroSplitScreen />;
}
```
**Why:** Need space for feature descriptions

### Example 2: Flight Compensation Service
```tsx
// Best choice: HeroWithAnimation (default)
import HeroWithAnimation from '@/components/HeroWithAnimation';
export default function HomePage() {
  return <HeroWithAnimation />;
}
```
**Why:** Balanced, has stats section, clear CTAs

### Example 3: Lead Generation
```tsx
// Best choice: HeroOverlayCard
import { HeroOverlayCard } from '@/components/HeroVariations';
export default function SignupPage() {
  return <HeroOverlayCard />;
}
```
**Why:** Built-in form, focused on conversion

### Example 4: Agency/Portfolio
```tsx
// Best choice: HeroFullBackground
import { HeroFullBackground } from '@/components/HeroVariations';
export default function HomePage() {
  return <HeroFullBackground />;
}
```
**Why:** Maximum visual impact, minimal copy

---

## 🚀 Quick Start Checklist

1. **Choose your layout** (use decision matrix above)
2. **Import the component**
   ```tsx
   import HeroWithAnimation from '@/components/HeroWithAnimation';
   // or
   import { HeroSplitScreen } from '@/components/HeroVariations';
   ```
3. **Add to your page**
   ```tsx
   export default function HomePage() {
     return <HeroWithAnimation />;
   }
   ```
4. **Test on mobile** (DevTools responsive mode)
5. **Customize text/colors** (edit component file)
6. **Deploy!**

---

## 🎓 Pro Tips

### Tip 1: Start Simple
Begin with **HeroWithAnimation** (default). It's the most versatile.

### Tip 2: Test Multiple
Visit `/hero-showcase` to see all layouts live before choosing.

### Tip 3: Consider Your Audience
- **B2B/Enterprise:** HeroSplitScreen
- **B2C/Consumer:** HeroFullBackground or HeroWithAnimation
- **Forms/Signup:** HeroOverlayCard

### Tip 4: Match Your Brand
- **Modern/Tech:** HeroContainedAnimation
- **Bold/Dramatic:** HeroFullBackground
- **Professional/Corporate:** HeroSplitScreen
- **Versatile/Safe:** HeroWithAnimation

---

## ❓ Still Unsure?

Visit the showcase to see them all:
```bash
npm run dev
# http://localhost:3000/hero-showcase
```

Or start with the default and iterate:
```tsx
import HeroWithAnimation from '@/components/HeroWithAnimation';
```

You can always switch later - it's just one line of code! 🚀

---

**Quick Answer:** Most users should start with **HeroWithAnimation** (the default). It works for 80% of use cases and you can always switch later.

