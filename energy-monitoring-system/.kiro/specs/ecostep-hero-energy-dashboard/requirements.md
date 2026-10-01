# Requirements Document: EcoStep Hero Energy Dashboard

## Introduction

This document specifies requirements for redesigning the EcoStep Central dashboard to establish a clear visual hierarchy with energy output (kWh) as the primary focus. The redesign transforms the current equal-weight metric grid into a hero-focused layout inspired by modern industrial monitoring systems, enabling users to immediately understand current energy generation within 1 second.

The dashboard maintains real-time monitoring capabilities while introducing a data-first visual hierarchy: a large hero energy card (60-65% width) displays primary KPI information, while secondary metrics (Voltage, Power, Current, Step Count) appear in a supporting column (35-40% width).

## Glossary

- **Hero_Card**: The primary energy display component occupying 60-65% of the dashboard width, approximately 2x larger than metric cards
- **Dashboard_System**: The EcoStep Central dashboard application
- **Metric_Column**: The right-side column containing four stacked metric cards for secondary measurements
- **Energy_Value**: The current daily energy generated measured in kilowatt-hours (kWh)
- **Trend_Indicator**: A visual component showing percentage change compared to previous day with color coding
- **Mini_Trend_Graph**: A compact line chart showing recent energy output trends for quick visual reference
- **AI_Insight**: An executive summary text generated from historical pattern analysis
- **Metric_Card**: A component displaying a single measurement with value, unit, and optional trend data
- **System_Status_Badge**: A visual indicator showing system operational state (Online, Offline, Warning)
- **Real_Time_Data**: Sensor readings delivered via WebSocket within 1 second of measurement
- **Admin_User**: Authenticated user with full dashboard access and configuration permissions
- **Public_User**: Unauthenticated user with read-only dashboard viewing access
- **Desktop_Viewport**: Display width 1024px or greater
- **Tablet_Viewport**: Display width between 768px and 1023px
- **Mobile_Viewport**: Display width less than 768px
- **Primary_KPI**: Key Performance Indicator designated as most important (daily energy output)
- **Secondary_Metrics**: Supporting measurements that provide context (Voltage, Power, Current, Step Count)

## Requirements

### Requirement 1: Layout Structure and Navigation

**User Story:** As a dashboard user, I want a clear page structure with consistent navigation, so that I can understand the layout hierarchy and access other system features.

#### Acceptance Criteria

1. THE Dashboard_System SHALL maintain the existing collapsible navigation sidebar on the left edge
2. THE Dashboard_System SHALL render a three-section layout consisting of header, hero section, and metrics section
3. THE Dashboard_System SHALL allocate 60% to 65% of the main content width to the Hero_Card
4. THE Dashboard_System SHALL allocate 35% to 40% of the main content width to the Metric_Column
5. THE Dashboard_System SHALL position the Metric_Column to the right of the Hero_Card
6. THE Dashboard_System SHALL maintain a maximum layout width of 1600px
7. THE Dashboard_System SHALL apply consistent spacing of 24px between major layout sections

### Requirement 2: Dashboard Header Information

**User Story:** As a dashboard user, I want to see contextual information in the header, so that I know when data was last updated and the current system state.

#### Acceptance Criteria

1. THE Dashboard_System SHALL display the title "EcoStep Central" in the header
2. THE Dashboard_System SHALL display the subtitle "Real-time monitoring of piezoelectric energy harvesting system" below the title
3. THE Dashboard_System SHALL display the current date in the header using the format "Month Day, Year"
4. THE Dashboard_System SHALL display the current timestamp in the header using 12-hour format with AM/PM indicator
5. THE Dashboard_System SHALL update the timestamp every 1 second
6. THE Dashboard_System SHALL display a System_Status_Badge in the header indicating operational state
7. WHEN the system database connection is active, THE Dashboard_System SHALL display the System_Status_Badge as "Online" with green accent color
8. WHEN the system database connection is inactive, THE Dashboard_System SHALL display the System_Status_Badge as "Offline" with red accent color
9. WHEN system health checks detect degraded performance, THE Dashboard_System SHALL display the System_Status_Badge as "Warning" with amber accent color

### Requirement 3: Hero Energy Card Primary Display

**User Story:** As a dashboard user, I want to immediately see the current energy output in a prominent display, so that I can assess system performance at a glance.

#### Acceptance Criteria

