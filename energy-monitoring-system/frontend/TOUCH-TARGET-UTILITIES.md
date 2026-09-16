# Touch Target Utilities

## Overview

Custom Tailwind CSS utilities for implementing WCAG-compliant touch targets across the EcoStep Energy Monitoring Dashboard. These utilities ensure all interactive elements meet the minimum 44x44px touch target size requirement specified in the Responsive Mobile Optimization spec.

## Available Utilities

### `.min-w-touch`
Sets minimum width to 44px.

```tsx
<button className="min-w-touch px-2 py-1">
  Button
</button>
```

**Use Case:** When you need to ensure minimum width but height can be flexible.

---

### `.min-h-touch`
Sets minimum height to 44px.

```tsx
<button className="min-h-touch px-4 py-1">
  Button
</button>
```

**Use Case:** When you need to ensure minimum height but width can be flexible.

---

### `.touch-target`
Sets both minimum width and height to 44px.

```tsx
<button className="touch-target">
  Icon
</button>
```

**Use Case:** For icon-only buttons, compact controls, and any interactive element that needs guaranteed touch target compliance.

## Common Patterns

### Icon-Only Button (Mobile)
```tsx
<button 
  className="touch-target flex items-center justify-center rounded-lg"
  aria-label="Settings"
>
  <Settings className="w-5 h-5" />
</button>
```

### Responsive Button with Touch Target
```tsx
<button className="touch-target px-3 py-2 sm:px-4 sm:py-3">
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">Icon</span>
</button>
```

### Header Action Button
```tsx
<button className="touch-target sm:px-4 sm:py-2">
  <Icon className="w-5 h-5 sm:mr-2" />
  <span className="hidden sm:inline">Label</span>
</button>
```

### Mobile Menu Button
```tsx
<button 
  className="touch-target fixed top-4 left-4 z-50 rounded-xl bg-[#1E2128]"
  aria-label="Open menu"
>
  <Menu className="w-6 h-6" />
</button>
```

## Implementation Details

### Location
These utilities are defined in `frontend/src/index.css` within the `@layer utilities` block:

```css
@layer utilities {
  /* Touch Target Utilities - Responsive Mobile Optimization */
  .min-w-touch {
    min-width: 44px;
  }

  .min-h-touch {
    min-height: 44px;
  }

  .touch-target {
    min-width: 44px;
    min-height: 44px;
  }
  
  /* ... other utilities ... */
}
```

### Tailwind CSS Version
This implementation uses **Tailwind CSS v4** with the new `@tailwindcss/postcss` plugin. The utilities are defined using the `@layer utilities` directive.

## Testing

A test component is available to verify the utilities work correctly:

**File:** `frontend/src/components/TouchTargetTest.tsx`

To test the utilities:
1. Import and render the `TouchTargetTest` component in your app
2. Visually inspect that buttons meet the 44x44px minimum
3. Use browser DevTools to measure element dimensions

## Design System Integration

These utilities complement the existing EcoStep design system:

```tsx
// EcoStep primary button with touch target
<button className="touch-target eco-btn-primary">
  Action
</button>

// EcoStep icon container with touch target
<div className="touch-target eco-icon-container">
  <Icon />
</div>

// Glass card button with touch target
<button className="touch-target glass-card hover:glass-card-hover">
  <Icon className="w-5 h-5" />
</button>
```

## WCAG Compliance

These utilities help meet **WCAG 2.1 Level AA** requirements:

- **Success Criterion 2.5.5 (Target Size - Level AAA):** Target size of at least 44 by 44 CSS pixels
- While Level AAA, this is considered best practice for mobile accessibility
- Ensures usability for users with motor impairments
- Reduces accidental taps on adjacent controls

## Browser Compatibility

The `min-width` and `min-height` properties used by these utilities are supported in all modern browsers:

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Opera: Full support

## Related Documentation

- [Responsive Mobile Optimization Spec](../.kiro/specs/responsive-mobile-optimization/)
- [EcoStep Design System](./ECOSTEP-DESIGN-SYSTEM.md)
- [Design System Overview](./DESIGN-SYSTEM.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Examples in Codebase

Once implemented across the dashboard, these utilities will be used in:

- **DashboardLayout**: Hamburger menu button, close buttons
- **Navigation**: Mobile menu items
- **Header Actions**: Settings, alerts, export buttons
- **FloatingChatButton**: Chat toggle button, close button
- **Metric Cards**: Action buttons, interactive elements
- **Tables**: Row action buttons, filter controls
- **Forms**: Submit buttons, icon buttons

## Migration Guide

To update existing buttons to use touch targets:

**Before:**
```tsx
<button className="w-10 h-10 rounded-lg">
  <Icon />
</button>
```

**After:**
```tsx
<button className="touch-target rounded-lg">
  <Icon />
</button>
```

The utilities provide the minimum dimensions, so you can remove explicit `w-` and `h-` classes for touch controls.

## Notes

- These utilities set **minimum** dimensions - elements can grow larger with padding
- Combine with responsive padding classes for optimal touch targets at all breakpoints
- Always include `aria-label` on icon-only buttons with touch targets
- Consider using `.touch-target` by default for all mobile interactive elements

---

**Implementation Date:** January 2025  
**Spec:** Responsive Mobile Optimization  
**Task:** 1.3 - Update Tailwind Configuration
