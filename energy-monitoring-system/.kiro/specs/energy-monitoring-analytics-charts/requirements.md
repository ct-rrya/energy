# Requirements Document

## Introduction

This document specifies requirements for implementing Energy Monitoring & Analytics visualizations on the EcoStep Dashboard using Recharts. The feature adds interactive, real-time charts to the existing dashboard page, enabling both public users and system administrators to visualize energy harvesting data from piezoelectric floor tiles. The implementation integrates with existing backend APIs, authentication, role-based access control, and WebSocket infrastructure without creating duplicate dashboards or modifying backend authorization logic.

## Glossary

- **Dashboard_Page**: The existing shared page component at `frontend/src/features/dashboard/pages/DashboardPage.tsx` that displays real-time metrics and sensor data for both public users and administrators
- **Recharts**: The charting library (version 3.9.2) already installed in the project for rendering responsive, customizable data visualizations
- **Analytics_Service**: The existing API service at `frontend/src/api/services/analytics.service.ts` that provides methods for fetching time-series data and dashboard analytics
- **Sensor_Service**: The existing API service at `frontend/src/api/services/sensor.service.ts` that provides methods for fetching sensor readings and statistics
- **Time_Series_API**: The backend endpoint `/analytics/time-series` that returns time-series data with configurable granularity (hour/day/week/month)
- **Dashboard_Analytics_API**: The backend endpoint `/analytics/dashboard` that returns comprehensive dashboard summary metrics
- **Reading_History_API**: The backend endpoint `/iot/readings/history/{sensorId}` that returns paginated historical sensor readings
- **Latest_Readings_API**: The backend endpoint `/iot/readings/latest` that returns the most recent readings from all sensors
- **TanStack_Query**: The data fetching and caching library (React Query) used throughout the frontend for server state management
- **SocketContext**: The existing React context at `frontend/src/contexts/SocketContext.tsx` that manages WebSocket connections for real-time updates
- **ThemeContext**: The existing React context that provides light/dark theme state and colors throughout the application
- **AuthContext**: The existing React context that provides authentication state, user information, and role-based access control
- **Public_User**: An unauthenticated user with read-only access to the dashboard and analytics visualizations
- **System_Administrator**: An authenticated admin user with full access to all features including device management and configuration
- **Chart_Component**: A reusable React component in `frontend/src/components/dashboard/` that renders a specific chart type with data, loading, empty, and error states
- **EcoStep_Design_System**: The existing design system documented in `frontend/DESIGN-SYSTEM.md` and `frontend/ECOSTEP-DESIGN-SYSTEM.md` that defines colors, spacing, typography, and component patterns
- **SensorReading**: TypeScript interface defining the structure of sensor data including voltage, current, power, energy, battery, temperature, and timestamp fields
- **TimeSeriesDataPoint**: TypeScript interface defining a single data point in time-series data with timestamp, value, label, and optional aggregation fields
- **DashboardAnalytics**: TypeScript interface defining the structure of dashboard summary metrics including today, yesterday, week, month, and system health data
- **Granularity**: The time interval for data aggregation in time-series queries (hour, day, week, or month)
- **MetricType**: The type of metric being visualized (power, voltage, current, battery, or energy)
- **Activity_Event**: A discrete footstep or pressure event detected by the piezoelectric tiles (currently NOT tracked as discrete events in the backend)
- **Real_Time_Update**: A WebSocket event broadcasting new sensor readings to connected clients for live chart updates
- **Chart_Filter**: User-selectable time range or period option (Today/7 Days/30 Days for line charts, Hourly/Daily/Weekly for bar charts)
- **Responsive_Layout**: Layout that adapts to screen size (desktop: 2-column grid, tablet: adaptive, mobile: stacked single column)

## Requirements

### Requirement 1: Chart Component Architecture

**User Story:** As a developer, I want reusable chart components with consistent structure, so that all visualizations follow the same patterns and maintainability is improved.

#### Acceptance Criteria

