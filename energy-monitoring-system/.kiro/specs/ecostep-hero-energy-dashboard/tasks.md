# Implementation Plan: EcoStep Hero Energy Dashboard

## Overview

This plan implements the EcoStep Hero Energy Dashboard redesign, transforming the equal-weight metric grid into a hero-focused layout with energy output (kWh) as the primary visual element. The implementation follows a component-first approach, building new components before integrating them into the existing DashboardPage.

**Technology Stack**: React 18, TypeScript, TanStack Query, Socket.IO, Tailwind CSS, Recharts

**Key Architecture Changes**:
- New 65/35 side-by-side desktop layout (hero card left, metrics column right)
- Real-time WebSocket data with 1-second debouncing
- Last-known-good data caching for validation failures
- Responsive breakpoints: Desktop (≥1024px), Tablet (768-1023px), Mobile (<768px)

## Tasks

- [x] 1. Create core component structure and type definitions
  - Create TypeScript interfaces for all component props
  - Define TrendDataPoint, ValidationRange, and other shared types
  - Create component files with empty function declarations
  - _Requirements: All (foundation for entire implementation)_

- [x] 2. Implement data validation and caching utilities
  - [x] 2.1 Create validateSensorData utility
    - Implement range validation for voltage (0-500V), current (0-100A), power (0-50000W), stepCount (0-1000000)
    - Return ValidationResult with isValid boolean and error messages
    - Add console warnings for out-of-range values
    - _Requirements: 16.7, 16.8, 16.9, 16.10, 17.6, 17.7, 19.6_
  
  - [x] 2.2 Create calculateTrend utility function
    - Handle undefined values (return 'no-data' direction)
    - Handle equal values (return 'neutral' direction)
    - Calculate percentage change with correct positive/negative logic
    - Return TrendCalculation object with direction, percentage, color, icon, label
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [x] 2.3 Implement last-known-good caching in DashboardPage
    - Add lastGoodReading and lastGoodMetrics state variables
    - Update cache when new valid data arrives using useEffect
    - Use cached data as fallback when validation fails
    - _Requirements: 19.2, 19.4, 19.5, 19.6_

- [~] 3. Build TrendIndicator component
  - [x] 3.1 Create TrendIndicator component with TypeScript interface
    - Accept currentValue, previousValue, format, showIcon props
    - Implement calculateTrend logic or import utility
    - Render arrow icon based on trend direction
    - Apply color based on trend (green for up, amber for down, gray for neutral/no-data)
    - Display formatted percentage with "vs yesterday" label
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 3.2 Write unit tests for TrendIndicator
    - Test positive trend shows green color with up arrow
    - Test negative trend shows amber color with down arrow
    - Test neutral trend shows gray with horizontal line
    - Test undefined values show "No comparison data"
    - Test percentage calculation accuracy
    - _Requirements: 4.1-4.7_

- [x] 4. Build MiniTrendGraph component
  - [x] 4.1 Create MiniTrendGraph component with Recharts
    - Accept data (TrendDataPoint[]), height, showAxes, accentColor props
    - Filter data to last 24 hours using useMemo
    - Render Recharts LineChart with monotone line
    - Set line color to #3ED98A, strokeWidth to 2px
    - Hide axes and dots for minimal design
    - Show "Insufficient data" when < 2 data points
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x] 4.2 Implement lazy loading for MiniTrendGraph
    - Wrap component with React.lazy()
    - Create GraphSkeleton fallback component
    - Use Suspense boundary in parent component
    - _Requirements: 20.7_
  
  - [ ]* 4.3 Write unit tests for MiniTrendGraph
    - Test 24-hour data filtering
    - Test empty state with < 2 data points
    - Test chart renders with valid data
    - Test responsive height scaling
    - _Requirements: 5.1-5.8_

