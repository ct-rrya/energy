# Design Document: EcoStep Central Dashboard Redesign

## Overview

This design document specifies the technical architecture for redesigning the EcoStep Central Dashboard to align with the refined visual design system. The redesign focuses on **CSS and presentation only**—no backend, API, or data handling changes. The goal is to transform the current dashboard into a deliberately designed, production-grade technical monitoring interface with strong visual hierarchy and data-first presentation.

### Design Goals

1. **Data-First Hierarchy**: Make numeric values the visual hero with large, bold typography
2. **Clear Information Architecture**: Three distinct sections with focused purposes
3. **Separation of Concerns**: Keep real-time monitoring (Dashboard) distinct from historical analysis (Analytics)
4. **Responsive Excellence**: Graceful degradation from desktop → tablet → mobile
5. **Performance**: Optimize rendering with lazy loading and efficient CSS
6. **Backward Compatibility**: Zero changes to backend APIs or data structures

### Scope

**In Scope:**
- Dashboard page layout restructuring
- Component refactoring and creation
- CSS styling updates per design system
- Responsive breakpoint implementation
- Empty state handling
- Dark mode consistency

**Out of Scope:**
- Backend API modifications
- WebSocket/polling logic changes
- New data endpoints
- Business logic changes
- Analytics page modifications (separate spec)

---

## Architecture

### Component Hierarchy

```
DashboardPage (Container)
├── PublicUserBanner (conditional)
├── DashboardHeader (new)
│   ├── Title + Status Indicator
│   └── QuickActions (Alerts button)
├── ElectricalMetricsGrid (refactored)
│   ├── MetricCard (Voltage)
│   ├── MetricCard (Current)
│   ├── MetricCard (Power)
│   └── MetricCard (Energy Today)
├── StepActivityCard (existing, repositioned)
├── SystemStatusCard (refactored)
│   ├── StatusIndicator (Wi-Fi)
│   ├── StatusIndicator (Bluetooth)
│   └── StatusIndicator (Data Transfer)
└── EmptyStatesContainer (conditional)
    └── SensorNodesEmptyState
```

### Layout Strategy

**Three-Section Architecture:**

1. **Hero Section**: Electrical Metrics Grid (4 metric cards)
   - Primary visual weight
   - Largest typography (36-48px numerics)
   - High-contrast accent colors
   - Priority: Voltage, Current, Power, Energy

2. **Supporting Section**: Step Activity Card
   - Single card, left-aligned, max-width constraint
   - Secondary importance
   - Moderate typography (24-32px)

3. **System Section**: System Status Card
   - Tertiary importance
   - Informational indicators
   - Subtle colors, small typography (14px)

**Removed from Dashboard:**
- Historical charts (moved to Analytics tab)
- Sensor node list (replaced with empty state until data available)
- Quick actions grid (consolidated to single Alerts button)

### Page Layout Structure

```
┌─────────────────────────────────────────────────┐
│ [Public User Banner] (conditional)              │
├─────────────────────────────────────────────────┤
│ EcoStep Central                        [Alerts] │
│ Real-time energy, activity, system monitoring   │
├─────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ V   │ │ A   │ │ W   │ │ kWh │  (4-col grid) │
│ │230.2│ │12.45│ │2867 │ │3.42 │               │
│ └─────┘ └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────────────┤
│ ┌───────────────────┐                          │
│ │ 👟 Steps: 8,247   │  (single card, narrow)  │
│ └───────────────────┘                          │
├─────────────────────────────────────────────────┤
│ System Status                                   │
│ ● Wi-Fi      ● Bluetooth      ● Data Transfer  │
└─────────────────────────────────────────────────┘
```

### Data Flow

**No Changes to Data Layer:**
- Existing hooks remain unchanged: `useDashboardMetrics()`, `useSystemHealth()`, `useLiveSensorData()`
- Existing WebSocket/polling mechanisms preserved
- API contracts unchanged

**Component Data Mapping:**
```typescript
// ElectricalMetricsGrid receives:
{
  voltage: lastReading?.voltage,
  current: lastReading?.current,
  power: lastReading?.power,
  energy: metrics?.dailyEnergy
}

// StepActivityCard receives:
{
  stepCount: lastReading?.stepCount,
  hasData: !!lastReading
}

// SystemStatusCard receives:
{
  wifi: lastReading?.wifiConnected,
  bluetooth: lastReading?.bluetoothConnected,
  dataTimestamp: lastReading?.timestamp,
  hasData: !!lastReading
}
```

---

## Components and Interfaces

### New Components

#### 1. DashboardHeader

**Purpose:** Consolidated page title, status indicator, and quick actions

