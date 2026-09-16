# Requirements Document: Responsive Design & Mobile Optimization

## Introduction

This document specifies requirements for implementing comprehensive responsive design and mobile optimization across the EcoStep Energy Monitoring Dashboard. The feature addresses critical responsive design issues that currently prevent proper mobile usage, implementing a mobile-first strategy to ensure the dashboard is fully usable on all screen sizes from 320px mobile devices to 1920px+ desktop displays.

The EcoStep Web Dashboard is a public energy-monitoring system designed for use on phones, tablets, laptops, and desktop computers. Currently, the dashboard has critical layout issues including fixed-width sidebars that block content on mobile, non-responsive metric cards, charts that don't adapt to container width, and insufficient touch target sizing. This feature will transform the dashboard into a genuinely responsive application while preserving all existing functionality, branding, and architecture.

## Glossary

### Core Components

- **DashboardLayout**: The main layout component at `frontend/src/layouts/DashboardLayout.tsx` containing the floating sidebar, navigation, and content area wrapper used by authenticated pages
- **Navigation**: The landing page navigation component at `frontend/src/components/layout/Navigation.tsx` providing Home/Dashboard links and mobile menu
- **FloatingChatButton**: The chat interface component at `frontend/src/components/FloatingChatButton.tsx` that expands into a chat panel
- **DashboardPage**: The main dashboard view at `frontend/src/features/dashboard/pages/DashboardPage.tsx` displaying metric cards, charts, and sensor data
- **ChartsLayoutContainer**: The charts container component wrapping analytics visualizations

### Layout Elements

- **Floating_Sidebar**: The fixed-position collapsible sidebar in DashboardLayout with navigation links, currently positioned with `left-6 top-6` and causing content overflow on mobile
- **Main_Content_Area**: The dashboard content region with fixed `marginLeft` that needs responsive adjustment
- **Metric_Cards**: The four primary metric display cards (Voltage, Current, Power, Energy Today) shown in a grid layout
- **Mobile_Menu**: Hamburger menu for mobile navigation (already exists in Navigation component, needs implementation in DashboardLayout)
- **Chat_Panel**: The expandable chat window with fixed 400x600px dimensions that needs mobile adaptation

### Responsive Concepts

- **Breakpoint**: CSS media query threshold for layout changes; using Tailwind defaults: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Mobile_First**: Design approach where base styles target mobile (320px+) with progressive enhancement for larger screens
- **Touch_Target**: Interactive element minimum size requirement (44x44px) for accessible touch interaction
- **Container_Query**: CSS feature for component-level responsive behavior based on container width rather than viewport width
- **Viewport_Height_Unit**: CSS height units including vh (viewport height), dvh (dynamic), lvh (large), svh (small) for handling mobile browser chrome

### User Types

- **Public_User**: Unauthenticated visitor with read-only dashboard access and limited features
- **Admin_User**: Authenticated user with full dashboard access including settings, reports, alerts, and analytics

### Design System