1. THE Hero_Card SHALL occupy 60% to 65% of the main content area width on Desktop_Viewport
2. THE Hero_Card SHALL be approximately 2 times larger in total area than any individual Metric_Card
3. THE Hero_Card SHALL display the Energy_Value with typography size between 56px and 72px
4. THE Hero_Card SHALL display the unit "kWh" adjacent to the Energy_Value with typography size between 24px and 32px
5. THE Hero_Card SHALL use tabular numerals for the Energy_Value display
6. THE Hero_Card SHALL display the label "Today's Energy Generated" above the Energy_Value
7. THE Hero_Card SHALL apply the accent color #3ED98A to the Energy_Value text
8. WHEN Energy_Value is undefined, THE Hero_Card SHALL display "0.0" with 50% opacity
9. THE Hero_Card SHALL update the Energy_Value within 1 second of receiving new Real_Time_Data

### Requirement 4: Hero Card Trend Indicator

**User Story:** As a dashboard user, I want to see how today's energy compares to yesterday, so that I can quickly assess performance trends.

#### Acceptance Criteria

1. THE Hero_Card SHALL display a Trend_Indicator showing percentage change compared to previous day
2. WHEN today's Energy_Value exceeds yesterday's value, THE Trend_Indicator SHALL display the percentage with green color #3ED98A and an upward arrow icon
3. WHEN today's Energy_Value is less than yesterday's value, THE Trend_Indicator SHALL display the percentage with amber color #F59E0B and a downward arrow icon
4. WHEN today's Energy_Value equals yesterday's value, THE Trend_Indicator SHALL display "No change" with gray color and a horizontal line icon
5. THE Trend_Indicator SHALL format percentage values to one decimal place
6. THE Trend_Indicator SHALL position below the Energy_Value with 12px spacing
7. WHEN historical data is unavailable, THE Trend_Indicator SHALL display "No comparison data" with gray color

### Requirement 5: Hero Card Mini Trend Graph

**User Story:** As a dashboard user, I want a small trend visualization in the hero card, so that I can see energy patterns at a glance without navigating to detailed analytics.

#### Acceptance Criteria

1. THE Hero_Card SHALL display a Mini_Trend_Graph showing energy output over time
2. THE Mini_Trend_Graph SHALL display the most recent 24 hours of data
3. THE Mini_Trend_Graph SHALL use a line chart visualization style
4. THE Mini_Trend_Graph SHALL occupy no more than 25% of the Hero_Card height
5. THE Mini_Trend_Graph SHALL use the accent color #3ED98A for the trend line
6. THE Mini_Trend_Graph SHALL omit axis labels and gridlines for minimal visual weight
7. THE Mini_Trend_Graph SHALL position above the AI_Insight section with 16px spacing
8. WHEN trend data contains fewer than 2 data points, THE Mini_Trend_Graph SHALL display "Insufficient data" message

### Requirement 6: Hero Card AI Insight Section

**User Story:** As a dashboard user, I want contextual insights about energy patterns, so that I understand what the data means without detailed analysis.

#### Acceptance Criteria

1. THE Hero_Card SHALL display an AI_Insight section at the bottom of the card
2. THE AI_Insight section SHALL be visually separated from other Hero_Card content with a subtle horizontal divider
3. THE AI_Insight section SHALL display executive summary text between 60 and 150 characters
4. THE AI_Insight section SHALL use muted text color (60% opacity of primary text color)
5. THE AI_Insight section SHALL use typography size between 13px and 15px
6. THE AI_Insight section SHALL apply 16px padding above the divider line
7. WHEN AI analysis is unavailable, THE AI_Insight section SHALL display "Analysis in progress" with gray color
8. THE Dashboard_System SHALL update AI_Insight content when new pattern analysis becomes available

### Requirement 7: Metrics Column Layout and Cards

**User Story:** As a dashboard user, I want supporting metrics displayed in an organized column, so that I can view secondary measurements without distraction from the primary energy KPI.

#### Acceptance Criteria

1. THE Metric_Column SHALL contain exactly 4 Metric_Cards stacked vertically
2. THE Metric_Column SHALL display Metric_Cards in this order from top to bottom: Voltage, Power, Current, Step Count
3. THE Metric_Column SHALL apply 16px vertical spacing between Metric_Cards
4. THE Metric_Column SHALL occupy 35% to 40% of the main content area width on Desktop_Viewport
5. EACH Metric_Card SHALL have equal height when displayed in the Metric_Column
6. NO Metric_Card SHALL exceed 50% of the Hero_Card total area
7. THE Metric_Column SHALL position to the right of the Hero_Card with 24px horizontal spacing

### Requirement 8: Voltage Metric Card Display

**User Story:** As a dashboard user, I want to see current voltage measurement, so that I can monitor electrical system voltage levels.

#### Acceptance Criteria

