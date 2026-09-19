# Step Activity Card - Design Specification

## Component Structure

```
┌───────────────────────────────────────────────┐
│  [ICON]  STEP ACTIVITY            [TODAY]    │  ← Header
│                                               │
│  1,248 steps                                  │  ← Main Value
│                                               │
│  ─────────────────────────────────────────    │  ← Divider
│  Footsteps recorded today                     │  ← Status
└───────────────────────────────────────────────┘
```

---

## Layout Breakdown

### Card Container
- **Border Radius:** `rounded-2xl` (16px)
- **Padding:** `p-6` (24px all sides)
- **Max Width:** `max-w-md` (28rem / 448px)
- **Transition:** Shadow on hover
- **Background:** Theme-aware (white in light, dark card in dark)
- **Border:** 1px solid, theme-aware
- **Shadow:** Subtle, theme-aware

### Header Section (Row)
**Left Side:**
```
[ICON CONTAINER] [LABEL]
```

**Icon Container:**
- Size: `w-10 h-10` (40×40px)
- Border Radius: `rounded-xl` (12px)
- Background: Light mint green (light mode) / Subtle mint (dark mode)
- Padding: Centered

**Icon:**
- Component: `Footprints` from lucide-react
- Size: `w-5 h-5` (20×20px)
- Stroke Width: `2.5`
- Color: Medium green (#428475) / Mint (#89D7B7)

**Label:**
- Text: "Step Activity"
- Size: `text-xs` (12px)
- Weight: Semibold (600)
- Transform: Uppercase
- Letter Spacing: `0.05em`
- Color: Secondary text color

**Right Side:**
```
[TODAY BADGE]
```

**Today Badge:**
- Padding: `px-3 py-1` (12px horizontal, 4px vertical)
- Border Radius: `rounded-full`
- Background: Very subtle (light/dark aware)
- Text: "TODAY"
- Size: `0.625rem` (10px)
- Weight: Medium (500)
- Transform: Uppercase
- Letter Spacing: `0.05em`

---

## Main Value Section

### Number Display
```
1,248 steps
```

**Number:**
- Size: `text-4xl` (36px)
- Weight: Bold (700)
- Color: Primary text (or muted if no data)
- Font Feature: Tabular numbers
- Format: Locale-aware comma separators

**Unit:**
- Text: "steps"
- Size: `text-lg` (18px)
- Weight: Medium (500)
- Color: Secondary text
- Spacing: `gap-2` from number

**Baseline Alignment:**
- Both number and unit sit on same baseline
- Flexbox: `items-baseline`

---

## Divider

- Height: `h-px` (1px)
- Color: Semi-transparent (theme-aware)
  - Light: `rgba(0, 0, 0, 0.06)`
  - Dark: `rgba(255, 255, 255, 0.06)`
- Margin: `mb-3` below

---

## Status Message

**Text:**
- Size: `text-sm` (14px)
- Color: Secondary text color
- States:
  - No data: "Waiting for footstep data"
  - Zero: "No footsteps recorded today"
  - Has data: "Footsteps recorded today"

---

## Color Palette

### Light Mode
| Element | Color | Hex/RGBA |
|---------|-------|----------|
| Card Background | White | `#FFFFFF` |
| Primary Text | Dark Green | `#1A312C` |
| Secondary Text | Gray-600 | `#6B7280` |
| Muted Text | Gray-400 | `#9CA3AF` |
| Icon Container BG | Light Mint | `rgba(66, 132, 117, 0.12)` |
| Icon Color | Medium Green | `#428475` |
| Border | Light Gray | `#E5E7EB` |
| Badge BG | Subtle Gray | `rgba(26, 49, 44, 0.06)` |
| Divider | Subtle Black | `rgba(0, 0, 0, 0.06)` |
| Shadow | Light | `0 2px 8px rgba(0,0,0,0.04)` |

### Dark Mode
| Element | Color | Hex/RGBA |
|---------|-------|----------|
| Card Background | Dark Card | `#1C1F28` |
| Primary Text | Light | `#F9FAFB` |
| Secondary Text | Gray-400 | `#9CA3AF` |
| Muted Text | Gray-600 | `#6B7280` |
| Icon Container BG | Subtle Mint | `rgba(137, 215, 183, 0.15)` |
| Icon Color | Mint Green | `#89D7B7` |
| Border | Dark Border | `#2A2E39` |
| Badge BG | Subtle White | `rgba(255, 255, 255, 0.06)` |
| Divider | Subtle White | `rgba(255, 255, 255, 0.06)` |
| Shadow | Dark | `0 2px 8px rgba(0,0,0,0.3)` |

---

## Typography Scale

| Element | Size | Weight | Transform |
|---------|------|--------|-----------|
| Step Number | 36px (4xl) | Bold (700) | None |
| Unit Label | 18px (lg) | Medium (500) | None |
| Card Label | 12px (xs) | Semibold (600) | Uppercase |
| Badge Text | 10px (0.625rem) | Medium (500) | Uppercase |
| Status Message | 14px (sm) | Normal (400) | None |

---

## Spacing

### Internal Card Spacing
```
┌─[6]──────────────────────────────[6]──┐
[6]  [ICON] [LABEL]        [BADGE]  [6]
     [4: gap between header and value]
[6]  1,248 steps                     [6]
     [3: gap between value and divider]
     ──────────────────────────
     [3: gap between divider and status]
[6]  Status message                  [6]
└─[6]──────────────────────────────[6]──┘

Legend: [6] = 24px padding
        [4] = 16px gap
        [3] = 12px gap
```

---

## States & Variants

### Empty State (No Data)
```
┌───────────────────────────────────────────┐
│  👣 STEP ACTIVITY              TODAY     │
│                                           │
│  — steps                                  │
│                                           │
│  ───────────────────────────────────────  │
│  Waiting for footstep data                │
└───────────────────────────────────────────┘
```

- Number: `—` (em dash)
- Color: Muted text color
- Message: "Waiting for footstep data"

### Valid Zero
```
┌───────────────────────────────────────────┐
│  👣 STEP ACTIVITY              TODAY     │
│                                           │
│  0 steps                                  │
│                                           │
│  ───────────────────────────────────────  │
│  No footsteps recorded today              │
└───────────────────────────────────────────┘
```

- Number: `0`
- Color: Primary text color
- Message: "No footsteps recorded today"

### Real Data (Small)
```
┌───────────────────────────────────────────┐
│  👣 STEP ACTIVITY              TODAY     │
│                                           │
│  52 steps                                 │
│                                           │
│  ───────────────────────────────────────  │
│  Footsteps recorded today                 │
└───────────────────────────────────────────┘
```

### Real Data (Large)
```
┌───────────────────────────────────────────┐
│  👣 STEP ACTIVITY              TODAY     │
│                                           │
│  12,485 steps                             │
│                                           │
│  ───────────────────────────────────────  │
│  Footsteps recorded today                 │
└───────────────────────────────────────────┘
```

- Numbers formatted with commas
- Tabular number font for alignment

---

## Responsive Behavior

### Desktop (≥1024px)
- Max width: `448px` (28rem)
- Maintains compact size
- Full padding: `24px`

### Tablet (768px - 1023px)
- Max width: `448px` or full within container
- Maintains structure
- Padding: `24px`

### Mobile (<768px)
- Full width within parent container
- Padding: `24px`
- Number size remains `4xl`
- Layout remains horizontal (icon + label)

**Minimum Width Recommended:** 320px

---

## Interactions

### Hover State
- Shadow increases slightly
- Transition: `duration-200`
- Easing: Default cubic-bezier

### Focus State
- Not interactive (display only)
- No focus ring needed

### Loading State
- Use parent dashboard loading state
- Display empty state until data arrives

---

## Accessibility

### Semantic HTML
```tsx
<div role="region" aria-label="Step Activity">
  {/* Card content */}
</div>
```

### Screen Reader Support
- Icon is decorative: `aria-hidden="true"`
- Number and unit read together: "1,248 steps"
- Status message provides context

### Color Contrast
- Text on background meets WCAG AA standards
- Icon contrast meets WCAG AA standards

---

## Component Props

```typescript
interface StepActivityCardProps {
  stepCount: number | undefined;
  hasData: boolean;
}
```

### Prop Details

**stepCount:**
- Type: `number | undefined`
- Description: Current step count from sensor
- Undefined: No data available
- 0: Valid zero measurement
- > 0: Actual step count

**hasData:**
- Type: `boolean`
- Description: Whether sensor data exists
- `true`: Display step count (even if 0)
- `false`: Display empty state

---

## Usage Example

```tsx
import { StepActivityCard } from '@/features/dashboard/components/StepActivityCard';

// In dashboard page
<div className="max-w-md">
  <StepActivityCard 
    stepCount={lastReading?.stepCount}
    hasData={!!lastReading}
  />
</div>
```

---

## Design Principles

### 1. Intentional Placement
- Not forced to match electrical metrics
- Stands as supporting activity metric
- Compact but prominent

### 2. Clear Hierarchy
- Number is largest element
- Unit is subordinate but clear
- Label and context are subtle

### 3. Theme Consistency
- Uses centralized `getThemeColors()`
- Matches existing card patterns
- Follows EcoStep visual language

### 4. Data Honesty
- No fake data
- Clear distinction: no data vs. zero
- Real-time monitoring language

### 5. Professional Aesthetic
- Not a fitness app
- IoT monitoring feel
- Clean and modern
- Subtle green accent

---

## Files

### Component
`/frontend/src/features/dashboard/components/StepActivityCard.tsx`

### Integration
`/frontend/src/features/dashboard/pages/DashboardPage.tsx`

### Dependencies
- `lucide-react` (Footprints icon)
- `@/contexts/ThemeContext`
- `@/lib/theme`

---

## Version
- **Created:** 2026-09-19
- **Status:** Implemented
- **Design System:** EcoStep Theme v1
