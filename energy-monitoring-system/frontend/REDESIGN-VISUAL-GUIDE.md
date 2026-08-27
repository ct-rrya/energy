# EcoStep Redesign - Visual Reference Guide

## 🎨 Color Palette

### Primary Colors
```
Deep Forest: #1A312C - Primary brand color, buttons, text
Teal:        #428475 - Secondary/action color, active states
Mint:        #89D7B7 - Highlight/accent color
Warm Cream:  #FFF4E1 - Primary light background
```

### Dark Mode
```
Background:  #0F1B18 - Darkest background
Surface:     #1A312C - Card surfaces
Text:        #89D7B7 - Primary text
Accent:      #428475 - Interactive elements
```

---

## 📐 Layout Specifications

### Dashboard Layout
```
Sidebar Width:  240px (desktop)
Header Height:  ~80px
Content Padding: 1.5rem (24px)
Card Radius:    1.25rem (20px)
Gap Between:    1rem (16px)
```

### Responsive Breakpoints
```
Mobile:  < 640px  (sm)
Tablet:  < 1024px (lg)
Desktop: ≥ 1024px
```

---

## 🧩 Component Specifications

### Sidebar Navigation
```typescript
Width: 240px
Background: rgba(255, 255, 255, 0.4) light
            rgba(26, 49, 44, 0.4) dark
Border: 1px solid rgba(26, 49, 44, 0.1)

Logo Section:
- Height: auto
- Padding: 1.5rem
- Border-bottom: 1px solid

Navigation Items:
- Padding: 0.75rem 1rem
- Border-radius: 0.75rem (12px)
- Active: bg-[#428475] text-[#FFF4E1]
- Hover: bg-white/60

User Section:
- Fixed at bottom
- Avatar: 40px × 40px
- Gradient: from-[#428475] to-[#89D7B7]
```

### Header
```typescript
Height: ~80px
Padding: 1.25rem 1.5rem
Border-bottom: 1px solid rgba(26, 49, 44, 0.1)

Welcome Text:
- Size: 0.875rem (14px)
- Color: #428475
- Weight: 500

Title:
- Size: 1.5rem-2rem (24px-32px)
- Color: #1A312C (light) / #89D7B7 (dark)
- Weight: 700

Icons:
- Size: 1.25rem (20px)
- Button: 40px × 40px
- Border-radius: 0.75rem (12px)
```

### Metric Cards
```typescript
Padding: 1.25rem (20px)
Border-radius: 1.25rem (20px)
Background: rgba(255, 255, 255, 0.72)
Border: 1px solid rgba(255, 255, 255, 0.7)
Shadow: 0 8px 30px rgba(26, 49, 44, 0.05)

Icon Badge:
- Size: 48px × 48px
- Border-radius: 0.875rem (14px)
- Gradient background
- Icon: 24px, white, stroke-width: 2

Label:
- Size: 0.8125rem (13px)
- Uppercase
- Letter-spacing: 0.05em
- Color: rgb(var(--color-neutral-600))

Value:
- Size: 2rem (32px)
- Weight: 600
- Line-height: 1.2
- Color: #1A312C / #89D7B7

Trend Badge:
- Size: 0.75rem (12px)
- Padding: 0.375rem 0.625rem
- Border-radius: 0.5rem (8px)
```

### Dashboard Cards
```typescript
Padding: 1.5rem (24px)
Border-radius: 1.25rem (20px)
Background: rgba(255, 255, 255, 0.72)
Border: 1px solid rgba(255, 255, 255, 0.7)
Shadow: 0 8px 30px rgba(26, 49, 44, 0.05)

Title:
- Size: 1.125rem (18px)
- Weight: 600
- Color: #1A312C / #89D7B7

Subtitle:
- Size: 0.875rem (14px)
- Weight: 500
- Color: rgb(var(--color-neutral-600))
```

### Notification Panel
```typescript
Width: 320px-384px (20rem-24rem)
Position: absolute right-0 top-12
Border-radius: 0.75rem (12px)
Padding: 1.25rem (20px)
Background: rgba(255, 255, 255, 0.9)
            rgba(26, 49, 44, 0.9) dark
Backdrop-filter: blur(12px)
Shadow: 0 20px 40px rgba(0, 0, 0, 0.1)

Badge:
- Size: 20px × 20px
- Position: -4px -4px
- Background: #428475
- Font-size: 0.625rem (10px)
- Font-weight: 700

Item:
- Padding: 0.75rem (12px)
- Border-radius: 0.5rem (8px)
- Unread: bg-[rgba(137,215,183,0.15)]
- Read: bg-white/40
```

---