1. THE Voltage Metric_Card SHALL display the label "Voltage" in 13px uppercase typography
2. THE Voltage Metric_Card SHALL display the voltage value with typography size between 28px and 36px
3. THE Voltage Metric_Card SHALL display the unit "V" adjacent to the voltage value
4. THE Voltage Metric_Card SHALL format voltage values to 1 decimal place
5. THE Voltage Metric_Card SHALL use tabular numerals for the voltage value display
6. THE Voltage Metric_Card SHALL apply accent color #3ED98A to the voltage value text
7. WHEN voltage data is undefined, THE Voltage Metric_Card SHALL display "0.0" with 50% opacity
8. THE Voltage Metric_Card SHALL display a percentage change indicator below the value
9. THE Voltage Metric_Card SHALL update within 1 second of receiving new Real_Time_Data

### Requirement 9: Power Metric Card Display

**User Story:** As a dashboard user, I want to see current power output, so that I can monitor instantaneous power generation.

#### Acceptance Criteria

1. THE Power Metric_Card SHALL display the label "Power" in 13px uppercase typography
2. THE Power Metric_Card SHALL display the power value with typography size between 28px and 36px
3. THE Power Metric_Card SHALL display the unit "W" adjacent to the power value
4. THE Power Metric_Card SHALL format power values to 1 decimal place
5. THE Power Metric_Card SHALL use tabular numerals for the power value display
6. THE Power Metric_Card SHALL apply amber color #F59E0B to the power value text
7. WHEN power data is undefined, THE Power Metric_Card SHALL display "0.0" with 50% opacity
8. THE Power Metric_Card SHALL display a percentage change indicator below the value
9. THE Power Metric_Card SHALL update within 1 second of receiving new Real_Time_Data

### Requirement 10: Current Metric Card Display

**User Story:** As a dashboard user, I want to see current electrical current measurement, so that I can monitor amperage levels.

#### Acceptance Criteria

1. THE Current Metric_Card SHALL display the label "Current" in 13px uppercase typography
2. THE Current Metric_Card SHALL display the current value with typography size between 28px and 36px
3. THE Current Metric_Card SHALL display the unit "A" adjacent to the current value
4. THE Current Metric_Card SHALL format current values to 2 decimal places
5. THE Current Metric_Card SHALL use tabular numerals for the current value display
6. THE Current Metric_Card SHALL apply blue color #3B82F6 to the current value text
7. WHEN current data is undefined, THE Current Metric_Card SHALL display "0.00" with 50% opacity
8. THE Current Metric_Card SHALL display a percentage change indicator below the value
9. THE Current Metric_Card SHALL update within 1 second of receiving new Real_Time_Data

### Requirement 11: Step Count Metric Card Display

**User Story:** As a dashboard user, I want to see cumulative step count, so that I can track foot traffic activity generating energy.

#### Acceptance Criteria

1. THE Step Count Metric_Card SHALL display the label "Steps Today" in 13px uppercase typography
2. THE Step Count Metric_Card SHALL display a foot icon (👣) adjacent to the label
3. THE Step Count Metric_Card SHALL display the step count value with typography size between 28px and 36px
4. THE Step Count Metric_Card SHALL format step count as an integer with comma separators for thousands
5. THE Step Count Metric_Card SHALL use tabular numerals for the step count display
6. THE Step Count Metric_Card SHALL apply accent color #3ED98A to the step count value text
7. WHEN step count data is undefined, THE Step Count Metric_Card SHALL display "0" with 50% opacity
8. THE Step Count Metric_Card SHALL display a mini sparkline showing hourly step activity
9. THE Step Count Metric_Card SHALL display peak hour information when available
10. THE Step Count Metric_Card SHALL update within 1 second of receiving new Real_Time_Data

### Requirement 12: Visual Design System Compliance

**User Story:** As a dashboard user, I want a clean, professional interface without distracting visual effects, so that I can focus on data rather than decorative elements.

#### Acceptance Criteria

1. THE Dashboard_System SHALL use #3ED98A as the single primary accent color
2. THE Dashboard_System SHALL NOT apply gradient backgrounds to any card component
3. THE Dashboard_System SHALL NOT apply glowing border effects to any component
4. THE Dashboard_System SHALL NOT use colorful icon boxes as decorative elements
5. THE Dashboard_System SHALL apply border radius between 12px and 16px to all card components
6. THE Dashboard_System SHALL use subtle box shadows with maximum 8px blur radius
7. THE Dashboard_System SHALL establish visual hierarchy through typography size differences rather than color intensity
8. THE Dashboard_System SHALL maintain light mode and dark mode theme compatibility
9. THE Dashboard_System SHALL use the existing design token system for colors, spacing, and typography