**File:** `frontend/src/features/dashboard/components/DashboardHeader.tsx`

**Props:**
```typescript
interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  systemStatus: 'connected' | 'disconnected' | 'unknown';
  alertsCount: number;
  isPublicUser: boolean;
  onAlertsClick: () => void;
}
```

**Structure:**
```tsx
<header className="dashboard-header">
  <div className="header-content">
    <h1 className="eco-page-title">{title}</h1>
    <div className="status-row">
      <StatusDot status={systemStatus} />
      <p className="eco-text-secondary">{subtitle}</p>
    </div>
  </div>
  <button 
    className="eco-btn-secondary"
    onClick={onAlertsClick}
    disabled={isPublicUser}
  >
    <Bell />
    Alerts
    {alertsCount > 0 && <Badge count={alertsCount} />}
  </button>
</header>
```

**Styling:**
- Flexbox layout: `space-between` on desktop, `column` on mobile
- Status dot: 8px circle, accent color
- Button: Secondary style from design system
- Responsive: Stack vertically on mobile (<640px)

#### 2. ElectricalMetricsGrid

**Purpose:** Hero section showcasing primary electrical metrics

**File:** `frontend/src/features/dashboard/components/ElectricalMetricsGrid.tsx`

**Props:**
```typescript
interface ElectricalMetricsGridProps {
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  isLoading?: boolean;
}
```

**Structure:**
```tsx
<div className="metrics-grid">
  <MetricCard
    label="Voltage"
    value={voltage}
    unit="V"
    precision={1}
    color="accent" // EcoStep green
    icon={<Zap size={16} />}
  />
  <MetricCard
    label="Current"
    value={current}
    unit="A"
    precision={2}
    color="amber"
    icon={<Activity size={16} />}
  />
  <MetricCard
    label="Power"
    value={power}
    unit="W"
    precision={1}
    color="blue"
    icon={<Zap size={16} />}
  />
  <MetricCard
    label="Energy Today"
    value={energy}
    unit="kWh"
    precision={2}
    color="amber"
    icon={<TrendingUp size={16} />}
  />
</div>
```

**Grid Behavior:**
- Desktop (≥1024px): 4 columns, equal width
- Tablet (640-1023px): 2 columns, 2 rows
- Mobile (<640px): 1 column, stacked

**Styling:**
```css
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem; /* 16px */
  
  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }
}
```

#### 3. MetricCard (refactored)

**Purpose:** Individual metric display with data-first hierarchy

**File:** `frontend/src/features/dashboard/components/MetricCard.tsx`

**Props:**
```typescript
interface MetricCardProps {
  label: string;
  value: number | undefined;
  unit: string;
  precision: number;
  color: 'accent' | 'amber' | 'blue' | 'red';
  icon?: React.ReactNode;
  isLoading?: boolean;
}
```

**Visual Hierarchy:**
```
┌─────────────────────┐
│ VOLTAGE        [⚡] │ ← Label (13px uppercase, secondary color)
│                     │
│ 230.2 V            │ ← Value (36px bold tabular, accent color) + Unit (18px)
└─────────────────────┘
```

**Typography:**
- Label: 13px, font-weight: 500, uppercase, letter-spacing: 0.05em, secondary text color
- Value: 36px, font-weight: 600, tabular-nums, accent color
- Unit: 18px, font-weight: 400, secondary text color, inline with value
- Icon: 16px, inline with label, same color as label

**Styling:**
```css
.metric-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: opacity 200ms;
  
  &:hover {
    opacity: 0.95;
  }
}

.metric-label {
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2.25rem; /* 36px */
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.metric-unit {
  font-size: 1.125rem; /* 18px */
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 0.25rem;
}
```

**Color Mapping:**
- `accent`: `#3DDC97` (light) / `#3ED98A` (dark) - EcoStep green
- `amber`: `#F59E0B` - Warning/energy color
- `blue`: `#3B82F6` - Info color
- `red`: `#EF4444` - Error/alert color

**Empty State:**
- Display `0.0` or `0.00` based on precision
- Reduce opacity to 0.5
- Show "Waiting for data" tooltip on hover

#### 4. SystemStatusCard (refactored)

**Purpose:** Consolidated system health indicators

**File:** `frontend/src/features/dashboard/components/SystemStatusCard.tsx`

**Props:**
```typescript
interface SystemStatusCardProps {
  wifi: boolean | undefined;
  bluetooth: boolean | undefined;
  dataTimestamp: string | undefined;
  hasData: boolean;
}
```

