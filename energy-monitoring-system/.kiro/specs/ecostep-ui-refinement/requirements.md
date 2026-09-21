# Requirements Document: EcoStep UI Refinement

## Introduction

Transform the EcoStep IoT energy monitoring system from a generic AI-generated dashboard template into a deliberately designed, production-grade technical monitoring interface. This refinement targets visual presentation only—CSS, styling, and component appearance—without any changes to functionality, business logic, or data handling.

## Glossary

- **EcoStep_UI**: The frontend React application for the EcoStep energy monitoring system
- **Design_Token**: Predefined style values (colors, spacing, typography) used consistently across the application
- **Hairline_Border**: A thin (1px solid) border used for subtle definition between elements
- **Glassmorphism**: A visual style using backdrop-filter blur effects and translucent backgrounds (to be removed)
- **Tabular_Numerals**: Font variant where all digits have uniform width for vertical alignment
- **Metric_Component**: UI component displaying numeric data (energy consumption, sensor counts, etc.)
- **Semantic_Color**: Colors with specific meanings (green=success, amber=warning, red=error)
- **Floating_Element**: UI layer that appears above other content (modals, dropdowns, tooltips)
- **Flat_Color**: Solid color without gradients or opacity effects

## Requirements

### Requirement 1: Remove Universal Gradients

**User Story:** As a user, I want the interface to use flat colors instead of gradients, so that the dashboard looks professional and production-grade rather than AI-generated.

#### Acceptance Criteria

