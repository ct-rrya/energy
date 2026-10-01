# Dashboard Components - EcoStep Central Redesign

## Overview

This directory contains all components for the redesigned EcoStep Central Dashboard. The redesign focuses on real-time monitoring with a clear three-tier visual hierarchy: primary (electrical metrics), secondary (step activity), and supporting (system status).

## Component Architecture

### Core Components

#### 1. DashboardHeader
**File:** `DashboardHeader.tsx`  
**Purpose:** Page header with title, system status, and alerts button

**Props:**
```typescript
interface DashboardHeaderProps {
  title: string;                    // Main page title
  subtitle: string;                 // Subtitle/description
  systemStatus: SystemStatusType;   // 'connected' | 'disconnected' | 'unknown'
  alertsCount: number;              // Number of active alerts
  isPublicUser: boolean;            // Disable alerts for public users
  onAlertsClick: () => void;        // Alert button callback
}
```

**Features:**
- Responsive layout (flex-row desktop, flex-column mobile)
- Status indicator dot with semantic colors
- Alerts button with badge count
- Disabled state for public users

---

#### 2. ElectricalMetricsGrid
**File:** `ElectricalMetricsGrid.tsx`  
**Purpose:** Hero section with four primary electrical metrics

**Props:**
```typescript
interface ElectricalMetricsGridProps {
  voltage?: number;     // Volts (V), 1 decimal
  current?: number;     // Amperes (A), 2 decimals
  power?: number;       // Watts (W), 1 decimal
  energy?: number;      // kWh, 2 decimals
  isLoading?: boolean;  // Loading state
}
```

**Grid Layout:**
- Desktop (≥1024px): 4 columns
- Tablet (640-1023px): 2 columns
- Mobile (<640px): 1 column

**Metric Colors:**
- Voltage: Accent green (`#3DDC97`)
- Current: Amber (`#F59E0B`)
- Power: Blue (`#3B82F6`)
- Energy: Amber (`#F59E0B`)

---

#### 3. MetricCard
**File:** `MetricCard.tsx`  
**Purpose:** Individual metric display with data-first hierarchy

**Props:**
```typescript
interface MetricCardProps {
  label: string;                    // Metric name (e.g., "Voltage")
  value: number | undefined;        // Numeric value
  unit: string;                     // Unit (e.g., "V", "A")
  precision: number;                // Decimal places
  color: MetricColor;               // 'accent' | 'amber' | 'blue' | 'red'
  icon?: React.ReactNode;           // Optional icon (16px)
  isLoading?: boolean;              // Loading skeleton
}
```

**Visual Hierarchy:**
- Label: 13px uppercase, secondary color
- Value: 36px bold tabular-nums, accent color
- Unit: 18px inline with value

**Typography Scale:**
- Desktop: 36px value
- Tablet: 32px value
- Mobile: 28px value

---

#### 4. StepActivityCard
**File:** `StepActivityCard.tsx`  
**Purpose:** Supporting section showing today's step count

**Props:**
```typescript
interface StepActivityCardProps {
  stepCount: number | undefined;    // Today's step count
  hasData: boolean;                 // Data availability flag
}
```

**Features:**
- Max-width: 400px
- 32px bold tabular-nums for count
- Footprint icon (16px) inline with label
- Empty state: "Waiting for footstep data"
- Real-time updates

---

#### 5. SystemStatusCard (New)
**File:** `SystemStatusCard.new.tsx`  
**Purpose:** Consolidated system health indicators

**Props:**
```typescript
interface SystemStatusCardNewProps {
  wifi: boolean | undefined;           // Wi-Fi connection
  bluetooth: boolean | undefined;      // Bluetooth connection
  dataTimestamp: string | undefined;   // Last data timestamp
  hasData: boolean;                    // Data received flag
}
```

**Status Grid:**
- Desktop: 3 columns
- Mobile: 1 column (stacked)

**Status Indicators:**
1. Wi-Fi (connected/disconnected/unknown)
2. Bluetooth (connected/disconnected/unknown)
3. Data Transfer (active/waiting)

