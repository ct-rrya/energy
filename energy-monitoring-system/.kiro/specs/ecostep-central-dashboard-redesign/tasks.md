# Implementation Plan: EcoStep Central Dashboard Redesign

## Overview

This plan implements the EcoStep Central Dashboard Redesign, transforming the dashboard from a mixed-purpose interface into a focused real-time monitoring system. The implementation is frontend-only (CSS and presentation changes) with zero backend modifications. The redesign emphasizes data-first visual hierarchy, responsive design, and clear separation between real-time monitoring (Dashboard) and historical analysis (Analytics tab).

## Tasks

- [x] 1. Create core component structure and interfaces
  - Create TypeScript interfaces for all new components
  - Set up component file structure in `frontend/src/features/dashboard/components/`
  - Define prop types for DashboardHeader, ElectricalMetricsGrid, MetricCard, SystemStatusCard, StatusIndicator, and SensorNodesEmptyState
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Implement DashboardHeader component
  - [x] 2.1 Create DashboardHeader component with header layout
    - Implement flexbox layout with title, subtitle, and system status indicator
    - Add alerts button with badge support for alert count
    - Implement responsive behavior (flex-row on desktop, flex-column on mobile)
    - Handle isPublicUser prop to disable alerts button
    - _Requirements: 1.1, 5.1, 5.6, 9.3_
  
  - [x] 2.2 Write unit tests for DashboardHeader
    - Test rendering with different system status states (connected, disconnected, unknown)
    - Test alerts button disabled state for public users
    - Test responsive layout transformations
    - Test badge display with different alert counts
    - _Requirements: 1.1, 9.3_

- [x] 3. Implement MetricCard component with data-first hierarchy
  - [x] 3.1 Create MetricCard component with visual hierarchy
    - Implement 13px uppercase label with letter-spacing and icon
    - Implement 36px bold tabular-nums value display
    - Implement 18px unit label inline with value
    - Add color prop support (accent, amber, blue, red) for accent colors
    - Implement precision prop for decimal formatting
    - Add empty state handling (show 0.0 or 0.00 with reduced opacity)
    - Apply card styling with solid background and hairline border
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.6, 5.7, 8.1, 8.2, 8.4, 8.5, 10.2_
  
  - [x] 3.2 Write unit tests for MetricCard
    - Test numeric value rendering with correct precision
    - Test tabular-nums font variant application
    - Test empty state when value is undefined
    - Test color prop application for accent colors
    - Test responsive typography scaling (36px → 32px → 28px)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.6_

- [x] 4. Implement ElectricalMetricsGrid component
  - [x] 4.1 Create ElectricalMetricsGrid with responsive grid layout
    - Implement CSS Grid with 4 columns for desktop (≥1024px)
    - Implement 2-column grid for tablet (640-1023px)
    - Implement 1-column stack for mobile (<640px)
    - Add four MetricCard instances: Voltage (V), Current (A), Power (W), Energy Today (kWh)
    - Apply correct color to each metric (Voltage: accent, Current: amber, Power: blue, Energy: amber)
    - Add icons for each metric (Zap, Activity, Zap, TrendingUp)
    - Handle loading state with skeleton components
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 4.2 Write unit tests for ElectricalMetricsGrid
    - Test all four metrics render in correct order
    - Test correct color application to each metric
    - Test responsive grid layout at different breakpoints
    - Test loading state rendering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_