1. THE Chart_Component SHALL be implemented as a TypeScript React component in the `frontend/src/components/dashboard/` directory
2. THE Chart_Component SHALL accept props for data, loading state, error state, theme colors, and chart-specific configuration
3. THE Chart_Component SHALL render using Recharts library components (LineChart, BarChart, AreaChart)
4. THE Chart_Component SHALL display a loading skeleton WHEN data is being fetched
5. THE Chart_Component SHALL display an empty state message WHEN no data is available
6. THE Chart_Component SHALL display an error message and retry option WHEN data fetching fails
7. THE Chart_Component SHALL apply colors from ThemeContext for light and dark mode support
8. THE Chart_Component SHALL be responsive and adjust layout based on container width
9. THE Chart_Component SHALL use TypeScript for type safety with proper interfaces for props and data structures

### Requirement 2: Power Generation Over Time Chart

**User Story:** As a user, I want to see power generation trends over time with selectable time ranges, so that I can understand how energy production varies throughout different periods.

#### Acceptance Criteria

1. THE Power_Generation_Chart SHALL render as a LineChart using Recharts LineChart component
2. THE Power_Generation_Chart SHALL fetch data from Time_Series_API with metric parameter set to "power"
3. THE Power_Generation_Chart SHALL display three time filter options: "Today", "7 Days", and "30 Days"
4. WHEN the user selects "Today", THE Power_Generation_Chart SHALL fetch data with granularity set to "hour"
5. WHEN the user selects "7 Days", THE Power_Generation_Chart SHALL fetch data with granularity set to "day"
6. WHEN the user selects "30 Days", THE Power_Generation_Chart SHALL fetch data with granularity set to "day"
7. THE Power_Generation_Chart SHALL display power values in Watts (W) on the Y-axis
8. THE Power_Generation_Chart SHALL display timestamps on the X-axis formatted according to the selected granularity
9. THE Power_Generation_Chart SHALL be positioned prominently above other secondary charts in the layout
10. THE Power_Generation_Chart SHALL use TanStack_Query for data fetching with appropriate caching and refetch interval
11. THE Power_Generation_Chart SHALL update cache WHEN new sensor readings arrive via SocketContext real-time updates
12. WHEN data points exist, THE Power_Generation_Chart SHALL render a smooth line with proper interpolation
13. WHEN the time filter changes, THE Power_Generation_Chart SHALL refetch data with updated query parameters

### Requirement 3: Voltage and Current Trend Charts

**User Story:** As a user, I want to see voltage and current measurements over time, so that I can monitor the electrical characteristics of the energy harvesting system.

#### Acceptance Criteria

1. THE Voltage_Current_Charts SHALL be implemented as either a single dual-axis chart or two synchronized LineChart components
2. THE Voltage_Current_Charts SHALL fetch data from Time_Series_API with metric parameter set to "voltage" and "current"
3. THE Voltage_Current_Charts SHALL display voltage values in Volts (V) on the Y-axis
4. THE Voltage_Current_Charts SHALL display current values in Amperes (A) on the Y-axis
5. THE Voltage_Current_Charts SHALL display timestamps on the X-axis
6. THE Voltage_Current_Charts SHALL use a default time range of the last 24 hours with hourly granularity
7. THE Voltage_Current_Charts SHALL use distinct colors for voltage and current lines according to EcoStep_Design_System
8. THE Voltage_Current_Charts SHALL display a legend identifying voltage and current lines
9. WHEN implemented as synchronized charts, THE Voltage_Current_Charts SHALL align X-axis timestamps precisely
10. THE Voltage_Current_Charts SHALL use TanStack_Query for data fetching with appropriate caching

### Requirement 4: Energy Generated by Period Chart

**User Story:** As a user, I want to see energy generation aggregated by different time periods, so that I can compare production across hours, days, or weeks.

#### Acceptance Criteria