### Requirement 13: Desktop Responsive Layout

**User Story:** As a dashboard user on a desktop computer, I want the hero and metrics displayed side-by-side, so that I can view all information without scrolling.

#### Acceptance Criteria

1. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL display the Hero_Card on the left side
2. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL display the Metric_Column on the right side
3. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL stack all 4 Metric_Cards vertically in the Metric_Column
4. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL allocate 60% to 65% width to the Hero_Card
5. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL allocate 35% to 40% width to the Metric_Column
6. WHEN viewport width is 1024px or greater, THE Dashboard_System SHALL align the Hero_Card and Metric_Column top edges

### Requirement 14: Tablet Responsive Layout

**User Story:** As a dashboard user on a tablet device, I want the layout adapted for medium screens, so that all content remains readable and accessible.

#### Acceptance Criteria

1. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL display the Hero_Card at full width above the metrics
2. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL display Metric_Cards in a 2x2 grid layout
3. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL arrange Voltage and Power cards in the first row
4. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL arrange Current and Step Count cards in the second row
5. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL apply 16px spacing between grid cells
6. WHEN viewport width is between 768px and 1023px, THE Dashboard_System SHALL scale Hero_Card typography to 48-56px for Energy_Value

### Requirement 15: Mobile Responsive Layout

**User Story:** As a dashboard user on a mobile device, I want all components stacked vertically, so that I can scroll through information on a small screen.

#### Acceptance Criteria

1. WHEN viewport width is less than 768px, THE Dashboard_System SHALL stack all components vertically
2. WHEN viewport width is less than 768px, THE Dashboard_System SHALL display components in this order: Header, Hero_Card, Voltage, Power, Current, Step Count
3. WHEN viewport width is less than 768px, THE Dashboard_System SHALL render each Metric_Card at full width
4. WHEN viewport width is less than 768px, THE Dashboard_System SHALL apply 16px vertical spacing between all components
5. WHEN viewport width is less than 768px, THE Dashboard_System SHALL scale Hero_Card typography to 36-48px for Energy_Value
6. WHEN viewport width is less than 768px, THE Dashboard_System SHALL reduce Hero_Card padding to 16px

### Requirement 16: Real-Time Data Integration

**User Story:** As a dashboard user, I want data to update automatically without page refresh, so that I see current system state at all times.

#### Acceptance Criteria

1. THE Dashboard_System SHALL establish WebSocket connection to the backend on page load
2. THE Dashboard_System SHALL subscribe to real-time sensor data updates via WebSocket
3. WHEN Real_Time_Data is received via WebSocket, THE Dashboard_System SHALL update voltage display within 1 second
4. WHEN Real_Time_Data is received via WebSocket, THE Dashboard_System SHALL update current display within 1 second
5. WHEN Real_Time_Data is received via WebSocket, THE Dashboard_System SHALL update power display within 1 second
6. WHEN Real_Time_Data is received via WebSocket, THE Dashboard_System SHALL update step count display within 1 second
7. WHEN Real_Time_Data is received via WebSocket, THE Dashboard_System SHALL validate data is within reasonable ranges before display
8. IF voltage value exceeds 500V or is negative, THEN THE Dashboard_System SHALL log a validation warning and use last known good value
9. IF current value exceeds 100A or is negative, THEN THE Dashboard_System SHALL log a validation warning and use last known good value
10. IF power value exceeds 50000W or is negative, THEN THE Dashboard_System SHALL log a validation warning and use last known good value

### Requirement 17: Daily Energy Metrics Fetching

**User Story:** As a dashboard user, I want daily energy totals fetched from the API, so that the hero card displays accurate cumulative energy data.

#### Acceptance Criteria

1. THE Dashboard_System SHALL fetch daily energy metrics via REST API on page load
2. THE Dashboard_System SHALL fetch daily energy metrics every 60 seconds
3. THE Dashboard_System SHALL display a loading skeleton for the Hero_Card while fetching initial data
4. IF daily energy API request fails, THEN THE Dashboard_System SHALL display an error message with retry button
5. IF daily energy API request fails, THEN THE Dashboard_System SHALL use last successfully fetched data if available
6. THE Dashboard_System SHALL validate daily energy value is between 0 and 1000 kWh before display
7. IF daily energy value is outside valid range, THEN THE Dashboard_System SHALL log a validation warning and use last known good value

### Requirement 18: User Role Access Control

**User Story:** As a system administrator, I want both admin and public users to access the dashboard, so that monitoring data is available to appropriate audiences.

