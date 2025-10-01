# VibeStay Design System
## A Vibe-Tech Product | 2025 Edition

---

## 🎨 Brand Identity

### Logo & Naming
- **Primary Name:** VibeStay
- **Tagline:** "Where Every Journey Feels Like Home"
- **Logo:** Gradient VT monogram with glassmorphic effect
- **Brand Voice:** Modern, welcoming, innovative, trustworthy

### Color Palette

#### Dark Mode (Default)
```css
--vs-dark-base: #0A0A0F;
--vs-dark-surface: #12121A;
--vs-dark-elevated: #1A1A24;
--vs-dark-border: rgba(255, 255, 255, 0.08);
--vs-glass-bg: rgba(18, 18, 26, 0.7);
--vs-glass-border: rgba(255, 255, 255, 0.1);
```

#### Primary Gradient
```css
--vs-gradient-start: #8B5CF6;  /* Purple */
--vs-gradient-mid: #3B82F6;    /* Blue */
--vs-gradient-end: #06B6D4;    /* Cyan */
--vs-gradient: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #06B6D4 100%);
```

#### Accent Colors
```css
--vs-neon-cyan: #00FFE0;
--vs-neon-purple: #E879F9;
--vs-electric-blue: #00D4FF;
--vs-success: #10B981;
--vs-warning: #F59E0B;
--vs-error: #EF4444;
```

#### Light Mode
```css
--vs-light-base: #FFFFFF;
--vs-light-surface: #F9FAFB;
--vs-light-elevated: #F3F4F6;
--vs-light-border: rgba(0, 0, 0, 0.08);
```

---

## 🎭 Visual Effects

### Glassmorphism
```css
.glass-effect {
  background: rgba(18, 18, 26, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

### Neumorphism (Soft UI)
```css
.neumorphic {
  background: linear-gradient(145deg, #0f0f14, #0c0c10);
  box-shadow: 20px 20px 60px #08080b,
              -20px -20px 60px #121217;
}
```

### Glow Effects
```css
.neon-glow {
  box-shadow: 0 0 20px rgba(0, 255, 224, 0.5),
              0 0 40px rgba(0, 255, 224, 0.3),
              0 0 60px rgba(0, 255, 224, 0.1);
}
```

---

## 📐 Typography

### Font Stack
```css
--font-display: 'Clash Display', 'Inter Display', system-ui;
--font-body: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
```css
--text-xs: clamp(0.75rem, 0.7vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.9vw, 1rem);
--text-base: clamp(1rem, 1vw, 1.125rem);
--text-lg: clamp(1.125rem, 1.2vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.5vw, 1.5rem);
--text-2xl: clamp(1.5rem, 2vw, 2rem);
--text-3xl: clamp(2rem, 3vw, 3rem);
--text-4xl: clamp(2.5rem, 4vw, 4rem);
--text-5xl: clamp(3rem, 5vw, 5rem);
```

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Black: 900

---

## 🎬 Animation System

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Scale
```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
```

### Micro-Interactions
```javascript
// Magnetic Button Effect
const magneticStrength = 0.3;
const magneticRange = 100;

// Parallax Scroll
const parallaxSpeed = 0.5;
const parallaxOffset = 100;

// 3D Card Tilt
const tiltMaxRotation = 15;
const tiltPerspective = 1000;
```

---

## 🧩 Component Patterns

### Glass Card
```tsx
<div className="glass-card">
  <div className="glass-card-glow" />
  <div className="glass-card-content">
    {/* Content */}
  </div>
</div>
```

### Gradient Button
```tsx
<button className="btn-gradient">
  <span className="btn-gradient-bg" />
  <span className="btn-gradient-content">
    Book Now
  </span>
</button>
```

### Floating Action
```tsx
<div className="fab-container">
  <button className="fab-trigger">
    <PlusIcon />
  </button>
  <div className="fab-menu">
    {/* Menu items */}
  </div>
</div>
```

---

## 📱 Responsive Breakpoints

```css
--breakpoint-xs: 475px;   /* Mobile S */
--breakpoint-sm: 640px;   /* Mobile L */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Desktop L */
--breakpoint-2xl: 1536px; /* Desktop XL */
```

---

## 🌟 Spacing System

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

---

## 🎯 Design Principles

### 1. **Depth & Dimension**
- Use layered glassmorphic surfaces
- Implement parallax scrolling
- Add 3D transforms on interaction

### 2. **Fluid Motion**
- Smooth transitions between states
- Physics-based animations
- Contextual micro-interactions

### 3. **Visual Hierarchy**
- Bold typography for headers
- Subtle borders and shadows
- Strategic use of color accents

### 4. **Accessibility First**
- WCAG AAA color contrast
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader optimized

### 5. **Performance Optimized**
- GPU-accelerated animations
- Lazy loading for images
- Code splitting per route
- Optimistic UI updates

---

## 🔧 Implementation Guidelines

### CSS Architecture
- Use CSS Modules for component styles
- Utility-first with Tailwind CSS
- CSS-in-JS for dynamic theming
- CSS Custom Properties for design tokens

### Component Structure
```
components/
├── primitives/     # Base UI elements
├── patterns/       # Reusable patterns
├── features/       # Feature-specific
└── layouts/        # Page layouts
```

### Naming Conventions
- Components: PascalCase
- CSS Classes: kebab-case with BEM
- CSS Variables: --vs-prefix
- JavaScript: camelCase

### Performance Metrics
- FCP: < 1.5s
- TTI: < 3.5s
- CLS: < 0.1
- Bundle size: < 200KB initial

---

## 🚀 Special Effects

### Aurora Background
```css
.aurora-bg {
  background: radial-gradient(ellipse at bottom, #0A0A0F 0%, transparent 70%),
              radial-gradient(ellipse at top, #8B5CF6 0%, transparent 50%),
              radial-gradient(ellipse at center, #06B6D4 0%, transparent 50%);
  animation: aurora 15s ease infinite;
}
```

### Holographic Text
```css
.holographic {
  background: linear-gradient(
    45deg,
    #00FFE0 0%,
    #E879F9 25%,
    #00D4FF 50%,
    #E879F9 75%,
    #00FFE0 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: holographic 3s ease infinite;
}
```

### Particle System
```javascript
// Particle configuration
const particles = {
  count: 50,
  speed: 0.5,
  size: { min: 1, max: 3 },
  opacity: { min: 0.1, max: 0.5 },
  color: ['#00FFE0', '#E879F9', '#00D4FF']
};
```

---

## 📋 Component Checklist

- [ ] GlassCard
- [ ] NeumorphicButton
- [ ] MagneticCursor
- [ ] ParallaxSection
- [ ] AnimatedCounter
- [ ] LiquidTransition
- [ ] FloatingActionButton
- [ ] InteractiveMap
- [ ] VirtualTour
- [ ] PriceSlider
- [ ] DatePicker
- [ ] SearchAutocomplete
- [ ] ReviewCarousel
- [ ] LoadingSkeleton
- [ ] ErrorBoundary

---

## 🎖️ Quality Standards

### Accessibility
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Color contrast ratio 4.5:1 minimum
- ✅ Reduced motion support

### Performance
- ✅ Lighthouse score 95+
- ✅ First paint < 1s
- ✅ Smooth 60fps animations
- ✅ Optimized bundle size
- ✅ Progressive enhancement

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS 14+, Android 10+)

---

*This design system is a living document and will evolve as VibeStay grows.*