- [x] 5. Implement StatusIndicator and SystemStatusCard components
  - [x] 5.1 Create StatusIndicator component
    - Implement status dot with semantic colors (green for connected, red for disconnected, gray for unknown)
    - Add pulse animation for active/connected status
    - Implement status label and value display
    - Add timestamp display for data transfer status
    - Format timestamp with proper time display
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4, 8.5_
  
  - [x] 5.2 Create SystemStatusCard component with status grid
    - Implement system status card with three StatusIndicator instances
    - Add Wi-Fi, Bluetooth, and Data Transfer status indicators
    - Implement responsive grid (3 columns desktop, 1 column mobile)
    - Apply supporting tier visual hierarchy styling
    - Handle empty state when no data available
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.5, 7.4, 7.5_
  
  - [ ]* 5.3 Write unit tests for StatusIndicator and SystemStatusCard
    - Test connected status rendering with green dot
    - Test disconnected status rendering with red dot
    - Test unknown status rendering with gray dot
    - Test timestamp formatting
    - Test responsive layout transformations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Refactor StepActivityCard component
  - [x] 6.1 Update StepActivityCard styling to match design system
    - Apply max-width constraint (400px)
    - Update label to "Step Activity" with 13px uppercase styling
    - Update step count display to 32px bold tabular-nums
    - Add inline icon (16px) with label
    - Implement empty state: "Waiting for footstep data"
    - Apply primary tier visual hierarchy styling
    - Ensure real-time updates when new step data received
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2, 10.1, 10.4, 11.2_
  
  - [ ]* 6.2 Write unit tests for StepActivityCard
    - Test step count display
    - Test empty state message when no data
    - Test max-width constraint
    - Test real-time update behavior
    - _Requirements: 2.2, 2.3, 2.5, 10.1_

- [x] 7. Create SensorNodesEmptyState component
  - [x] 7.1 Implement SensorNodesEmptyState component
    - Create empty state with Activity icon (64px circle)
    - Add title: "No sensor data available"
    - Add description: "Waiting for sensor data. Connect ESP32 sensors to view real-time node status and readings."
    - Apply centered layout with proper spacing (3rem vertical padding)
    - Use muted background for icon container
    - Apply max-width constraint (420px) for description
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [ ]* 7.2 Write unit tests for SensorNodesEmptyState
    - Test empty state message rendering
    - Test icon display
    - Test centered layout
    - _Requirements: 10.3, 10.4_

- [-] 8. Checkpoint - Component library complete
  - Ensure all new components are created and styled
  - Verify all TypeScript interfaces are properly defined
  - Check that all components follow the design system
  - Ask the user if questions arise.

- [x] 9. Refactor DashboardPage layout
  - [x] 9.1 Remove deprecated components from DashboardPage
    - Remove ChartsLayoutContainer from Dashboard (keep import in Analytics)
    - Remove QuickActionsCard component and usage
    - Remove RecentActivityCard component and usage
    - Remove LiveSensorCard component and usage
    - Remove PageHeader component (replaced by DashboardHeader)
    - Clean up unused imports and references
    - _Requirements: 1.6, 1.7, 1.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 9.3, 9.4, 12.6_
  
  - [x] 9.2 Integrate new components into DashboardPage
    - Add DashboardHeader at the top of the page
    - Add ElectricalMetricsGrid as hero section
    - Position StepActivityCard as supporting section
    - Add SystemStatusCard as tertiary section
    - Conditionally render SensorNodesEmptyState when no data available
    - Conditionally render PublicUserBanner for public users
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 9.3 Wire data flow to new components
    - Connect useDashboardMetrics() hook to ElectricalMetricsGrid
    - Connect useLiveSensorData() hook to ElectricalMetricsGrid and StepActivityCard
    - Connect useSystemHealth() hook to SystemStatusCard
    - Map voltage, current, power, energy from lastReading to ElectricalMetricsGrid
    - Map stepCount from lastReading to StepActivityCard
    - Map wifi, bluetooth, dataTimestamp from lastReading to SystemStatusCard
    - Implement hasData logic to control empty state rendering
    - Preserve existing WebSocket/polling mechanisms
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 9.4 Write integration tests for DashboardPage
    - Test data flow from hooks to components
    - Test component rendering with live data
    - Test empty state rendering when no data available
    - Test real-time updates when sensor data changes
    - Test PublicUserBanner conditional rendering
    - _Requirements: 1.1, 9.1, 9.2, 10.3, 11.1, 11.2, 11.3_