1. THE Energy_Period_Chart SHALL render as a BarChart using Recharts BarChart component
2. THE Energy_Period_Chart SHALL fetch data from Time_Series_API with metric parameter set to "energy"
3. THE Energy_Period_Chart SHALL display three period filter options: "Hourly", "Daily", and "Weekly"
4. WHEN the user selects "Hourly", THE Energy_Period_Chart SHALL fetch data for the last 24 hours with granularity set to "hour"
5. WHEN the user selects "Daily", THE Energy_Period_Chart SHALL fetch data for the last 30 days with granularity set to "day"
6. WHEN the user selects "Weekly", THE Energy_Period_Chart SHALL fetch data for the last 12 weeks with granularity set to "week"
7. THE Energy_Period_Chart SHALL display energy values in kilowatt-hours (kWh) on the Y-axis
8. THE Energy_Period_Chart SHALL display time period labels on the X-axis
9. THE Energy_Period_Chart SHALL use bar colors from EcoStep_Design_System with theme-appropriate shading
10. THE Energy_Period_Chart SHALL use TanStack_Query for data fetching with appropriate caching
11. WHEN the period filter changes, THE Energy_Period_Chart SHALL refetch data with updated query parameters

### Requirement 5: Cumulative Energy Generated Chart

**User Story:** As a user, I want to see cumulative energy generation over time, so that I can track total energy harvested and visualize growth trends.

#### Acceptance Criteria

1. THE Cumulative_Energy_Chart SHALL render as an AreaChart using Recharts AreaChart component
2. THE Cumulative_Energy_Chart SHALL fetch data from Time_Series_API with metric parameter set to "energy"
3. THE Cumulative_Energy_Chart SHALL calculate cumulative values by summing energy from all previous data points
4. THE Cumulative_Energy_Chart SHALL display cumulative energy in kilowatt-hours (kWh) on the Y-axis
5. THE Cumulative_Energy_Chart SHALL display timestamps on the X-axis
6. THE Cumulative_Energy_Chart SHALL use a default time range of the last 30 days with daily granularity
7. THE Cumulative_Energy_Chart SHALL fill the area under the curve with a gradient from EcoStep_Design_System colors
8. THE Cumulative_Energy_Chart SHALL display the total cumulative value at the latest data point
9. THE Cumulative_Energy_Chart SHALL use TanStack_Query for data fetching with appropriate caching
10. WHEN new data arrives, THE Cumulative_Energy_Chart SHALL recalculate cumulative totals from updated dataset

### Requirement 6: Activity Trend Chart Implementation Decision

**User Story:** As a developer, I want to determine whether activity/footstep tracking is available in the backend, so that I can implement the Activity Trend chart only if discrete event data exists.

#### Acceptance Criteria

1. THE Activity_Chart_Analysis SHALL examine backend API responses from Time_Series_API, Reading_History_API, and Dashboard_Analytics_API
2. THE Activity_Chart_Analysis SHALL search for discrete footstep count, activity event count, or step count fields in API response data structures
3. THE Activity_Chart_Analysis SHALL search SensorReading interface for activity-related fields beyond voltage, current, power, energy, battery, and temperature
4. IF discrete activity event data exists in the backend, THEN THE Activity_Chart SHALL be implemented as a BarChart showing event counts over time
5. IF discrete activity event data does NOT exist in the backend, THEN THE Activity_Chart SHALL NOT be implemented and requirements documentation SHALL note this limitation
6. THE Activity_Chart_Decision SHALL be documented in the design phase with clear explanation of data availability

### Requirement 7: Layout Integration with Existing Dashboard

**User Story:** As a user, I want charts to appear on the existing dashboard page below the current metrics, so that I can access all monitoring features in one place.

#### Acceptance Criteria

1. THE Chart_Layout SHALL be added to the existing Dashboard_Page component without creating a separate analytics page
2. THE Chart_Layout SHALL be positioned below the existing real-time metrics section (metric chips and featured power output card)
3. THE Chart_Layout SHALL be positioned below the existing "Sensor Nodes / Recent Readings" section
4. THE Chart_Layout SHALL use a responsive grid layout with CSS Grid or Flexbox
5. ON desktop screens (≥1024px width), THE Chart_Layout SHALL display Power_Generation_Chart spanning full width with secondary charts in a 2-column grid below
6. ON tablet screens (768px-1023px width), THE Chart_Layout SHALL adapt to a single column OR 2-column layout based on available space
7. ON mobile screens (<768px width), THE Chart_Layout SHALL display all charts stacked in a single column
8. THE Chart_Layout SHALL maintain consistent spacing and card styling from EcoStep_Design_System
9. THE Chart_Layout SHALL NOT modify existing dashboard routes, navigation, or header components
10. THE Chart_Layout SHALL preserve the existing PublicUserBanner, quick actions panel, and metric chips