**Structure:**
```tsx
<div className="system-status-card">
  <h3 className="card-title">System Status</h3>
  <div className="status-grid">
    <StatusIndicator
      label="Wi-Fi"
      status={wifi === true ? 'connected' : wifi === false ? 'disconnected' : 'unknown'}
    />
    <StatusIndicator
      label="Bluetooth"
      status={bluetooth === true ? 'connected' : bluetooth === false ? 'disconnected' : 'unknown'}
    />
    <StatusIndicator
      label="Data Transfer"
      status={hasData ? 'active' : 'waiting'}
      timestamp={dataTimestamp}
    />
  </div>
</div>
```

**Grid Layout:**
- Desktop: 3 columns
- Mobile: 1 column stacked

**StatusIndicator Structure:**
```tsx
<div className="status-indicator">
  <StatusDot status={status} />
  <div className="status-content">
    <p className="status-label">{label}</p>
    <p className="status-value">{displayValue}</p>
    {timestamp && <p className="status-timestamp">Last: {formatTime(timestamp)}</p>}
  </div>
</div>
```

**Status Dot Colors:**
- `connected` / `active`: Accent green with pulse animation
- `disconnected` / `error`: Red `#EF4444`
- `unknown` / `waiting`: Secondary gray

#### 5. SensorNodesEmptyState

**Purpose:** Inform users when no sensor data is available

**File:** `frontend/src/features/dashboard/components/SensorNodesEmptyState.tsx`

**Props:**
```typescript
interface SensorNodesEmptyStateProps {
  className?: string;
}
```

**Structure:**
```tsx
<div className="empty-state-container">
  <div className="empty-state-icon">
    <Activity size={32} />
  </div>
  <h4 className="empty-state-title">No sensor data available</h4>
  <p className="empty-state-description">
    Waiting for sensor data. Connect ESP32 sensors to view real-time node status and readings.
  </p>
</div>
```

**Styling:**
- Icon: 64px circle, muted background, centered
- Title: 16px, font-weight: 600
- Description: 14px, secondary color, max-width: 420px, centered
- Vertical padding: 3rem top/bottom

### Refactored Components

#### StepActivityCard

**Current:** Positioned in supporting section, single column

**Changes:**
- Add max-width constraint: `400px`
- Maintain existing data structure
- Update styling to match MetricCard visual hierarchy
- Label: "Step Activity" (13px uppercase)
- Value: Step count (32px bold tabular)
- Icon: Inline with label (16px)

**File:** `frontend/src/features/dashboard/components/StepActivityCard.tsx` (existing, styled update only)

#### ChartsLayoutContainer

**Status:** Removed from Dashboard, remains in Analytics page

**Reason:** Dashboard focuses on real-time metrics only; historical charts belong in Analytics

#### LiveSensorCard

**Status:** Removed from Dashboard

**Reason:** Dashboard shows aggregated metrics; individual sensor nodes are not primary concern

### Removed Components

1. **QuickActionsCard** - Consolidated to single Alerts button in header
2. **RecentActivityCard** - Not relevant for real-time monitoring focus
3. **Featured Power Output Card** - Redundant with Power metric in grid

---

## Data Models

### No New Data Models

All existing data structures remain unchanged. Components consume existing hooks and data types.

**Existing Data Sources:**
```typescript
// From useDashboardMetrics()
interface DashboardMetrics {
  dailyEnergy: number;
  weeklyEnergy: number;
  monthlyEnergy: number;
  // ... other metrics
}

// From useLiveSensorData()
interface SensorReading {
  voltage: number;
  current: number;
  power: number;
  stepCount: number;
  wifiConnected: boolean;
  bluetoothConnected: boolean;
  timestamp: string;
}

// From useSystemHealth()
interface SystemHealth {
  database: 'connected' | 'disconnected';
  api: 'healthy' | 'unhealthy';
}
```

---

## Responsive Design Strategy

### Breakpoints

Following Tailwind CSS conventions:
```typescript
const BREAKPOINTS = {
  mobile: '0-639px',      // Single column, stacked
  tablet: '640-1023px',   // 2-column grid for metrics
  desktop: '1024px+',     // Full 4-column layout
};
```

### Layout Transformations

#### Desktop (≥1024px)
```
┌──────────────────────────────────────────────┐
│ Header (flex-row, space-between)             │
├──────────────────────────────────────────────┤
│ [V] [A] [W] [kWh]  (4-col grid, equal width)│
├──────────────────────────────────────────────┤
│ [Steps]  (max-width: 400px, left-aligned)   │
├──────────────────────────────────────────────┤
│ [Wi-Fi] [BT] [Data]  (3-col grid)           │
└──────────────────────────────────────────────┘
```

