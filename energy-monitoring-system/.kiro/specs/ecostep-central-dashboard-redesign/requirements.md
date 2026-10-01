# Requirements Document

## Introduction

The EcoStep Central Dashboard Redesign transforms the current dashboard from a mixed-purpose interface into a focused real-time monitoring system. The redesigned dashboard will clearly answer "What is the current state of the EcoStep system right now?" by displaying only current metrics, step activity, and system status. All historical analytics and trend visualizations will remain in the separate Analytics tab, creating a clear conceptual separation between real-time monitoring (NOW) and historical analysis (OVER TIME).

## Glossary

- **EcoStep_Central**: The main dashboard page that displays real-time system monitoring information
- **Analytics_Tab**: A separate page dedicated to historical data visualization and trend analysis
- **Step_Activity_Card**: A prominent UI component displaying the current day's footstep count
- **Electrical_Metrics_Grid**: A compact grid of four cards showing Voltage, Current, Power, and Energy Today
- **System_Status_Area**: A UI section displaying IoT connection status, data transmission status, and device health
- **Real_Time_Data**: Data representing the current state of the system (not historical)
- **Historical_Data**: Time-series data used for trend analysis and period comparisons
- **Telemetry**: Real-time measurements received from IoT devices
- **Empty_State**: A UI state displayed when no data is available

## Requirements

### Requirement 1: Real-Time Monitoring Dashboard

**User Story:** As a user, I want EcoStep Central to show only current system state, so that I can quickly understand what is happening right now without being distracted by historical data.

#### Acceptance Criteria

1. THE EcoStep_Central SHALL display only real-time data for current system state
2. THE EcoStep_Central SHALL display current Voltage in Volts (V)
3. THE EcoStep_Central SHALL display current Current in Amperes (A)
4. THE EcoStep_Central SHALL display current Power in Watts (W)
5. THE EcoStep_Central SHALL display Energy Today in kilowatt-hours (kWh)
6. THE EcoStep_Central SHALL NOT display any historical trend charts
7. THE EcoStep_Central SHALL NOT display any period comparison visualizations
8. THE EcoStep_Central SHALL NOT display any cumulative historical data

### Requirement 2: Step Activity Monitoring

**User Story:** As a user, I want to see today's step count prominently displayed, so that I can immediately understand the primary activity driving energy generation.

#### Acceptance Criteria

1. THE Step_Activity_Card SHALL be visually dominant in the layout hierarchy
2. THE Step_Activity_Card SHALL display the count of steps detected today
3. WHEN no telemetry data has been received, THE Step_Activity_Card SHALL display the message "Waiting for footstep data"
4. THE Step_Activity_Card SHALL occupy a larger visual area than the Electrical_Metrics_Grid
5. THE Step_Activity_Card SHALL update in real-time when new step data is received

### Requirement 3: Electrical Metrics Display

**User Story:** As a user, I want to see current electrical measurements in a compact format, so that I can monitor system performance without visual clutter.

#### Acceptance Criteria

1. THE Electrical_Metrics_Grid SHALL display exactly four metric cards
2. THE Electrical_Metrics_Grid SHALL include a Voltage card displaying current voltage in Volts
3. THE Electrical_Metrics_Grid SHALL include a Current card displaying current amperage in Amperes
4. THE Electrical_Metrics_Grid SHALL include a Power card displaying current power in Watts
5. THE Electrical_Metrics_Grid SHALL include an Energy Today card displaying today's energy in kilowatt-hours
6. THE Electrical_Metrics_Grid SHALL use a compact card design that is smaller than the Step_Activity_Card
7. THE Electrical_Metrics_Grid SHALL occupy a secondary position in the visual hierarchy
8. WHEN telemetry data is unavailable, THE Electrical_Metrics_Grid SHALL display a placeholder value or loading state

### Requirement 4: System Status Monitoring

**User Story:** As a user, I want to see the health and connectivity status of the IoT system, so that I can identify connection issues quickly.

#### Acceptance Criteria

1. THE System_Status_Area SHALL display IoT connection status
2. THE System_Status_Area SHALL display data transmission status
3. THE System_Status_Area SHALL display the timestamp of the last received data
4. THE System_Status_Area SHALL indicate whether devices are online or offline
5. THE System_Status_Area SHALL occupy a supporting position in the visual hierarchy
6. WHEN the IoT connection is lost, THE System_Status_Area SHALL clearly indicate the disconnected state

### Requirement 5: Visual Hierarchy and Layout

**User Story:** As a user on a desktop device, I want the layout to emphasize step activity as primary information, so that I can quickly focus on the most important metric.

#### Acceptance Criteria

1. THE EcoStep_Central SHALL implement a three-tier visual hierarchy: primary, secondary, and supporting
2. THE Step_Activity_Card SHALL occupy the primary tier of visual hierarchy
3. THE Electrical_Metrics_Grid SHALL occupy the secondary tier of visual hierarchy
4. THE System_Status_Area SHALL occupy the supporting tier of visual hierarchy
5. THE Step_Activity_Card SHALL be visually larger than any individual metric card in the Electrical_Metrics_Grid
6. THE layout SHALL use whitespace intentionally to reduce visual clutter
7. THE layout SHALL emphasize numerical data over decorative elements

