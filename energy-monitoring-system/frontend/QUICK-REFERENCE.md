# EcoStep Design System - Quick Reference Card

## 🎨 Brand Colors

```
#1A312C  Primary (Deep forest green) - Main text, headings, buttons
#428475  Secondary (Teal green) - Charts, active states, accents
#89D7B7  Accent (Soft mint green) - Highlights, success, badges
#FFF4E1  Background (Warm cream) - Page background
```

## 📦 Utility Classes

```css
.app-shell        /* Main container: 32px radius, glass */
.glass-card       /* Content card: 20px radius, glass */
.metric-card      /* Stat card: 18px radius, glass */
.chart-container  /* Chart wrapper: 22px radius, glass */

.btn-primary      /* Forest green button */
.btn-secondary    /* Glass button with border */
.btn-ghost        /* Transparent hover button */

.badge            /* Rounded pill badge */
.badge-success    /* Mint green badge */
.badge-warning    /* Yellow badge */
.badge-info       /* Teal badge */

.metric-value     /* Large stat number: 28-32px */
.metric-label     /* Uppercase label: 13px */

.nav-pill-active  /* Teal navigation pill */
```

## 🔤 Typography

```
Font: Inter (Google Fonts)

h1: 32-40px, weight 700
h2: 24-30px, weight 600
h3: 18-20px, weight 600
h4: 16-18px, weight 600
Body: 14-15px, weight 400-500
Label: 13px, weight 500, uppercase
```

## 📏 Border Radius

```
32px - Application shell
22px - Chart containers
20px - Large cards
18px - Metric cards
12px - Buttons, navigation pills
10px - Badges
```

## 🌊 Glassmorphic Formula

```css
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.55);
box-shadow: 0 8px 30px rgba(26, 49, 44, 0.06);
border-radius: 20px; /* adjust per component */
```

## 🎯 Icon Badges

```css
width: 48px;
height: 48px;
border-radius: 14px;
background: linear-gradient(135deg, #428475, #356A5E);
box-shadow: 0 4px 12px rgba(66, 132, 117, 0.15);
```

## 📊 Chart Colors

```
Line/Area: #428475 (teal), 2.5px stroke
Fill: gradient from rgba(66,132,117,0.25) to rgba(137,215,183,0.05)
Grid: rgba(26,49,44,0.06), dashed
Labels: #737373, 12px, weight 500
```

## 🔘 Button Sizing

```css
Primary/Secondary:
  padding: 0.625rem 1.5rem (10px 24px)
  border-radius: 0.75rem (12px)
  font-size: 14-15px
  font-weight: 500
```

## 🏷️ Badge Sizing

```css
padding: 0.375rem 0.875rem (6px 14px)
border-radius: 0.625rem (10px)
font-size: 12px
font-weight: 500
```

## 📱 Breakpoints

```
Desktop: ≥1024px - Full sidebar, 4-col grid
Tablet:  768-1023px - 2-col grid
Mobile:  <768px - 1-col stack
```

## ✨ Animations

```css
transition: all 0.2s ease;

Hover lift:
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(26, 49, 44, 0.08);
```

## 🎨 CSS Custom Properties

```css
:root {
  --color-primary-500: 26 49 44;
  --color-secondary-400: 66 132 117;
  --color-accent-400: 137 215 183;
  --color-background: 255 244 225;
}

/* Usage */
color: rgb(var(--color-primary-500));
background: rgba(var(--color-secondary-400), 0.5);
```

## 📋 Common Patterns

### Metric Card
```tsx
<div className="metric-card">
  <div className="mb-5 flex items-start justify-between">
    <div className="h-12 w-12 rounded-[0.875rem] bg-gradient-to-br from-[rgb(var(--color-secondary-400))] to-[rgb(var(--color-secondary-500))] flex items-center justify-center">
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
  <div className="metric-label mb-2">LABEL TEXT</div>
  <div className="metric-value-large">24.3</div>
</div>
```

### Glass Card
```tsx
<div className="glass-card">
  <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-500))] mb-6">
    Card Title
  </h3>
  {/* Content */}
</div>
```

### Primary Button
```tsx
<button className="btn-primary inline-flex items-center gap-2">
  <Icon className="h-4 w-4" />
  <span>Button Text</span>
</button>
```

### Success Badge
```tsx
<div className="badge badge-success">
  Active
</div>
```

## 📂 File Structure

```
frontend/
├── src/
│   ├── index.css                    (Global styles)
│   ├── layouts/
│   │   └── DashboardLayout.tsx      (Main layout)
│   ├── components/
│   │   ├── charts/
│   │   │   └── EnergyConsumptionChart.tsx
│   │   └── common/
│   │       └── EcoStepLogo.tsx
│   └── features/
│       └── dashboard/
│           ├── components/
│           │   ├── StatCard.tsx
│           │   └── DashboardCard.tsx
│           └── pages/
│               └── DashboardPage.tsx
├── COLOR-PALETTE.md
├── ECOSTEP-DESIGN-SYSTEM.md
├── IMPLEMENTATION-GUIDE.md
├── REDESIGN-SUMMARY.md
├── VISUAL-GUIDE.md
└── QUICK-REFERENCE.md (this file)
```

## 🚀 Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## ✅ Checklist for New Components

- [ ] Use glassmorphic styling (`.glass-card` or custom)
- [ ] Apply brand colors from CSS variables
- [ ] Use consistent border radius (18-22px)
- [ ] Add soft shadow (0 8px 30px rgba(26, 49, 44, 0.06))
- [ ] Implement hover state with lift effect
- [ ] Use Inter font with proper weights
- [ ] Ensure responsive behavior
- [ ] Test backdrop-filter support
- [ ] Verify color contrast (WCAG AA minimum)
- [ ] Add smooth transitions (200ms ease)

---

**Quick Reference v1.0** | EcoStep Design System