- [x] 5. Build AIInsightSection component
  - [x] 5.1 Create AIInsightSection component
    - Accept insight, isLoading, maxLength props (default 150)
    - Render Sparkles icon with #3ED98A color
    - Display insight text with muted color (#6B7280 light, #9CA3AF dark)
    - Add border-top divider with theme-aware color
    - Show "Analysis in progress..." when insight is undefined
    - Use 13-15px responsive typography
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 6. Build HeroEnergyCard component
  - [x] 6.1 Create HeroEnergyCard base structure
    - Create component with props interface (energyValue, previousDayEnergy, trendData, aiInsight, isLoading, isError, onRetry)
    - Implement card container with 32px padding (desktop), 24px (tablet), 20px (mobile)
    - Add 12px border-radius and hairline border
    - Set minimum height to 400px (desktop), 350px (mobile)
    - Apply CSS containment (contain: layout style)
    - _Requirements: 3.1, 3.2, 12.5, 20.5_
  
  - [x] 6.2 Implement energy value display with typography
    - Display label "Today's Energy Generated" (13px uppercase)
    - Format energy value with useMemo (toFixed(1))
    - Apply responsive typography: 36-48px (mobile), 48-56px (tablet), 56-72px (desktop)
    - Display unit "kWh" with 20-32px responsive sizing
    - Apply accent color #3ED98A to value
    - Use tabular numerals (font-variant-numeric: tabular-nums)
    - Show "0.0" with 50% opacity when undefined
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 12.7_
  
  - [x] 6.3 Integrate TrendIndicator into HeroEnergyCard
    - Calculate trend with useMemo using energyValue and previousDayEnergy
    - Position below energy value with 12px spacing
    - Pass calculated trend data to TrendIndicator component
    - _Requirements: 4.1-4.7_
  
  - [ ] 6.4 Integrate MiniTrendGraph into HeroEnergyCard
    - Add graph section with 16px top margin
    - Set max height to 100px (25% of 400px card height)
    - Pass trendData prop to MiniTrendGraph
    - Wrap with Suspense for lazy loading
    - _Requirements: 5.1-5.8_
  
  - [x] 6.5 Integrate AIInsightSection into HeroEnergyCard
    - Add 16px margin above divider
    - Pass aiInsight prop to AIInsightSection
    - Apply border-top divider with theme-aware opacity
    - _Requirements: 6.1-6.8_
  
  - [x] 6.6 Add empty and loading states to HeroEnergyCard
    - Create HeroCardSkeleton with shimmer animation
    - Show skeleton when isLoading is true
    - Show empty state with Zap icon when energyValue undefined and not loading
    - Display "Waiting for data..." message in empty state
    - _Requirements: 3.8, 17.3, 19.8_
  
  - [ ] 6.7 Wrap HeroEnergyCard with React.memo
    - Add custom comparison function for props
    - Compare energyValue, previousDayEnergy, isLoading
    - Optimize to prevent unnecessary re-renders
    - _Requirements: 20.1_
  
  - [ ]* 6.8 Write unit tests for HeroEnergyCard
    - Test energy value formatting and display
    - Test empty state rendering
    - Test loading skeleton display
    - Test trend integration
    - Test responsive typography scaling
    - _Requirements: 3.1-3.9_

- [ ] 7. Enhance MetricCard component
  - [ ] 7.1 Update MetricCard for hero dashboard design
    - Verify props interface matches design (label, value, unit, precision, color, icon, showTrend, trendPercentage)
    - Apply responsive typography: 28px (mobile), 32px (tablet), 36px (desktop)
    - Use tabular numerals for all numeric displays
    - Format values with proper precision (1 decimal for V/W, 2 for A, 0 for steps)
    - Show value with 50% opacity when undefined
    - _Requirements: 8.1-8.9, 9.1-9.9, 10.1-10.9, 11.1-11.10_
  
  - [ ] 7.2 Add color mapping to MetricCard
    - Map 'accent' to #3ED98A (voltage, energy, steps)
    - Map 'amber' to #F59E0B (power)
    - Map 'blue' to #3B82F6 (current)
    - Map 'red' to #EF4444 (errors, alerts)
    - Apply color to value text
    - _Requirements: 8.6, 9.6, 10.6, 11.6, 12.1_
  
  - [ ] 7.3 Wrap MetricCard with React.memo
    - Add memoization to prevent unnecessary re-renders
    - Compare value, isLoading props for optimization
    - _Requirements: 20.2_

- [ ] 8. Build MetricsColumn container component
  - [ ] 8.1 Create MetricsColumn component
    - Accept voltage, current, power, stepCount, isLoading props
    - Render 4 MetricCard components in fixed order (Voltage, Power, Current, Steps)
    - Apply flexbox column layout with 16px gap
    - Set width to 35% on desktop with minWidth 280px
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_
  
  - [ ] 8.2 Configure MetricCard instances
    - Voltage: label "Voltage", unit "V", precision 1, color "accent"
    - Power: label "Power", unit "W", precision 1, color "amber"
    - Current: label "Current", unit "A", precision 2, color "blue"
    - Steps: label "Steps Today", unit "", precision 0, color "accent", icon Footprints
    - Pass corresponding data props from displayReading
    - _Requirements: 8.1-8.9, 9.1-9.9, 10.1-10.9, 11.1-11.10_

- [ ] 9. Enhance DashboardHeader component
  - [ ] 9.1 Add real-time clock to DashboardHeader
    - Add currentTime state with useState(new Date())
    - Set up useEffect with setInterval to update every 1 second
    - Format date: toLocaleDateString with month: 'long', day: 'numeric', year: 'numeric'
    - Format time: toLocaleTimeString with hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    - Clean up interval on unmount
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 9.2 Add system status badge to DashboardHeader
    - Accept systemStatus prop ('connected' | 'disconnected' | 'unknown')
    - Display "Online" with green color when connected
    - Display "Offline" with red color when disconnected
    - Display "Warning" with amber color when degraded
    - Position badge prominently in header
    - _Requirements: 2.6, 2.7, 2.8, 2.9_
  
  - [x] 9.3 Add WebSocket connection indicator
    - Accept isWebSocketConnected prop
    - Show disconnection warning when false
    - Use red badge or icon for visual indicator
    - _Requirements: 19.1_

- [ ] 10. Implement enhanced data hooks
  - [ ] 10.1 Enhance useDashboardMetrics hook
    - Update queryFn to fetch new API response shape (dailyEnergy, previousDayEnergy, energyTrend, aiInsight)
    - Set refetchInterval to 60000ms (60 seconds)
    - Set staleTime to 50000ms (50 seconds)
    - Add retry logic with 3 attempts and exponential backoff
    - Enable refetchOnMount and refetchOnWindowFocus
    - Use placeholderData to show stale data while revalidating
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [ ] 10.2 Enhance useLiveSensorData hook with debouncing
    - Add updateQueue state to buffer incoming WebSocket messages
    - Push new readings to updateQueue on 'sensor:reading' event
    - Create debounced processor with useEffect and setTimeout (1000ms)
    - Take most recent reading from queue and validate before applying
    - Clear queue after processing
    - Validate using validateSensorReading before setState
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 20.4_
  
  - [ ] 10.3 Add WebSocket connection monitoring
    - Track connection state with isConnected boolean
    - Listen to 'connect' and 'disconnect' events
    - Update connection status in state
    - Return connection status from hook
    - _Requirements: 16.1, 19.1_

- [ ] 11. Checkpoint - Ensure component library is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integrate components into DashboardPage
  - [ ] 12.1 Update DashboardPage layout structure
    - Remove existing ElectricalMetricsGrid from current position
    - Create new layout container with CSS Grid (65% / 35% columns on desktop)
    - Set max-width to 1600px and center with margin auto
    - Apply 24px gap between hero and metrics column
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 12.2 Integrate HeroEnergyCard into DashboardPage
    - Place HeroEnergyCard in left grid column
    - Pass energyValue from displayMetrics.dailyEnergy
    - Pass previousDayEnergy from displayMetrics.previousDayEnergy
    - Pass trendData from displayMetrics.energyTrend
    - Pass aiInsight from displayMetrics.aiInsight
    - Pass isLoading and isError from query state
    - Add onRetry callback to refetch metrics
    - _Requirements: 3.1-3.9_
  
  - [ ] 12.3 Integrate MetricsColumn into DashboardPage
    - Place MetricsColumn in right grid column
    - Pass voltage, current, power from displayReading
    - Pass stepCount from displayReading
    - Pass isLoading from query state
    - _Requirements: 7.1-7.7, 8.1-8.9, 9.1-9.9, 10.1-10.9, 11.1-11.10_
  
  - [ ] 12.4 Update DashboardHeader integration
    - Pass systemStatus from useSystemHealth hook
    - Calculate status from database connection state
    - Pass isWebSocketConnected from useLiveSensorData hook
    - Ensure alertsCount, isPublicUser, onAlertsClick props are passed
    - _Requirements: 2.1-2.9, 19.1_
  
  - [ ] 12.5 Implement error handling in DashboardPage
    - Show DataFetchError when metricsError is true and no cached data
    - Pass retry handler to trigger refetchMetrics
    - Show isRetrying state from query
    - Keep displaying last good data during errors
    - _Requirements: 19.3, 19.4_

- [ ] 13. Implement responsive layout breakpoints
  - [ ] 13.1 Add desktop layout styles (≥1024px)
    - Use CSS Grid with gridTemplateColumns: '65% 35%'
    - Stack items horizontally with hero left, metrics right
    - Align top edges of hero and metrics
    - Apply 32px card padding
    - Use 56-72px hero energy typography
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 13.2 Add tablet layout styles (768px - 1023px)
    - Switch to block layout (hero full width above)
    - Display metrics in 2x2 grid below hero
    - Arrange Voltage/Power in row 1, Current/Steps in row 2
    - Apply 16px grid gap
    - Use 24px card padding
    - Scale hero typography to 48-56px
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [x] 13.3 Add mobile layout styles (<768px)
    - Use flexbox column layout stacking all components
    - Order: Header, Hero, Voltage, Power, Current, Steps
    - Render all cards at full width
    - Apply 16px vertical gap
    - Use 20px card padding
    - Scale hero typography to 36-48px
    - Reduce hero min-height to 350px
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [ ]* 13.4 Test responsive layouts on real devices
    - Test desktop layout on 1920x1080, 1440x900, 1280x720
    - Test tablet layout on iPad, Android tablets
    - Test mobile layout on iPhone, Android phones
    - Verify typography scales correctly at all breakpoints
    - Verify spacing and gaps maintain design specs
    - _Requirements: 13.1-13.6, 14.1-14.6, 15.1-15.6_

- [ ] 14. Implement visual design system compliance
  - [ ] 14.1 Apply design tokens and color system
    - Use #3ED98A for accent (energy, voltage, steps)
    - Use #F59E0B for amber (power, warnings)
    - Use #3B82F6 for blue (current)
    - Use #EF4444 for red (errors)
    - Verify no gradients applied to cards
    - Verify no glowing borders used
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 14.2 Apply typography and spacing system
    - Use 12-16px border-radius on all cards
    - Apply subtle shadows (max 8px blur) to floating elements only
    - Use size hierarchy (not color intensity) for visual hierarchy
    - Apply consistent 24px section gaps
    - Apply consistent card padding (32px/24px/20px responsive)
    - _Requirements: 12.5, 12.6, 12.7_
  
  - [ ] 14.3 Implement dark mode support
    - Use theme context from existing ThemeContext
    - Apply light mode colors: bg #FFFFFF, text #1A312C, border rgba(26,49,44,0.08)
    - Apply dark mode colors: bg #1C1F28, text #F9FAFB, border rgba(137,215,183,0.12)
    - Use Tailwind dark: classes for theme switching
    - Test all components in both themes
    - _Requirements: 12.8, 12.9_

- [ ] 15. Implement performance optimizations
  - [ ] 15.1 Add React.memo to all card components
    - Wrap HeroEnergyCard with React.memo
    - Wrap MetricCard with React.memo
    - Wrap TrendIndicator with React.memo
    - Wrap MiniTrendGraph with React.memo
    - Add custom comparison functions where needed
    - _Requirements: 20.1, 20.2_
  
  - [ ] 15.2 Add useMemo for computed values
    - Memoize formatted energy value in HeroEnergyCard
    - Memoize trend calculations
    - Memoize filtered trend data (24h) in MiniTrendGraph
    - Memoize formatted metric values in MetricCard
    - _Requirements: 20.3_
  
  - [ ] 15.3 Add useCallback for event handlers
    - Memoize handleAlertsClick in DashboardPage
    - Memoize handleRetry callback
    - Memoize other event handlers passed to child components
    - _Requirements: 20.3_
  
  - [ ] 15.4 Apply CSS containment to cards
    - Add contain: 'layout style' to HeroEnergyCard
    - Add contain: 'layout style' to MetricCard
    - Test scroll and layout performance
    - _Requirements: 20.5, 20.6_
  
  - [ ]* 15.5 Run performance audit
    - Run Lighthouse performance audit
    - Verify Time to Interactive < 3s
    - Verify Cumulative Layout Shift < 0.1
    - Verify First Contentful Paint < 2s
    - Check for unnecessary re-renders with React DevTools Profiler
    - _Requirements: 20.1-20.8_

- [ ] 16. Implement accessibility features
  - [ ] 16.1 Add ARIA labels and semantic HTML
    - Add role="region" and aria-label to HeroEnergyCard
    - Add aria-live="polite" to energy value display
    - Add aria-atomic="true" to prevent partial announcements
    - Add aria-label with full text (e.g., "24.7 kilowatt hours")
    - Add aria-hidden="true" to decorative icons
    - Add sr-only spans for screen reader context
    - _Requirements: 21.2, 21.3, 21.4, 21.8_
  
  - [ ] 16.2 Implement keyboard navigation
    - Add skip link to jump to main content
    - Ensure all interactive elements are focusable
    - Apply visible focus indicators (2px solid #3ED98A, 2px offset)
    - Test tab order follows visual hierarchy
    - Add focus-visible styles for keyboard-only focus
    - _Requirements: 21.1, 21.7_
  
  - [ ] 16.3 Verify color contrast compliance
    - Check light mode text contrast (min 4.5:1)
    - Check dark mode text contrast (min 4.5:1)
    - Check large text contrast (min 3:1 for ≥24px)
    - Test accent color #3ED98A for sufficient contrast
    - Use contrast checker tools
    - _Requirements: 21.5, 21.6_
  
  - [ ] 16.4 Add reduced motion support
    - Detect prefers-reduced-motion media query
    - Set animation durations to 0.01ms when reduced motion preferred
    - Apply to all transitions and animations
    - Test with system setting enabled
    - _Requirements: 21.9_
  
  - [ ]* 16.5 Test with screen readers
    - Test with NVDA (Windows)
    - Test with VoiceOver (macOS/iOS)
    - Verify live region announcements work
    - Verify all content is announced in logical order
    - Verify no redundant announcements
    - _Requirements: 21.1-21.9_

- [ ] 17. Implement error states and fallbacks
  - [ ] 17.1 Create loading skeletons
    - Create HeroCardSkeleton with shimmer animation
    - Create MetricCardSkeleton with shimmer animation
    - Use skeleton components during initial load
    - Match skeleton dimensions to actual components
    - _Requirements: 17.3, 20.1_
  
  - [ ] 17.2 Create empty state components
    - Design hero empty state with icon and message
    - Design metric empty state with muted display
    - Show "Waiting for data..." when no data received
    - Show "No data yet" for individual metrics
    - _Requirements: 19.7, 19.8, 19.9_
  
  - [ ] 17.3 Implement error UI components
    - Create DataFetchError component with retry button
    - Show error message and error details
    - Provide retry functionality
    - Show loading state during retry
    - _Requirements: 17.4, 19.3_
  
  - [ ] 17.4 Add WebSocket disconnection handling
    - Show toast notification on disconnection
    - Show reconnection success toast
    - Update header badge to show disconnected state
    - Continue displaying last known good data
    - _Requirements: 19.1, 19.2_

- [ ] 18. Checkpoint - Ensure core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 19. Write integration tests
  - [ ]* 19.1 Test WebSocket data flow
    - Mock Socket.IO connection
    - Simulate sensor readings
    - Verify debouncing works (max 1 update/second)
    - Verify data validation prevents bad data
    - Verify last-known-good fallback works
    - _Requirements: 16.1-16.10, 20.4_
  
  - [ ]* 19.2 Test API error recovery
    - Mock API failure scenarios
    - Verify error UI displays
    - Verify retry functionality works
    - Verify stale data continues showing during refetch
    - Verify last good data used on validation failure
    - _Requirements: 17.4, 17.5, 19.3, 19.4_
  
  - [ ]* 19.3 Test responsive layout transitions
    - Render at desktop width (1280px)
    - Verify 65/35 side-by-side layout
    - Resize to tablet width (900px)
    - Verify 2x2 grid layout
    - Resize to mobile width (375px)
    - Verify stacked layout
    - _Requirements: 13.1-13.6, 14.1-14.6, 15.1-15.6_
  
  - [ ]* 19.4 Test dark mode theme switching
    - Render in light mode
    - Verify light colors applied
    - Switch to dark mode
    - Verify dark colors applied
    - Check all components update correctly
    - _Requirements: 12.8_

- [ ]* 20. Write component unit tests
  - [ ]* 20.1 Test calculateTrend utility
    - Test positive change returns correct percentage
    - Test negative change returns correct percentage
    - Test equal values return 'neutral'
    - Test undefined values return 'no-data'
    - Test color assignment logic
    - _Requirements: 4.1-4.7_
  
  - [ ]* 20.2 Test validateSensorReading utility
    - Test valid data passes validation
    - Test voltage out of range fails
    - Test current out of range fails
    - Test power out of range fails
    - Test negative values fail
    - _Requirements: 16.7, 16.8, 16.9, 16.10_
  
  - [ ]* 20.3 Test HeroEnergyCard component
    - Test energy value formatting
    - Test trend indicator integration
    - Test empty state rendering
    - Test loading skeleton
    - Test error state
    - _Requirements: 3.1-3.9_
  
  - [ ]* 20.4 Test MetricCard component
    - Test value formatting with different precisions
    - Test color mapping (accent, amber, blue, red)
    - Test empty state with undefined value
    - Test tabular numerals applied
    - _Requirements: 8.1-8.9, 9.1-9.9, 10.1-10.9, 11.1-11.10_

- [ ]* 21. Visual regression testing
  - [ ]* 21.1 Capture baseline screenshots
    - Desktop hero card layout
    - Tablet 2x2 layout
    - Mobile stacked layout
    - Light mode and dark mode
    - Empty states
    - Loading states
    - Error states
    - _Requirements: All visual requirements_
  
  - [ ]* 21.2 Set up visual regression pipeline
    - Configure testing tool (Percy, Chromatic, or similar)
    - Add to CI/CD pipeline
    - Set acceptable diff thresholds
    - _Requirements: All visual requirements_

- [ ] 22. Final verification and polish
  - [ ] 22.1 Verify all requirements coverage
    - Review requirements 1-22
    - Confirm each acceptance criterion implemented
    - Document any deviations or exceptions
    - _Requirements: All_
  
  - [ ] 22.2 Code review and cleanup
    - Remove console.log statements
    - Remove commented-out code
    - Verify TypeScript types are correct
    - Verify no ESLint warnings
    - Format code with Prettier
    - _Requirements: All_
  
  - [ ] 22.3 Documentation updates
    - Update component documentation
    - Add JSDoc comments to public functions
    - Update README if needed
    - Document environment variables
    - _Requirements: All_
  
  - [ ] 22.4 Final QA pass
    - Test all user flows
    - Test all error scenarios
    - Test all responsive breakpoints
    - Test dark mode and light mode
    - Test with real backend data
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Testing tasks are critical for production quality but can be deferred
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow user questions
- Component tests focus on isolated unit behavior
- Integration tests verify data flow and interactions
- Visual regression tests catch unintended UI changes
- WebSocket debouncing is critical for performance (Requirement 20.4)
- Last-known-good caching prevents UI flicker on bad data (Requirements 19.5, 19.6)
- Responsive design requires testing on real devices (Requirements 13-15)
- Accessibility testing with screen readers is strongly recommended (Requirement 21)
- Dark mode support uses existing ThemeContext (Requirement 12.8)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "4.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "6.1", "7.2"] },
    { "id": 4, "tasks": ["6.2", "7.3", "8.1"] },
    { "id": 5, "tasks": ["6.3", "6.4", "6.5", "8.2"] },
    { "id": 6, "tasks": ["6.6", "6.7", "6.8"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "10.1"] },
    { "id": 8, "tasks": ["10.2", "10.3"] },
    { "id": 9, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 10, "tasks": ["12.4", "12.5"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 12, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 13, "tasks": ["15.1", "15.2", "15.3", "15.4", "15.5"] },
    { "id": 14, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] },
    { "id": 15, "tasks": ["17.1", "17.2", "17.3", "17.4"] },
    { "id": 16, "tasks": ["19.1", "19.2", "19.3", "19.4"] },
    { "id": 17, "tasks": ["20.1", "20.2", "20.3", "20.4"] },
    { "id": 18, "tasks": ["21.1", "21.2"] },
    { "id": 19, "tasks": ["22.1", "22.2", "22.3", "22.4"] }
  ]
}
```
