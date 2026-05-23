---
name: Glassmorphic UI Styling
description: Guides the implementation of modern glassmorphic panels, animated background radial gradients, and pixel-grain dot overlays.
---

# Skill: Glassmorphic UI Styling in Tailwind v4

Use this skill when designing or updating UI components, backgrounds, card chassis, or visual layouts for the dashboard.

## 1. Drifting Background Gradients

Implement the background in `app/layout.tsx` or `globals.css` using two radial gradients that drift slowly over a 36-second loop.

### CSS Animation Definition
```css
@keyframes backgroundDrift {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.radial-bg-orange {
  position: absolute;
  top: -10%;
  right: -10%;
  width: 70vw;
  height: 70vh;
  background: radial-gradient(circle, rgba(224, 118, 88, 0.16) 0%, rgba(224, 118, 88, 0) 70%);
  filter: blur(80px);
  animation: backgroundDrift 36s infinite ease-in-out;
  pointer-events: none;
  z-index: 0;
}

.radial-bg-grey {
  position: absolute;
  bottom: -10%;
  left: -10%;
  width: 70vw;
  height: 70vh;
  background: radial-gradient(circle, rgba(180, 180, 200, 0.06) 0%, rgba(180, 180, 200, 0) 70%);
  filter: blur(100px);
  animation: backgroundDrift 36s infinite ease-in-out;
  animation-delay: -18s; /* Offset phase */
  pointer-events: none;
  z-index: 0;
}
```

## 2. Film-Grain Dot Overlay

A fine-grain tile pattern layered above the background colors to give organic texture.
- Add to `body::after` or as a absolute full-viewport div.
- Repeat a `3px x 3px` transparent PNG/SVG containing a single 1px white dot with ~1.4% opacity.

### CSS Overlay Pattern
```css
.film-grain {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 0);
  background-size: 3px 3px;
  pointer-events: none;
  z-index: 1;
}
```

## 3. Glassmorphic Card Chassis

Every widget card on the dashboard must share the glassmorphic card look.
In Tailwind v4, use:

```tsx
export function GlassCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`
      relative overflow-hidden
      bg-white/4 border border-white/8
      backdrop-blur-[24px] saturate-[1.2]
      rounded-2xl shadow-2xl p-6
      transition-all duration-300 hover:border-white/12
      ${className}
    `}>
      {children}
    </div>
  );
}
```

## 4. Visual Verification

Ensure:
1. Contrast ratios meet WCAG AA standards (4.5:1 for normal text).
2. Hovering over cards triggers a subtle micro-animation (e.g., border color shifting to `border-white/12`).
3. Radial gradients do not cause scroll overflows (use `overflow-hidden` on parent wrapper).