#### Tablet (640-1023px)
```
┌────────────────────────────┐
│ Header (flex-col, stacked) │
├────────────────────────────┤
│ [V] [A]  (2-col grid)     │
│ [W] [kWh]                 │
├────────────────────────────┤
│ [Steps] (full-width)      │
├────────────────────────────┤
│ [Wi-Fi]                   │
│ [Bluetooth]               │
│ [Data Transfer]           │
└────────────────────────────┘
```

#### Mobile (<640px)
```
┌──────────────┐
│ Header       │
│ (stacked)    │
├──────────────┤
│ [Voltage]    │
│ [Current]    │
│ [Power]      │
│ [Energy]     │
├──────────────┤
│ [Steps]      │
├──────────────┤
│ [Wi-Fi]      │
│ [Bluetooth]  │
│ [Data Trans] │
└──────────────┘
```

### Typography Scaling

Metric values scale down on smaller screens:
- Desktop: 36px
- Tablet: 32px
- Mobile: 28px

Labels remain consistent: 13px all breakpoints

### Touch Targets

All interactive elements meet 44x44px minimum:
- Buttons: 44px height minimum
- Cards: Entire card is tappable (no specific target needed)
- Alerts badge: 48x48px effective touch area

---

## Testing Strategy

### Unit Tests

**Component Rendering Tests:**
```typescript
// MetricCard.test.tsx
describe('MetricCard', () => {
  it('renders numeric value with correct precision', () => {
    render(<MetricCard value={230.234} precision={1} unit="V" />);
    expect(screen.getByText('230.2')).toBeInTheDocument();
  });
  
  it('applies tabular-nums font variant', () => {
    const { container } = render(<MetricCard value={100} />);
    const valueElement = container.querySelector('.metric-value');
    expect(valueElement).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });
  
  it('displays empty state when value is undefined', () => {
    render(<MetricCard value={undefined} precision={2} />);
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });
});

// ElectricalMetricsGrid.test.tsx
describe('ElectricalMetricsGrid', () => {
  it('renders all four metrics in correct order', () => {
    render(<ElectricalMetricsGrid voltage={230} current={10} power={2300} energy={5.5} />);
    const labels = screen.getAllByRole('heading', { level: 3 });
    expect(labels.map(l => l.textContent)).toEqual(['VOLTAGE', 'CURRENT', 'POWER', 'ENERGY TODAY']);
  });
  
  it('applies correct color to each metric', () => {
    const { container } = render(<ElectricalMetricsGrid voltage={230} />);
    const voltageValue = container.querySelector('[data-testid="voltage-value"]');
    expect(voltageValue).toHaveStyle({ color: expect.stringContaining('3DDC97') });
  });
});

// SystemStatusCard.test.tsx
describe('SystemStatusCard', () => {
  it('shows connected status when wifi is true', () => {
    render(<SystemStatusCard wifi={true} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
  
  it('shows disconnected status when bluetooth is false', () => {
    render(<SystemStatusCard bluetooth={false} />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
  
  it('formats timestamp correctly', () => {
    const timestamp = '2024-01-15T10:30:00Z';
    render(<SystemStatusCard dataTimestamp={timestamp} hasData={true} />);
    expect(screen.getByText(/Last: \d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });
});
```

**Responsive Behavior Tests:**
```typescript
describe('DashboardPage Responsive', () => {
  it('applies 4-column grid on desktop', () => {
    global.innerWidth = 1200;
    const { container } = render(<DashboardPage />);
    const grid = container.querySelector('.metrics-grid');
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(4, 1fr)' });
  });
  
  it('applies 2-column grid on tablet', () => {
    global.innerWidth = 768;
    const { container } = render(<DashboardPage />);
    const grid = container.querySelector('.metrics-grid');
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
  });
  
  it('applies 1-column grid on mobile', () => {
    global.innerWidth = 375;
    const { container } = render(<DashboardPage />);
    const grid = container.querySelector('.metrics-grid');
    expect(grid).toHaveStyle({ gridTemplateColumns: '1fr' });
  });
});
```

**Empty State Tests:**
```typescript
describe('Empty States', () => {
  it('shows empty state when no sensor data', () => {
    render(<SensorNodesEmptyState />);
    expect(screen.getByText('No sensor data available')).toBeInTheDocument();
  });
  
  it('displays waiting message in metric card when value is undefined', () => {
    render(<MetricCard value={undefined} label="Voltage" unit="V" />);
    // Should show 0.0 but with reduced opacity
    const valueElement = screen.getByText('0.0');
    expect(valueElement.closest('.metric-card')).toHaveStyle({ opacity: '0.5' });
  });
});
```