- [x] 10. Implement responsive design and styling
  - [x] 10.1 Apply responsive breakpoints and layouts
    - Implement desktop breakpoint (≥1024px): 4-column metrics grid
    - Implement tablet breakpoint (640-1023px): 2-column metrics grid
    - Implement mobile breakpoint (<640px): 1-column stacked layout
    - Apply responsive typography scaling (36px → 32px → 28px for metric values)
    - Implement touch targets (minimum 44x44px for all interactive elements)
    - Test layout transformations at all breakpoints
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 10.2 Apply design system styling to all components
    - Apply color tokens from lib/theme.ts to all components
    - Implement card styling (solid backgrounds, hairline borders, 12px border-radius)
    - Apply typography system (sizes, weights, letter-spacing)
    - Implement spacing system (card padding 24px, grid gap 16px, section gap 24px)
    - Add hover states and transitions (200ms opacity transitions)
    - Apply whitespace intentionally to reduce visual clutter
    - Remove any gradients, glassmorphism, or excessive shadows
    - _Requirements: 5.6, 5.7, 8.4, 8.5_
  
  - [ ]* 10.3 Write responsive design tests
    - Test 4-column grid on desktop viewports
    - Test 2-column grid on tablet viewports
    - Test 1-column grid on mobile viewports
    - Test typography scaling across breakpoints
    - Test touch target sizes on mobile
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Implement dark mode support
  - [x] 11.1 Add dark mode styling to all new components
    - Apply dark mode color tokens from lib/theme.ts
    - Implement dark page background (#0F1116)
    - Implement dark card background (#1C1F28)
    - Implement dark text colors (primary: #F9FAFB, secondary: #9CA3AF)
    - Implement dark border color (#2A2E39)
    - Use accent color for dark mode (#3ED98A)
    - Maintain status colors across themes (green, red, amber, blue)
    - Ensure visual hierarchy is preserved in dark mode
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 11.2 Write dark mode tests
    - Test dark background colors applied correctly
    - Test dark text colors applied correctly
    - Test visual hierarchy maintained in dark mode
    - Test theme switching without page refresh
    - _Requirements: 8.1, 8.2, 8.6_

- [x] 12. Implement error handling and loading states
  - [x] 12.1 Add loading skeletons for all components
    - Create skeleton component for MetricCard with pulse animation
    - Create skeleton component for SystemStatusCard
    - Create skeleton component for StepActivityCard
    - Implement loading state in ElectricalMetricsGrid
    - Maintain layout structure during loading (prevent layout shift)
    - _Requirements: 3.8, 10.2_
  
  - [x] 12.2 Implement error boundaries and error states
    - Add error boundary at DashboardPage level
    - Implement retry button for data fetch errors
    - Add visual indicator for WebSocket disconnection in header
    - Implement fallback to last known good data on error
    - Add validation for data types before rendering
    - Log errors to console in development mode
    - _Requirements: 4.6, 10.4, 10.5_
  
  - [ ]* 12.3 Write error handling tests
    - Test loading skeleton rendering
    - Test error boundary behavior
    - Test WebSocket disconnection indicator
    - Test data validation and fallback behavior
    - _Requirements: 10.2, 10.4_

- [x] 13. Optimize performance
  - [x] 13.1 Implement rendering optimizations
    - Wrap MetricCard with React.memo to prevent unnecessary re-renders
    - Wrap SystemStatusCard with React.memo
    - Use useMemo for formatted value calculations in MetricCard
    - Use useCallback for event handlers in DashboardHeader
    - Verify ChartsLayoutContainer lazy loading (already implemented)
    - Use named imports for Lucide icons to enable tree-shaking
    - _Requirements: 9.1, 9.2_
  
  - [x] 13.2 Apply CSS performance optimizations
    - Add CSS containment (contain: layout style) to metric cards
    - Add will-change: opacity to animated elements (pulse animation)
    - Use GPU acceleration for animations
    - Optimize CSS selectors (direct class selectors, avoid deep nesting)
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 13.3 Verify performance benchmarks
    - Run Lighthouse audit to verify performance score
    - Verify bundle size increase is <10% from current
    - Test rendering performance with React DevTools Profiler
    - Verify no layout shifts during loading
    - _Requirements: 9.1, 9.2_

- [ ] 14. Checkpoint - Core functionality complete
  - Verify all components render correctly
  - Test data flow from hooks to UI
  - Verify responsive behavior across all breakpoints
  - Test dark mode switching
  - Ensure error handling works correctly
  - Ask the user if questions arise.

- [ ] 15. Implement accessibility features
  - [ ] 15.1 Add ARIA labels and semantic HTML
    - Use semantic HTML (header, main, section landmarks)
    - Add ARIA labels to status indicators
    - Add aria-disabled to alerts button when disabled for public users
    - Ensure proper heading hierarchy (h1 for page title, h2 for sections, h3 for cards)
    - Add accessible labels for icon-only elements
    - _Requirements: 9.3_
  
  - [ ] 15.2 Implement keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add visible focus indicators (no shadows, use borders)
    - Test tab order follows logical flow
    - Ensure alerts button is keyboard activatable
    - _Requirements: 9.3_
  
  - [ ]* 15.3 Write accessibility tests
    - Run axe accessibility audit on all components
    - Verify WCAG AA contrast ratios
    - Test keyboard navigation flow
    - Verify screen reader labels for status indicators
    - Test focus indicators visibility
    - _Requirements: 9.3_

- [ ] 16. Verify backward compatibility
  - [ ] 16.1 Ensure no breaking changes to existing features
    - Verify authentication logic unchanged
    - Verify IoT communication protocols unchanged
    - Verify analytics calculation algorithms unchanged
    - Verify report generation functionality unchanged
    - Verify AI chatbot functionality unchanged
    - Verify Analytics tab accessible with all existing functionality
    - Test that no existing features are removed or disabled
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 16.2 Verify API contracts preserved
    - Confirm no new API endpoints created
    - Confirm no modifications to existing backend APIs
    - Confirm no database structure changes
    - Confirm no telemetry processing logic changes
    - Verify existing hooks work without modification
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 16.3 Write backward compatibility tests
    - Test existing API endpoints still function
    - Test data fetching hooks work unchanged
    - Test Analytics tab remains fully functional
    - Test authentication flows remain intact
    - _Requirements: 9.1, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 17. Documentation and cleanup
  - [ ] 17.1 Update component documentation
    - Add JSDoc comments to all component prop interfaces
    - Document component usage in README or Storybook
    - Update ARCHITECTURE-OVERVIEW.md with new component structure
    - Document responsive breakpoints and behavior
    - Document dark mode implementation
    - _Requirements: 9.3_
  
  - [ ] 17.2 Clean up deprecated code
    - Delete removed component files (QuickActionsCard, RecentActivityCard, LiveSensorCard, PageHeader)
    - Remove unused imports across all files
    - Remove dead code and commented-out sections
    - Update component index.ts exports
    - Run linter and fix all warnings
    - _Requirements: 9.3, 9.4_

- [ ] 18. Final checkpoint - Complete feature review
  - Run full test suite and verify all tests pass
  - Perform visual QA across all breakpoints (desktop, tablet, mobile)
  - Test dark mode consistency across all components
  - Verify accessibility compliance (WCAG AA)
  - Verify backward compatibility with existing features
  - Review performance metrics (Lighthouse, bundle size)
  - Ask the user if questions arise or if ready for final review.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation is frontend-only (CSS and presentation) - no backend changes required
- All existing hooks, APIs, and data structures remain unchanged
- ChartsLayoutContainer removed from Dashboard but remains in Analytics tab
- Design uses TypeScript and React with component-based architecture
- Focus on data-first visual hierarchy with large, bold typography for numeric values
- Three-tier visual hierarchy: ElectricalMetricsGrid (primary), StepActivityCard (secondary), SystemStatusCard (tertiary)
- Responsive design with graceful degradation: desktop (4-col) → tablet (2-col) → mobile (1-col)
- Full dark mode support using centralized theme tokens
- Real-time updates via existing WebSocket/polling mechanisms
- Empty states use waiting/loading language, not error messages
- Checkpoints ensure incremental validation and user feedback opportunities

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1", "5.2", "6.1", "7.2"] },
    { "id": 3, "tasks": ["4.2", "5.3", "6.2", "9.1"] },
    { "id": 4, "tasks": ["9.2"] },
    { "id": 5, "tasks": ["9.3"] },
    { "id": 6, "tasks": ["9.4", "10.1", "10.2", "11.1", "12.1"] },
    { "id": 7, "tasks": ["10.3", "11.2", "12.2", "13.1"] },
    { "id": 8, "tasks": ["12.3", "13.2", "15.1"] },
    { "id": 9, "tasks": ["13.3", "15.2", "16.1"] },
    { "id": 10, "tasks": ["15.3", "16.2"] },
    { "id": 11, "tasks": ["16.3", "17.1"] },
    { "id": 12, "tasks": ["17.2"] }
  ]
}
```
