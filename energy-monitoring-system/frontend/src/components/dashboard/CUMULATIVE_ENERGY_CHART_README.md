# CumulativeEnergyChart Component

## Overview

The `CumulativeEnergyChart` component displays cumulative energy harvested over time as an area chart with gradient fill. It visualizes the total accumulated energy from piezoelectric floor tiles over a configurable time period (default: 30 days).

## Implementation Status

✅ **Completed** - All subtasks implemented and verified

## Features

### Core Functionality
- ✅ Displays cumulative energy generation over time
- ✅ Fetches energy time-series data from Analytics API
- ✅ Calculates cumulative values by summing all previous data points
- ✅ Shows total cumulative energy in subtitle
- ✅ Real-time updates via WebSocket integration
- ✅ Automatic recalculation when new data arrives

### Visual Design
- ✅ Area chart with gradient fill (Fresh Mint #89D7B7 to transparent)
- ✅ Theme-aware colors (light/dark mode support)
- ✅ Responsive layout with glassmorphic card styling
- ✅ Smooth curve line with 2px stroke width
- ✅ Grid lines with theme-appropriate opacity
- ✅ Custom tooltip with formatted values and timestamps

### User Experience
- ✅ Loading skeleton during data fetch
- ✅ Empty state message when no data available
- ✅ Error state with retry button
- ✅ Smooth transitions between states
- ✅ Configurable time period (daysToShow prop)

## Usage

```tsx
import { CumulativeEnergyChart } from '@/components/dashboard';

// Default usage (30 days)
<CumulativeEnergyChart />

// Custom time period (14 days)
<CumulativeEnergyChart daysToShow={14} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Optional CSS class name for custom styling |
| `daysToShow` | `number` | `30` | Number of days to display |

## Requirements Mapping

### Requirement 5: Cumulative Energy Generated Chart

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| 5.1: Render as AreaChart | ✅ | Uses Recharts `<AreaChart>` component |
| 5.2: Fetch energy data | ✅ | Uses `useTimeSeriesData` hook with `metric='energy'` |
| 5.3: Calculate cumulative values | ✅ | Uses `calculateCumulative` utility function |
| 5.4: Display cumulative energy (kWh) | ✅ | Y-axis label: "Cumulative Energy (kWh)" |
| 5.5: Display timestamps | ✅ | X-axis with date formatting |
| 5.6: Last 30 days, daily granularity | ✅ | Default time range with `granularity='day'` |
| 5.7: Gradient fill | ✅ | LinearGradient from #89D7B7 to transparent |
| 5.8: Display total cumulative value | ✅ | Shown in subtitle with unit formatting |
| 5.9: TanStack Query caching | ✅ | Leverages `useTimeSeriesData` hook |
| 5.10: Recalculate on new data | ✅ | `useMemo` recalculates when data changes |
| 11.3: Theme-appropriate colors | ✅ | Uses ThemeContext for light/dark modes |

## Component Structure

```
CumulativeEnergyChart
├── useTheme() - Theme context for colors
├── useChartRealTimeUpdates() - WebSocket integration
├── useTimeSeriesData() - Data fetching
│   ├── metric: 'energy'
│   ├── granularity: 'day'
│   └── Date range: last N days
├── transformToChartData() - Convert API response
├── calculateCumulative() - Compute cumulative values
└── ChartContainer
    └── ResponsiveContainer
        └── AreaChart
            ├── Gradient definition (energyGradient)
            ├── CartesianGrid
            ├── XAxis (date formatting)
            ├── YAxis (Cumulative Energy kWh)
            ├── Tooltip (CustomChartTooltip)
            └── Area (monotone curve with gradient fill)
```

## Data Flow

1. **Component Mounts**
   - Subscribe to real-time updates (`useChartRealTimeUpdates`)
   - Calculate date range (last N days)
   - Fetch energy data via `useTimeSeriesData`

2. **Data Processing**
   - Transform API response to chart format (`transformToChartData`)
   - Calculate cumulative values (`calculateCumulative`)
   - Calculate total (latest data point value)
   - Generate subtitle with total

3. **Rendering**
   - Determine chart state (loading/error/empty/data)
   - Render appropriate UI via `ChartContainer`
   - Display area chart with gradient fill

4. **Real-Time Updates**
   - WebSocket event triggers cache invalidation
   - TanStack Query refetches data
   - Component recalculates cumulative values
   - Chart updates with new data

## Cumulative Calculation Algorithm

The cumulative calculation transforms a sequence of energy values into cumulative totals:

**Input:** `[10, 15, 20, 5, 12]` kWh

**Output:** `[10, 25, 45, 50, 62]` kWh

**Logic:**
```typescript
let cumulative = 0;
return dataPoints.map((point) => {
  cumulative += point.value;
  return { ...point, value: cumulative };
});
```

Each point represents the sum of all energy values from the start up to that point.

## Testing

Comprehensive test suite with 15 tests covering:

- ✅ Component rendering with various props
- ✅ Cumulative calculation correctness
- ✅ Loading, error, and empty states
- ✅ Real-time updates integration
- ✅ Data fetching with correct parameters
- ✅ Theme integration

**Run tests:**
```bash
npm test -- CumulativeEnergyChart.test.tsx --run
```

**Test Results:** 15/15 passed ✅

## Build Verification

- ✅ TypeScript compilation: No errors
- ✅ ESLint: No errors or warnings
- ✅ Vite build: Success
- ✅ Unit tests: 15/15 passed
- ✅ Exports: Added to barrel export in `index.ts`

## Integration

The component is ready for integration into the Dashboard page via `ChartsLayoutContainer`:

```tsx
import { CumulativeEnergyChart } from '@/components/dashboard';

// In ChartsLayoutContainer.tsx
<div className="space-y-6">
  <PowerGenerationChart />
  <VoltageCurrentChart />
  <EnergyPeriodChart />
  <CumulativeEnergyChart />  {/* New component */}
</div>
```

## Color Palette

Following EcoStep Design System:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Line Stroke | #89D7B7 (Fresh Mint) | #89D7B7 (Fresh Mint) |
| Gradient Start | #89D7B7 @ 80% opacity | #89D7B7 @ 80% opacity |
| Gradient End | #89D7B7 @ 10% opacity | #89D7B7 @ 10% opacity |
| Grid Lines | rgba(26,49,44,0.1) | rgba(42,46,55,0.3) |
| Text | #1A312C (Deep Forest) | #9CA3AF (Gray) |

## Performance Optimizations

- ✅ `useMemo` for cumulative calculation (only recalculates when data changes)
- ✅ `useMemo` for chart data transformation
- ✅ `useMemo` for total cumulative value
- ✅ `useMemo` for subtitle generation
- ✅ TanStack Query caching with 5-minute stale time
- ✅ Data point limiting via chartUtils (prevents performance issues)

## Accessibility

- ✅ Semantic HTML structure
- ✅ Proper ARIA labels for chart title
- ✅ Keyboard-accessible retry button in error state
- ✅ Theme-aware colors with sufficient contrast
- ✅ Descriptive subtitle with total value and time range

## Next Steps

1. Integration into `ChartsLayoutContainer` (Task 7 in spec)
2. Visual QA testing in both light and dark themes
3. Cross-browser testing (Chrome, Firefox, Safari, Edge)
4. Mobile responsive testing
5. User acceptance testing

## Files Created

1. ✅ `CumulativeEnergyChart.tsx` - Main component
2. ✅ `CumulativeEnergyChart.test.tsx` - Test suite
3. ✅ `CumulativeEnergyChart.demo.tsx` - Demo component (optional)
4. ✅ Updated `index.ts` - Barrel export

## Dependencies

- React & React Hooks
- Recharts (AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip)
- TanStack Query (@tanstack/react-query)
- date-fns (date manipulation)
- ThemeContext (light/dark mode)
- SocketContext (WebSocket integration)
- chartUtils (data transformation, cumulative calculation)
- ChartContainer (shared wrapper)
- CustomChartTooltip (custom tooltip styling)

---

**Status:** ✅ Complete and ready for integration
**Last Updated:** 2024-01-16
**Author:** Kiro AI Development Team