**Accessibility Tests:**
```typescript
describe('Accessibility', () => {
  it('meets WCAG AA contrast requirements', async () => {
    const { container } = render(<MetricCard value={230} label="Voltage" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('provides accessible labels for status indicators', () => {
    render(<SystemStatusCard wifi={true} />);
    expect(screen.getByLabelText(/Wi-Fi.*connected/i)).toBeInTheDocument();
  });
  
  it('disables alerts button with proper aria attributes for public users', () => {
    render(<DashboardHeader isPublicUser={true} />);
    const button = screen.getByRole('button', { name: /alerts/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
```

### Integration Tests

**Data Flow Tests:**
```typescript
describe('Dashboard Data Integration', () => {
  it('updates metrics when sensor data changes', async () => {
    const { rerender } = render(<DashboardPage />);
    
    // Mock initial sensor reading
    mockUseLiveSensorData.mockReturnValue({ 
      lastReading: { voltage: 220, current: 10, power: 2200 } 
    });
    rerender(<DashboardPage />);
    expect(screen.getByText('220.0')).toBeInTheDocument();
    
    // Mock updated sensor reading
    mockUseLiveSensorData.mockReturnValue({ 
      lastReading: { voltage: 230, current: 12, power: 2760 } 
    });
    rerender(<DashboardPage />);
    expect(screen.getByText('230.0')).toBeInTheDocument();
  });
  
  it('preserves filter selection across re-renders', () => {
    const { rerender } = render(<DashboardPage />);
    const filterButton = screen.getByRole('button', { name: /all metrics/i });
    userEvent.click(filterButton);
    userEvent.click(screen.getByText('Power & Energy'));
    
    rerender(<DashboardPage />);
    expect(screen.getByText('Power & Energy')).toBeInTheDocument();
  });
});
```

### Visual Regression Tests

**Snapshot Tests:**
```typescript
describe('Dashboard Visual Snapshots', () => {
  it('matches desktop layout snapshot', () => {
    const { container } = render(<DashboardPage />);
    expect(container).toMatchSnapshot('dashboard-desktop');
  });
  
  it('matches dark mode snapshot', () => {
    const { container } = render(
      <ThemeProvider theme="dark">
        <DashboardPage />
      </ThemeProvider>
    );
    expect(container).toMatchSnapshot('dashboard-dark');
  });
  
  it('matches empty state snapshot', () => {
    mockUseLiveSensorData.mockReturnValue({ lastReading: null });
    const { container } = render(<DashboardPage />);
    expect(container).toMatchSnapshot('dashboard-empty');
  });
});
```

---

## Error Handling

### Data Loading States

**Loading Skeleton:**
- Display pulse animation on metric cards
- Show "Loading..." text in system status
- Maintain layout structure (no layout shift)

**Implementation:**
```tsx
{isLoading ? (
  <div className="metric-card-skeleton">
    <div className="skeleton-label" />
    <div className="skeleton-value" />
  </div>
) : (
  <MetricCard {...props} />
)}
```

### Error States

**Data Fetch Errors:**
- Display error boundary at page level
- Show retry button
- Preserve last known good data

**WebSocket Disconnection:**
- Visual indicator in header (status dot turns red)
- Toast notification: "Connection lost. Reconnecting..."
- Automatic reconnection attempts
- No UI blocking

**Invalid Data:**
- Validate data types before rendering
- Fallback to 0 values with warning icon
- Log errors to console (dev mode)

### Empty Data States

**No Sensor Readings:**
```tsx
<EmptyState
  icon={<Activity />}
  title="Waiting for sensor data"
  description="Connect ESP32 sensors to view real-time metrics."
/>
```

**Partial Data:**
- Render available metrics
- Show placeholder values (0.0) for missing data
- Display "Waiting for data" tooltip

### Graceful Degradation

**Old Browser Support:**
- Fallback fonts for `tabular-nums` if unsupported
- CSS Grid fallback to Flexbox
- No critical dependency on modern features

**Low Bandwidth:**
- Lazy load ChartsLayoutContainer (already implemented)
- Minimize re-renders with React.memo
- Optimize images (SVG icons only)

---

## Performance Optimization

### Code Splitting

**Lazy Loading:**
```tsx
// ChartsLayoutContainer already lazy-loaded in current implementation
const ChartsLayoutContainer = lazy(() => 
  import('../components/ChartsLayoutContainer')
);

// Consider lazy loading for future heavy components
const AdvancedAnalytics = lazy(() => 
  import('../components/AdvancedAnalytics')
);
```

**Bundle Optimization:**
- Tree-shake unused Lucide icons
- Use named imports: `import { Zap, Activity } from 'lucide-react'`
- Avoid importing entire libraries