---

#### 6. StatusIndicator
**File:** `StatusIndicator.tsx`  
**Purpose:** Individual status item with dot, label, and timestamp

**Props:**
```typescript
interface StatusIndicatorProps {
  label: string;                    // Status label (e.g., "Wi-Fi")
  status: StatusType;               // See StatusType below
  timestamp?: string;               // Optional last update time
  value?: string;                   // Optional custom display value
}

type StatusType = 
  | 'connected' 
  | 'disconnected' 
  | 'active' 
  | 'waiting' 
  | 'error' 
  | 'unknown';
```

**Status Colors:**
- connected/active: Accent green with pulse
- disconnected/error: Red (`#EF4444`)
- unknown/waiting: Secondary gray

---

#### 7. SensorNodesEmptyState
**File:** `SensorNodesEmptyState.tsx`  
**Purpose:** Empty state when no sensor data available

**Props:**
```typescript
interface SensorNodesEmptyStateProps {
  className?: string;               // Optional custom class
}
```

**Layout:**
- Centered content
- 64px icon circle
- Title: "No sensor data available"
- Description: Max-width 420px
- Vertical padding: 3rem (48px)

---

## Component Hierarchy

```
DashboardPage
├── PublicUserBanner (conditional)
├── DashboardHeader
│   ├── Title + Status Indicator
│   └── Alerts Button (with badge)
├── ElectricalMetricsGrid (Hero Section)
│   ├── MetricCard (Voltage)
│   ├── MetricCard (Current)
│   ├── MetricCard (Power)
│   └── MetricCard (Energy Today)
├── StepActivityCard (Supporting Section)
└── SystemStatusCardNew (Tertiary Section)
    ├── StatusIndicator (Wi-Fi)
    ├── StatusIndicator (Bluetooth)
    └── StatusIndicator (Data Transfer)
```

---

## Type Definitions

### Enums and Unions

```typescript
// System status for header
type SystemStatusType = 'connected' | 'disconnected' | 'unknown';

// Metric color variants
type MetricColor = 'accent' | 'amber' | 'blue' | 'red';

// Status indicator states
type StatusType = 
  | 'connected' 
  | 'disconnected' 
  | 'active' 
  | 'waiting' 
  | 'error' 
  | 'unknown';
```

### Color Mapping

```typescript
// Metric Colors
const METRIC_COLORS = {
  accent: '#3DDC97',  // EcoStep green
  amber: '#F59E0B',   // Warning/energy
  blue: '#3B82F6',    // Info
  red: '#EF4444',     // Error/alert
};

// Status Colors
const STATUS_COLORS = {
  connected: '#10B981',   // Green
  disconnected: '#EF4444', // Red
  waiting: '#6B7280',     // Gray
};
```

---

## Responsive Breakpoints

Following Tailwind CSS conventions:

```typescript
const BREAKPOINTS = {
  mobile: '0-639px',      // Single column
  tablet: '640-1023px',   // 2-column grid
  desktop: '1024px+',     // Full layout
};
```

### Layout Transformations

**Desktop (≥1024px):**
- 4-column metrics grid
- Horizontal header layout
- 3-column status grid

**Tablet (640-1023px):**
- 2-column metrics grid (2x2)
- Stacked header
- 3-column status grid

**Mobile (<640px):**
- Single column (stacked)
- Full-width cards
- Single column status

---

## Design System

### Typography

```typescript
// Metric Values
fontSize: '2.25rem',      // 36px
fontWeight: 600,
fontVariantNumeric: 'tabular-nums',

// Labels
fontSize: '0.8125rem',    // 13px
fontWeight: 500,
textTransform: 'uppercase',
letterSpacing: '0.05em',

// Units
fontSize: '1.125rem',     // 18px
fontWeight: 400,
```

### Spacing

```typescript
// Card Padding
padding: '1.5rem',        // 24px

// Grid Gap
gap: '1rem',              // 16px

// Section Gap
gap: '1.5rem',            // 24px
```