- **EcoStep_Design_System**: The established design patterns documented in `frontend/DESIGN-SYSTEM.md` and `frontend/ECOSTEP-DESIGN-SYSTEM.md` defining colors (#1A312C, #428475, #89D7B7), spacing, and component patterns
- **Theme_Context**: React context providing light/dark theme state and color palette
- **Responsive_Grid**: CSS Grid layout that adapts column count based on screen size

### Technical Stack

- **Tailwind_CSS**: Utility-first CSS framework already in use for styling
- **React**: UI library (v18+) used for all components
- **TypeScript**: Type-safe JavaScript used throughout the codebase
- **Recharts**: Charting library for data visualizations that needs responsive configuration
- **TanStack_Query**: Data fetching library for API interactions

## Requirements

### Requirement 1: Sidebar Responsive Behavior

**User Story:** As a mobile user, I want the sidebar to be hidden by default and accessible via a hamburger menu, so that I have full screen width for viewing dashboard content without obstruction.

#### Acceptance Criteria

1.1 WHEN viewing dashboard on mobile screens (< 768px), THE Floating_Sidebar SHALL be hidden by default and not occupy screen space

1.2 WHEN viewing dashboard on mobile screens (< 768px), THE system SHALL display a hamburger menu button in the top-left corner for sidebar access

1.3 WHEN the user taps the hamburger menu on mobile, THE Floating_Sidebar SHALL slide in from the left edge as an overlay

1.4 WHEN the Floating_Sidebar is opened on mobile, THE system SHALL display a semi-transparent backdrop behind the sidebar

1.5 WHEN the user taps the backdrop or sidebar close button, THE Floating_Sidebar SHALL slide out and hide

1.6 WHEN viewing dashboard on tablet (768px - 1023px), THE Floating_Sidebar MAY remain hidden with hamburger menu OR show in collapsed icon-only state

1.7 WHEN viewing dashboard on desktop (≥ 1024px), THE Floating_Sidebar SHALL display in its current collapsible format (collapsed or expanded state)

1.8 WHEN the Floating_Sidebar transitions between visible/hidden states, THE animations SHALL respect `prefers-reduced-motion` media query

1.9 WHEN the user navigates using keyboard, THE hamburger menu button SHALL be focusable and operable with Enter/Space keys

1.10 WHEN the Floating_Sidebar is opened on mobile, THE focus SHALL trap within the sidebar until closed

### Requirement 2: Main Content Area Responsive Layout

**User Story:** As a mobile user, I want the main content to use the full available screen width, so that I can view dashboard information without horizontal scrolling or clipped content.

#### Acceptance Criteria

2.1 WHEN viewing dashboard on mobile (< 768px), THE Main_Content_Area SHALL NOT have fixed left margins

2.2 WHEN viewing dashboard on mobile (< 768px), THE Main_Content_Area SHALL use responsive padding (e.g., px-4 or px-6)

2.3 WHEN viewing dashboard on tablet (768px - 1023px), THE Main_Content_Area SHALL adjust margins based on sidebar state (hidden/collapsed)

2.4 WHEN viewing dashboard on desktop (≥ 1024px), THE Main_Content_Area SHALL maintain appropriate left margin accounting for visible sidebar width

2.5 WHEN the sidebar expands/collapses on desktop, THE Main_Content_Area margin SHALL transition smoothly

2.6 WHEN viewport width exceeds 1920px, THE Main_Content_Area content SHALL remain centered with max-width constraint and not stretch infinitely

2.7 WHEN Main_Content_Area adjusts, THE transition duration SHALL be 250ms or less for responsive feel

2.8 WHEN Main_Content_Area transitions, THE animation SHALL respect `prefers-reduced-motion` preference

### Requirement 3: Metric Cards Responsive Grid

**User Story:** As a user on any device, I want the metric cards to arrange appropriately for my screen size, so that values remain readable and cards don't become too cramped or too stretched.

#### Acceptance Criteria

3.1 WHEN viewing on mobile portrait (< 640px), THE Metric_Cards SHALL display in single column (1 card per row)

3.2 WHEN viewing on large mobile/small tablet (640px - 767px), THE Metric_Cards SHALL display in 2-column grid

3.3 WHEN viewing on tablet (768px - 1023px), THE Metric_Cards SHALL display in 2-column grid

3.4 WHEN viewing on desktop (≥ 1024px), THE Metric_Cards SHALL display in 4-column grid (all cards in one row)

3.5 WHEN Metric_Cards resize, THE typography inside (label, value, unit) SHALL remain readable and properly sized

3.6 WHEN Metric_Cards resize, THE numerical values SHALL NOT wrap unnecessarily across multiple lines

3.7 WHEN touch targets within Metric_Cards exist (buttons, links), THE touch target size SHALL be minimum 44x44px

3.8 WHEN Metric_Cards display in grid, THE gap between cards SHALL scale appropriately (smaller on mobile, larger on desktop)

3.9 WHEN viewing on ultra-wide screens (> 1920px), THE Metric_Cards SHALL maintain reasonable maximum width and not stretch excessively

### Requirement 4: Charts Responsive Behavior

**User Story:** As a user viewing charts on mobile, I want visualizations to resize and adapt to my screen, so that I can interpret data without horizontal scrolling or unreadable labels.

#### Acceptance Criteria

4.1 WHEN charts render using Recharts, THE chart width SHALL be set to responsive percentage (e.g., width="100%") rather than fixed pixels

4.2 WHEN charts render on mobile (< 768px), THE chart height SHALL reduce to mobile-appropriate size (e.g., 250-300px instead of 400px)

4.3 WHEN charts display axis labels on mobile, THE label font size SHALL be readable (minimum 11-12px)

4.4 WHEN X-axis labels would overlap on narrow screens, THE chart SHALL reduce label frequency or rotate labels appropriately

4.5 WHEN chart legends display on mobile, THE legend SHALL wrap or stack vertically if horizontal space is insufficient

4.6 WHEN chart tooltips appear on touch devices, THE tooltips SHALL trigger on tap and display without hover dependency

4.7 WHEN charts render on desktop, THE charts SHALL utilize available width efficiently without excessive empty space

4.8 WHEN ChartsLayoutContainer displays multiple charts, THE layout SHALL stack charts vertically on mobile and arrange in grid on desktop

4.9 WHEN Recharts ResponsiveContainer is used, THE aspect ratio property SHALL be configured appropriately for each screen size

4.10 WHEN charts contain interactive elements (buttons, filters), THE touch targets SHALL meet 44x44px minimum size

### Requirement 5: Tables Responsive Handling

**User Story:** As a user viewing data tables on mobile, I want tables to remain usable without breaking the page layout, so that I can access tabular information even on small screens.

#### Acceptance Criteria

5.1 WHEN tables contain many columns, THE table container SHALL implement horizontal scrolling within the table component only

5.2 WHEN a table scrolls horizontally, THE rest of the dashboard page SHALL remain fixed and not scroll horizontally

5.3 WHEN tables scroll horizontally on mobile, THE table container SHALL have visual indicators (shadows/gradients) showing more content exists

5.4 WHEN simple tables display on mobile (few columns), THE system MAY implement card-based stacking layout as alternative to scrolling

5.5 WHEN table content is viewed on mobile, THE font size SHALL remain readable (minimum 14px for body text)

5.6 WHEN table headers are present, THE headers SHALL remain visible during vertical scroll (sticky positioning) on mobile

5.7 WHEN tables include action buttons, THE buttons SHALL meet minimum 44x44px touch target size

5.8 WHEN tables transform to card layout on mobile, THE card design SHALL follow EcoStep_Design_System patterns

### Requirement 6: Header and Action Buttons Responsive Layout

**User Story:** As a mobile user, I want header elements and action buttons to fit my screen without overflow, so that I can access all controls comfortably.

#### Acceptance Criteria

6.1 WHEN viewing page header on mobile (< 640px), THE action buttons SHALL NOT overflow the viewport width

6.2 WHEN multiple action buttons exist in header on mobile, THE secondary actions SHALL collapse into overflow menu or stack vertically

6.3 WHEN header title and actions are displayed together on mobile, THE layout SHALL wrap to multiple rows if needed

6.4 WHEN admin-only action buttons are shown to Public_User, THE buttons SHALL remain visibly disabled with reduced opacity at all screen sizes

6.5 WHEN header buttons render on mobile, THE button text MAY be hidden with icon-only display for space efficiency

6.6 WHEN icon-only buttons are used on mobile, THE buttons SHALL include aria-label attributes for accessibility

6.7 WHEN header layout adjusts on tablet (768px - 1023px), THE primary actions SHALL remain visible while secondary actions may collapse

6.8 WHEN viewing header on desktop (≥ 1024px), THE full button labels and all actions SHALL be visible in single row

6.9 WHEN header buttons meet touch targets, THE minimum size SHALL be 44x44px on mobile/tablet

6.10 WHEN Public_User views disabled admin buttons, NO additional login CTA or authentication prompt SHALL appear

### Requirement 7: Chat Window Responsive Design

**User Story:** As a mobile user opening the chat assistant, I want the chat interface to utilize my screen effectively, so that I can interact with the chatbot comfortably without obscured content.

#### Acceptance Criteria

7.1 WHEN FloatingChatButton chat opens on mobile (< 640px), THE Chat_Panel SHALL expand to full-screen or near-full-screen (accounting for safe areas)

7.2 WHEN FloatingChatButton chat opens on mobile, THE Chat_Panel border-radius SHALL be 0 for true full-screen appearance

7.3 WHEN FloatingChatButton chat opens on tablet (640px - 1023px), THE Chat_Panel SHALL size appropriately (e.g., 80-90% width/height) with centered positioning

7.4 WHEN FloatingChatButton chat opens on desktop (≥ 1024px), THE Chat_Panel SHALL maintain current 400x600px floating panel design

7.5 WHEN chat input field is focused on mobile, THE Chat_Panel SHALL account for virtual keyboard and adjust height to prevent obscured controls

7.6 WHEN Chat_Panel displays on mobile, THE chat messages SHALL remain readable with appropriate font size and padding

7.7 WHEN FloatingChatButton itself displays on mobile, THE button position SHALL NOT obscure critical dashboard content

7.8 WHEN Chat_Panel is open on mobile, THE underlying page content SHALL NOT be scrollable (body scroll lock)

7.9 WHEN Chat_Panel close button displays on mobile, THE button SHALL meet 44x44px minimum touch target size

7.10 WHEN Chat_Panel transitions between states, THE animations SHALL respect `prefers-reduced-motion` preference

### Requirement 8: Viewport and Mobile Browser Chrome Handling

**User Story:** As a mobile browser user, I want the dashboard to handle browser UI (address bar, bottom nav) gracefully, so that content doesn't get clipped when browser chrome appears or disappears.

#### Acceptance Criteria

8.1 WHEN full-screen elements use height units, THE system SHALL prefer modern viewport units (dvh, svh, lvh) over 100vh where appropriate

8.2 WHEN mobile browser chrome (address bar) hides/shows, THE layout SHALL adapt smoothly without jarring content jumps

8.3 WHEN fixed or sticky positioned elements are used, THE positioning SHALL account for mobile safe areas (notches, rounded corners)

8.4 WHEN content is displayed in full height containers on mobile, THE content SHALL remain accessible and not be clipped below browser UI

8.5 WHEN iOS Safari address bar collapses on scroll, THE sticky headers SHALL remain properly positioned

8.6 WHEN Android Chrome bottom navigation appears, THE fixed bottom elements (like floating chat button) SHALL remain accessible

8.7 WHEN viewport height changes due to virtual keyboard, THE page SHALL handle the resize gracefully without breaking layout

8.8 WHEN using viewport units for Chat_Panel on mobile, THE system SHALL use dvh (dynamic viewport height) to account for browser chrome

### Requirement 9: Performance Optimization for Mobile

**User Story:** As a mobile user with limited data and battery, I want the dashboard to perform efficiently, so that pages load quickly and don't drain my device resources.

#### Acceptance Criteria

9.1 WHEN dashboard loads on mobile, THE system SHALL eliminate unnecessary component re-renders through proper memoization

9.2 WHEN API requests are triggered, THE system SHALL prevent duplicate simultaneous requests for the same data

9.3 WHEN telemetry data updates via WebSocket on mobile, THE polling frequency SHALL be appropriate and not excessive (no more frequent than needed)

9.4 WHEN WebSocket connection is used for live updates, THE system SHALL NOT fall back to rapid polling unnecessarily

9.5 WHEN large datasets render in lists (sensor nodes, tables), THE system SHALL implement virtualization if list exceeds reasonable limit (e.g., > 100 items)

9.6 WHEN charts recalculate or re-render on data updates, THE system SHALL debounce or throttle updates to prevent excessive recalculations

9.7 WHEN components are not visible in viewport (below fold), THE system SHALL defer or lazy-load non-critical content

9.8 WHEN TanStack_Query caches data, THE cache configuration SHALL leverage appropriate staleTime and cacheTime to minimize redundant fetches

9.9 WHEN images or SVGs are loaded, THE assets SHALL be optimized for web delivery (compressed, appropriately sized)

9.10 WHEN CSS animations run on mobile, THE animations SHALL use GPU-accelerated properties (transform, opacity) for smooth performance

### Requirement 10: Touch and Accessibility

**User Story:** As a user with touch devices or accessibility needs, I want all interactive elements to be properly sized and accessible, so that I can use the dashboard effectively regardless of input method.

#### Acceptance Criteria

10.1 WHEN interactive elements (buttons, links, inputs) are displayed, THE minimum touch target size SHALL be 44x44px

10.2 WHEN body text is displayed on mobile, THE font size SHALL be minimum 14px for readability

10.3 WHEN headings are displayed on mobile, THE heading sizes SHALL scale appropriately (e.g., h1: 24-28px, h2: 20-24px)

10.4 WHEN users navigate via keyboard, THE tab order SHALL be logical and all interactive elements SHALL be keyboard accessible

10.5 WHEN elements receive keyboard focus, THE focus indicator SHALL be clearly visible with sufficient contrast

10.6 WHEN admin features are disabled for Public_User, THE disabled state SHALL be visually clear with reduced opacity or grayscale treatment

10.7 WHEN icon-only controls are used (no visible label), THE elements SHALL include descriptive aria-label attributes

10.8 WHEN color is used to convey information (status, alerts), THE design SHALL also use icons or text labels for non-color-dependent understanding

10.9 WHEN contrast ratios are measured between text and background, THE ratios SHALL meet WCAG 2.1 Level AA standards (4.5:1 for normal text, 3:1 for large text)

10.10 WHEN interactions require hover (tooltips, dropdowns), THE same functionality SHALL be available via tap/click for touch devices

### Requirement 11: Comprehensive Breakpoint Testing

**User Story:** As a quality assurance engineer, I want the dashboard tested at all common device sizes, so that we ensure consistent experience across the device landscape.

#### Acceptance Criteria

11.1 WHEN dashboard is tested, THE testing SHALL include these minimum viewport sizes:
- 320 × 568 (iPhone SE)
- 360 × 800 (Android small)
- 390 × 844 (iPhone 12/13/14)
- 412 × 915 (Android large)
- 480 × 800 (landscape mobile)
- 768 × 1024 (iPad portrait)
- 820 × 1180 (iPad Air)
- 1024 × 768 (iPad landscape)
- 1280 × 720 (laptop)
- 1366 × 768 (common laptop)
- 1440 × 900 (MacBook)
- 1920 × 1080 (desktop)

11.2 WHEN testing at each viewport size, THE page SHALL NOT exhibit horizontal scrolling (except intentionally contained tables)

11.3 WHEN testing at each viewport size, THE content SHALL NOT be clipped or cut off

11.4 WHEN testing at each viewport size, THE elements SHALL NOT overlap inappropriately

11.5 WHEN testing at each viewport size, THE text SHALL remain readable without zooming

11.6 WHEN testing at each viewport size, THE buttons and interactive elements SHALL remain accessible and appropriately sized

11.7 WHEN testing devices in portrait orientation, THE layout SHALL adapt appropriately

11.8 WHEN testing devices in landscape orientation, THE layout SHALL adapt appropriately (may differ from portrait)

11.9 WHEN browser DevTools responsive mode is used for testing, THE results SHALL be verified on actual physical devices or emulators

11.10 WHEN accessibility testing is performed at each breakpoint, THE WCAG 2.1 Level AA compliance SHALL be maintained

### Requirement 12: Design and Architecture Preservation

**User Story:** As a project stakeholder, I want responsive changes to preserve existing functionality and design language, so that the application remains recognizable and no features are lost.

#### Acceptance Criteria

12.1 WHEN responsive changes are implemented, THE EcoStep brand colors (#1A312C, #428475, #89D7B7) and visual identity SHALL remain unchanged

12.2 WHEN responsive changes are implemented, THE existing color palette for light and dark themes SHALL be preserved

12.3 WHEN responsive changes are implemented, THE current feature set (dashboard, analytics, reports, alerts, settings, chat) SHALL remain fully functional

12.4 WHEN responsive changes are implemented, NO new UI frameworks (Bootstrap, Material UI, Chakra, Ant Design, etc.) SHALL be introduced

12.5 WHEN responsive changes are implemented, THE backend API contracts and endpoints SHALL NOT change

12.6 WHEN responsive changes are implemented, THE database schema and structure SHALL NOT be modified

12.7 WHEN responsive changes are implemented, THE authentication and authorization flow SHALL remain unchanged

12.8 WHEN responsive changes are implemented, THE IoT sensor data ingestion and WebSocket functionality SHALL remain unchanged

12.9 WHEN responsive changes are implemented, THE system SHALL continue using React + Vite + TypeScript + Tailwind CSS stack

12.10 WHEN responsive changes are implemented, THE Public_User and Admin_User role-based access behavior SHALL remain unchanged

12.11 WHEN responsive changes are implemented, THE real-time monitoring features SHALL continue to function identically

12.12 WHEN responsive changes are implemented, THE TanStack Query data fetching patterns SHALL remain consistent

### Requirement 13: Container Queries (Optional Enhancement)

**User Story:** As a developer building reusable components, I want the ability to use container queries where appropriate, so that components can respond to their container size rather than only viewport size.

#### Acceptance Criteria

13.1 WHEN reusable components need intrinsic responsive behavior, THE system MAY implement CSS container queries using @container rules

13.2 WHEN container queries are used, THE implementation SHALL only apply where genuinely beneficial (not as blanket replacement for media queries)

13.3 WHEN Metric_Cards or chart components adapt based on space, THE components MAY use container queries to adjust internal layout

13.4 WHEN container queries are implemented, THE fallback behavior for browsers without support SHALL be graceful degradation

13.5 WHEN container queries are used, THE containment context SHALL be properly defined on parent containers

### Requirement 14: Visual Design Consistency

**User Story:** As a user viewing the dashboard on any device, I want the application to look like the same EcoStep product, so that I have a consistent experience regardless of screen size.

#### Acceptance Criteria

14.1 WHEN dashboard is viewed on mobile, THE visual design SHALL clearly represent the EcoStep brand identity

14.2 WHEN dashboard is viewed on different screen sizes, THE core design language (card styles, button styles, spacing patterns) SHALL remain consistent

14.3 WHEN typography scales for different screen sizes, THE type hierarchy (h1 > h2 > body > caption) SHALL remain clear

14.4 WHEN spacing adjusts for mobile vs desktop, THE relative spacing relationships SHALL remain visually consistent

14.5 WHEN components resize (cards, buttons, inputs), THE border radius and corner rounding SHALL scale appropriately

14.6 WHEN shadows and elevation are used on responsive components, THE shadow intensity SHALL remain proportional to the design system

14.7 WHEN icons are displayed at different sizes, THE icon stroke width and weight SHALL remain visually balanced

14.8 WHEN color is applied to elements, THE same theme colors SHALL be used across all breakpoints

## Out of Scope

The following items are explicitly **not** part of this feature:

- Creating separate native mobile applications (iOS/Android)
- Creating separate mobile and desktop web applications
- Introducing new CSS frameworks (Bootstrap, Material UI, Chakra UI, Ant Design, Tailwind alternatives)
- Rewriting the entire frontend from scratch
- Changing backend API structure, endpoints, or response formats
- Modifying database schema or queries
- Changing authentication mechanisms or JWT handling
- Modifying IoT sensor communication protocols or WebSocket server logic
- Changing deployment configuration or infrastructure
- Adding unnecessary third-party dependencies
- Implementing Progressive Web App (PWA) features
- Adding mobile-specific native features (camera, geolocation, push notifications)
- Creating mobile-specific routes or page variations
- Over-engineering with excessive breakpoint granularity (e.g., every 50px)

## Success Criteria

The feature is considered successfully implemented when:

1. Dashboard is fully usable on 320px mobile screens without horizontal scrolling
2. Sidebar adapts with mobile menu implementation for < 768px screens
3. All metric cards respond to screen size with appropriate grid layouts (1/2/2/4 columns)
4. Charts resize responsively and remain readable on all screen sizes
5. No unintended horizontal scrolling occurs on any screen size (except contained tables)
6. All touch targets meet or exceed 44x44px minimum size requirement
7. Performance on mobile devices is acceptable (no excessive re-renders, efficient data fetching)
8. All accessibility requirements are met (WCAG 2.1 Level AA compliance maintained)
9. Dashboard passes all breakpoint tests listed in Requirement 11
10. EcoStep branding, color palette, and design language are fully preserved
11. All existing functionality remains operational (dashboard, analytics, charts, chat, navigation)
12. TypeScript compilation completes without errors
13. Existing frontend tests pass without modification (unless tests specifically check fixed layouts)
14. No console errors occur during normal usage across breakpoints
15. Public monitoring features remain easily accessible for unauthenticated users

## Technical Constraints

The implementation must adhere to the following technical constraints:

- **Frontend Stack:** Must use existing React + Vite + TypeScript + Tailwind CSS stack
- **No New Frameworks:** Cannot introduce new UI frameworks or CSS libraries
- **API Contracts:** Must maintain current API contracts and request/response formats
- **Authentication:** Must preserve existing authentication flow and JWT handling
- **User Roles:** Must support both Public (unauthenticated) and Admin (authenticated) user types with existing permission model
- **Data Fetching:** Must work with existing TanStack Query setup and caching strategy
- **Charts:** Must work with existing Recharts library configuration
- **WebSocket:** Must maintain existing real-time update functionality via Socket.IO
- **Theme System:** Must work with existing ThemeContext for light/dark mode
- **Browser Support:** Must support modern browsers (Chrome, Firefox, Safari, Edge) with graceful degradation for older browsers
- **Accessibility:** Must maintain WCAG 2.1 Level AA compliance
- **Build Process:** Must not require changes to Vite build configuration or deployment process

## Assumptions

The following assumptions are made for this feature:

1. The existing codebase has no critical technical debt that would block responsive implementation
2. The Tailwind CSS configuration includes default breakpoints (sm, md, lg, xl, 2xl)
3. The project has access to modern CSS features including Flexbox, Grid, and optionally Container Queries
4. The backend APIs can handle the same request load regardless of device type
5. The WebSocket implementation scales appropriately for mobile clients
6. The current chart data volume is reasonable for mobile rendering (not thousands of data points)
7. The development team has access to physical devices or reliable emulators for testing
8. Browser DevTools responsive mode is acceptable for initial testing before device verification
9. The project timeline allows for iterative testing across multiple breakpoints
10. Existing component tests may need minor updates to accommodate responsive changes but core logic tests remain valid

## Dependencies

This feature depends on:

1. **Existing Components:** All current dashboard, layout, and navigation components must remain functional
2. **Tailwind CSS:** The utility class framework already configured in the project
3. **React 18+:** Modern React features including hooks, context, and concurrent mode
4. **TypeScript:** Type definitions for all props, state, and component interfaces
5. **TanStack Query:** Data fetching library for API interactions
6. **Recharts:** Charting library for data visualizations
7. **Theme Context:** Existing theme system providing light/dark mode state
8. **Auth Context:** Existing authentication context providing user state and permissions
9. **Socket Context:** Existing WebSocket context for real-time updates
10. **Browser APIs:** Modern CSS features (Grid, Flexbox, Media Queries, optionally Container Queries)

## Open Questions

The following questions need clarification during design phase:

1. Should the sidebar on tablet (768-1023px) remain hidden with hamburger menu, or show in collapsed icon-only state?
2. Should simple tables on mobile transform to card-based layout, or always use horizontal scrolling?
3. What is the acceptable maximum number of table rows before virtualization is required for performance?
4. Should the floating chat button position adjust on mobile to avoid obscuring metrics (e.g., bottom-center instead of bottom-right)?
5. Are there any specific mobile devices or screen sizes used by the primary user base that should receive extra testing focus?
6. Should landscape orientation on mobile devices have special handling or follow standard tablet layout rules?
7. What is the minimum supported mobile browser version (e.g., iOS Safari 14+, Chrome 90+)?
8. Should container queries be implemented as progressive enhancement or avoided entirely for browser compatibility?
9. Are there performance benchmarks or metrics we should target for mobile (e.g., First Contentful Paint < 2s on 3G)?
10. Should the admin action buttons on mobile collapse into an overflow menu with icon, or stack vertically?
