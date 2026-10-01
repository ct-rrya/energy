# Technical Design: EcoStep Central Dashboard Redesign

## Overview

This design specifies a complete restructuring of the EcoStep Dashboard page to create a production-grade, data-first energy monitoring interface. The redesign transforms the current cluttered layout with mixed concerns into a clean, hierarchical three-section layout that separates real-time monitoring (EcoStep Central) from historical analytics (Historical Analytics tab).

The redesign addresses key UX problems:
- Current dashboard mixes real-time and historical data without clear separation
- Charts dominate the page, pushing critical live metrics below the fold
- Step activity data is buried despite being a unique differentiator
- System status is poorly communicated
- No clear visual hierarchy distinguishes "now" from "historical"

### Design Philosophy

**Data-First Hierarchy**: Live metrics are the visual hero. System status supports operational awareness. Historical charts are secondary context, living primarily in the Analytics tab.

**Clear Separation of Concerns**:
- **EcoStep Central (Dashboard Tab)**: Real-time monitoring with immediate system status
- **Historical Analytics (Analytics Tab)**: Time-series trends, historical comparisons, long-term patterns

**Progressive Disclosure**: Show the most critical information first, with details available through interaction or navigation to dedicated pages.

## Architecture

### High-Level Component Structure

```
DashboardPage
├── PublicUserBanner (conditional)
├── PageHeader (title + system status indicator + quick actions)
├── ElectricalMetricsGrid (4 live metric cards: Voltage, Current, Power, Energy)
├── StepActivityCard (featured, visually distinct)
├── SystemStatusSection (Wi-Fi, Bluetooth, Data Transfer)
└── EmptyStateOrSensors (sensor nodes when available)
```

**Removed from Dashboard**:
- All historical charts (PowerGenerationChart, EnergyPeriodChart, CumulativeEnergyChart, StepsChart, Voltage/Current Trend)
- Historical data visualizations belong in the Analytics tab

### Page Layout Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ [Public User Banner] (conditional)                      │
├─────────────────────────────────────────────────────────┤
│ EcoStep Central  [●] Real-time monitoring     [🔔 3]   │
├─────────────────────────────────────────────────────────┤
│ SECTION 1: Live Electrical Metrics (Hero)              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ VOLTAGE  │ │ CURRENT  │ │  POWER   │ │  ENERGY  │  │
│ │  5.0 V   │ │  0.15 A  │ │  0.8 W   │ │ 0.12 kWh │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│ SECTION 2: Step Activity (Featured Supporting Metric)  │
│ ┌─────────────────────────────────────────────────┐    │
│ │ 🦶 STEP ACTIVITY                        [TODAY] │    │
│ │ 1,247 steps                                     │    │
│ │ Footsteps recorded today                        │    │
│ └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│ SECTION 3: System Status                               │
│ ┌──────────────────────────────────────────────────┐   │
│ │ System Status                                    │   │
│ │ ● Wi-Fi Connected    ● Bluetooth Connected      │   │
│ │ ● Data Transfer: Receiving (Last: 2:34 PM)      │   │
│ └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Sensor Nodes (Empty State / Live When Available)       │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

```typescript
// Mobile (<768px): Single column, all stacked
// Tablet (768px-1023px): 2-column grid for metrics
// Desktop (≥1024px): 4-column grid for metrics

const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
};
```

**Responsive Layout Rules**:
- Mobile: All sections stack vertically, 100% width
- Tablet: Electrical Metrics in 2×2 grid, other sections full-width
- Desktop: Electrical Metrics in 1×4 grid, other sections full-width

## Components and Interfaces

### 1. DashboardPage (Modified)

**File**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**Responsibilities**:
- Page-level layout orchestration
- Data fetching coordination (hooks)
- Role-based access control
- Responsive layout management

**Key Changes**:
- Remove all chart components (moved to Analytics tab)
- Remove filter dropdown (not needed without charts)
- Restructure layout into 3 sections
- Simplify page complexity

**Data Dependencies**:
```typescript
const { data: liveMetrics } = useLiveSensorData();
const { data: systemStatus } = useSystemHealth();
const { data: dashboardMetrics } = useDashboardMetrics(); // For Energy Today
```

