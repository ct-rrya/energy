# Hero Dashboard Component Structure

## Overview

This document outlines the component structure for the EcoStep Hero Energy Dashboard redesign. The redesign transforms the equal-weight metric grid into a hero-focused layout with energy output (kWh) as the primary KPI.

## Component Hierarchy

```
DashboardPage (existing, enhanced)
├── DashboardHeader (existing, enhanced with date/time)
├── HeroSection (NEW)
│   └── HeroEnergyCard (NEW)
│       ├── EnergyValueDisplay (internal)
│       ├── TrendIndicator (NEW)
│       ├── MiniTrendGraph (NEW)
│       └── AIInsightSection (NEW)
└── MetricsColumn (NEW)
    ├── MetricCard (existing, reused)
    │   ├── VoltageMetric
    │   ├── PowerMetric
    │   ├── CurrentMetric
    │   └── StepCountMetric
```

## Component Files

### Core Components

1. **HeroEnergyCard.tsx**
   - Primary KPI display component
   - Occupies 60-65% of dashboard width
   - Displays energy value, trend, graph, and insights
   - Implements: Requirements 3.1-3.9, 4.1-4.7, 5.1-5.8, 6.1-6.8

2. **TrendIndicator.tsx**
   - Color-coded percentage change display
   - Shows comparison vs. yesterday
   - Implements: Requirements 4.1-4.7

3. **MiniTrendGraph.tsx**
   - Compact 24-hour sparkline visualization
   - Uses Recharts for rendering
   - Implements: Requirements 5.1-5.8

4. **AIInsightSection.tsx**
   - Executive summary text display
   - Shows AI-generated pattern insights
   - Implements: Requirements 6.1-6.8

5. **MetricsColumn.tsx**
   - Container for 4 stacked metric cards
   - Implements: Requirements 7.1-7.7

6. **HeroCardSkeleton.tsx**
   - Loading skeleton for hero card
   - Shimmer animation
   - Implements: Requirements 17.3, 20.1

### Existing Components (Reused)

1. **MetricCard.tsx** (Enhanced)
   - Individual metric display
   - Used for Voltage, Power, Current, Step Count
   - Already implements data-first visual hierarchy

2. **DashboardHeader.tsx** (To be enhanced)
   - Will add date/time display
   - Will add system status badge
   - Will add WebSocket connection indicator

## Type Definitions

### hero-dashboard.types.ts

Core type definitions for the hero dashboard components:

- `TrendDataPoint` - Data point for trend graph
- `ValidationRange` - Range validation config
- `ValidationResult` - Validation check result
- `TrendDirection` - Trend direction enum
- `TrendCalculation` - Complete trend analysis result
- `EnhancedDashboardMetrics` - Extended metrics with hero data
- `SystemStatusType` - System status enum
- `HeroEnergyCardProps` - Hero card component props
- `TrendIndicatorProps` - Trend indicator props
- `MiniTrendGraphProps` - Mini graph props
- `AIInsightSectionProps` - AI insight props
- `MetricsColumnProps` - Metrics column props
- `EnhancedDashboardHeaderProps` - Enhanced header props
- `LastKnownGoodData` - Cached data interface

### validation.types.ts

Validation utility types:

- `SensorFieldName` - Valid sensor field names
- `VALIDATION_RANGES` - Predefined validation ranges
- `ValidatableData` - Generic validatable data interface

## Utility Functions

### validateSensorData.ts

Data validation utilities:

- `validateSensorReading(reading)` - Validates sensor reading
- `validateMetrics(metrics)` - Validates dashboard metrics
- `validateField(field, value)` - Validates single field

### calculateTrend.ts

Trend calculation utilities:

- `calculateTrend(current, previous)` - Calculates trend direction and percentage
- `formatTrendLabel(direction, percentage)` - Formats trend label
- `getTrendColor(direction)` - Returns trend color

## Validation Ranges

Based on Requirements 16.7-16.10, 17.6:

| Field        | Min | Max       | Unit |
|--------------|-----|-----------|------|
| voltage      | 0   | 500       | V    |
| current      | 0   | 100       | A    |
| power        | 0   | 50,000    | W    |
| stepCount    | 0   | 1,000,000 | -    |
| dailyEnergy  | 0   | 1,000     | kWh  |

## Color System

### Primary Colors

- **Accent Green**: `#3ED98A` - Energy, Voltage, Steps
- **Amber**: `#F59E0B` - Power, Warnings
- **Blue**: `#3B82F6` - Current
- **Red**: `#EF4444` - Errors, Alerts

### Trend Colors

- **Up (Positive)**: `#3ED98A` (Green)
- **Down (Negative)**: `#F59E0B` (Amber)
- **Neutral/No Data**: `#9CA3AF` (Gray)

## Typography Scale

### Hero Energy Display

| Viewport | Value  | Unit   | Label |
|----------|--------|--------|-------|
| Mobile   | 36-48px| 20px   | 12px  |
| Tablet   | 48-56px| 26px   | 13px  |
| Desktop  | 56-72px| 32px   | 13px  |

### Metric Card Display

| Viewport | Value | Unit | Label |
|----------|-------|------|-------|
| Mobile   | 28px  | 16px | 13px  |
| Tablet   | 32px  | 17px | 13px  |
| Desktop  | 36px  | 18px | 13px  |

## Layout Specifications

### Desktop (≥1024px)
- Hero Card: 60-65% width (prefer 65%)
- Metrics Column: 35-40% width (prefer 35%)
- Horizontal gap: 24px
- Max width: 1600px

### Tablet (768-1023px)
- Hero Card: 100% width
- Metrics: 2x2 grid below hero
- Grid gap: 16px

### Mobile (<768px)
- All components stacked vertically
- Full width cards
- Vertical gap: 16px

## Performance Optimizations

All components implement:

1. **React.memo** - Prevent unnecessary re-renders
2. **useMemo** - Memoize computed values
3. **useCallback** - Memoize event handlers
4. **CSS Containment** - `contain: layout style`
5. **Lazy Loading** - MiniTrendGraph lazy loaded

## Implementation Status

- [x] Type definitions created
- [x] Component files created with empty declarations
- [x] Utility function signatures defined
- [x] Validation ranges defined
- [x] Component documentation written
- [ ] Component implementations (subsequent tasks)
- [ ] Unit tests (subsequent tasks)
- [ ] Integration with DashboardPage (subsequent tasks)

## Next Steps

1. Task 2: Implement data validation and caching utilities
2. Task 3: Build TrendIndicator component
3. Task 4: Build MiniTrendGraph component
4. Task 5: Build AIInsightSection component
5. Task 6: Build HeroEnergyCard component
6. Task 7: Enhance MetricCard component
7. Task 8: Build MetricsColumn component
8. Task 9: Enhance DashboardHeader component
9. Task 10: Implement enhanced data hooks
10. Task 12: Integrate components into DashboardPage

## References

- Design Document: `.kiro/specs/ecostep-hero-energy-dashboard/design.md`
- Requirements Document: `.kiro/specs/ecostep-hero-energy-dashboard/requirements.md`
- Tasks Document: `.kiro/specs/ecostep-hero-energy-dashboard/tasks.md`
