# Implementation Plan: Energy Monitoring & Analytics Charts

## Overview

This implementation plan breaks down the Energy Monitoring & Analytics Charts feature into discrete, actionable tasks. The feature adds interactive, real-time data visualizations to the existing EcoStep Dashboard using Recharts, integrating with established patterns for API communication (TanStack Query), real-time updates (WebSocket), theme management, and role-based access control.

**Key Components:**
- 4 chart components (PowerGenerationChart, VoltageCurrentChart, EnergyPeriodChart, CumulativeEnergyChart)
- Shared UI components (ChartContainer, loading/empty/error states)
- 4 custom hooks for data fetching and real-time updates
- Utility functions for data transformation
- Integration with existing Dashboard page
- Full theme support, responsive layout, and accessibility

**Technology Stack:** TypeScript, React, Recharts, TanStack Query, WebSocket

## Tasks

- [x] 1. Set up chart infrastructure and shared components
  - [x] 1.1 Create shared type definitions for charts
    - Create `frontend/src/components/dashboard/chartTypes.ts` with interfaces: `ChartDataPoint`, `TimeFilter`, `PeriodFilter`, `ChartThemeColors`, `CustomTooltipProps`
    - Define type exports for component props and data structures
    - _Requirements: 14.4, 9.8_
  
  - [x] 1.2 Create ChartContainer wrapper component
    - Implement `frontend/src/components/dashboard/ChartContainer.tsx` with props for title, subtitle, loading, error, empty states
    - Integrate ThemeContext for theme-appropriate colors (cardBg, text, border, shadows)
    - Add conditional rendering logic for loading/error/empty/data states
    - Apply EcoStep Design System styling (rounded corners, shadows, spacing)
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8, 11.1, 11.2_
  
  - [x] 1.3 Create ChartLoadingState component
    - Implement `frontend/src/components/dashboard/ChartLoadingState.tsx` with skeleton loader
    - Add animated shimmer effect for loading bars/lines
    - Apply theme-aware colors from ThemeContext
    - Match chart height to prevent layout shift
    - _Requirements: 12.1, 12.5_
  
  - [x] 1.4 Create ChartEmptyState component
    - Implement `frontend/src/components/dashboard/ChartEmptyState.tsx` with icon, message, and suggestion text
    - Use lucide-react ChartNoAxesColumn icon
    - Apply theme-aware text colors
    - Center content and match chart height
    - _Requirements: 12.2, 12.6_
  
  - [x] 1.5 Create ChartErrorState component
    - Implement `frontend/src/components/dashboard/ChartErrorState.tsx` with error icon, message, and retry button
    - Use lucide-react AlertCircle icon
    - Add retry button that calls onRetry callback
    - Apply error accent color (#EF4444) and theme-aware styling
    - _Requirements: 12.3, 12.4, 12.7_
  
  - [x] 1.6 Create CustomChartTooltip component
    - Implement `frontend/src/components/dashboard/CustomChartTooltip.tsx` for Recharts tooltips
    - Format values with appropriate units (W, V, A, kWh)
    - Format timestamps in human-readable format
    - Apply theme-appropriate background and text colors
    - Support multi-value tooltips for charts with multiple metrics
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 1.7 Create chart utility functions
    - Create `frontend/src/components/dashboard/chartUtils.ts` with helper functions
    - Implement `transformToChartData(timeSeries: TimeSeries): ChartDataPoint[]`
    - Implement `calculateCumulative(dataPoints: ChartDataPoint[]): ChartDataPoint[]`
    - Implement `formatChartTimestamp(timestamp: string, granularity: Granularity): string`
    - Implement `limitDataPoints(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[]`
    - _Requirements: 9.7, 14.6_
  
  - [x] 1.8 Create chart components barrel export
    - Create `frontend/src/components/dashboard/index.ts` barrel file
    - Export all chart components, shared UI components, types, and utilities
    - _Requirements: 14.7_

- [x] 2. Implement data fetching hooks
  - [x] 2.1 Create useTimeSeriesData generic hook
    - Implement `frontend/src/features/dashboard/hooks/useTimeSeriesData.ts`
    - Accept params: metric, granularity, startDate, endDate, sensorId (optional), enabled (optional)
    - Use TanStack Query's useQuery with query key: `['analytics', 'time-series', metric, granularity, startDate, endDate, sensorId]`
    - Call `analyticsService.getTimeSeries()` from existing API service
    - Configure staleTime: 60000ms for hourly, 300000ms for daily/weekly/monthly
    - Configure refetchInterval: 60000ms for hourly data, false for others
    - Enable retry with exponential backoff (2 retries, max 5000ms delay)
    - Return: `{ data, isLoading, error, refetch }`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 2.2 Create usePowerGeneration specialized hook
    - Implement `frontend/src/features/dashboard/hooks/usePowerGeneration.ts`
    - Accept timeFilter parameter: 'today' | '7days' | '30days'
    - Use useMemo to calculate startDate, endDate, and granularity based on timeFilter
    - Today: start/end of current day, hourly granularity
    - 7 Days: 7 days ago to now, daily granularity
    - 30 Days: 30 days ago to now, daily granularity
    - Call useTimeSeriesData with metric='power'
    - Use date-fns for date calculations (subDays, startOfDay, endOfDay)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 8.9_
  
  - [x] 2.3 Create useEnergyByPeriod specialized hook
    - Implement `frontend/src/features/dashboard/hooks/useEnergyByPeriod.ts`
    - Accept periodFilter parameter: 'hourly' | 'daily' | 'weekly'
    - Use useMemo to calculate startDate, endDate, and granularity
    - Hourly: last 24 hours, hourly granularity
    - Daily: last 30 days, daily granularity
    - Weekly: last 12 weeks, weekly granularity
    - Call useTimeSeriesData with metric='energy'
    - Use date-fns for date calculations (subHours, subDays, subWeeks)
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 8.9_
  
  - [x] 2.4 Create useChartRealTimeUpdates hook
    - Implement `frontend/src/features/dashboard/hooks/useChartRealTimeUpdates.ts`
    - Use useSocket from SocketContext to access WebSocket connection
    - Use useQueryClient from TanStack Query
    - Listen for 'sensor:reading' events via socket.on()
    - On event: invalidate query keys for power, voltage, current, energy time-series
    - Clean up event listener on unmount with socket.off()
    - Only subscribe if socket is connected
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9_

- [x] 3. Implement PowerGenerationChart component
  - [x] 3.1 Create PowerGenerationChart component structure
    - Create `frontend/src/components/dashboard/PowerGenerationChart.tsx`
    - Define component props interface (className optional)
    - Add state for timeFilter: 'today' | '7days' | '30days' (default: 'today')
    - Create time filter button controls (Today, 7 Days, 30 Days)
    - _Requirements: 2.1, 2.3, 2.13_
  
  - [x] 3.2 Integrate data fetching and rendering
    - Use usePowerGeneration hook with current timeFilter
    - Transform API data to ChartDataPoint format using chartUtils
    - Wrap content in ChartContainer with title "Power Generation Over Time"
    - Pass loading, error, isEmpty states to ChartContainer
    - Position filter buttons in ChartContainer actions slot
    - _Requirements: 2.2, 2.10, 12.8_
  
  - [x] 3.3 Implement Recharts LineChart
    - Use Recharts ResponsiveContainer (width: 100%, height: 400px)
    - Add LineChart with CartesianGrid (strokeDasharray="3 3")
    - Configure XAxis with timestamp, formatted per granularity
    - Configure YAxis with label "Power (W)"
    - Add Line component: type="monotone", stroke=#428475, strokeWidth=2, dot=false, activeDot radius=6
    - Add Tooltip component with CustomChartTooltip
    - Apply theme colors from ThemeContext for grid, axes, text
    - _Requirements: 2.1, 2.7, 2.8, 2.9, 2.12, 11.3, 11.4, 13.1, 13.7_
  
  - [x] 3.4 Integrate real-time updates
    - Call useChartRealTimeUpdates hook in component
    - Verify chart updates when new sensor readings arrive via WebSocket
    - _Requirements: 2.11, 9.7, 9.8_

- [x] 4. Implement VoltageCurrentChart component
  - [x] 4.1 Create VoltageCurrentChart component structure
    - Create `frontend/src/components/dashboard/VoltageCurrentChart.tsx`
    - Define component props interface (className optional)
    - Set up two separate chart containers (voltage and current)
    - _Requirements: 3.1, 3.9_
  
  - [x] 4.2 Fetch voltage and current data
    - Use useTimeSeriesData hook twice: once for voltage, once for current
    - Set metric='voltage' and metric='current'
    - Set granularity='hour', last 24 hours date range
    - Transform both datasets to ChartDataPoint format
    - _Requirements: 3.2, 3.6, 3.10_
  
  - [x] 4.3 Implement voltage LineChart
    - Wrap in ChartContainer with title "Voltage Trend"
    - Use Recharts LineChart with voltage data
    - Configure YAxis with label "Voltage (V)"
    - Use accent color #428475 (Muted Teal) for line
    - Add CustomChartTooltip with unit="V"
    - Apply theme colors
    - _Requirements: 3.3, 3.7, 3.8, 11.3_
  
  - [x] 4.4 Implement current LineChart
    - Wrap in ChartContainer with title "Current Trend"
    - Use Recharts LineChart with current data
    - Configure YAxis with label "Current (A)"
    - Use amber color #F59E0B for line
    - Add CustomChartTooltip with unit="A"
    - Apply theme colors
    - Synchronize X-axis domain with voltage chart
    - _Requirements: 3.4, 3.5, 3.7, 3.8, 11.3_

- [x] 5. Implement EnergyPeriodChart component
  - [x] 5.1 Create EnergyPeriodChart component structure
    - Create `frontend/src/components/dashboard/EnergyPeriodChart.tsx`
    - Define component props interface (className optional)
    - Add state for periodFilter: 'hourly' | 'daily' | 'weekly' (default: 'daily')
    - Create period filter button controls (Hourly, Daily, Weekly)
    - _Requirements: 4.1, 4.3, 4.11_
  
  - [x] 5.2 Integrate data fetching and rendering
    - Use useEnergyByPeriod hook with current periodFilter
    - Transform API data to ChartDataPoint format
    - Wrap content in ChartContainer with title "Energy Generated by Period"
    - Pass loading, error, isEmpty states to ChartContainer
    - Position filter buttons in ChartContainer actions slot
    - _Requirements: 4.2, 4.10_
  
  - [x] 5.3 Implement Recharts BarChart
    - Use Recharts ResponsiveContainer (width: 100%, height: 350px)
    - Add BarChart with CartesianGrid
    - Configure XAxis with period labels
    - Configure YAxis with label "Energy (kWh)"
    - Add Bar component: fill=#89D7B7, radius=[8,8,0,0] (rounded top corners)
    - Add Tooltip component with CustomChartTooltip and unit="kWh"
    - Apply theme colors from ThemeContext
    - _Requirements: 4.1, 4.7, 4.8, 4.9, 11.3_

- [x] 6. Implement CumulativeEnergyChart component
  - [x] 6.1 Create CumulativeEnergyChart component structure
    - Create `frontend/src/components/dashboard/CumulativeEnergyChart.tsx`
    - Define component props interface (className optional)
    - _Requirements: 5.1_
  
  - [x] 6.2 Fetch and transform data to cumulative
    - Use useTimeSeriesData hook with metric='energy', granularity='day', last 30 days
    - Use useMemo to calculate cumulative values: sum energy from all previous points
    - Use calculateCumulative utility function from chartUtils
    - Calculate total cumulative value at latest data point
    - _Requirements: 5.2, 5.3, 5.10_
  
  - [x] 6.3 Implement Recharts AreaChart
    - Use Recharts ResponsiveContainer (width: 100%, height: 350px)
    - Create linearGradient definition for area fill (Fresh Mint #89D7B7 to transparent)
    - Add AreaChart with CartesianGrid
    - Configure XAxis with date formatting
    - Configure YAxis with label "Cumulative Energy (kWh)"
    - Add Area component: type="monotone", stroke=#89D7B7, strokeWidth=2, fill=gradient
    - Add Tooltip component with CustomChartTooltip and unit="kWh"
    - Apply theme colors from ThemeContext
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.9, 11.3_
  
  - [x] 6.4 Display total cumulative value
    - Add subtitle or metric overlay showing total cumulative energy
    - Format value with 2 decimal places and "kWh" unit
    - _Requirements: 5.8_

- [x] 7. Checkpoint - Verify all charts render independently
  - Ensure all four chart components build without TypeScript errors
  - Test each chart component in isolation with mock data
  - Verify loading, empty, and error states display correctly
  - Verify theme colors apply correctly in light and dark modes
  - Ask the user if questions arise

- [x] 8. Create responsive charts layout container
  - [x] 8.1 Create ChartsLayoutContainer component
    - Create `frontend/src/components/dashboard/ChartsLayoutContainer.tsx`
    - Implement responsive CSS Grid layout
    - Desktop (≥1024px): PowerGenerationChart full width, secondary charts 2-column grid (50% each)
    - Tablet (768px-1023px): Adaptive layout based on space
    - Mobile (<768px): All charts stacked single column (100% width)
    - Apply consistent spacing (gap: 1.5rem or 24px)
    - _Requirements: 7.4, 7.5, 7.6, 7.7_
  
  - [x] 8.2 Render all chart components in layout
    - Import PowerGenerationChart, VoltageCurrentChart, EnergyPeriodChart, CumulativeEnergyChart
    - Arrange in layout: Power chart top, then 2x2 grid of secondary charts
    - Pass any necessary props (className for spacing/styling)
    - _Requirements: 7.1, 7.2, 7.8_

- [x] 9. Integrate charts into existing DashboardPage
  - [x] 9.1 Import and position ChartsLayoutContainer
    - Import ChartsLayoutContainer in `frontend/src/features/dashboard/pages/DashboardPage.tsx`
    - Position after existing sections: Quick Actions, Header + Metrics Chips, Featured Power Output Card, Sensor Nodes List
    - Add spacing above charts section (mt-6 or mt-8)
    - _Requirements: 7.2, 7.3, 7.10_
  
  - [x] 9.2 Verify existing functionality preserved
    - Test that PublicUserBanner still displays for unauthenticated users
    - Test that quick actions panel collapse/expand still works
    - Test that metric chips display correctly
    - Test that sensor nodes list renders without issues
    - Verify no layout shift or styling conflicts
    - _Requirements: 7.9, 15.12_
  
  - [x] 9.3 Test role-based access for charts
    - Verify public users can view all charts
    - Verify authenticated admin users can view all charts
    - Verify no admin-only controls appear in chart components
    - Use getUserRole function to confirm role detection works
    - _Requirements: 10.1, 10.2, 10.3, 10.7, 10.8_

- [x] 10. Implement accessibility features
  - [x] 10.1 Add ARIA labels to chart components
    - Add aria-label to ChartContainer with descriptive chart name
    - Add aria-label to filter button groups with role="group"
    - Add aria-pressed state to active filter buttons
    - _Requirements: 13.7_
  
  - [x] 10.2 Ensure keyboard navigation support
    - Verify filter buttons are keyboard accessible (Tab, Enter, Space)
    - Verify retry button in error state is keyboard accessible
    - Test chart tooltip navigation with keyboard (if supported by Recharts)
    - _Requirements: 13.7_
  
  - [x] 10.3 Verify color contrast for WCAG compliance
    - Test text colors in light mode meet WCAG AA standards (contrast ratio ≥4.5:1)
    - Test text colors in dark mode meet WCAG AA standards
    - Test chart line/bar colors are distinguishable
    - Use browser dev tools or contrast checker tool
    - _Requirements: 11.4_

- [x] 11. Add responsive tooltip positioning
  - [x] 11.1 Configure Recharts tooltip positioning
    - Set Tooltip position prop to prevent overflow beyond chart boundaries
    - Test tooltip behavior on mobile screens (edge detection)
    - Ensure tooltip content wraps properly on small screens
    - _Requirements: 13.8_

- [x] 12. Optimize performance for real-time updates
  - [x] 12.1 Implement data point limiting
    - Use limitDataPoints utility function in charts with real-time updates
    - Limit PowerGenerationChart to max 100 points for "Today" view
    - Ensure older data points are removed when limit is reached
    - _Requirements: 9.8_
  
  - [x] 12.2 Throttle WebSocket invalidations
    - Add throttling logic in useChartRealTimeUpdates hook
    - Prevent invalidation more than once every 5 seconds
    - Use useRef to track last invalidation timestamp
    - _Requirements: 9.3, 9.4_

- [x] 13. Checkpoint - Verify integrated dashboard functionality
  - Test complete dashboard page with all charts rendered
  - Verify charts load data successfully from backend API
  - Test time and period filter interactions
  - Test theme toggle between light and dark modes
  - Test responsive layout on desktop, tablet, and mobile viewports
  - Test WebSocket real-time updates (if test environment supports)
  - Ask the user if questions arise

- [ ]* 14. Write unit tests for custom hooks
  - [ ]* 14.1 Test useTimeSeriesData hook
    - Write tests in `frontend/src/features/dashboard/hooks/useTimeSeriesData.test.ts`
    - Test successful data fetch with valid parameters
    - Test loading state during fetch
    - Test error state on API failure
    - Test query key generation with different parameters
    - Test staleTime and refetchInterval configuration
    - Mock analyticsService.getTimeSeries
    - _Requirements: 8.7, 8.8_
  
  - [ ]* 14.2 Test usePowerGeneration hook
    - Write tests in `frontend/src/features/dashboard/hooks/usePowerGeneration.test.ts`
    - Test date range calculation for 'today' filter
    - Test date range calculation for '7days' filter
    - Test date range calculation for '30days' filter
    - Test granularity selection per filter
    - Mock useTimeSeriesData hook
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ]* 14.3 Test useEnergyByPeriod hook
    - Write tests in `frontend/src/features/dashboard/hooks/useEnergyByPeriod.test.ts`
    - Test date range calculation for 'hourly' filter
    - Test date range calculation for 'daily' filter
    - Test date range calculation for 'weekly' filter
    - Test granularity selection per filter
    - Mock useTimeSeriesData hook
    - _Requirements: 4.4, 4.5, 4.6_

- [ ]* 15. Write unit tests for chart components
  - [ ]* 15.1 Test ChartContainer component
    - Write tests in `frontend/src/components/dashboard/ChartContainer.test.tsx`
    - Test rendering with loading state shows ChartLoadingState
    - Test rendering with empty state shows ChartEmptyState
    - Test rendering with error state shows ChartErrorState
    - Test rendering with data shows children
    - Test retry button calls onRetry callback
    - Test theme colors apply correctly
    - _Requirements: 1.2, 1.3, 1.4, 12.8_
  
  - [ ]* 15.2 Test PowerGenerationChart component
    - Write tests in `frontend/src/components/dashboard/PowerGenerationChart.test.tsx`
    - Test rendering with mock data
    - Test time filter button clicks update state
    - Test chart renders with correct data
    - Mock usePowerGeneration hook
    - _Requirements: 2.13, 3.1, 3.2_
  
  - [ ]* 15.3 Test chart utility functions
    - Write tests in `frontend/src/components/dashboard/chartUtils.test.ts`
    - Test transformToChartData converts TimeSeries to ChartDataPoint[]
    - Test calculateCumulative computes running sum correctly
    - Test formatChartTimestamp formats dates per granularity
    - Test limitDataPoints limits array to max length
    - _Requirements: 14.6_

- [ ]* 16. Write integration tests
  - [ ]* 16.1 Test DashboardPage with charts
    - Write tests in `frontend/src/features/dashboard/pages/DashboardPage.test.tsx`
    - Test all chart components render on the page
    - Test PublicUserBanner displays for unauthenticated users
    - Test charts display for authenticated users
    - Mock API responses for all data hooks
    - Mock SocketContext for WebSocket
    - _Requirements: 7.1, 7.2, 10.7_
  
  - [ ]* 16.2 Test real-time updates integration
    - Test WebSocket event triggers chart data refetch
    - Mock socket.on('sensor:reading') event emission
    - Verify TanStack Query cache invalidation
    - Verify chart components re-render with new data
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 17. Build verification and linting
  - [ ] 17.1 Run TypeScript compilation
    - Execute `npm run build` in frontend directory
    - Verify no TypeScript errors
    - Fix any type errors that arise
    - _Requirements: 15.1_
  
  - [ ] 17.2 Run ESLint checks
    - Execute `npm run lint` in frontend directory
    - Verify no ESLint errors
    - Fix any linting issues
    - _Requirements: 15.2_

- [ ] 18. Cross-browser and device testing
  - [ ] 18.1 Test on desktop browsers
    - Test on Chrome (latest)
    - Test on Firefox (latest)
    - Test on Safari (latest, macOS)
    - Test on Edge (latest)
    - Verify charts render correctly, tooltips work, filters function
    - _Requirements: 15.3_
  
  - [ ] 18.2 Test on mobile browsers
    - Test on iOS Safari (iPhone)
    - Test on Chrome Mobile (Android)
    - Verify responsive layout stacks correctly
    - Verify touch interactions work (tap filters, view tooltips)
    - Test landscape and portrait orientations
    - _Requirements: 15.4_
  
  - [ ] 18.3 Test role-based access
    - Test as public user (unauthenticated) - charts visible, no admin controls
    - Test as system administrator (authenticated) - charts visible, full access
    - Verify PublicUserBanner displays correctly for public users
    - _Requirements: 15.5, 15.6_

- [ ] 19. Verify all acceptance criteria
  - [ ] 19.1 Verify loading states
    - Navigate to dashboard while throttling network in dev tools
    - Confirm loading skeletons display
    - Confirm smooth transition to data display
    - _Requirements: 15.7_
  
  - [ ] 19.2 Verify empty states
    - Test with backend returning empty data arrays
    - Confirm empty state messages display
    - Confirm suggestions are helpful
    - _Requirements: 15.8_
  
  - [ ] 19.3 Verify error states
    - Test with backend returning 500 errors
    - Confirm error messages display
    - Confirm retry button refetches data
    - _Requirements: 15.9_
  
  - [ ] 19.4 Verify filter interactions
    - Click time filter buttons on PowerGenerationChart
    - Click period filter buttons on EnergyPeriodChart
    - Verify data refetches with updated parameters
    - Verify charts update with new data
    - _Requirements: 15.10_
  
  - [ ] 19.5 Verify theme toggle
    - Toggle theme from light to dark mode
    - Toggle theme from dark to light mode
    - Verify all chart colors update dynamically
    - Verify text remains readable with sufficient contrast
    - _Requirements: 15.11_
  
  - [ ] 19.6 Verify existing dashboard functionality
    - Verify quick actions panel works
    - Verify metric chips display correctly
    - Verify sensor nodes list renders
    - Verify no console errors or warnings
    - _Requirements: 15.12, 15.14_

- [ ] 20. Final verification checkpoint
  - Ensure all tasks are complete
  - Run full build and lint checks one final time
  - Perform end-to-end smoke test on all chart interactions
  - Verify no regressions in existing dashboard features
  - Document any known issues or limitations
  - Ask the user if ready to deploy or if additional changes needed

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints (tasks 7, 13, 20) ensure incremental validation and allow for course correction
- Property-based tests are NOT included as this feature does not have universal correctness properties suitable for PBT
- Unit and integration tests validate specific examples, edge cases, and integration points
- The Activity Trend Chart is NOT included per Requirement 6 (discrete activity event data not available in backend)
- All implementation follows EcoStep Design System patterns and existing codebase conventions
- Real-time updates use WebSocket invalidation strategy rather than direct cache manipulation for simplicity and reliability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.7"] },
    { "id": 1, "tasks": ["1.2", "1.8"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "1.6", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["3.1", "4.1", "5.1", "6.1"] },
    { "id": 5, "tasks": ["3.2", "4.2", "5.2", "6.2"] },
    { "id": 6, "tasks": ["3.3", "4.3", "4.4", "5.3", "6.3"] },
    { "id": 7, "tasks": ["3.4", "6.4", "8.1"] },
    { "id": 8, "tasks": ["8.2"] },
    { "id": 9, "tasks": ["9.1"] },
    { "id": 10, "tasks": ["9.2", "9.3", "10.1", "10.2", "10.3", "11.1"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["14.1", "14.2", "14.3", "15.1", "15.2", "15.3"] },
    { "id": 13, "tasks": ["16.1", "16.2"] },
    { "id": 14, "tasks": ["17.1"] },
    { "id": 15, "tasks": ["17.2"] },
    { "id": 16, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 17, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6"] }
  ]
}
```
