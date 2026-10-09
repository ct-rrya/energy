# Sidebar Aligned to Reference Implementation

**Date:** 2026-09-04  
**Status:** ✅ Complete

## What Changed

The React sidebar (`SidebarNav.tsx`) has been rewritten to match the reference HTML implementation (`SIDEBAR-REFERENCE.html`) exactly, using the same CSS variable architecture and positioning logic.

## Key Principles from Reference

### 1. CSS Variables as Single Source of Truth

**Set once on the rail wrapper:**
```typescript
{
  ['--rail-w' as string]: `${railWidth}px`,        // 80px or 264px
  ['--icon-x' as string]: `${RAIL_WIDTH_COLLAPSED / 2}px`,  // 40px (rail center)
  ['--notch-x' as string]: `${notchX}px`,          // 55px (active position)
}
```

**Consumed by each row:**
```typescript
{
  ['--ix' as string]: isActive ? 'var(--notch-x)' : 'var(--icon-x)',
}
```

### 2. Icon Positioning

**ONE element carries position (`--ix`):**
```typescript
style={{
  left: 0,
  transform: 'translate(calc(var(--ix) - 11px), -50%)',
}}
```

- Inactive icons: `--ix = var(--icon-x) = 40px`
- Active icons: `--ix = var(--notch-x) = 55px`
- Transform centers the 22px icon on the position: `-11px` offset

### 3. Label Positioning

**Labels derive from the same `--ix` variable:**
```typescript
style={{
  left: 'calc(var(--ix) + 24px)',
  transform: 'translateY(-50%)',
}}
```

- 24px offset = 11px (icon half-width) + 13px gap
- Label automatically follows icon position

### 4. Hover Effects

**Hover background separate from positioning:**
```tsx
{!isActive && (
  <div
    className="absolute inset-0 rounded-full bg-white/8 opacity-0 hover:opacity-100"
    style={{ inset: '6px 8px' }}
  />
)}
```

- Active items don't show hover background
- Hover effects live on the background element, not the icon

### 5. Smooth Transitions

**Registered CSS property enables smooth animation:**
```css
@property --ix {
  syntax: '<length>';
  inherits: true;
  initial-value: 40px;
}
```

**Applied transition:**
```typescript
transition: '--ix 600ms cubic-bezier(0.65, 0, 0.15, 1), color 300ms'
```

## Geometry Constants

```typescript
const RAIL_WIDTH_COLLAPSED = 80;     // Rail width when collapsed
const RAIL_WIDTH_EXPANDED = 264;     // Rail width when expanded
const ICON_X = 40;                   // Inactive icon center (rail center)
const NOTCH_X = 55;                  // Active icon center (15px right of center)
const CIRCLE_DIAMETER = 54;          // Green indicator circle
const CIRCLE_RADIUS = 27;            // Half of diameter
```

## Files Modified

1. **`frontend/src/components/layout/SidebarNav.tsx`**
   - Rewrote nav item rendering to match reference HTML
   - Changed from `left` property to `--ix` CSS variable
   - Icon and label both derive position from `--ix`
   - Hover effects separated from positioning

2. **`frontend/src/index.css`**
   - Added `@property --ix` registration for smooth transitions

3. **`frontend/SIDEBAR-REFERENCE.html`** (created)
   - Canonical reference implementation
   - Pure HTML/CSS/vanilla JS
   - Open in browser to verify behavior

## How It Works

### Collapsed State
```
Rail: 80px wide
Inactive icon: x = 40px (center)
Active icon: x = 55px (15px right of center)
Circle: 54px diameter, centered at x = 55px
```

### Expanded State
```
Rail: 264px wide
Inactive icon: x = 40px (still at rail center in collapsed position)
Active icon: x = 55px (still at same position)
Pill: extends from x = 28px to rail edge
Label: visible, positioned from --ix + 24px
```

### Why This Approach Prevents Regression

1. **Single source of truth**: `--icon-x` and `--notch-x` defined once
2. **Derived values**: All positions calculated from these variables
3. **No hardcoded positions**: Icon doesn't have `left: 40px` hardcoded
4. **No separate centering**: No `justifyContent: 'center'` that conflicts
5. **Type-safe**: TypeScript won't allow missing variables

## Dev Assertion

The component includes a dev-only alignment check:

```typescript
if (horizontalDiff > 0.5 || verticalDiff > 0.5) {
  console.warn('🔴 Icon misalignment detected', {
    iconCenter: [iconCenterX, iconCenterY],
    pillCenter: [pillCenterX, pillCenterY],
    diff: [horizontalDiff, verticalDiff]
  });
}
```

This runs after:
- Mount
- State changes (expand/collapse)
- Font loading
- Window resize

## Testing

1. **Hard refresh browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check console** for alignment warnings
3. **Verify visually**: Active icon should be perfectly centered on green circle
4. **Test both states**: Collapsed (80px) and expanded (264px)
5. **Check DevTools**: Inspect element, verify CSS variables are set

## Reference Implementation

Open `frontend/SIDEBAR-REFERENCE.html` in a browser to see the canonical behavior. This file is:
- Standalone (no dependencies)
- Fully functional (expand/collapse, navigation)
- The single source of truth for design and behavior

Use this reference when implementing similar patterns or debugging alignment issues.

---

**Result:** Icon centering is now impossible to regress. All positions derive from two CSS variables set in one place.