### Requirement 8: Data Fetching with TanStack Query

**User Story:** As a developer, I want to use the existing TanStack Query infrastructure for data fetching, so that caching, error handling, and refetching behavior remain consistent.

#### Acceptance Criteria

1. THE Chart_Data_Hooks SHALL be implemented as custom React hooks using TanStack Query's useQuery hook
2. THE Chart_Data_Hooks SHALL call Analytics_Service or Sensor_Service methods rather than making direct API calls
3. THE Chart_Data_Hooks SHALL define appropriate query keys following the existing pattern (e.g., ['analytics', 'time-series', metric, startDate, endDate, granularity])
4. THE Chart_Data_Hooks SHALL specify staleTime based on data update frequency (e.g., 60000ms for hourly data, 300000ms for daily data)
5. THE Chart_Data_Hooks SHALL specify refetchInterval for automatic background updates (e.g., 60000ms for charts with live data)
6. THE Chart_Data_Hooks SHALL enable retry with exponential backoff for failed requests
7. THE Chart_Data_Hooks SHALL return loading state, error state, data, and refetch function to chart components
8. THE Chart_Data_Hooks SHALL use TypeScript with proper type inference from Analytics_Service and Sensor_Service return types
9. THE Chart_Data_Hooks SHALL NOT duplicate data fetching logic already present in existing hooks like useDashboardMetrics

### Requirement 9: Real-Time Chart Updates via WebSocket

**User Story:** As a user, I want charts to update in real-time when new sensor data arrives, so that I can see live energy production without manually refreshing.

#### Acceptance Criteria

1. THE Chart_Real_Time_Updates SHALL use the existing SocketContext to subscribe to WebSocket events
2. THE Chart_Real_Time_Updates SHALL listen for 'sensor:reading' events from the WebSocket connection
3. WHEN a 'sensor:reading' event is received, THE Chart_Real_Time_Updates SHALL update relevant TanStack_Query cache entries
4. THE Chart_Real_Time_Updates SHALL invalidate query keys for affected charts (e.g., ['analytics', 'time-series', 'power'] when power changes)
5. THE Chart_Real_Time_Updates SHALL NOT create a new WebSocket connection separate from SocketContext
6. THE Chart_Real_Time_Updates SHALL NOT interfere with existing WebSocket event handlers for alerts or dashboard metrics
7. THE Chart_Real_Time_Updates SHALL append new data points to existing chart data rather than refetching entire datasets when possible
8. THE Chart_Real_Time_Updates SHALL limit the number of data points displayed to prevent performance degradation (e.g., maximum 100 points for real-time line charts)
9. THE Chart_Real_Time_Updates SHALL function correctly whether the WebSocket connection is active or inactive

### Requirement 10: Role-Based Access and Security

**User Story:** As a system administrator, I want to ensure public users can view charts without accessing admin-only features, so that data visibility aligns with security requirements.

#### Acceptance Criteria

1. THE Chart_Access_Control SHALL allow both Public_User and System_Administrator roles to view all charts on Dashboard_Page
2. THE Chart_Access_Control SHALL use the existing getUserRole function from `frontend/src/lib/permissions.ts` to determine user role
3. THE Chart_Access_Control SHALL NOT display admin-only controls (e.g., sensor configuration, alert management buttons) to Public_User within chart components
4. THE Chart_Access_Control SHALL NOT modify backend API authorization or authentication logic
5. THE Chart_Access_Control SHALL fetch data from public-safe monitoring endpoints that do not expose sensitive system configuration
6. THE Chart_Access_Control SHALL NOT expose API keys, ESP32 authentication tokens, or internal system credentials in chart components
7. THE Chart_Access_Control SHALL maintain the existing PublicUserBanner display for unauthenticated users
8. THE Chart_Access_Control SHALL NOT create separate chart views or routes for public vs admin users
9. IF export functionality is added to charts in the future, THE Chart_Access_Control SHALL restrict export to System_Administrator role only