### Rendering Optimization

**React.memo Usage:**
```tsx
// Memoize metric cards to prevent unnecessary re-renders
export const MetricCard = React.memo(function MetricCard({
  value,
  label,
  unit,
  ...props
}: MetricCardProps) {
  // Component implementation
});

// Memoize system status card (updates less frequently)
export const SystemStatusCard = React.memo(SystemStatusCard);
```

**useMemo for Calculations:**
```tsx
const formattedValue = useMemo(() => {
  if (value === undefined) return precision === 2 ? '0.00' : '0.0';
  return value.toFixed(precision);
}, [value, precision]);
```

**useCallback for Event Handlers:**
```tsx
const handleAlertsClick = useCallback(() => {
  navigate('/alerts');
}, [navigate]);
```

### CSS Performance

**Efficient Selectors:**
```css
/* ✅ Good: Direct class selectors */
.metric-card { }
.metric-value { }

/* ❌ Bad: Deep nesting */
.dashboard .content .grid .card .value { }
```

**CSS Containment:**
```css
.metric-card {
  contain: layout style;
}

.system-status-card {
  contain: layout style paint;
}
```

**GPU Acceleration:**
```css
.status-dot.pulse {
  animation: pulse 2s ease-in-out infinite;
  will-change: opacity;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Data Fetching Optimization

**Existing Hooks Already Optimized:**
- React Query handles caching, deduplication, background refetching
- WebSocket reduces unnecessary HTTP requests

**Additional Considerations:**
```tsx
// Stale-while-revalidate pattern already in place via React Query
const { data: metrics } = useDashboardMetrics({
  staleTime: 30000, // 30 seconds
  cacheTime: 60000, // 1 minute
  refetchInterval: 5000, // Refetch every 5s for real-time updates
});
```

---

## Dark Mode Implementation

### Color Token Mapping

All colors reference centralized theme tokens from `lib/theme.ts`:

```typescript
// Light Mode
pageBackground: '#FFF4E1' (warm cream)
cardBackground: '#FFFFFF'
textPrimary: '#1A312C' (dark green)
textSecondary: '#4B5563' (gray-600)
border: '#E5E7EB' (gray-200)
accent: '#428475' (medium green)

// Dark Mode
pageBackground: '#0F1116' (deep charcoal)
cardBackground: '#1C1F28' (elevated dark)
textPrimary: '#F9FAFB' (near white)
textSecondary: '#9CA3AF' (gray-400)
border: '#2A2E39' (subtle dark border)
accent: '#3ED98A' (light green)
```

### Component-Level Dark Mode

**Using Theme Context:**
```tsx
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

export function MetricCard({ value, label }: MetricCardProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  return (
    <div 
      className="metric-card"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        color: colors.textPrimary
      }}
    >
      {/* Component content */}
    </div>
  );
}
```

**Tailwind Dark Mode Classes:**
```tsx
// Alternative approach using Tailwind
<div className="bg-white dark:bg-[#1C1F28] border border-gray-200 dark:border-[#2A2E39]">
  <span className="text-[#1A312C] dark:text-[#F9FAFB]">Value</span>
</div>
```

### Status Colors in Dark Mode

Status colors remain consistent across themes for semantic clarity:
- Success/Connected: `#10B981` (green) - no change
- Warning: `#F59E0B` (amber) - no change
- Error/Disconnected: `#EF4444` (red) - no change
- Info: `#3B82F6` (blue) - no change

### Border Opacity Adjustments

```css
/* Light Mode */
border: 1px solid rgba(26, 49, 44, 0.08);

/* Dark Mode */
border: 1px solid rgba(137, 215, 183, 0.12);
```

### Testing Dark Mode

```typescript
describe('Dark Mode', () => {
  it('applies dark background colors', () => {
    render(
      <ThemeProvider theme="dark">
        <MetricCard value={230} label="Voltage" />
      </ThemeProvider>
    );
    const card = screen.getByTestId('metric-card');
    expect(card).toHaveStyle({ backgroundColor: '#1C1F28' });
  });
  
  it('maintains visual hierarchy in dark mode', () => {
    const { container } = render(
      <ThemeProvider theme="dark">
        <ElectricalMetricsGrid voltage={230} />
      </ThemeProvider>
    );
    const value = container.querySelector('.metric-value');
    const label = container.querySelector('.metric-label');
    
    // Value should be brighter than label
    expect(getComputedStyle(value).color).toBe('rgb(62, 217, 138)'); // #3ED98A
    expect(getComputedStyle(label).color).toBe('rgb(156, 163, 175)'); // #9CA3AF
  });
});
```

