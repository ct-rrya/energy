# Floating Capsule Sidebar - Visual Testing Guide

## Quick Start
```bash
cd energy-monitoring-system/frontend
npm run dev
```

Navigate to the dashboard (login required) to see the new sidebar.

## Test Scenarios

### 1. Initial Render (Collapsed State)
**What to check:**
- [ ] Round logo badge (80px circle) with green Footprints icon
- [ ] Tall dark capsule below (80px wide, fully rounded ends)
- [ ] Icons centered in capsule (22px, stroke-width 1.5)
- [ ] No labels visible (icon-only)
- [ ] Active route has green circle with dark green icon
- [ ] 20px gap between logo badge and capsule

**Expected colors (light mode):**
- Rail background: Deep navy (#101a30)
- Icons: White with 72% opacity
- Active circle: Bright green (#19d46a)
- Active icon: Dark green ink (#05361f)

### 2. Liquid Notch Indicator
**What to check:**
- [ ] Green circle (54px) positioned on active item
- [ ] Scooped-out ring around circle (darker navy outline)
- [ ] Circle centered on nav item vertically
- [ ] No visual glitches or misalignment

**Test with DevTools:**
Open browser inspector and check the computed `maskImage` on the notch ring element.

### 3. Route Navigation
**Actions:**
1. Click "Home" → notch moves to Home
2. Click "EcoStep Central" → notch moves to Dashboard
3. Click "Analytics" → notch moves to Analytics

**What to check:**
- [ ] Notch glides smoothly (600ms duration)
- [ ] Stretch effect visible during transition (taller briefly)
- [ ] No jumping or flickering
- [ ] Active icon color changes to dark green
- [ ] Previous icon returns to white

### 4. Expand Sidebar
**Action:** Click hamburger icon (☰) at top of rail

**What to check:**
- [ ] Sidebar expands to 240px width (450ms)
- [ ] Logo badge morphs from circle to pill shape
- [ ] "EcoStep" wordmark appears next to icon
- [ ] Nav item labels fade in
- [ ] All labels use Bricolage Grotesque font
- [ ] Notch stays aligned during expansion
- [ ] Content area margin adjusts smoothly

**Typography check:**
- Logo wordmark: font-extrabold (800 weight)
- Nav labels: font-medium (600 weight)
- Bottom controls: font-medium (600 weight)

### 5. Collapse Sidebar
**Action:** Click hamburger again

**What to check:**
- [ ] Sidebar collapses to 80px (450ms)
- [ ] Logo badge morphs back to circle
- [ ] Wordmark fades out
- [ ] Nav labels fade out
- [ ] Icons remain centered
- [ ] Tooltips work (hover over icons)
- [ ] Notch stays aligned

### 6. Theme Toggle
**Action:** Click moon/sun icon at bottom

**What to check:**
- [ ] Rail color changes (light navy → darker navy)
- [ ] Rail line accents appear in dark mode
- [ ] Icon opacity adjusts
- [ ] Green colors remain consistent
- [ ] Smooth transition (200ms)
- [ ] Logo badge updates

**Dark mode colors:**
- Rail: #16223f (lighter than light mode)
- Rail lines: #22305a (subtle accent)
- Icons: White with 70% opacity

### 7. Bottom Controls
**Admin user:**
- [ ] Theme toggle visible
- [ ] Avatar with username/admin text
- [ ] Logout button visible

**Guest user:**
- [ ] Theme toggle visible
- [ ] Avatar with "Guest" + "Read-only" text
- [ ] No logout button

**Expanded state:**
- [ ] Avatar shows green circle + name + role
- [ ] All controls have labels
- [ ] Proper spacing between controls

### 8. Mobile Responsive (<1024px)
**Actions:**
1. Resize browser to mobile width
2. Sidebar should hide automatically

**What to check:**
- [ ] Sidebar hidden off-screen
- [ ] Mobile menu button appears (top-left corner)
- [ ] Content has top padding (64px)
- [ ] Click menu button → drawer slides in
- [ ] Dark backdrop appears behind drawer
- [ ] Close X button visible (top-right of drawer)
- [ ] Click backdrop → drawer closes
- [ ] Click nav item → drawer closes + route changes
- [ ] Body scroll locked when drawer open

### 9. Hover Effects
**Collapsed state:**
- [ ] Icons show tooltip on hover
- [ ] Subtle background hover (white/5% opacity)
- [ ] Cursor becomes pointer

**Expanded state:**
- [ ] Rows show background hover
- [ ] Labels remain readable
- [ ] Tooltips don't show (not needed)

### 10. Keyboard Navigation
**Actions:**
1. Tab through sidebar items
2. Press Enter on focused item

**What to check:**
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard shortcuts work (if implemented)
- [ ] Logical tab order: hamburger → nav items → theme → avatar → logout

### 11. Animation Performance
**What to check:**
- [ ] Notch transition smooth (no stutter)
- [ ] Expand/collapse smooth
- [ ] No layout shift in content area
- [ ] 60fps on both desktop and mobile
- [ ] Respects prefers-reduced-motion setting

**Test with DevTools:**
- Enable "Rendering" → "Frame Rendering Stats"
- Check for consistent 60fps during animations

### 12. Edge Cases

**Long username:**
- [ ] Username truncates with ellipsis when expanded
- [ ] No layout breaking

**Rapid clicking:**
- [ ] Multiple rapid clicks don't break animation state
- [ ] Notch doesn't get stuck

**Window resize during animation:**
- [ ] Sidebar responds correctly
- [ ] Notch repositions without glitches

**Font loading:**
- [ ] Bricolage Grotesque loads correctly
- [ ] Fallback fonts work if Google Fonts unavailable

## Browser Testing Matrix

Test in these browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

**Screen reader:**
- [ ] All buttons have proper labels
- [ ] Active state announced
- [ ] Navigation structure makes sense

**Contrast:**
- [ ] Active icon on green circle: sufficient contrast
- [ ] Inactive icons on navy: sufficient contrast
- [ ] Labels readable in both modes

**Keyboard only:**
- [ ] Can navigate entire sidebar
- [ ] Can toggle expand/collapse
- [ ] Can activate all controls

## Performance Metrics

**Initial load:**
- [ ] No layout shift (CLS = 0)
- [ ] Sidebar renders immediately
- [ ] Notch positions correctly on first paint

**Runtime:**
- [ ] No memory leaks (use Chrome DevTools Memory profiler)
- [ ] Smooth animations even after 10+ navigations
- [ ] Event listeners cleaned up properly

## Known Issues to Watch For

1. **Notch misalignment** - May occur if:
   - Fonts not loaded before measurement
   - Window resized during navigation
   - Content shifts after render

2. **Mask rendering** - Some browsers may:
   - Require vendor prefixes (WebKit)
   - Show aliasing on the scooped edge
   - Have performance issues with complex masks

3. **Z-index conflicts** - Watch for:
   - Modals appearing behind sidebar
   - Tooltips cut off by overflow
   - Focus rings hidden by other elements

## Debug Tools

If issues arise:

```javascript
// Check notch position
console.log(getComputedStyle(document.documentElement).getPropertyValue('--notch-y'));

// Check sidebar state
console.log(localStorage.getItem('ecostep.sidebar.expanded'));

// Force notch recalculation (add to useLiquidNotch)
window.recalculateNotch = () => updateNotchPosition();
```

## Sign-Off Checklist

Before marking complete:
- [ ] All 12 test scenarios pass
- [ ] Works in all target browsers
- [ ] Accessibility audit passes
- [ ] Performance metrics acceptable
- [ ] Mobile UX smooth
- [ ] No console errors
- [ ] Documentation complete

---

**Last Updated:** Implementation complete, awaiting visual testing
**Status:** ✅ Build successful, ready for review