### Border Radius

```typescript
// Cards
borderRadius: '12px',

// Buttons/Inputs
borderRadius: '8px',

// Pills/Badges
borderRadius: '9999px',
```

---

## Dark Mode Support

All components support dark mode using centralized theme tokens from `@/lib/theme.ts`:

```typescript
// Light Mode
pageBackground: '#FFF4E1'
cardBackground: '#FFFFFF'
textPrimary: '#1A312C'
textSecondary: '#4B5563'
border: '#E5E7EB'
accent: '#428475'

// Dark Mode
pageBackground: '#0F1116'
cardBackground: '#1C1F28'
textPrimary: '#F9FAFB'
textSecondary: '#9CA3AF'
border: '#2A2E39'
accent: '#3ED98A'
```

---

## Testing Strategy

### Unit Tests

Each component should have corresponding `.test.tsx` files:

- `DashboardHeader.test.tsx`
- `MetricCard.test.tsx`
- `ElectricalMetricsGrid.test.tsx`
- `SystemStatusCard.new.test.tsx`
- `StatusIndicator.test.tsx`
- `SensorNodesEmptyState.test.tsx`

### Test Coverage

- Props rendering
- Empty states
- Loading states
- Responsive behavior
- Dark mode
- Accessibility (WCAG AA)

---

## Usage Examples

### Complete Dashboard Layout

```tsx
import {
  DashboardHeader,
  ElectricalMetricsGrid,
  StepActivityCard,
  SystemStatusCardNew,
  SensorNodesEmptyState,
} from '@/features/dashboard/components';

function DashboardPage() {
  const { lastReading } = useLiveSensorData();
  const { data: metrics } = useDashboardMetrics();
  
  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="EcoStep Central"
        subtitle="Real-time energy, activity, system monitoring"
        systemStatus={lastReading ? 'connected' : 'disconnected'}
        alertsCount={3}
        isPublicUser={false}
        onAlertsClick={() => navigate('/alerts')}
      />
      
      <ElectricalMetricsGrid
        voltage={lastReading?.voltage}
        current={lastReading?.current}
        power={lastReading?.power}
        energy={metrics?.dailyEnergy}
      />
      
      <StepActivityCard
        stepCount={lastReading?.stepCount}
        hasData={!!lastReading}
      />
      
      <SystemStatusCardNew
        wifi={lastReading?.wifiConnected}
        bluetooth={lastReading?.bluetoothConnected}
        dataTimestamp={lastReading?.timestamp}
        hasData={!!lastReading}
      />
      
      {!lastReading && <SensorNodesEmptyState />}
    </div>
  );
}
```

---

## Implementation Status

✅ Task 1: Core component structure and interfaces (COMPLETE)
- All TypeScript interfaces defined
- Component files created with proper structure
- Barrel exports configured in index.ts
- Documentation complete

**Next Tasks:**
- Task 2: Implement DashboardHeader component
- Task 3: Implement MetricCard component
- Task 4: Implement ElectricalMetricsGrid component
- Task 5: Implement StatusIndicator and SystemStatusCard
- Task 6: Refactor StepActivityCard styling
- Task 7: Create SensorNodesEmptyState component

---

## Related Files

- **Types:** `../types/dashboard.types.ts`
- **Hooks:** `../hooks/useDashboardMetrics.ts`, `../hooks/useLiveSensorData.ts`
- **Pages:** `../pages/DashboardPage.tsx`
- **Theme:** `@/lib/theme.ts`

---

## Notes

- **No Backend Changes:** All modifications are frontend-only (CSS/presentation)
- **Backward Compatibility:** Existing hooks and APIs remain unchanged
- **Code Splitting:** ChartsLayoutContainer is lazy-loaded, excluded from barrel exports
- **Theme System:** Uses centralized theme context from `@/contexts/ThemeContext`
- **Icon Library:** Lucide React (already installed)
- **Real-time Updates:** Via existing WebSocket/polling mechanisms