---

## Implementation Plan

### Phase 1: Component Creation (2-3 hours)

**Tasks:**
1. Create `DashboardHeader.tsx` component
2. Create `ElectricalMetricsGrid.tsx` component
3. Refactor `MetricCard.tsx` with new visual hierarchy
4. Create `SystemStatusCard.tsx` component
5. Create `SensorNodesEmptyState.tsx` component

**Deliverable:** New components with TypeScript interfaces, no integration yet

### Phase 2: DashboardPage Refactoring (2-3 hours)

**Tasks:**
1. Remove old components (QuickActionsCard, RecentActivityCard, etc.)
2. Integrate new components into DashboardPage
3. Implement responsive grid layouts
4. Update data flow to new components
5. Remove ChartsLayoutContainer from Dashboard (keep in Analytics)

**Deliverable:** Functional dashboard with new layout, basic styling

### Phase 3: Styling & Polish (3-4 hours)

**Tasks:**
1. Apply design system tokens consistently
2. Implement responsive breakpoints
3. Add hover states and transitions
4. Implement dark mode for all new components
5. Add empty states and loading skeletons
6. Optimize typography (tabular-nums, letter-spacing)

**Deliverable:** Fully styled dashboard matching design system

### Phase 4: Testing & QA (2-3 hours)

**Tasks:**
1. Write unit tests for new components
2. Test responsive behavior across breakpoints
3. Test dark mode consistency
4. Verify accessibility (WCAG AA)
5. Test empty states and error handling
6. Performance testing (lighthouse, render times)

**Deliverable:** Test coverage >80%, passing accessibility audits

### Phase 5: Documentation & Cleanup (1-2 hours)

**Tasks:**
1. Update component documentation
2. Add JSDoc comments to props interfaces
3. Create Storybook stories (if applicable)
4. Update ARCHITECTURE-OVERVIEW.md
5. Remove unused imports and dead code

**Deliverable:** Clean, documented codebase ready for review

---

## File Structure

```
frontend/src/features/dashboard/
├── components/
│   ├── DashboardHeader.tsx               # NEW: Page header with status
│   ├── DashboardHeader.test.tsx          # NEW: Unit tests
│   ├── ElectricalMetricsGrid.tsx         # NEW: Hero metrics grid
│   ├── ElectricalMetricsGrid.test.tsx    # NEW: Unit tests
│   ├── MetricCard.tsx                    # REFACTOR: Data-first styling
│   ├── MetricCard.test.tsx               # UPDATE: New test cases
│   ├── SystemStatusCard.tsx              # REFACTOR: Consolidated status
│   ├── SystemStatusCard.test.tsx         # UPDATE: Updated tests
│   ├── StatusIndicator.tsx               # NEW: Individual status item
│   ├── SensorNodesEmptyState.tsx         # NEW: Empty state component
│   ├── StepActivityCard.tsx              # KEEP: Minor styling updates
│   ├── ChartsLayoutContainer.tsx         # KEEP: Used in Analytics
│   ├── DashboardSkeleton.tsx             # UPDATE: New skeleton structure
│   └── index.ts                          # UPDATE: Export new components
├── pages/
│   ├── DashboardPage.tsx                 # REFACTOR: New layout
│   └── DashboardPage.test.tsx            # UPDATE: Integration tests
├── hooks/
│   ├── useDashboardMetrics.ts            # KEEP: No changes
│   ├── useSystemHealth.ts                # KEEP: No changes
│   └── useLiveSensorData.ts              # KEEP: No changes
└── styles/
    └── dashboard.css                     # UPDATE: New component styles

DELETED FILES:
├── components/
│   ├── QuickActionsCard.tsx              # REMOVE: Replaced by header button
│   ├── RecentActivityCard.tsx            # REMOVE: Not in new design
│   ├── LiveSensorCard.tsx                # REMOVE: Not displayed currently
│   └── PageHeader.tsx                    # REMOVE: Replaced by DashboardHeader
```

---

## Migration Strategy

### Backward Compatibility

**No Breaking Changes:**
- All existing hooks remain unchanged
- API contracts preserved
- Data structures untouched
- Other pages (Analytics, Alerts) unaffected

**Feature Flags (Optional):**
```typescript
// If gradual rollout desired
const ENABLE_NEW_DASHBOARD = import.meta.env.VITE_NEW_DASHBOARD === 'true';

export function DashboardPage() {
  if (!ENABLE_NEW_DASHBOARD) {
    return <LegacyDashboard />;
  }
  return <NewDashboard />;
}
```

### Rollback Plan