#### Acceptance Criteria

1. THE Dashboard_System SHALL allow Admin_User to access all dashboard features
2. THE Dashboard_System SHALL allow Public_User to access all dashboard viewing features
3. THE Dashboard_System SHALL display a "Public Viewer" badge for Public_User
4. THE Dashboard_System SHALL display an "Administrator" badge for Admin_User
5. THE Dashboard_System SHALL NOT restrict any Hero_Card content based on user role
6. THE Dashboard_System SHALL NOT restrict any Metric_Card content based on user role
7. THE Dashboard_System SHALL maintain navigation sidebar access for both Admin_User and Public_User

### Requirement 19: Error Handling and Fallback States

**User Story:** As a dashboard user, I want graceful error handling when data is unavailable, so that the interface remains functional during connectivity issues.

#### Acceptance Criteria

1. WHEN WebSocket connection is disconnected, THE Dashboard_System SHALL display a disconnection indicator in the header
2. WHEN WebSocket connection is disconnected, THE Dashboard_System SHALL continue displaying last received Real_Time_Data
3. WHEN API request fails, THE Dashboard_System SHALL display an error message with retry functionality
4. WHEN API request fails, THE Dashboard_System SHALL continue displaying last successfully fetched data if available
5. THE Dashboard_System SHALL store last known good values for all metrics in component state
6. WHEN new data fails validation, THE Dashboard_System SHALL fall back to last known good value
7. THE Dashboard_System SHALL display empty state indicators when no data has ever been received
8. WHEN Energy_Value has never been received, THE Hero_Card SHALL display "Waiting for data" message
9. WHEN sensor readings have never been received, THE Metric_Cards SHALL display "No data yet" message

### Requirement 20: Performance and Rendering Optimization

**User Story:** As a dashboard user, I want smooth, responsive performance, so that the interface remains usable during high-frequency data updates.

#### Acceptance Criteria

1. THE Dashboard_System SHALL wrap Hero_Card component with React.memo to prevent unnecessary re-renders
2. THE Dashboard_System SHALL wrap each Metric_Card component with React.memo to prevent unnecessary re-renders
3. THE Dashboard_System SHALL use React.useMemo for formatted value calculations in all display components
4. THE Dashboard_System SHALL debounce WebSocket data updates to maximum 1 update per second per metric
5. THE Dashboard_System SHALL apply CSS containment (contain: layout style) to card components
6. THE Dashboard_System SHALL avoid layout thrashing by batching DOM updates
7. THE Dashboard_System SHALL lazy load the Mini_Trend_Graph component
8. THE Dashboard_System SHALL use requestAnimationFrame for smooth visual updates

### Requirement 21: Accessibility Requirements

**User Story:** As a dashboard user with accessibility needs, I want keyboard navigation and screen reader support, so that I can access all dashboard information.

#### Acceptance Criteria

1. THE Dashboard_System SHALL provide a skip link to jump to main dashboard content
2. THE Dashboard_System SHALL apply proper ARIA labels to all interactive elements
3. THE Dashboard_System SHALL ensure all Hero_Card content has semantic HTML structure
4. THE Dashboard_System SHALL ensure all Metric_Card content has semantic HTML structure
5. THE Dashboard_System SHALL maintain minimum 4.5:1 contrast ratio for all text in light mode
6. THE Dashboard_System SHALL maintain minimum 4.5:1 contrast ratio for all text in dark mode
7. THE Dashboard_System SHALL support keyboard navigation for all interactive elements
8. THE Dashboard_System SHALL announce Real_Time_Data updates to screen readers using ARIA live regions
9. THE Dashboard_System SHALL respect user's prefers-reduced-motion system setting for animations

### Requirement 22: Dashboard Scope and Analytics Separation

**User Story:** As a dashboard user, I want the overview dashboard focused on current state, so that I can distinguish between real-time monitoring and historical analysis.

#### Acceptance Criteria

1. THE Dashboard_System SHALL NOT include voltage trend charts in the dashboard layout
2. THE Dashboard_System SHALL NOT include current trend charts in the dashboard layout
3. THE Dashboard_System SHALL NOT include energy by time period charts in the dashboard layout
4. THE Dashboard_System SHALL NOT include cumulative energy graphs in the dashboard layout
5. THE Dashboard_System SHALL answer the question "What is happening right now?" within 1 second of page load
6. THE Dashboard_System SHALL provide navigation link to Historical Analytics page for detailed trend analysis
7. THE Mini_Trend_Graph SHALL serve as a preview only and SHALL NOT replace detailed analytics