1. WHEN the EcoStep_UI loads, THE System SHALL NOT use linear-gradient() in background properties for any component except logos
2. WHEN the EcoStep_UI loads, THE System SHALL NOT use radial-gradient() in background properties for any component except logos
3. WHERE a component previously used gradients, THE System SHALL replace them with flat Semantic_Colors or EcoStep green (#3DDC97)
4. WHEN rendering buttons, THE System SHALL use solid background colors without gradient effects
5. WHEN rendering hero sections or headers, THE System SHALL use solid background colors without gradient overlays

### Requirement 2: Eliminate Glassmorphism Effects

**User Story:** As a user, I want cards and containers to have solid backgrounds with clear borders, so that content is easier to read and the interface feels more intentional.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders any card component, THE System SHALL NOT apply backdrop-filter blur effects
2. WHEN the EcoStep_UI renders any container, THE System SHALL use solid background colors instead of translucent rgba backgrounds with opacity > 0.1
3. WHERE a component previously used glassmorphism, THE System SHALL add Hairline_Borders for definition
4. THE System SHALL use background color rgb(255, 255, 255) for light mode cards
5. THE System SHALL use background color rgb(28, 31, 40) for dark mode cards
6. WHEN rendering card borders, THE System SHALL use rgba opacity between 0.08-0.15 for subtle definition

### Requirement 3: Reduce Border Radius Values

**User Story:** As a user, I want UI elements to have moderate border radius (not excessive roundness), so that the interface looks more technical and less playful.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders standard cards, THE System SHALL use border-radius between 8-12px
2. WHEN the EcoStep_UI renders small elements (buttons, inputs), THE System SHALL use border-radius of 6-8px
3. WHERE a component is a badge or pill, THE System SHALL use border-radius: 9999px only if the element is truly pill-shaped
4. THE System SHALL NOT use border-radius values exceeding 12px except for pills
5. WHEN rendering large containers, THE System SHALL use border-radius of 12px maximum

### Requirement 4: Remove Excessive Shadows

**User Story:** As a user, I want shadows to be used only for floating elements (modals, dropdowns), so that visual hierarchy is communicated through borders and spacing rather than shadows.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders card components, THE System SHALL NOT apply box-shadow effects
2. WHEN the EcoStep_UI renders Floating_Elements (modals, dropdowns, tooltips), THE System SHALL apply subtle box-shadow for layering
3. WHERE surface contrast is needed, THE System SHALL use Hairline_Borders instead of shadows
4. THE System SHALL NOT use box-shadow on buttons, badges, or navigation elements
5. WHEN rendering containers, THE System SHALL achieve definition through 1px solid borders

### Requirement 5: Establish Data-First Visual Hierarchy

**User Story:** As a user, I want numeric data to be the visual hero of metric displays, so that I can quickly scan energy consumption values without distraction.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders a Metric_Component, THE System SHALL display the numeric value with font-size >= 36px for primary metrics
2. WHEN the EcoStep_UI renders a Metric_Component, THE System SHALL apply font-weight >= 600 to numeric values
3. WHEN the EcoStep_UI renders a Metric_Component, THE System SHALL enable Tabular_Numerals (font-variant-numeric: tabular-nums)
4. WHEN the EcoStep_UI renders metric icons, THE System SHALL position icons beside labels (not in large tiles above data)
5. WHEN the EcoStep_UI renders metric icons, THE System SHALL limit icon size to <= 20px (preferably 16px)
6. WHERE a metric has secondary values, THE System SHALL use font-size of 20px and subdued color (#525252 light, #9CA3AF dark)
7. WHEN rendering metric labels, THE System SHALL use 13px uppercase text with letter-spacing: 0.05em

### Requirement 6: Remove Pastel Icon Tiles

**User Story:** As a user, I want icons to support data labels rather than compete with them, so that my attention focuses on the actual values being monitored.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders a Metric_Component with an icon, THE System SHALL NOT display the icon in a large pastel-colored tile
2. WHERE a metric previously had an icon tile, THE System SHALL position the icon inline beside the label
3. WHEN rendering metric icons, THE System SHALL use neutral colors (#525252 light, #9CA3AF dark)
4. THE System SHALL remove background gradients from all icon containers
5. WHEN rendering icons, THE System SHALL use 16x16px or 20x20px sizes maximum

### Requirement 7: Apply Hairline Borders

**User Story:** As a user, I want cards and containers to have subtle borders for definition, so that content areas are clearly delineated without heavy shadows.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders any card component without backdrop-filter, THE System SHALL add a 1px solid border
2. WHERE light mode is active, THE System SHALL use border color rgba(26, 49, 44, 0.08) for cards
3. WHERE dark mode is active, THE System SHALL use border color rgba(137, 215, 183, 0.12) for cards
4. WHEN rendering navigation elements, THE System SHALL use Hairline_Borders for separation between sections
5. THE System SHALL use consistent border opacity (0.08-0.15) throughout the application

### Requirement 8: Refine Badge Components

**User Story:** As a user, I want status badges to use semantic colors with visible borders, so that system states are immediately recognizable.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders a success/healthy badge, THE System SHALL use green (#22C55E) as the Semantic_Color
2. WHEN the EcoStep_UI renders a warning badge, THE System SHALL use amber (#F59E0B) as the Semantic_Color
3. WHEN the EcoStep_UI renders an error/alert badge, THE System SHALL use red (#EF4444) as the Semantic_Color
4. WHEN the EcoStep_UI renders any badge, THE System SHALL add a 1px solid border with opacity 0.2
5. WHERE a badge is not truly pill-shaped, THE System SHALL use border-radius: 6px instead of rounded-full
6. WHEN rendering badge backgrounds, THE System SHALL use rgba color with 0.1 opacity for subtle fill
7. THE System SHALL NOT use arbitrary colors (purple, arbitrary blue, arbitrary orange) for badges unless contextually meaningful

### Requirement 9: Refine Button Components

**User Story:** As a user, I want buttons to have flat colors with restrained hover effects, so that interactions feel responsive but not animated or playful.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders primary action buttons, THE System SHALL use solid background color #3DDC97 (EcoStep green)
2. WHEN a user hovers over a button, THE System SHALL darken the background color slightly (hover: #35c27b)
3. WHEN a user hovers over a button, THE System SHALL NOT apply transform: scale effects
4. WHEN the EcoStep_UI renders buttons, THE System SHALL use border-radius of 8px
5. THE System SHALL NOT apply box-shadow to button components
6. WHEN rendering button text, THE System SHALL use font-weight: 500
7. WHEN rendering disabled buttons, THE System SHALL reduce opacity to 0.5 without changing background color

### Requirement 10: Refine Chart Visualizations

**User Story:** As a user, I want charts to prioritize data clarity over decoration, so that I can analyze energy patterns without visual noise.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders area charts, THE System SHALL use area fill opacity <= 0.15
2. WHEN the EcoStep_UI renders line or area charts, THE System SHALL disable decorative dots (dot={false})
3. WHEN a user hovers over a chart, THE System SHALL show activeDot with radius <= 4px
4. WHEN the EcoStep_UI renders charts, THE System SHALL use EcoStep green (#3DDC97) as the primary stroke color
5. WHEN rendering chart axes, THE System SHALL use neutral colors (#525252) with 12px font size
6. WHEN rendering CartesianGrid, THE System SHALL use stroke color rgba(26, 49, 44, 0.1) with strokeDasharray="3 3"
7. THE System SHALL NOT use gradient fills in chart areas (except for subtle opacity fades)
8. WHEN rendering axis labels, THE System SHALL include clear labels (e.g., "Time (24h)", "Energy (kWh)")

### Requirement 11: Apply Typography System

**User Story:** As a developer, I want consistent typography tokens across the application, so that text hierarchy is predictable and maintainable.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders page titles, THE System SHALL use 32px font size with font-weight: 700
2. WHEN the EcoStep_UI renders section titles, THE System SHALL use 20px font size with font-weight: 600
3. WHEN the EcoStep_UI renders card titles, THE System SHALL use 16px font size with font-weight: 600
4. WHEN the EcoStep_UI renders primary metrics, THE System SHALL use 36px font size with font-weight: 600 and Tabular_Numerals
5. WHEN the EcoStep_UI renders secondary metrics, THE System SHALL use 20px font size with font-weight: 600 and Tabular_Numerals
6. WHEN the EcoStep_UI renders metric labels, THE System SHALL use 13px font size with font-weight: 500 and text-transform: uppercase

### Requirement 12: Implement Dark Mode Consistency

**User Story:** As a user, I want dark mode to maintain the same visual hierarchy and design principles as light mode, so that my experience is consistent regardless of theme preference.

#### Acceptance Criteria

1. WHERE light mode uses #FFFFFF backgrounds, dark mode SHALL use #0F1116 for page backgrounds
2. WHERE light mode uses #F5F5F5 for cards, dark mode SHALL use #1C1F28 for card surfaces
3. WHERE light mode uses rgba(26, 49, 44, 0.08) borders, dark mode SHALL use rgba(137, 215, 183, 0.12) borders
4. WHEN dark mode is active, primary text SHALL use color #F9FAFB
5. WHEN dark mode is active, secondary text SHALL use color #9CA3AF
6. WHERE any component has light mode styles, THE System SHALL provide corresponding dark mode variants
7. WHEN switching between light and dark modes, THE System SHALL maintain identical visual hierarchy and spacing

### Requirement 13: Update Global CSS Foundation

**User Story:** As a developer, I want global CSS to enforce design principles automatically, so that new components inherit production-grade aesthetics by default.

#### Acceptance Criteria

1. THE System SHALL define Design_Tokens for colors, spacing, and typography in global CSS
2. THE System SHALL remove any global gradient utilities from the CSS framework
3. THE System SHALL set default border-radius values (6px, 8px, 12px) in the design system
4. THE System SHALL define Tabular_Numerals as a reusable utility class
5. THE System SHALL define Hairline_Border utilities for light and dark modes
6. WHERE Tailwind CSS utilities exist for removed styles (e.g., backdrop-blur), THE System SHALL document their deprecation

### Requirement 14: Refine Core Components

**User Story:** As a developer, I want core reusable components (Button, Badge, Card) to follow design principles, so that new features automatically look production-grade.

#### Acceptance Criteria

1. WHEN the Button component renders, THE System SHALL apply design tokens for colors, border-radius, and typography
2. WHEN the Badge component renders, THE System SHALL use Semantic_Colors with borders and appropriate border-radius
3. WHEN the EcoCard component renders, THE System SHALL use solid backgrounds with Hairline_Borders (no shadows)
4. WHEN the DashboardCard component renders, THE System SHALL establish data-first hierarchy with large numeric values
5. WHEN the LiveSensorCard component renders, THE System SHALL position icons beside labels (not in tiles)
6. WHERE a component previously used glassmorphism or gradients, THE System SHALL apply refactored styles

### Requirement 15: Refine Feature Pages

**User Story:** As a user, I want all feature pages (Dashboard, Analytics, Alerts, etc.) to follow consistent visual design, so that the application feels cohesive.

#### Acceptance Criteria

1. WHEN the Dashboard page renders, THE System SHALL apply refined card styles and data hierarchy
2. WHEN the Analytics page renders, THE System SHALL apply refined chart styles with restrained colors
3. WHEN the Alerts page renders, THE System SHALL use Semantic_Colors for alert badges and status indicators
4. WHEN the Sensors page renders, THE System SHALL display sensor data with proper Tabular_Numerals formatting
5. WHEN the Reports page renders, THE System SHALL apply consistent typography and spacing
6. WHEN the Settings page renders, THE System SHALL use refined form inputs and buttons
7. WHERE any page has empty states, THE System SHALL use restrained illustrations or icons (no gradients)

### Requirement 16: Improve Empty States

**User Story:** As a user, I want empty states to be helpful and professional, so that I understand next actions without feeling overwhelmed by decorative graphics.

#### Acceptance Criteria

1. WHEN the EcoStep_UI displays an empty state, THE System SHALL use simple icons (<= 48px) in neutral colors
2. WHEN displaying empty state messages, THE System SHALL use clear, actionable text (e.g., "No alerts configured. Create your first alert rule.")
3. WHERE an empty state includes a call-to-action button, THE System SHALL apply refined button styles
4. THE System SHALL NOT use illustrations with gradients or playful colors in empty states
5. WHEN rendering empty state containers, THE System SHALL use subtle backgrounds (neutral-50 light, neutral-900 dark)

### Requirement 17: Maintain Accessibility Standards

**User Story:** As a user with accessibility needs, I want the refined UI to maintain WCAG AA compliance, so that I can use the application effectively.

#### Acceptance Criteria

1. WHEN the EcoStep_UI renders text on backgrounds, THE System SHALL maintain color contrast ratio >= 4.5:1 for normal text
2. WHEN the EcoStep_UI renders large text (>= 18px), THE System SHALL maintain color contrast ratio >= 3:1
3. WHEN removing shadows from buttons, THE System SHALL ensure visible focus states remain (outline or border)
4. WHEN using Semantic_Colors for badges, THE System SHALL ensure sufficient contrast between text and background
5. WHERE color communicates status, THE System SHALL provide additional visual indicators (icons, text labels)
6. WHEN keyboard navigation is used, THE System SHALL maintain visible focus indicators throughout the interface

### Requirement 18: Performance Optimization

**User Story:** As a user on a lower-end device, I want the refined UI to perform smoothly, so that I can monitor energy data without lag or jank.

#### Acceptance Criteria

1. WHERE backdrop-filter blur effects are removed, THE System SHALL improve paint performance on lower-end devices
2. WHERE gradients are removed, THE System SHALL reduce CSS bundle size and rendering complexity
3. WHERE transform hover effects are removed, THE System SHALL eliminate layout thrashing during interactions
4. THE System SHALL use CSS containment (contain: layout style) on card components where appropriate
5. WHEN rendering large lists of metrics or cards, THE System SHALL use efficient CSS without complex filters or transforms

### Requirement 19: Testing and Validation

**User Story:** As a developer, I want automated tests to validate design compliance, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE System SHALL include unit tests verifying components render without gradients
2. THE System SHALL include unit tests verifying border-radius values are within acceptable ranges (6-12px)
3. THE System SHALL include unit tests verifying Tabular_Numerals are applied to numeric displays
4. THE System SHALL include visual regression tests comparing before/after screenshots
5. WHERE visual regression tests detect AI-generated aesthetics (gradients, excessive shadows), THE System SHALL flag them for review
6. WHEN running accessibility tests, THE System SHALL verify WCAG AA compliance is maintained post-refinement

### Requirement 20: Documentation and Guidelines

**User Story:** As a developer, I want documentation explaining the design principles, so that I can create new features that follow the production-grade aesthetic.

#### Acceptance Criteria

1. THE System SHALL provide documentation listing all Design_Tokens (colors, spacing, typography)
2. THE System SHALL document which CSS patterns are discouraged (gradients, glassmorphism, excessive shadows)
3. THE System SHALL provide examples of correctly styled components (buttons, badges, cards, charts)
4. THE System SHALL document dark mode implementation patterns for new components
5. WHERE developers add new components, THE System SHALL provide linting rules to enforce design principles
6. WHEN onboarding new developers, THE System SHALL include a style guide comparing "before" and "after" examples