**Git Strategy:**
- Create feature branch: `feature/dashboard-redesign`
- Implement all changes in branch
- Merge to main only after full QA

**If Issues Arise:**
```bash
# Revert merge commit
git revert -m 1 <merge-commit-hash>

# Or reset branch
git checkout main
git reset --hard <commit-before-merge>
```

**Database:** No database changes, rollback is instant

---

## Acceptance Criteria Summary

### Functional Requirements

✅ **F1**: Dashboard displays real-time electrical metrics (Voltage, Current, Power, Energy)
✅ **F2**: Dashboard shows step activity as supporting metric
✅ **F3**: Dashboard displays system status (Wi-Fi, Bluetooth, Data Transfer)
✅ **F4**: Dashboard header shows system status indicator and alerts button
✅ **F5**: Alerts button is disabled for public users
✅ **F6**: Empty states displayed when no sensor data available

### Visual Requirements

✅ **V1**: Metric values use large, bold typography (36px)
✅ **V2**: Metric values use tabular numerals for alignment
✅ **V3**: Labels use 13px uppercase with letter-spacing
✅ **V4**: Icons are 16px, inline with labels, not in tiles
✅ **V5**: Status dots use semantic colors (green, red, gray)
✅ **V6**: Cards use solid backgrounds with hairline borders
✅ **V7**: No gradients, glassmorphism, or excessive shadows
✅ **V8**: Border radius: 8-12px for cards, 6-8px for small elements

### Responsive Requirements

✅ **R1**: Desktop (≥1024px): 4-column metrics grid
✅ **R2**: Tablet (640-1023px): 2-column metrics grid
✅ **R3**: Mobile (<640px): Single column, stacked layout
✅ **R4**: Touch targets: Minimum 44x44px
✅ **R5**: Typography scales down on mobile (36px → 28px for values)

### Performance Requirements

✅ **P1**: Lazy load charts container (already implemented)
✅ **P2**: Memoize components to prevent unnecessary re-renders
✅ **P3**: Use CSS containment for layout optimization
✅ **P4**: Bundle size: No increase >10% from current

### Accessibility Requirements

✅ **A1**: WCAG AA contrast ratios maintained
✅ **A2**: Semantic HTML (headers, landmarks)
✅ **A3**: Keyboard navigation support
✅ **A4**: Screen reader labels for status indicators
✅ **A5**: Focus indicators visible without shadows

### Dark Mode Requirements

✅ **D1**: All components support dark mode
✅ **D2**: Dark mode uses theme tokens from `lib/theme.ts`
✅ **D3**: Visual hierarchy maintained in dark mode
✅ **D4**: Status colors remain consistent across themes

---

## Appendix

### Design System Reference

**Colors:**
- Accent: `#3DDC97` (light) / `#3ED98A` (dark)
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

**Typography:**
- Page Title: 32px, font-weight: 700
- Section Title: 20px, font-weight: 600
- Metric Value: 36px, font-weight: 600, tabular-nums
- Metric Label: 13px, font-weight: 500, uppercase

**Spacing:**
- Card Padding: 24px (1.5rem)
- Grid Gap: 16px (1rem)
- Section Gap: 24px (1.5rem)

**Border Radius:**
- Cards: 12px
- Buttons/Inputs: 8px
- Pills: 9999px

### Browser Support

**Target Browsers:**
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Last 2 versions

**Fallbacks:**
- CSS Grid → Flexbox
- Tabular-nums → Monospace font

### Dependencies

**No New Dependencies Required:**
- React: Already installed
- React Router: Already installed
- Lucide React: Already installed (icons)
- Tailwind CSS: Already installed
- React Query: Already installed (data fetching)

### Known Limitations

1. **No Historical Data on Dashboard**: By design, historical charts moved to Analytics
2. **No Sensor Node Details**: Individual sensor cards removed; focus on aggregated metrics
3. **Limited Customization**: Layout is fixed; user cannot rearrange cards (future enhancement)
4. **No Export Function**: Dashboard data cannot be exported (future enhancement)

---

## Conclusion

This design document provides a complete technical specification for redesigning the EcoStep Central Dashboard. The new design prioritizes data-first hierarchy, clean visual presentation, and responsive excellence while maintaining backward compatibility with all existing backend systems.

Key achievements:
- Clear three-section information architecture
- Large, tabular numeric displays for easy scanning
- Separation of real-time (Dashboard) vs. historical (Analytics) data
- Consistent application of design system principles
- Responsive design with graceful degradation
- Full dark mode support
- Zero backend changes required

Implementation can proceed in phases with clear deliverables at each stage, ensuring quality and testability throughout the process.