### 2. ElectricalMetricsGrid (New Component)

**File**: `frontend/src/features/dashboard/components/ElectricalMetricsGrid.tsx`

**Purpose**: Display 4 live electrical metrics in a responsive grid with clear hierarchy.

**Interface**:
```typescript
interface ElectricalMetricsGridProps {
  voltage: number | undefined;
  current: number | undefined;
  power: number | undefined;
  energyToday: number | undefined;
  hasData: boolean;
}
```

**Layout**:
- Desktop: 1×4 horizontal grid
- Tablet: 2×2 grid
- Mobile: 4×1 vertical stack

**Design Specifications**:
- Each metric card: 8-12px border radius, hairline border
- Metric value: 36-48px font size, font-weight: 700, tabular-nums
- Metric label: 13px uppercase, letter-spacing: 0.05em, subdued color
- Unit display: 18px, medium weight, subdued color
- Color coding:
  - Voltage: EcoStep Green (#3DDC97)
  - Current: Amber (#F59E0B)
  - Power: Blue (#3B82F6)
  - Energy: Amber (#F59E0B)

**Empty State**: Show "—" with "Waiting for data" when no sensor readings available.

### 3. StepActivityCard (Existing - No Changes)

**File**: `frontend/src/features/dashboard/components/StepActivityCard.tsx`

**Status**: ✅ Already implemented correctly

**Usage in Redesign**: Move to prominent position after electrical metrics grid.

**Why It Works**:
- Clear visual hierarchy (icon, label, value, context)
- Proper empty state handling
- Theme-aware styling
- Communicates the unique value proposition (footsteps → energy)

### 4. SystemStatusSection (New Component)

**File**: `frontend/src/features/dashboard/components/SystemStatusSection.tsx`

**Purpose**: Display real-time system connectivity and data transfer status.

**Interface**:
```typescript
interface SystemStatusSectionProps {
  wifiConnected: boolean | undefined;
  bluetoothConnected: boolean | undefined;
  dataTransferActive: boolean;
  lastUpdateTimestamp: string | undefined;
}
```

**Layout**:
```
┌────────────────────────────────────────────┐
│ System Status                              │
│ ┌──────────────┬────────────┬─────────────┐│
│ │ ● Wi-Fi      │ ● Bluetooth│ ● Transfer  ││
│ │   Connected  │   Connected│   Receiving ││
│ │              │            │   Last: 2:34││
│ └──────────────┴────────────┴─────────────┘│
└────────────────────────────────────────────┘
```

**Design Specifications**:
- Card with hairline border, 12px border-radius
- 3-column grid (desktop), stacks on mobile
- Status indicators: 12px circular dots
  - Green (#3DDC97): Connected/Active
  - Red (#EF4444): Disconnected/Inactive
  - Gray (#9CA3AF): Unknown
- Label: 14px, font-weight: 500
- Status text: 12px, subdued color
- Last update timestamp: 12px, more subdued

### 5. PageHeader (New Component)

**File**: `frontend/src/features/dashboard/components/PageHeader.tsx`

**Purpose**: Consistent page header with title, status indicator, and quick actions.

**Interface**:
```typescript
interface PageHeaderProps {
  title: string;
  subtitle: string;
  systemStatus: 'connected' | 'disconnected' | 'unknown';
  onAlertsClick: () => void;
  alertsCount?: number;
  isPublicUser: boolean;
}
```

**Layout**:
```
EcoStep Central  [●] Real-time monitoring     [🔔 Alerts 3]
```

**Design Specifications**:
- Title: 32px, font-weight: 700
- Subtitle: 14px with status indicator dot
- Status dot: 8px circle, inline with subtitle
- Alerts button: Outlined card-style button with notification badge
- Responsive: Stacks on mobile

### 6. SensorNodesSection (Modified)

**File**: `frontend/src/features/dashboard/components/SensorNodesSection.tsx`

**Purpose**: Display live sensor nodes when available, empty state otherwise.

**Key Changes**:
- Remove hard-coded mock data
- Show empty state by default
- Populate with real sensor data when WebSocket receives readings
- Design per empty state requirements (simple icon, helpful text)

**Empty State Design**:
```
┌────────────────────────────────────────────┐
│ Sensor Nodes                               │
│                                            │
│         [Activity Icon]                    │
│    No sensor data available                │
│    Connect ESP32 sensors to view           │
│    real-time node status                   │
│                                            │
└────────────────────────────────────────────┘
```

## Data Models

### LiveMetrics (Real-time)

```typescript
interface LiveMetrics {
  voltage: number;        // Volts (V)
  current: number;        // Amperes (A)
  power: number;          // Watts (W)
  stepCount: number;      // Steps today
  wifiConnected: boolean;
  bluetoothConnected: boolean;
  timestamp: string;      // ISO 8601
  sensorId: string;
}
```

**Source**: WebSocket event `sensor:reading` via `useLiveSensorData()` hook

### DashboardMetrics (Aggregated)

```typescript
interface DashboardMetrics {
  dailyEnergy: number;    // kWh today
  weeklyEnergy: number;   // kWh this week
  monthlyEnergy: number;  // kWh this month
  totalReadings: number;
}
```

**Source**: REST API `/analytics/dashboard` via `useDashboardMetrics()` hook

### SystemStatus (Health)

```typescript
interface SystemStatus {
  database: 'connected' | 'disconnected';
  websocket: 'connected' | 'disconnected';
  activeSensors: number;
  lastDataReceived: string | null;
}
```

**Source**: REST API `/health/system` via `useSystemHealth()` hook

## Data Flow

### Real-Time Updates Flow

```
ESP32 Sensor → Backend WebSocket Gateway → Frontend Socket Context
                                              ↓
                                    useLiveSensorData() hook
                                              ↓
                         ┌────────────────────┴────────────────────┐
                         ↓                    ↓                    ↓
          ElectricalMetricsGrid    StepActivityCard    SystemStatusSection
```

**Update Frequency**:
- WebSocket: Real-time (as sensor transmits, typically 1-5 seconds)
- Dashboard Metrics: Polled every 30 seconds
- System Health: Polled every 10 seconds

### WebSocket Event Handling

```typescript
// Already implemented in SocketContext
socket.on('sensor:reading', (reading: SensorReading) => {
  // Updates useLiveSensorData() state
  // Triggers re-render of all components consuming live data
});
```

### REST API Polling

```typescript
// useDashboardMetrics.ts
useQuery({
  queryKey: ['dashboard', 'metrics'],
  queryFn: getDashboardAnalytics,
  refetchInterval: 30000, // 30 seconds
  staleTime: 20000,
});

// useSystemHealth.ts
useQuery({
  queryKey: ['system', 'health'],
  queryFn: getSystemHealth,
  refetchInterval: 10000, // 10 seconds
  staleTime: 5000,
});
```

## Error Handling

### Network Errors

**WebSocket Disconnection**:
```typescript
if (!isConnected) {
  return (
    <div className="status-banner">
      ⚠️ Real-time connection lost. Reconnecting...
    </div>
  );
}
```

**API Errors**:
```typescript
const { data, error, isError } = useDashboardMetrics();

if (isError) {
  return (
    <ErrorState
      message="Unable to load dashboard metrics"
      onRetry={refetch}
    />
  );
}
```

### Empty Data States

**No Sensor Data**:
- Show "—" for numeric values
- Display "Waiting for sensor data" helper text
- Maintain layout structure (no collapsing)

**Zero vs. Undefined**:
```typescript
// Distinguish between valid zero and missing data
const displayValue = hasData && value !== undefined ? value : null;
const isEmpty = displayValue === null;
```

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**ElectricalMetricsGrid.test.tsx**:
- ✅ Renders 4 metric cards with correct labels
- ✅ Displays values with proper formatting (decimals, units)
- ✅ Shows empty state when no data
- ✅ Applies tabular-nums font variant
- ✅ Uses correct color coding per metric
- ✅ Responsive grid layout (1×4 desktop, 2×2 tablet, 4×1 mobile)

**SystemStatusSection.test.tsx**:
- ✅ Renders Wi-Fi, Bluetooth, Data Transfer status
- ✅ Shows correct status indicator colors
- ✅ Displays last update timestamp
- ✅ Handles undefined/unknown states gracefully
- ✅ Responsive layout (3-column desktop, stacked mobile)

**PageHeader.test.tsx**:
- ✅ Renders title and subtitle
- ✅ Shows system status indicator
- ✅ Alerts button hidden for public users
- ✅ Alerts button shows notification badge when count > 0
- ✅ Calls onAlertsClick handler

**DashboardPage.test.tsx** (Integration):
- ✅ Renders all 3 sections in correct order
- ✅ Fetches data from correct hooks
- ✅ Shows PublicUserBanner for public role
- ✅ Responsive layout adjustments
- ✅ No chart components rendered (moved to Analytics)

### Accessibility Tests

**Keyboard Navigation**:
- ✅ All interactive elements focusable (alerts button)
- ✅ Focus indicators visible
- ✅ Tab order logical (top to bottom)

**Screen Readers**:
- ✅ Metric labels announced before values
- ✅ Status indicators have text labels (not color-only)
- ✅ aria-label for alert button with count
- ✅ Heading hierarchy correct (h1 → h2 → h3)

**WCAG Compliance**:
- ✅ Color contrast ≥4.5:1 for text
- ✅ Color contrast ≥3:1 for large text
- ✅ Status communicated with icons + text (not color alone)

### Visual Regression Tests

**Chromatic/Percy Snapshots**:
- ✅ Dashboard - Light mode - With data
- ✅ Dashboard - Dark mode - With data
- ✅ Dashboard - Light mode - Empty state
- ✅ Dashboard - Dark mode - Empty state
- ✅ Dashboard - Mobile viewport
- ✅ Dashboard - Tablet viewport
- ✅ Dashboard - Desktop viewport

## Design Tokens

### Colors (From Requirements)

```typescript
// Light Mode
export const LIGHT_THEME = {
  pageBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  border: 'rgba(26, 49, 44, 0.08)',
  textPrimary: '#0F1116',
  textSecondary: '#525252',
  textTertiary: '#9CA3AF',
  accent: '#3DDC97', // EcoStep Green
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
};

// Dark Mode
export const DARK_THEME = {
  pageBackground: '#0F1116',
  cardBackground: '#1C1F28',
  surfaceMuted: '#12141A',
  border: 'rgba(137, 215, 183, 0.12)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  accent: '#3DDC97', // EcoStep Green (same)
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
};
```

### Typography

```typescript
export const TYPOGRAPHY = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: {
    xs: '0.75rem',   // 12px - Helper text
    sm: '0.875rem',  // 14px - Body text
    base: '1rem',    // 16px - Body text
    lg: '1.125rem',  // 18px - Large text
    xl: '1.25rem',   // 20px - Section titles
    '2xl': '1.5rem', // 24px - Card titles
    '3xl': '2rem',   // 32px - Page titles
    '4xl': '2.25rem',// 36px - Primary metrics
    '5xl': '3rem',   // 48px - Hero metrics
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing

```typescript
export const SPACING = {
  gap: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
  },
  padding: {
    card: '1.5rem', // 24px
    section: '2rem', // 32px
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
};
```

## File Structure

```
frontend/src/features/dashboard/
├── pages/
│   └── DashboardPage.tsx (MODIFIED - remove charts, restructure)
├── components/
│   ├── ElectricalMetricsGrid.tsx (NEW)
│   ├── ElectricalMetricsGrid.test.tsx (NEW)
│   ├── SystemStatusSection.tsx (NEW)
│   ├── SystemStatusSection.test.tsx (NEW)
│   ├── PageHeader.tsx (NEW)
│   ├── PageHeader.test.tsx (NEW)
│   ├── SensorNodesSection.tsx (NEW - refactored from DashboardPage)
│   ├── SensorNodesSection.test.tsx (NEW)
│   ├── StepActivityCard.tsx (EXISTING - no changes)
│   └── StepActivityCard.test.tsx (EXISTING)
├── hooks/
│   ├── useLiveSensorData.ts (EXISTING - no changes)
│   ├── useDashboardMetrics.ts (EXISTING - no changes)
│   └── useSystemHealth.ts (EXISTING - no changes)
└── types/
    └── dashboard.types.ts (EXISTING - add new interfaces if needed)

frontend/src/components/dashboard/
├── PowerGenerationChart.tsx (MOVED TO ANALYTICS TAB)
├── EnergyPeriodChart.tsx (MOVED TO ANALYTICS TAB)
├── CumulativeEnergyChart.tsx (MOVED TO ANALYTICS TAB)
├── StepsChart.tsx (MOVED TO ANALYTICS TAB)
├── VoltageCurrentChart.tsx (MOVED TO ANALYTICS TAB)
└── ChartsLayoutContainer.tsx (MOVED TO ANALYTICS TAB)
```

## Migration Strategy

### Phase 1: Component Creation

1. Create ElectricalMetricsGrid component with tests
2. Create SystemStatusSection component with tests
3. Create PageHeader component with tests
4. Create SensorNodesSection component (refactor from DashboardPage)

### Phase 2: Dashboard Page Refactoring

1. Remove all chart imports from DashboardPage
2. Remove ChartsLayoutContainer usage
3. Remove filter dropdown (not needed)
4. Restructure layout into 3 sections
5. Import and use new components
6. Update tests

### Phase 3: Analytics Tab Integration

1. Move ChartsLayoutContainer to Analytics page
2. Ensure Historical Analytics tab shows all charts
3. Update navigation and routing
4. Test separation of concerns

### Phase 4: Testing & Validation

1. Run unit tests for all new components
2. Run integration tests for DashboardPage
3. Perform accessibility audit
4. Visual regression testing
5. Performance testing (lazy loading, WebSocket efficiency)

## Backward Compatibility

### Preserved APIs

- WebSocket event structure (`sensor:reading`) - No changes
- REST API endpoints - No changes
- Hook interfaces (`useLiveSensorData`, etc.) - No changes
- Theme context - No changes
- Auth context and role-based access - No changes

### Breaking Changes

⚠️ **None**: This is a pure UI/layout refactoring. All data fetching, business logic, and APIs remain unchanged.

### Feature Flags (Optional)

If gradual rollout is desired:

```typescript
const FEATURE_FLAGS = {
  USE_REDESIGNED_DASHBOARD: true, // Toggle in config
};

export function DashboardPage() {
  if (FEATURE_FLAGS.USE_REDESIGNED_DASHBOARD) {
    return <NewDashboardLayout />;
  }
  return <LegacyDashboardLayout />;
}
```

## Performance Considerations

### Lazy Loading

Charts are removed from Dashboard, reducing initial bundle size:
- Before: ~150KB (charts + Recharts library)
- After: ~40KB (cards and simple UI components)
- Charts load on Analytics tab navigation (code-splitting)

### WebSocket Efficiency

No changes to WebSocket handling. Existing throttling in `useChartRealTimeUpdates` remains effective:
```typescript
const THROTTLE_INTERVAL = 5000; // 5 seconds
```

### React Query Caching

Existing caching strategy remains:
- Live data: `staleTime: 0` (always fresh)
- Dashboard metrics: `staleTime: 20000` (20 seconds)
- System health: `staleTime: 5000` (5 seconds)

### Rendering Optimization

All components use:
- Memoized calculations (`useMemo`)
- Stable callback references (`useCallback`)
- Proper dependency arrays
- No unnecessary re-renders

## Accessibility Features

### Semantic HTML

```html
<main>
  <h1>EcoStep Central</h1>
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading" class="sr-only">Live Electrical Metrics</h2>
    <!-- Electrical Metrics Grid -->
  </section>
  <section aria-labelledby="step-heading">
    <h2 id="step-heading" class="sr-only">Step Activity</h2>
    <!-- Step Activity Card -->
  </section>
  <section aria-labelledby="status-heading">
    <h2 id="status-heading">System Status</h2>
    <!-- System Status -->
  </section>
</main>
```

### Screen Reader Announcements

```typescript
// System status updates announce to screen readers
<div role="status" aria-live="polite">
  {systemStatus.database === 'connected' ? 'Connected' : 'Disconnected'}
</div>

// Metric updates announce when values change significantly
<div role="status" aria-live="polite" aria-atomic="true">
  Current power: {power} watts
</div>
```

### Keyboard Navigation

- All interactive elements in tab order
- Skip link to main content
- Focus trapping in modals (if added later)
- Arrow key navigation for metric cards (optional enhancement)

## Design Validation Checklist

### Requirements Compliance

- ✅ Req 1: No gradients used (flat colors only)
- ✅ Req 2: No glassmorphism (solid backgrounds + hairline borders)
- ✅ Req 3: Border radius 8-12px (moderate, not excessive)
- ✅ Req 4: No shadows on cards (only borders)
- ✅ Req 5: Data-first hierarchy (large numeric values, small icons)
- ✅ Req 6: No pastel icon tiles (icons beside labels, neutral colors)
- ✅ Req 7: Hairline borders on all cards
- ✅ Req 8: Semantic colors for status (green/amber/red with borders)
- ✅ Req 11: Typography system (36px metrics, 13px labels, tabular-nums)
- ✅ Req 12: Dark mode consistency (matching hierarchy, proper colors)
- ✅ Req 17: WCAG AA compliance (4.5:1 contrast, visible focus states)

### Visual Hierarchy

1. **Primary**: Live electrical metrics (Voltage, Current, Power, Energy)
2. **Secondary**: Step activity (supporting human-energy narrative)
3. **Tertiary**: System status (operational context)
4. **Quaternary**: Sensor nodes (detailed when available)

### User Flow Validation

```
User lands on Dashboard
  ↓
Immediately sees live metrics (above the fold)
  ↓
Understands system is operational (status indicators)
  ↓
Sees step activity → energy connection
  ↓
For historical analysis: Navigate to Analytics tab
  ↓
Charts and time-series data load (code-split)
```

## Implementation Notes

### CSS Utility Classes

Leverage existing Tailwind utilities, ensure these are defined:

```css
/* Add to global CSS if not present */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.uppercase-tracking {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hairline-border-light {
  border: 1px solid rgba(26, 49, 44, 0.08);
}

.hairline-border-dark {
  border: 1px solid rgba(137, 215, 183, 0.12);
}
```

### Component Reusability

ElectricalMetricsGrid is intentionally tightly coupled to the dashboard. For other pages needing metric displays:
- Extract a more generic `MetricCard` component if pattern repeats 3+ times
- Current design prioritizes clarity over premature abstraction

### Dark Mode Implementation

All components use `useTheme()` hook and `getThemeColors()` utility:

```typescript
const { theme } = useTheme();
const colors = getThemeColors(theme);

// Then use colors.textPrimary, colors.cardBackground, etc.
```

No hard-coded colors in components. All theme-dependent values come from centralized tokens.

## Future Enhancements (Out of Scope)

These are explicitly NOT part of this redesign but may be considered later:

1. **Customizable Dashboard**: Allow users to rearrange sections or hide/show metrics
2. **Metric Thresholds**: Visual indicators when metrics exceed/fall below thresholds
3. **Historical Mini-Charts**: Tiny sparklines next to live metrics showing 1-hour trend
4. **Export Data**: Download current readings as CSV/JSON
5. **Alerts Integration**: Inline alert notifications on dashboard
6. **Multi-Sensor Support**: When multiple ESP32 devices are connected, show all in sensor grid

## Conclusion

This design provides a complete blueprint for transforming the EcoStep Dashboard from a chart-heavy analytics page into a focused, real-time monitoring interface. By separating concerns (real-time monitoring vs. historical analysis), establishing clear visual hierarchy, and following production-grade design principles, the redesigned dashboard will communicate system status and live metrics more effectively while maintaining backward compatibility and accessibility standards.

The implementation is straightforward: create 4 new components, refactor DashboardPage to use them, and move historical charts to the Analytics tab. No changes to backend, APIs, or data fetching logic are required.