### Requirement 11: Theme Support

**User Story:** As a user, I want charts to respect my light/dark theme preference, so that visualizations are comfortable to view in any lighting condition.

#### Acceptance Criteria

1. THE Chart_Theme SHALL use ThemeContext to access current theme state ('light' or 'dark')
2. THE Chart_Theme SHALL apply theme-appropriate colors for chart backgrounds, grid lines, axes, and labels
3. THE Chart_Theme SHALL apply theme-appropriate colors for line strokes, bar fills, and area gradients from EcoStep_Design_System
4. THE Chart_Theme SHALL ensure text labels remain readable with sufficient contrast in both light and dark modes
5. THE Chart_Theme SHALL update chart colors dynamically WHEN the user toggles theme preference
6. THE Chart_Theme SHALL use the existing color palette defined in EcoStep_Design_System (e.g., accent: light #2FBF71, dark #3ED98A)
7. THE Chart_Theme SHALL NOT hardcode color values but instead reference theme-provided color variables or constants

### Requirement 12: Loading, Empty, and Error States

**User Story:** As a user, I want to see appropriate feedback when charts are loading, empty, or encounter errors, so that I understand the current state of data visualization.

#### Acceptance Criteria

1. WHEN data is being fetched, THE Chart_Component SHALL display a loading skeleton or spinner indicating data is loading
2. WHEN data fetching completes with zero data points, THE Chart_Component SHALL display an empty state message (e.g., "No data available for this time range")
3. WHEN data fetching fails with a network error, THE Chart_Component SHALL display an error message and a "Retry" button
4. WHEN the user clicks "Retry", THE Chart_Component SHALL trigger a refetch of chart data using TanStack_Query's refetch function
5. THE Chart_Loading_State SHALL match the visual style of loading states elsewhere in the Dashboard_Page
6. THE Chart_Empty_State SHALL suggest possible actions (e.g., "Try selecting a different time range" or "No sensor data recorded yet")
7. THE Chart_Error_State SHALL display the error message text when available for debugging purposes
8. THE Chart_Component SHALL transition smoothly between loading, error, empty, and data-loaded states without layout shift

### Requirement 13: Chart Tooltips and Interactivity

**User Story:** As a user, I want to hover over data points to see detailed values, so that I can inspect specific measurements at particular times.

#### Acceptance Criteria

1. THE Chart_Component SHALL enable Recharts Tooltip component for all chart types (LineChart, BarChart, AreaChart)
2. WHEN the user hovers over a data point or bar, THE Chart_Tooltip SHALL display a tooltip with the exact value and timestamp
3. THE Chart_Tooltip SHALL format values with appropriate units (W for power, V for voltage, A for current, kWh for energy)
4. THE Chart_Tooltip SHALL format timestamps in a human-readable format (e.g., "Jan 15, 2024 2:30 PM" for hourly data, "Jan 15" for daily data)
5. THE Chart_Tooltip SHALL use theme-appropriate background color and text color from ThemeContext
6. THE Chart_Tooltip SHALL display multiple values WHEN hovering over charts with multiple metrics (e.g., voltage and current)
7. THE Chart_Component SHALL enable Recharts Legend component for charts with multiple data series
8. THE Chart_Component SHALL support responsive tooltip positioning to prevent tooltips from extending beyond chart boundaries

### Requirement 14: Chart Component File Organization

**User Story:** As a developer, I want chart components organized in a clear directory structure, so that code is easy to locate and maintain.

#### Acceptance Criteria

1. THE Chart_Components SHALL be created in the `frontend/src/components/dashboard/` directory
2. THE Chart_Components SHALL include individual component files: PowerGenerationChart.tsx, VoltageCurrentChart.tsx, EnergyPeriodChart.tsx, CumulativeEnergyChart.tsx
3. THE Chart_Components SHALL include shared state components: ChartLoadingState.tsx, ChartEmptyState.tsx, ChartErrorState.tsx
4. THE Chart_Components SHALL include a shared types file: chartTypes.ts defining common interfaces for chart props and data structures
5. THE Chart_Components SHALL include custom data fetching hooks in `frontend/src/features/dashboard/hooks/` (e.g., useTimeSeriesData.ts, useChartRealTimeUpdates.ts)
6. THE Chart_Components SHALL include utility functions for data transformation in a utils file if needed (e.g., calculateCumulative, formatChartData)
7. THE Chart_Components SHALL export components from an index.ts barrel file for simplified imports
8. THE Chart_Components SHALL NOT create duplicate type definitions already present in `frontend/src/features/analytics/types/analytics.types.ts`

### Requirement 15: Build and Verification

**User Story:** As a developer, I want the implementation to build successfully and pass verification checks, so that the feature is production-ready.

#### Acceptance Criteria

1. THE Implementation SHALL compile without TypeScript errors when running `npm run build` in the frontend directory
2. THE Implementation SHALL pass ESLint checks without errors when running `npm run lint` in the frontend directory
3. THE Implementation SHALL render all charts successfully on desktop browsers (Chrome, Firefox, Safari, Edge)
4. THE Implementation SHALL render all charts successfully on mobile browsers (iOS Safari, Chrome Mobile)
5. THE Implementation SHALL function correctly for Public_User role (unauthenticated access)
6. THE Implementation SHALL function correctly for System_Administrator role (authenticated access)
7. THE Implementation SHALL display appropriate loading states during initial data fetch
8. THE Implementation SHALL display appropriate empty states when no data is available
9. THE Implementation SHALL display appropriate error states when API requests fail
10. THE Implementation SHALL respond correctly to time filter and period filter interactions
11. THE Implementation SHALL update charts when theme is toggled between light and dark mode
12. THE Implementation SHALL NOT break existing dashboard functionality (quick actions, metric chips, sensor nodes list, PublicUserBanner)
13. THE Implementation SHALL NOT modify backend API endpoints, database schemas, or ESP32 communication protocols
14. THE Implementation SHALL NOT introduce console errors or warnings during normal operation

## Special Guidance

### Parser and Serializer Requirements

This feature does NOT include parsers or serializers. Chart data is consumed directly from existing API JSON responses without custom parsing or serialization logic beyond standard JavaScript/TypeScript JSON handling.

### Activity/Footstep Chart Limitation

Based on the current backend data structures (SensorReading, TimeSeriesDataPoint, DashboardAnalytics), **discrete activity or footstep event counts are NOT available**. The backend provides continuous measurements (voltage, current, power, energy, battery, temperature) but does NOT track individual pressure events or footsteps as discrete countable occurrences.

**Recommendation:** Requirement 6 allows for implementation of the Activity Trend chart ONLY if discrete event data becomes available in the future. The design phase should verify data availability and document this limitation clearly. If activity tracking is a priority, a separate backend requirement would be needed to instrument and store discrete event counts.

### Real-Time Update Strategy

The implementation should follow this pattern for real-time updates:

1. **Initial Load:** Fetch historical data via TanStack Query from `/analytics/time-series`
2. **Background Refresh:** Use `refetchInterval` to periodically update data (e.g., every 60 seconds)
3. **WebSocket Integration:** Listen to `sensor:reading` events via SocketContext and invalidate affected query keys to trigger incremental updates
4. **Optimization:** Limit chart data points to prevent memory/performance issues (e.g., max 100 points for real-time views, use aggregated data for longer time ranges)

### Responsive Chart Sizing

Charts should use Recharts ResponsiveContainer component with percentage-based widths to adapt to different screen sizes. Consider these breakpoints:

- **Desktop (≥1024px):** Power chart full width, secondary charts 2-column grid (50% width each)
- **Tablet (768px-1023px):** Power chart full width, secondary charts single column OR 2-column based on space
- **Mobile (<768px):** All charts stacked single column (100% width each)

### Data Granularity Selection

Choose appropriate granularity based on time range to balance detail and API performance:

- **Today (24 hours):** Hourly granularity (≤24 data points)
- **7 Days:** Daily granularity (7 data points) OR hourly if hourly detail is valuable (≤168 points)
- **30 Days:** Daily granularity (≤30 data points)
- **Real-time updates:** Consider using minute-level granularity for very recent data, then aggregate to hourly for older data
