# Status Components Implementation

## Overview

This document describes the implementation of the **StatusIndicator** and **SystemStatusCard** components as part of the EcoStep Central Dashboard Redesign (Tasks 5.1 and 5.2).

## Components

### StatusIndicator

**File:** `StatusIndicator.tsx`

A reusable component for displaying connection or operational status with a semantic colored dot, label, status text, and optional timestamp.

#### Features

- ✅ Semantic status colors (green, red, gray)
- ✅ Pulse animation for active/connected states
- ✅ Timestamp display with proper formatting (HH:MM:SS)
- ✅ Flexible value display (custom or automatic)
- ✅ Accessible labels with ARIA support
- ✅ Dark mode support via theme tokens
- ✅ Responsive typography

#### Status Types

| Status | Color | Animation | Usage |
|--------|-------|-----------|-------|
| `connected` | Accent Green | Pulse | Wi-Fi/Bluetooth connected |
| `active` | Accent Green | Pulse | Data transfer active |
| `disconnected` | Red (#EF4444) | None | Connection lost |
| `error` | Red (#EF4444) | None | Error state |
| `waiting` | Secondary Gray | None | Waiting for data |
| `unknown` | Secondary Gray | None | Unknown state |

#### Props

```typescript
interface StatusIndicatorProps {
  label: string;           // Display label (e.g., "Wi-Fi")
  status: StatusType;      // Current status state
  timestamp?: string;      // Optional ISO timestamp
  value?: string;          // Optional custom display value
}
```

#### Example Usage

```tsx
// Connected with pulse animation
<StatusIndicator
  label="Wi-Fi"
  status="connected"
/>

// Active with timestamp
<StatusIndicator
  label="Data Transfer"
  status="active"
  timestamp="2024-01-15T14:30:45Z"
/>

// Disconnected
<StatusIndicator
  label="Bluetooth"
  status="disconnected"
/>

// Custom value
<StatusIndicator
  label="API Server"
  status="connected"
  value="Online"
/>
```

### SystemStatusCardNew

**File:** `SystemStatusCard.new.tsx`

A consolidated card component displaying three system health indicators: Wi-Fi, Bluetooth, and Data Transfer status.

#### Features

- ✅ Three StatusIndicator instances
- ✅ Wi-Fi connection status
- ✅ Bluetooth connection status
- ✅ Data transfer status with timestamp
- ✅ Responsive grid layout (3 columns → 1 column)
- ✅ Supporting tier visual hierarchy
- ✅ Dark mode support
- ✅ Empty state handling

#### Layout

**Desktop (≥640px):** 3 columns (horizontal)
```
┌─────────────────────────────────────┐
│ System Status                       │
├─────────────────────────────────────┤
│ [Wi-Fi] [Bluetooth] [Data Transfer] │
└─────────────────────────────────────┘
```

**Mobile (<640px):** 1 column (stacked)
```
┌─────────────┐
│ System      │
│ Status      │
├─────────────┤
│ [Wi-Fi]     │
│ [Bluetooth] │
│ [Data]      │
└─────────────┘
```

#### Props

```typescript
interface SystemStatusCardNewProps {
  wifi: boolean | undefined;          // Wi-Fi status
  bluetooth: boolean | undefined;     // Bluetooth status
  dataTimestamp: string | undefined;  // Last data timestamp
  hasData: boolean;                   // Whether data received
}
```

#### Status Mapping

| Prop | Value | Status Result |
|------|-------|---------------|
| `wifi` | `true` | `'connected'` |
| `wifi` | `false` | `'disconnected'` |
| `wifi` | `undefined` | `'unknown'` |
| `bluetooth` | `true` | `'connected'` |
| `bluetooth` | `false` | `'disconnected'` |
| `bluetooth` | `undefined` | `'unknown'` |
| `hasData` | `true` | `'active'` |
| `hasData` | `false` | `'waiting'` |

#### Example Usage

```tsx
// All connected with data
<SystemStatusCardNew
  wifi={true}
  bluetooth={true}
  dataTimestamp="2024-01-15T14:30:45Z"
  hasData={true}
/>

// Wi-Fi disconnected
<SystemStatusCardNew
  wifi={false}
  bluetooth={true}
  dataTimestamp="2024-01-15T14:25:30Z"
  hasData={true}
/>

// No data yet (waiting)
<SystemStatusCardNew
  wifi={true}
  bluetooth={true}
  dataTimestamp={undefined}
  hasData={false}
/>
```

## Design System Integration

### Colors

Components use centralized theme tokens from `lib/theme.ts`:

```typescript
// Light Mode
accent: '#428475'        // Medium green for connected/active
textPrimary: '#1A312C'   // Dark green
textSecondary: '#4B5563' // Gray-600
textMuted: '#9CA3AF'     // Gray-400

// Dark Mode
accent: '#3ED98A'        // Light green for connected/active
textPrimary: '#F9FAFB'   // Near white
textSecondary: '#9CA3AF' // Gray-400
textMuted: '#6B7280'     // Gray-500

// Semantic (consistent across themes)
error: '#EF4444'         // Red for disconnected/error
```

### Typography

- **Card Title:** 16px (1rem), font-weight: 600, `textPrimary`
- **Status Label:** 14px (0.875rem), font-weight: 500, `textPrimary`
- **Status Value:** 14px (0.875rem), font-weight: 400, `textSecondary`
- **Timestamp:** 12px (0.75rem), font-weight: 400, `textMuted`

### Spacing

- **Card Padding:** 24px (1.5rem)
- **Grid Gap:** 16px (1rem)
- **Status Item Gap:** 8px (0.5rem)
- **Title Margin:** 16px bottom (1rem)

### Animation

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Applied to connected/active status dots */
animation: pulse 2s ease-in-out infinite;
```

## Accessibility

### ARIA Labels

StatusIndicator includes proper ARIA attributes:
```tsx
<div role="status" aria-label="Wi-Fi: Connected">
  {/* Status content */}
</div>
```

### Semantic HTML

- Uses semantic elements (`<p>`, `<div>`)
- Proper heading hierarchy (`<h3>` for card title)
- Screen reader friendly labels

### Keyboard Support

- No interactive elements (status display only)
- Readable by screen readers
- Maintains proper focus order in parent containers

## Responsive Design

### Breakpoints

- **Desktop:** ≥640px - 3 column grid
- **Mobile:** <640px - 1 column stack

### Implementation

Uses CSS Grid with media query:
```css
.grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 639px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

## Testing

### Example Files

Visual examples and test cases are provided in:
- `StatusIndicator.example.tsx` - 7 usage examples
- `SystemStatusCard.example.tsx` - 6 usage examples

### Test Scenarios

**StatusIndicator:**
1. ✅ Connected status with pulse
2. ✅ Disconnected status (red)
3. ✅ Active with timestamp formatting
4. ✅ Waiting state
5. ✅ Unknown state
6. ✅ Custom value display
7. ✅ All states grid

**SystemStatusCard:**
1. ✅ All connected
2. ✅ Wi-Fi disconnected
3. ✅ No data (waiting)
4. ✅ Unknown status
5. ✅ Mixed states
6. ✅ Responsive layout

### Build Verification

✅ TypeScript compilation: **PASSED**
✅ Vite production build: **PASSED**
✅ Bundle size: **No significant increase**

## Requirements Validation

### Task 5.1 - StatusIndicator ✅

- ✅ **Req 4.1:** Displays IoT connection status
- ✅ **Req 4.2:** Displays data transmission status
- ✅ **Req 4.3:** Displays timestamp of last received data
- ✅ **Req 4.4:** Indicates online/offline devices
- ✅ **Req 4.5:** Occupies supporting position in visual hierarchy
- ✅ **Req 4.6:** Clearly indicates disconnected state
- ✅ **Req 8.4:** Uses subtle borders consistent with EcoStep visual language
- ✅ **Req 8.5:** Uses restrained green accent color

### Task 5.2 - SystemStatusCard ✅

- ✅ **Req 4.1:** Displays IoT connection status
- ✅ **Req 4.2:** Displays data transmission status
- ✅ **Req 4.3:** Displays timestamp of last received data
- ✅ **Req 4.4:** Indicates online/offline devices
- ✅ **Req 4.5:** Occupies supporting position in visual hierarchy
- ✅ **Req 4.6:** Clearly indicates disconnected state
- ✅ **Req 5.5:** System status area occupies supporting tier
- ✅ **Req 7.4:** Stacks components vertically on mobile
- ✅ **Req 7.5:** Adjusts grid layout for tablet readability

## Integration

### Exports

Components are exported in `index.ts`:
```typescript
export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';

export { SystemStatusCardNew } from './SystemStatusCard.new';
export type { SystemStatusCardNewProps } from './SystemStatusCard.new';
```

### Usage in DashboardPage

The SystemStatusCard will be integrated in task 9.2:
```tsx
import { SystemStatusCardNew } from '@/features/dashboard/components';

<SystemStatusCardNew
  wifi={lastReading?.wifiConnected}
  bluetooth={lastReading?.bluetoothConnected}
  dataTimestamp={lastReading?.timestamp}
  hasData={!!lastReading}
/>
```

## Files Created/Modified

### Created
- ✅ `StatusIndicator.example.tsx` - Visual examples
- ✅ `SystemStatusCard.example.tsx` - Visual examples
- ✅ `STATUS_COMPONENTS_README.md` - This documentation

### Modified
- ✅ `StatusIndicator.tsx` - Full implementation with pulse animation
- ✅ `SystemStatusCard.new.tsx` - Full implementation with responsive grid

### Build Output
- ✅ Frontend build successful
- ✅ No TypeScript errors
- ✅ No bundle size issues

## Next Steps

The components are now ready for integration into the DashboardPage:

1. **Task 9.2:** Integrate SystemStatusCard into DashboardPage layout
2. **Task 9.3:** Wire data flow from `useLiveSensorData()` hook
3. **Task 5.3:** Write unit tests for StatusIndicator and SystemStatusCard (optional)

## Notes

- Components follow the design system strictly
- Dark mode support is built-in via theme tokens
- Pulse animation is CSS-based (no JavaScript)
- Timestamp formatting handles invalid dates gracefully
- Components are fully responsive out-of-the-box
- No external dependencies added
- Backward compatible with existing codebase
