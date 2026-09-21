# Implementation Plan: EcoStep UI Refinement

## Overview

Transform the EcoStep IoT energy monitoring system from a generic AI-generated dashboard into a production-grade technical monitoring interface through systematic CSS and component styling refinement. This implementation focuses exclusively on visual presentation without modifying functionality, business logic, or data handling.

## Tasks

### Phase 1: Foundation - Global CSS and Design Tokens

- [x] 1. Establish design token system
  - Create `frontend/src/styles/design-tokens.ts` with color, spacing, and typography definitions
  - Define EcoStep green (#3DDC97) and semantic colors (green, amber, red, blue)
  - Define neutral color hierarchy for light mode (50, 100, 200, 600, 900)
  - Define dark mode colors (background: #0F1116, surface: #1C1F28, borders, text)
  - Define border-radius tokens (sm: 6px, md: 8px, lg: 12px, full: 9999px)
  - Define typography tokens (metric sizes, page titles, section titles, card titles)
  - Export TypeScript types for ComponentStyleProps, BadgeConfig, CardConfig
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 13.1_

- [x] 2. Refactor global CSS to remove AI-generated patterns
  - Audit `frontend/src/styles/globals.css` for gradient usage (linear-gradient, radial-gradient)
  - Remove or replace all background gradients with flat colors
  - Remove glassmorphism utilities (backdrop-blur, backdrop-filter classes)
  - Update border-radius utilities to use 6-12px range (not 16-20px)
  - Remove excessive box-shadow utilities for cards and containers
  - Add hairline border utilities (light: rgba(26, 49, 44, 0.08), dark: rgba(137, 215, 183, 0.12))
  - Add tabular-nums utility class (.tabular-nums { font-variant-numeric: tabular-nums; })
  - Document deprecated utilities in comments
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.4, 4.1, 13.2, 13.3, 13.4, 13.5_

- [x] 3. Update Tailwind configuration for production-grade defaults
  - Edit `tailwind.config.js` to extend theme with design tokens
  - Override default border-radius values (rounded-md: 8px, rounded-lg: 12px)
  - Add custom colors (eco-green, semantic colors, neutral hierarchy, dark mode colors)
  - Configure dark mode strategy (class-based or media query)
  - Remove or disable gradient color stops if present
  - Add custom utilities for hairline borders
  - _Requirements: 13.1, 13.2, 13.6_

- [ ] 4. Checkpoint - Verify foundation is established
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Core Components - Remove AI-Generated Aesthetics

- [x] 5. Refine Button component
  - [ ] 5.1 Remove gradient backgrounds from all button variants
    - Locate `frontend/src/components/ui/Button.tsx` (or similar)
    - Replace gradient backgrounds with flat colors (primary: #3DDC97, secondary, ghost, danger)
    - Set border-radius to 8px (not rounded-full or 20px)
    - Remove box-shadow from all states
    - _Requirements: 1.4, 3.2, 4.4, 9.1, 9.4, 9.5_
  
  - [ ] 5.2 Refine hover and active states
    - Implement hover state with darker flat color (hover: #35c27b for primary)
    - Remove transform: scale effects on hover
    - Use subtle opacity change (0.95) instead of scale
    - Implement disabled state with opacity: 0.5
    - Set font-weight: 500 for button text
    - _Requirements: 9.2, 9.3, 9.6, 9.7_

- [x] 6. Refine Badge component
  - [x] 6.1 Implement semantic color system
    - Locate `frontend/src/components/ui/Badge.tsx` (or similar)
    - Replace arbitrary colors with semantic colors (green: #22C55E, amber: #F59E0B, red: #EF4444, blue: #3B82F6)
    - Use rgba backgrounds with 0.1 opacity for subtle fill
    - Add 1px solid borders with 0.2 opacity
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  
  - [x] 6.2 Adjust badge shape and borders
    - Use border-radius: 6px for standard badges (not rounded-full unless truly pill-shaped)
    - Reserve rounded-full (9999px) only for pill badges
    - Ensure sufficient text contrast (WCAG AA 4.5:1)
    - _Requirements: 8.5, 8.7, 17.4_

- [x] 7. Refine Card components
  - [x] 7.1 Remove glassmorphism from EcoCard
    - Locate `frontend/src/components/ui/EcoCard.tsx` (or Card.tsx)
    - Remove backdrop-filter: blur() and webkit-backdrop-filter
    - Replace translucent rgba backgrounds with solid colors (white light, #1C1F28 dark)
    - Add 1px solid hairline borders using design tokens
    - Remove box-shadow (keep shadows only for floating elements)
    - Set border-radius to 8px or 12px (not 20px)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.1, 7.1_
  
  - [x] 7.2 Add dark mode variants for Card
    - Implement dark mode conditional rendering (background, borders, text colors)
    - Use dark design tokens (surface: #1C1F28, border: rgba(137, 215, 183, 0.12))
    - Ensure consistent spacing and hierarchy between light and dark modes
    - _Requirements: 2.5, 7.3, 12.1, 12.2, 12.3, 12.6, 12.7_

- [x] 8. Refine DashboardCard component
  - [ ] 8.1 Establish data-first visual hierarchy
    - Locate `frontend/src/components/dashboard/DashboardCard.tsx` (or similar metric card)
    - Set primary metric font-size to 36px, font-weight: 600, with tabular-nums
    - Set secondary metric font-size to 20px, font-weight: 600, with tabular-nums
    - Set metric labels to 13px, font-weight: 500, uppercase, letter-spacing: 0.05em
    - Remove competing visual elements (pastel icon tiles, excessive spacing)
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 11.4, 11.5, 11.6_
  
  - [ ] 8.2 Reposition icons beside labels
    - Remove large pastel icon tiles (64x64px backgrounds with gradients)
    - Position icons inline beside labels (not above data values)
    - Reduce icon size to 16px or 20px maximum
    - Use neutral icon colors (#525252 light, #9CA3AF dark)
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Refine LiveSensorCard component
  - [x] 9.1 Apply data hierarchy to sensor metrics
    - Locate `frontend/src/components/sensors/LiveSensorCard.tsx` (or similar)
    - Apply same data hierarchy as DashboardCard (large values, small labels)
    - Enable tabular-nums for sensor readings
    - Remove gradient backgrounds from sensor status indicators
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 11.4_
  
  - [x] 9.2 Refine sensor status badges
    - Use semantic colors for sensor status (green: healthy, amber: warning, red: error)
    - Add hairline borders to status badges
    - Position status inline or beside sensor name (not in large tiles)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 15.4_

- [ ] 10. Checkpoint - Verify core components are refined
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Feature Pages - Apply Design Principles

- [x] 11. Refine Dashboard page
  - [ ] 11.1 Update Dashboard layout and cards
    - Locate `frontend/src/features/dashboard/pages/DashboardPage.tsx`
    - Ensure all metric cards use refined DashboardCard component
    - Remove any remaining gradient backgrounds or glassmorphism effects
    - Apply consistent spacing using design tokens
    - _Requirements: 15.1_
  
  - [ ] 11.2 Refine dashboard charts
    - Locate chart components in `frontend/src/features/dashboard/components/`
    - Apply chart refinements (area opacity <= 0.15, no decorative dots, subtle activeDot)
    - Use EcoStep green (#3DDC97) for primary chart strokes
    - Use neutral colors for axes and grid lines
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 15.1_

- [x] 12. Refine Analytics page
  - [ ] 12.1 Update Analytics charts with restrained styling
    - Locate `frontend/src/features/analytics/pages/AnalyticsPage.tsx`
    - Apply chart property requirements (opacity, dot removal, colors)
    - Ensure CartesianGrid uses strokeDasharray="3 3" and subtle colors
    - Add clear axis labels (e.g., "Time (24h)", "Energy (kWh)")
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 15.2_
  
  - [ ] 12.2 Refine Analytics metric cards and filters
    - Apply data hierarchy to any metric displays
    - Refine filter buttons to use flat colors and restrained hover
    - Remove gradients from date range pickers or selection UI
    - _Requirements: 9.1, 9.2, 9.3, 15.2_

- [x] 13. Refine Alerts page
  - [ ] 13.1 Update alert status indicators
    - Locate `frontend/src/features/alerts/pages/AlertsPage.tsx`
    - Use semantic badge colors for alert severity (green, amber, red)
    - Ensure all alert cards use hairline borders (no shadows)
    - Apply consistent typography for alert titles and descriptions
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 15.3_
  
  - [ ] 13.2 Refine alert list and empty states
    - Apply refined card styles to alert list items
    - Update empty state to use simple icons (<= 48px) in neutral colors
    - Ensure empty state message is clear and actionable
    - Remove gradient backgrounds from empty state illustrations
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 14. Refine Sensors page
  - [ ] 14.1 Update sensor list with data hierarchy
    - Locate `frontend/src/features/sensors/pages/SensorsPage.tsx`
    - Apply tabular-nums to all sensor readings and timestamps
    - Use refined LiveSensorCard component for each sensor
    - Ensure sensor status uses semantic badge colors
    - _Requirements: 5.3, 11.4, 15.4_
  
  - [ ] 14.2 Refine sensor detail views
    - Apply chart refinements to sensor-specific charts
    - Use hairline borders for sensor metadata cards
    - Remove any remaining glassmorphism or gradients
    - _Requirements: 2.1, 2.2, 7.1, 10.1, 10.2, 10.3_

- [x] 15. Refine Reports page
  - [x] 15.1 Apply typography and spacing consistency
    - Locate `frontend/src/features/reports/pages/ReportsPage.tsx`
    - Use typography tokens for report titles, sections, and descriptions
    - Apply consistent spacing between report cards
    - Refine report generation buttons with flat colors
    - _Requirements: 11.1, 11.2, 11.3, 15.5_
  
  - [x] 15.2 Update report preview cards
    - Apply refined card styles (solid backgrounds, hairline borders, no shadows)
    - Use tabular-nums for report dates and metrics
    - Ensure download/export buttons use refined button styles
    - _Requirements: 2.3, 2.4, 7.1, 9.1, 9.4_

- [x] 16. Refine Settings page
  - [ ] 16.1 Update form inputs and controls
    - Locate `frontend/src/features/settings/pages/SettingsPage.tsx`
    - Refine input fields (border-radius: 8px, hairline borders, no shadows)
    - Apply refined button styles to all action buttons (Save, Cancel, etc.)
    - Ensure toggle switches and checkboxes use flat colors
    - _Requirements: 3.2, 7.1, 9.1, 9.4, 15.6_
  
  - [ ] 16.2 Refine settings sections and cards
    - Group settings into cards with hairline borders
    - Apply consistent typography for section headings
    - Remove gradients from any decorative elements
    - _Requirements: 1.1, 1.2, 7.1, 11.2_

- [ ] 17. Checkpoint - Verify all feature pages are refined
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Navigation and Layout Components

- [x] 18. Refine Navigation component
  - [x] 18.1 Remove gradients and apply hairline borders
    - Locate `frontend/src/components/layout/Navigation.tsx`
    - Remove any gradient backgrounds from nav bar or sidebar
    - Add hairline borders for separation between nav sections
    - Use solid backgrounds (white light, #1C1F28 dark)
    - _Requirements: 1.1, 1.2, 7.4_
  
  - [x] 18.2 Refine navigation items and active states
    - Apply flat colors for active/hover states (use EcoStep green sparingly)
    - Remove transform: scale effects on navigation item hover
    - Ensure focus states are visible (outline or border)
    - Use consistent typography for navigation labels
    - _Requirements: 9.3, 17.3_

- [x] 19. Refine DashboardLayout component
  - [x] 19.1 Update layout container styling
    - Locate `frontend/src/layouts/DashboardLayout.tsx`
    - Remove gradient backgrounds from header, sidebar, or main container
    - Apply consistent padding and spacing using design tokens
    - Ensure dark mode variants exist for all layout sections
    - _Requirements: 1.1, 1.2, 12.6, 12.7_
  
  - [x] 19.2 Refine layout borders and spacing
    - Add hairline borders between header, sidebar, and main content
    - Use consistent border colors (light and dark mode variants)
    - Ensure responsive behavior maintains design principles
    - _Requirements: 7.4, 7.5_

- [x] 20. Refine LandingPage component
  - [ ] 20.1 Remove AI-generated aesthetics from hero section
    - Locate `frontend/src/features/landing/pages/LandingPage.tsx`
    - Replace gradient backgrounds with flat EcoStep green or neutral colors
    - Remove glassmorphism effects from feature cards
    - Apply refined button styles to CTAs (Sign Up, Learn More, etc.)
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 9.1_
  
  - [ ] 20.2 Refine landing page sections
    - Apply hairline borders to feature cards and sections
    - Use consistent typography for headings and body text
    - Ensure all buttons, badges, and links use refined styles
    - Remove decorative elements with gradients or excessive shadows
    - _Requirements: 7.1, 11.1, 11.2, 11.3_

- [ ] 21. Checkpoint - Verify navigation and layout refinement
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Dark Mode and Theme Consistency

- [x] 22. Implement comprehensive dark mode support
  - [x] 22.1 Audit all components for dark mode coverage
    - Create checklist of all components (Button, Badge, Card, Navigation, etc.)
    - For each component, verify dark mode styles exist
    - Use design tokens for dark mode colors consistently
    - _Requirements: 12.6_
  
  - [x] 22.2 Test theme switching consistency
    - Verify light-to-dark transitions maintain visual hierarchy
    - Ensure all text remains readable (contrast ratios >= 4.5:1)
    - Test that borders, backgrounds, and text update correctly
    - Verify charts and data visualizations work in both themes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7, 17.1, 17.2_

- [ ] 23. Finalize accessibility compliance
  - [ ] 23.1 Run accessibility audit on refined components
    - Use axe-core or similar tool to check WCAG AA compliance
    - Verify color contrast ratios for all text on backgrounds
    - Ensure focus states are visible with refined flat design
    - Test keyboard navigation across all pages
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.6_
  
  - [ ] 23.2 Add additional indicators for color-coded status
    - Where color communicates status, add icons or text labels
    - Ensure badges include both color and text (not just color)
    - Verify charts use patterns or labels in addition to colors
    - _Requirements: 17.5_

- [ ] 24. Checkpoint - Verify dark mode and accessibility
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Testing and Documentation

- [ ]* 25. Write unit tests for design compliance
  - [ ]* 25.1 Test components render without gradients
    - Write tests verifying Button, Badge, Card components don't use linear-gradient or radial-gradient
    - Test that background properties contain solid colors only
    - _Requirements: 19.1_
  
  - [ ]* 25.2 Test border-radius values are within acceptable ranges
    - Write tests verifying border-radius is between 6-12px for standard elements
    - Test that pills use border-radius: 9999px appropriately
    - _Requirements: 19.2_
  
  - [ ]* 25.3 Test tabular-nums applied to numeric displays
    - Write tests verifying Metric_Components have font-variant-numeric: tabular-nums
    - Test that sensor readings, timestamps, and metrics use tabular numerals
    - _Requirements: 19.3_

- [ ]* 26. Configure visual regression testing
  - [ ]* 26.1 Set up Chromatic or Percy for screenshot comparison
    - Configure visual regression testing tool in CI pipeline
    - Capture screenshots of all major pages (Dashboard, Analytics, Alerts, Sensors, Reports, Settings)
    - Create baseline for "before" state
    - _Requirements: 19.4_
  
  - [ ]* 26.2 Generate and review visual regression reports
    - Run visual regression tests after all refinements
    - Review flagged differences (gradients, shadows, border-radius)
    - Approve refined designs as new baseline
    - _Requirements: 19.5_

- [ ]* 27. Write integration tests for design consistency
  - [ ]* 27.1 Test consistent spacing and typography across pages
    - Write tests verifying consistent spacing tokens used throughout app
    - Test typography tokens applied correctly (page titles, section titles, card titles, metrics)
    - _Requirements: 19.4_
  
  - [ ]* 27.2 Test theme switching maintains hierarchy
    - Write tests verifying light-to-dark theme switching preserves visual hierarchy
    - Test that all components have corresponding dark mode variants
    - _Requirements: 19.4_

- [ ] 28. Create design system documentation
  - [ ] 28.1 Document design tokens and usage guidelines
    - Create `frontend/docs/design-system.md` documenting all design tokens
    - List colors, spacing, typography, and border-radius values
    - Provide examples of correctly styled components
    - Document discouraged patterns (gradients, glassmorphism, excessive shadows)
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ] 28.2 Create before/after examples for developers
    - Include side-by-side code examples showing AI-generated vs production-grade styles
    - Document dark mode implementation patterns
    - Provide linting rules or ESLint config for enforcing design principles
    - Create onboarding guide with style comparison examples
    - _Requirements: 20.3, 20.4, 20.5, 20.6_

- [ ] 29. Final checkpoint - Ensure all tests pass and documentation is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is a **pure visual refinement project** - no functionality, business logic, or API changes
- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Focus on **Phase 1 (Foundation)** first as it establishes the design token system used throughout
- Gradients, glassmorphism, and excessive shadows are the primary targets for removal
- Maintain WCAG AA accessibility standards throughout refinement
- Use existing React/TypeScript/Tailwind tooling - no new dependencies required
- Test dark mode thoroughly to ensure consistency with light mode hierarchy

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1", "18.1", "19.1", "20.1"] },
    { "id": 2, "tasks": ["5.2", "6.2", "7.2", "8.2", "9.2", "18.2", "19.2", "20.2"] },
    { "id": 3, "tasks": ["11.1", "12.1", "13.1", "14.1", "15.1", "16.1"] },
    { "id": 4, "tasks": ["11.2", "12.2", "13.2", "14.2", "15.2", "16.2"] },
    { "id": 5, "tasks": ["22.1", "23.1"] },
    { "id": 6, "tasks": ["22.2", "23.2"] },
    { "id": 7, "tasks": ["25.1", "25.2", "25.3", "26.1", "27.1"] },
    { "id": 8, "tasks": ["26.2", "27.2", "28.1"] },
    { "id": 9, "tasks": ["28.2"] }
  ]
}
```