## 🎭 Login Page Specifications

### Split Screen Layout
```
Desktop:
├── Left Panel (55%)
│   ├── Background: #1A312C
│   ├── Gradient overlays (subtle)
│   ├── Abstract shapes (opacity: 0.08-0.20)
│   ├── Logo + Brand
│   ├── Heading: 2.5rem-3rem
│   └── Value indicators (3)
│
└── Right Panel (45%)
    ├── Background: #FFF4E1
    ├── Form container (max-width: 28rem)
    ├── Welcome heading: 1.875rem
    ├── Input fields
    ├── Sign in button
    ├── Demo credentials
    └── Register link

Mobile:
└── Single column
    ├── Small logo
    ├── Form (full width)
    └── Demo credentials
```

### Form Elements
```typescript
Input:
- Height: 48px
- Padding: 0.75rem 1rem
- Border-radius: 0.75rem (12px)
- Border: 1px solid rgba(26, 49, 44, 0.2)
- Background: rgba(255, 255, 255, 0.8)
- Focus: ring-2 ring-[#428475]

Button:
- Height: 52px
- Padding: 0.875rem 1.25rem
- Border-radius: 0.75rem (12px)
- Background: #1A312C
- Color: #FFF4E1
- Hover: bg-[#428475]
- Shadow: 0 8px 16px rgba(26, 49, 44, 0.15)

Label:
- Size: 0.875rem (14px)
- Weight: 500
- Color: #1A312C
- Margin-bottom: 0.5rem
```

---

## ✨ Animations & Transitions

### Durations
```css
Fast:    150ms - Hover effects
Normal:  200ms - Color changes, transforms
Slow:    300ms - Panel slides, fades
```

### Easing
```css
ease:     General transitions
ease-out: Slides, fades in
ease-in:  Fades out
```

### Hover Effects
```css
Cards:
- transform: translateY(-1px to -2px)
- box-shadow: increase by 1 level

Buttons:
- transform: translateY(-1px)
- box-shadow: increase
- background: slightly lighter/darker

Icons:
- transform: scale(1.05)
- color: change to accent
```

---

## 🌓 Theme Toggle

### Implementation
```typescript
// LocalStorage key
'ecostep-theme'

// Classes applied to <html>
.light or .dark

// Toggle function
const toggleTheme = () => {
  setTheme(prev => prev === 'light' ? 'dark' : 'light');
};

// Persistence
localStorage.setItem('ecostep-theme', theme);
```

---

## 📱 Responsive Behavior

### Desktop (≥ 1024px)
- Show sidebar (240px fixed)
- Show full header with all controls
- Grid layouts: 2-4 columns
- Cards side by side

### Tablet (640px - 1023px)
- Hide sidebar
- Show mobile menu icon
- Grid layouts: 2 columns
- Reduced padding

### Mobile (< 640px)
- Hide sidebar
- Hide brand panel on login
- Single column layouts
- Stack all cards
- Reduced font sizes
- Touch-friendly targets (min 44px)

---

## 🎯 Interactive States

### Button States
```
Default:   Base styling
Hover:     Lighter/darker, transform up
Active:    Pressed effect
Focus:     Ring outline
Disabled:  50% opacity, no pointer events
Loading:   Spinner, disabled state
```

### Input States
```
Default:   Base border
Focus:     Ring effect, accent border
Error:     Red border, shake animation
Success:   Green border, check icon
Disabled:  Gray background, no pointer
```

### Card States
```
Default:   Base styling
Hover:     Lift effect, stronger shadow
Active:    Pressed state (if clickable)
Loading:   Skeleton shimmer
Empty:     Empty state illustration
Error:     Error message + retry button
```

---

## 🔧 Development Notes

### Performance Tips
1. Use CSS transforms instead of position changes
2. Avoid animating expensive properties
3. Use `will-change` sparingly
4. Prefer CSS transitions over JS animations
5. Lazy load images and heavy components
6. Use React.memo for expensive renders
7. Debounce search and input handlers

### Accessibility
1. All interactive elements have focus states
2. Color contrast meets WCAG AA standards
3. Icons have aria-labels
4. Forms have proper labels
5. Keyboard navigation works
6. Screen reader friendly

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 10+)

---

## 📦 Dependencies

### Core
- React 18+
- TypeScript 5+
- Vite 8+

### UI/Styling
- Tailwind CSS 3+
- Lucide React (icons)
- Recharts (charts)

### State Management
- TanStack Query (React Query)
- React Router
- Context API

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📊 Performance Targets

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Load Times
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Total Bundle Size: < 1MB

---

**Last Updated:** December 2024  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