### Requirement 6: Historical Analytics Separation

**User Story:** As a user, I want historical charts to remain in the Analytics tab, so that I can access them when I need trend analysis without cluttering my real-time monitoring view.

#### Acceptance Criteria

1. THE Analytics_Tab SHALL display the Power Generation Over Time chart
2. THE Analytics_Tab SHALL display the Voltage Trend chart
3. THE Analytics_Tab SHALL display the Current Trend chart
4. THE Analytics_Tab SHALL display the Energy Generated by Period chart
5. THE Analytics_Tab SHALL display the Cumulative Energy Generated chart
6. THE Analytics_Tab SHALL display the Steps Over Time chart
7. THE Analytics_Tab SHALL display the Step Activity vs. Energy Output chart
8. THE EcoStep_Central SHALL NOT duplicate any charts that exist in the Analytics_Tab

### Requirement 7: Responsive Design

**User Story:** As a user on various devices, I want the dashboard to adapt to different screen sizes, so that I can monitor the system from desktop, tablet, or mobile devices.

#### Acceptance Criteria

1. THE EcoStep_Central SHALL render correctly on desktop screen sizes (1024px and above)
2. THE EcoStep_Central SHALL render correctly on tablet screen sizes (768px to 1023px)
3. THE EcoStep_Central SHALL render correctly on mobile screen sizes (below 768px)
4. WHEN displayed on mobile devices, THE EcoStep_Central SHALL stack components vertically
5. WHEN displayed on tablet devices, THE EcoStep_Central SHALL adjust the grid layout to maintain readability
6. THE visual hierarchy SHALL be preserved across all screen sizes

### Requirement 8: Theme Support

**User Story:** As a user, I want the redesigned dashboard to work in both light and dark modes, so that I can use my preferred visual theme.

#### Acceptance Criteria

1. THE EcoStep_Central SHALL render correctly in light mode
2. THE EcoStep_Central SHALL render correctly in dark mode
3. THE EcoStep_Central SHALL use the existing dark charcoal color for dark mode
4. THE EcoStep_Central SHALL use subtle borders consistent with the existing EcoStep visual language
5. THE EcoStep_Central SHALL use the restrained green accent color for highlights and active states
6. WHEN the user switches themes, THE EcoStep_Central SHALL update all colors without requiring a page refresh

### Requirement 9: Component Reuse

**User Story:** As a developer, I want to reuse existing components where possible, so that the implementation maintains consistency and reduces development time.

#### Acceptance Criteria

1. THE EcoStep_Central SHALL reuse existing API endpoints for data fetching
2. THE EcoStep_Central SHALL reuse existing data-fetching logic without duplication
3. THE EcoStep_Central SHALL reuse existing UI components where they match the design requirements
4. THE implementation SHALL NOT create duplicate API endpoints
5. THE implementation SHALL NOT modify existing backend APIs
6. THE implementation SHALL NOT modify database structure
7. THE implementation SHALL NOT modify telemetry processing logic

### Requirement 10: Empty State Handling

**User Story:** As a user, I want clear feedback when data is unavailable, so that I understand the system is waiting for telemetry rather than experiencing an error.

#### Acceptance Criteria

1. WHEN no step data has been received today, THE Step_Activity_Card SHALL display "Waiting for footstep data"
2. WHEN telemetry data is temporarily unavailable, THE Electrical_Metrics_Grid SHALL display a loading state
3. WHEN the system has never received data, THE EcoStep_Central SHALL display appropriate empty states for all components
4. THE empty states SHALL use language that indicates waiting or loading, not errors
5. WHEN data becomes available after an empty state, THE EcoStep_Central SHALL automatically update to display the received data

### Requirement 11: Real-Time Data Updates

**User Story:** As a user, I want the dashboard to update automatically when new data arrives, so that I always see current information without manually refreshing.

#### Acceptance Criteria

1. WHEN new telemetry data is received, THE EcoStep_Central SHALL update the displayed metrics within 5 seconds
2. WHEN new step data is received, THE Step_Activity_Card SHALL update the displayed count within 5 seconds
3. WHEN system status changes, THE System_Status_Area SHALL reflect the new status within 5 seconds
4. THE EcoStep_Central SHALL use existing WebSocket or polling mechanisms for real-time updates
5. THE real-time update mechanism SHALL NOT create additional server load beyond existing implementations

### Requirement 12: Backward Compatibility

**User Story:** As a system administrator, I want existing features to remain unchanged, so that users can continue to access analytics, reports, authentication, and AI chatbot functionality without disruption.

#### Acceptance Criteria

1. THE implementation SHALL NOT modify authentication logic
2. THE implementation SHALL NOT modify IoT communication protocols
3. THE implementation SHALL NOT modify analytics calculation algorithms
4. THE implementation SHALL NOT modify report generation functionality
5. THE implementation SHALL NOT modify AI chatbot functionality
6. THE Analytics_Tab SHALL remain accessible with all existing functionality intact
7. THE implementation SHALL NOT remove or disable any existing features outside of EcoStep_Central

