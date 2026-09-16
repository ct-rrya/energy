# Tasks: Responsive Design & Mobile Optimization

## Task 1: Foundation - Utility Hooks & Layout Setup

### 1.1 Create useMediaQuery Hook
- [x] Create `frontend/src/hooks/useMediaQuery.ts`
- [x] Implement media query matching with useState and useEffect
- [x] Add event listener for media query changes
- [x] Add debouncing for performance (100ms delay)
- [x] Export hook with TypeScript types
- [x] Test hook with common breakpoints (mobile, tablet, desktop)

**Acceptance:** useMediaQuery hook correctly returns boolean for media query strings and updates on viewport changes

### 1.2 Create useViewportSize Hook
- [x] Create `frontend/src/hooks/useViewportSize.ts`
- [x] Implement window size tracking with useState and useEffect
- [x] Add window resize event listener with debouncing
- [x] Return { width, height } object
- [x] Clean up event listeners on unmount
- [x] Add TypeScript interface for return type

**Acceptance:** useViewportSize hook returns current viewport dimensions and updates on window resize

### 1.3 Update Tailwind Configuration (if needed)
- [x] Verify default breakpoints are configured: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- [x] Add any custom utilities for touch targets (min-w-[44px], min-h-[44px])
- [x] Verify container max-widths are appropriate
- [x] Test Tailwind responsive classes compile correctly

**Acceptance:** Tailwind configuration supports all required breakpoints and utilities

### 1.4 Add Responsive Padding Utilities to DashboardLayout
- [x] Open `frontend/src/layouts/DashboardLayout.tsx`
- [x] Update main content padding from fixed to responsive: `p-4 sm:p-6 lg:p-8`
- [x] Add max-width constraint: `max-w-[1600px] mx-auto`
- [x] Test padding scales properly on different screen sizes
- [x] Verify no layout breaks on ultra-wide screens (> 1920px)

**Acceptance:** Main content area has responsive padding and max-width constraint

---

## Task 2: DashboardLayout - Mobile Sidebar Implementation

### 2.1 Add Mobile Sidebar State Management
- [x] Open `frontend/src/layouts/DashboardLayout.tsx`
- [x] Add `mobileSidebarOpen` state: `useState(false)`
- [x] Import `useMediaQuery` hook
- [x] Add `isDesktop` check: `useMediaQuery('(min-width: 1024px)')`
- [x] Add effect to close mobile sidebar on desktop resize
- [x] Note: Sidebar hidden with hamburger menu for < 1024px per Correction 2 (Option A selected)

**Acceptance:** Component has state and hooks for mobile sidebar management

### 2.2 Create Mobile Hamburger Menu Button
- [x] Add hamburger button component (only visible on mobile/tablet < 1024px)
- [x] Position fixed: `fixed top-4 left-4 z-50`
- [x] Size: `w-12 h-12` (48x48px - exceeds 44px minimum)
- [x] Style with EcoStep colors: `bg-[#1E2128]` with rounded corners
- [x] Add Menu icon from lucide-react
- [x] Add aria-label: "Open navigation menu"
- [x] Add onClick handler: `setMobileSidebarOpen(true)`
- [x] Hide on desktop: conditional render `{!isDesktop && ...}`

**Acceptance:** Hamburger menu button appears on mobile/tablet (< 1024px) and opens sidebar

### 2.3 Create Mobile Sidebar Overlay
- [x] Add conditional render for mobile/tablet sidebar: `{!isDesktop && mobileSidebarOpen && ...}`
- [x] Create backdrop div: `fixed inset-0 bg-black/50 z-40`
- [x] Add onClick handler to backdrop: `setMobileSidebarOpen(false)` + focus return
- [x] Create sidebar container: `fixed left-0 top-0 bottom-0 w-64 z-50`
- [x] Add slide-in animation: `transform transition-transform duration-300`
- [x] Copy existing sidebar content into mobile sidebar
- [x] Add close button in sidebar: X icon with aria-label "Close menu" (44x44px)
- [x] Respect prefers-reduced-motion

**Acceptance:** ✅ Mobile/tablet sidebar slides in from left with backdrop, dismissible by backdrop click or close button

### 2.4 Implement Focus Trapping for Mobile Sidebar
- [x] Add useEffect for focus management when sidebar opens
- [x] Focus first interactive element on open
- [x] Add Tab key handler to trap focus within sidebar
- [x] Handle Shift+Tab for backward navigation
- [x] Return focus to hamburger button on close
- [x] Add Escape key handler to close sidebar

**Acceptance:** ✅ Keyboard focus trapped within mobile sidebar, Escape closes sidebar

### 2.5 Update Main Content Margin Logic
- [x] Update main content marginLeft to use CSS custom properties pattern (Correction 1)
- [x] Mobile/Tablet (< 1024px): No margin, full width
- [x] Desktop (≥ 1024px): Dynamic margin using CSS custom properties: `style={{ '--sidebar-width': `${sidebarWidth}px`, marginLeft: 'calc(var(--sidebar-width) + 48px)' }}`
- [x] Remove any className patterns like `ml-[${sidebarWidth}px]` (not supported by Tailwind JIT)
- [x] Test smooth transitions when resizing

**Acceptance:** ✅ Main content margin adjusts appropriately for each breakpoint without gaps or overlaps using CSS custom properties

### 2.6 Add Body Scroll Lock for Mobile Sidebar
- [x] Add useEffect to set `document.body.style.overflow = 'hidden'` when mobile sidebar open
- [x] Reset to `document.body.style.overflow = ''` when closed
- [x] Clean up on component unmount
- [x] Test page doesn't scroll when mobile sidebar is open

**Acceptance:** ✅ Page scrolling disabled when mobile sidebar is open

---

## Task 3: Metric Cards Responsive Grid

### 3.1 Update Metric Cards Grid Classes
- [x] Open `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- [x] Find metric cards grid container
- [x] Update grid classes: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [x] Update gap: `gap-3 sm:gap-4`
- [x] Test grid behavior at 320px (1 col), 640px (2 cols), 1024px (4 cols)

**Acceptance:** ✅ Metric cards display in 1/2/2/4 columns at appropriate breakpoints (verified in TASK-3-VERIFICATION.md)

### 3.2 Update Metric Card Internal Spacing
- [x] Update card padding: `p-4 sm:p-6`
- [x] Update label font size: `text-xs sm:text-sm`
- [x] Update value font size: `text-2xl sm:text-3xl`
- [x] Update unit font size: `text-base sm:text-lg`
- [x] Test readability at all sizes
- [x] Ensure values don't wrap unnecessarily

**Acceptance:** ✅ Metric card typography scales appropriately and remains readable (verified in TASK-3-VERIFICATION.md)

### 3.3 Add Touch Target Sizing to Interactive Card Elements
- [x] If cards have buttons/links, ensure minimum `w-11 h-11` (44px)
- [x] Add padding to create sufficient touch area
- [x] Test tap targets on mobile device or emulator
- [x] Verify no overlapping touch targets

**Acceptance:** ✅ All interactive elements within metric cards meet 44x44px minimum (verified in TOUCH-TARGET-AUDIT.md and TASK-3-VERIFICATION.md)

### 3.4 Phase 1 Checkpoint Testing
- [x] Run Playwright viewport tests on 4 key breakpoints: 320px, 768px, 1280px, 1920px
- [x] Verify no horizontal scroll at any viewport
- [x] Verify sidebar visibility (hidden < 1024px, visible ≥ 1024px)
- [x] Verify main content margin calculations work with CSS custom properties
- [x] Verify metric cards display in correct column counts (1/2/2/4)
- [x] Verify no element overlap or clipping
- [x] Document test results in PHASE-1-CHECKPOINT.md
- [x] DO NOT PROCEED to Task 4 unless checkpoint passes

**Acceptance:** ✅ All structural layout tests pass at 4 test viewports; foundation is solid before adding charts and tables (PHASE-1-CHECKPOINT.md: PASSED)

---

## Task 4: Charts Responsive Configuration

### 4.1 Update PowerChart Component
- [x] Open chart component (likely in `frontend/src/components/dashboard/` or `frontend/src/features/dashboard/components/`)
- [x] Import `useMediaQuery` hook
- [~] Add `isMobile` check: `useMediaQuery('(max-width: 767px)')`
- [~] Update ResponsiveContainer height: `height={isMobile ? 250 : 400}`
- [~] Update chart margins for mobile: `margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}`
- [~] Update XAxis tick fontSize: `tick={{ fontSize: isMobile ? 11 : 12 }}`
- [~] Add XAxis label rotation for mobile: `angle={isMobile ? -45 : 0}`
- [~] Update Line strokeWidth: `strokeWidth={isMobile ? 2 : 3}`

**Acceptance:** Power chart adjusts height, margins, font sizes, and label orientation for mobile

### 4.2 Update Voltage/Current Charts
- [~] Repeat responsive configuration for voltage and current charts
- [~] Ensure height reduces on mobile (250px)
- [~] Adjust margins, font sizes, and labels
- [~] Test dual-axis chart readability on mobile
- [~] Consider stacking axes vertically on very narrow screens if needed

**Acceptance:** Voltage and current charts are readable and properly sized on mobile

### 4.3 Update Energy Period Chart (Bar Chart)
- [~] Apply responsive configuration to bar chart
- [~] Adjust bar width/spacing for mobile
- [~] Update YAxis tick fontSize for mobile
- [~] Test legend wrapping on narrow screens
- [~] Ensure bars remain tappable (sufficient width)

**Acceptance:** Energy bar chart displays appropriately on mobile with readable labels

### 4.4 Update ChartsLayoutContainer Grid
- [~] Open `frontend/src/features/dashboard/components/ChartsLayoutContainer.tsx` (or similar)
- [~] Update grid layout: `grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6`
- [~] Ensure charts stack vertically on mobile
- [~] Test 2-column layout on desktop (if applicable)
- [~] Verify spacing between charts at all breakpoints

**Acceptance:** Charts container stacks vertically on mobile and arranges in grid on desktop

### 4.5 Add Tooltip Touch Support
- [~] Verify Recharts tooltips work on touch devices (may be default behavior)
- [~] Test tooltip trigger on tap
- [~] Ensure tooltip doesn't require hover
- [~] Add fallback if tooltip positioning issues occur on mobile

**Acceptance:** Chart tooltips display and function correctly on touch devices

---

## Task 5: Tables Responsive Handling

**Note:** Horizontal scroll is the default pattern per requirements 5.1-5.3. Card-based mobile layout (5.4) is marked as MAY (optional) and should only be implemented if explicitly requested.

### 5.1 Implement Horizontal Scroll Container for Sensor Nodes Table
- [~] Find sensor nodes table/list in `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- [~] Wrap table in scroll container: `<div className="overflow-x-auto -mx-4 md:mx-0">`
- [~] Add inner wrapper: `<div className="inline-block min-w-full align-middle">`
- [~] Test horizontal scrolling on mobile
- [~] Ensure rest of page doesn't scroll horizontally

**Acceptance:** Sensor nodes table scrolls horizontally on mobile without affecting page layout

### 5.2 Add Scroll Indicators (Optional Enhancement)
- [~] Add gradient shadow on right edge of scrollable table
- [~] Use `absolute` positioned div with gradient: `bg-gradient-to-l from-white to-transparent`
- [~] Show indicator only when content overflows
- [~] Test visual feedback that more content exists

**Acceptance:** Visual indicator shows when table has more content off-screen

### 5.3 Optimize Table Layout for Mobile (if applicable)
- [~] Evaluate if current sensor nodes display is table-like or card-based
- [~] Current implementation appears to be card-based - verify responsive behavior
- [~] Ensure cards stack properly on mobile
- [~] Update any grid layouts: `grid-cols-1 md:grid-cols-2`
- [~] Note: Card-stacking implementation per 5.4 is optional unless explicitly required

**Acceptance:** Sensor nodes display adapts appropriately for mobile viewing

### 5.4 Add Touch Targets to Table Action Buttons
- [~] Find action buttons in sensor node items (Activity, Download icons)
- [~] Ensure buttons are minimum `w-11 h-11` (44px)
- [~] Current implementation: `w-9 h-9` - increase to `w-11 h-11`
- [~] Test tap targets on mobile device

**Acceptance:** All action buttons in sensor nodes meet 44x44px minimum touch target

---

## Task 6: Header and Action Buttons Responsive Layout

### 6.1 Convert Header Action Buttons to Icon-Only on Mobile
- [x] Open `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- [~] Find header action buttons (Settings, Alerts, Export)
- [~] Update button structure with hidden text on mobile: `<span className="hidden sm:inline">Settings</span>`
- [~] Ensure icons are visible: `<Settings className="w-4 h-4 sm:mr-2" />`
- [~] Adjust button padding: `px-3 py-2 sm:px-4 sm:py-3`
- [~] Test buttons at mobile and desktop widths

**Acceptance:** Header buttons show icon-only on mobile, icon+text on desktop

### 6.2 Add aria-labels to Icon-Only Buttons
- [~] Add aria-label to each button: `aria-label="Open settings"`
- [~] Ensure icon has aria-hidden: `<Settings className="w-4 h-4" aria-hidden="true" />`
- [~] Test with screen reader or accessibility inspector
- [~] Verify button purpose is announced correctly

**Acceptance:** Icon-only buttons have descriptive aria-labels for screen readers

### 6.3 Update Page Title Responsive Typography
- [~] Find page title: "EcoStep Dashboard"
- [~] Update heading size: `text-2xl sm:text-3xl font-bold`
- [~] Update subtitle size if present: `text-sm sm:text-base`
- [~] Test readability at mobile sizes
- [~] Ensure title doesn't wrap awkwardly

**Acceptance:** Page title scales appropriately and remains readable on mobile

### 6.4 Adjust Header Layout for Mobile Wrapping
- [~] Update header container to allow wrapping: `flex-col sm:flex-row`
- [~] Add gap: `gap-4`
- [~] Test header at narrow widths
- [~] Ensure title and actions don't overlap
- [~] Verify layout is usable at 320px width

**Acceptance:** Header layout wraps gracefully on mobile without overlapping elements

---

## Task 7: FloatingChatButton Responsive Design

### 7.1 Add Responsive Styles to Chat Panel
- [~] Open `frontend/src/components/FloatingChatButton.tsx`
- [~] Verify existing mobile full-screen styles work correctly
- [x] Import `useMediaQuery` hook
- [~] Add breakpoint checks: `isMobile`, `isTablet`, `isDesktop`
- [~] Update panel styles with conditional logic:
  - Mobile: `inset: 0, width: '100%', height: '100dvh', borderRadius: 0`
  - Tablet: `90% width/height, centered, max 600x800px`
  - Desktop: `400x600px, bottom-right positioning`
- [~] Test at each breakpoint

**Acceptance:** Chat panel displays full-screen on mobile, centered on tablet, floating panel on desktop

### 7.2 Update Chat Button Touch Target
- [~] Verify chat button size: currently `w-[60px] h-[60px]` ✓
- [~] Ensure button exceeds 44x44px minimum ✓
- [~] Test button tap area on mobile device
- [~] Verify button doesn't obstruct important content on mobile

**Acceptance:** Chat button meets touch target requirements and doesn't obstruct content

### 7.3 Add Body Scroll Lock for Mobile Chat
- [~] Add useEffect to lock body scroll when chat open on mobile
- [~] Set `document.body.style.overflow = 'hidden'` when `isExpanded && isMobile`
- [~] Reset on close or desktop resize
- [~] Test page doesn't scroll when mobile chat is open

**Acceptance:** Page scrolling disabled when chat is open on mobile

### 7.4 Update Chat Close Button Size
- [~] Find close button in chat header: currently `w-[32px] h-[32px]`
- [~] Increase to `w-11 h-11` (44px minimum) on mobile
- [~] Use responsive classes: `w-11 h-11 sm:w-8 sm:h-8`
- [~] Test close button tap target on mobile

**Acceptance:** Chat close button meets 44x44px minimum touch target on mobile

### 7.5 Handle Virtual Keyboard on Mobile
- [~] Test chat input field on mobile device with virtual keyboard
- [~] Verify input field remains accessible when keyboard opens
- [~] Adjust chat panel height if needed: use `height: '100dvh'` for dynamic viewport
- [~] Ensure messages area scrolls properly with keyboard visible

**Acceptance:** Chat interface remains usable when virtual keyboard is open

---

## Task 8: Viewport and Mobile Browser Chrome Handling

### 8.1 Update Viewport Height Units
- [~] Find components using `100vh`: FloatingChatButton, DashboardLayout
- [~] Replace with `100dvh` where appropriate (dynamic viewport height)
- [~] Test on iOS Safari with address bar hide/show
- [~] Test on Android Chrome with bottom nav
- [~] Verify no clipping occurs with browser chrome

**Acceptance:** Full-height elements adapt to mobile browser chrome correctly

### 8.2 Add Safe Area Insets
- [~] Add CSS environment variables for safe areas: `env(safe-area-inset-top)`, etc.
- [~] Apply to fixed positioned elements (chat button, hamburger menu)
- [~] Test on devices with notches (iPhone X+)
- [~] Verify content doesn't go under notch or rounded corners

**Acceptance:** Fixed elements respect device safe areas (notches, rounded corners)

### 8.3 Test iOS Safari Specific Behaviors
- [~] Test sticky headers remain positioned when address bar hides
- [~] Test fixed positioned elements (chat button) remain visible
- [~] Test scroll behavior with rubber-banding
- [~] Verify no white space appears during overscroll

**Acceptance:** Dashboard works correctly in iOS Safari with all browser UI states

### 8.4 Test Android Chrome Specific Behaviors
- [~] Test with bottom navigation bar visible
- [~] Test with Chrome's pull-to-refresh
- [~] Verify fixed elements remain accessible
- [~] Test viewport resize when keyboard opens/closes

**Acceptance:** Dashboard works correctly in Android Chrome with all browser UI states

---

## Task 9: Performance Optimization

### 9.1 Add Debouncing to Resize Handlers
- [~] Update `useMediaQuery` hook with debouncing (already in design)
- [~] Update `useViewportSize` hook with debouncing
- [~] Use 100ms delay for resize events
- [~] Test resize performance is smooth
- [~] Verify no excessive re-renders on resize

**Acceptance:** Viewport change handlers are debounced for better performance

### 9.2 Memoize Responsive Components
- [~] Verify WebSocket data flow before implementing MetricCard memo (Correction 3)
- [~] Ensure parent component passes primitives (label: string, value: number, unit: string)
- [~] If parent passes object references, refactor to use useMemo/selectors for primitive extraction
- [~] Wrap MetricCard component with React.memo
- [~] Wrap chart components with React.memo
- [~] Add useMemo for expensive calculations in components
- [~] Use useCallback for event handlers passed to children
- [~] Profile component re-renders before/after

**Acceptance:** Responsive components are memoized with proper primitive props contract to prevent unnecessary re-renders

### 9.3 Implement Lazy Loading for Below-Fold Charts
- [~] Wrap ChartsLayoutContainer with lazy() and Suspense
- [~] Create loading skeleton for charts
- [~] Test charts load after above-fold content
- [~] Verify initial page load is faster
- [~] Measure FCP (First Contentful Paint) improvement

**Acceptance:** Charts are lazy-loaded to improve initial page load performance

### 9.4 Optimize TanStack Query Cache Settings
- [~] Review TanStack Query configuration
- [~] Set appropriate staleTime for dashboard metrics (e.g., 30s)
- [~] Set appropriate cacheTime (e.g., 5 minutes)
- [~] Verify no duplicate API requests on mount
- [~] Test data freshness vs. request frequency balance

**Acceptance:** TanStack Query cache minimizes redundant API requests

### 9.5 Add Virtual Scrolling if Needed
- [~] Count typical number of sensor nodes displayed
- [~] If > 100 items, implement virtual scrolling with @tanstack/react-virtual
- [~] Test scroll performance with large lists
- [~] Verify memory usage doesn't spike with many items

**Acceptance:** Long lists use virtual scrolling for optimal performance (if needed)

---

## Task 10: Touch and Accessibility

### 10.1 Audit All Interactive Elements for Touch Targets
- [~] Create checklist of all buttons, links, inputs
- [~] Measure each element's tap area
- [~] Update any elements < 44x44px to meet minimum
- [~] Use Chrome DevTools mobile emulator to visualize touch targets
- [~] Test on physical mobile device

**Acceptance:** 100% of interactive elements meet 44x44px minimum touch target

### 10.2 Update Font Sizes for Mobile Readability
- [~] Find all text elements < 14px on mobile
- [~] Update to minimum `text-sm` (14px) for body text
- [~] Update headings: h1 `text-2xl sm:text-3xl`, h2 `text-xl sm:text-2xl`
- [~] Test readability without zooming on mobile device
- [~] Verify text hierarchy remains clear

**Acceptance:** All text meets minimum font size requirements for mobile readability

### 10.3 Add Skip Link for Keyboard Navigation
- [~] Add skip link at top of DashboardLayout: `<a href="#main-content">Skip to main content</a>`
- [~] Style as visually hidden: `sr-only focus:not-sr-only`
- [~] Add visible styles on focus with high contrast
- [~] Add `id="main-content"` to main element
- [~] Test Tab key shows skip link

**Acceptance:** Skip link appears on Tab and allows keyboard users to skip navigation

### 10.4 Implement Focus Management for Modals/Overlays
- [~] Ensure mobile sidebar focuses first element on open
- [~] Ensure chat panel focuses input on open
- [~] Add focus trap to mobile sidebar (already in Task 2.4)
- [~] Return focus to trigger button on close
- [~] Test keyboard navigation through all interactive elements

**Acceptance:** Focus is managed correctly for all modal/overlay interactions

### 10.5 Add ARIA Labels to Icon-Only Controls
- [~] Audit all icon-only buttons (mobile header buttons, action buttons)
- [~] Add aria-label to each: `aria-label="Settings"`
- [~] Add aria-hidden to icons: `<Icon aria-hidden="true" />`
- [~] Test with screen reader (NVDA, VoiceOver, TalkBack)
- [~] Verify button purpose is announced

**Acceptance:** All icon-only controls have descriptive ARIA labels

### 10.6 Verify Color Contrast Ratios
- [~] Use browser extension (axe DevTools, WAVE) to check contrast
- [~] Test all text on background combinations
- [~] Ensure 4.5:1 ratio for normal text (WCAG AA)
- [~] Ensure 3:1 ratio for large text (WCAG AA)
- [~] Fix any failing contrast ratios
- [~] Test in both light and dark themes

**Acceptance:** All color combinations meet WCAG 2.1 Level AA contrast requirements

### 10.7 Ensure Hover States Have Touch Equivalents
- [~] Find all hover-dependent interactions (tooltips, dropdowns)
- [~] Add tap/click triggers for touch devices
- [~] Test tooltips appear on tap on mobile
- [~] Test dropdown menus open on tap
- [~] Remove hover-only functionality

**Acceptance:** All interactions work without hover on touch devices

---

## Task 11: Comprehensive Breakpoint Testing

**IMPORTANT:** Requirement 11 completion requires physical device verification per Requirement 11.9. DevTools/simulator testing alone is insufficient. Flag any test as 'Pending Physical Device QA' if physical devices are unavailable.

### 11.1 Set Up Automated Breakpoint Tests
- [~] Install Playwright or update existing test setup
- [~] Create viewport test configuration with all 12 sizes from Requirement 11.1
- [~] Write test to visit dashboard at each viewport
- [~] Check for horizontal scroll: `scrollWidth <= clientWidth`
- [~] Take screenshots at each breakpoint
- [~] Create baseline screenshots for comparison

**Acceptance:** Automated tests verify no horizontal scrolling at all breakpoints

### 11.2 Manual Testing - Mobile Devices (320-480px)
- [~] Test on iPhone SE (320 × 568) or simulator
- [~] Test on Android small (360 × 800) or emulator
- [~] Test on iPhone 12/13/14 (390 × 844) or simulator
- [~] Test on Android large (412 × 915) or emulator
- [~] Test landscape orientation (480 × 800)
- [~] Verify checklist: no scroll, no clips, readable text, accessible buttons
- [~] Flag as 'Pending Physical Device QA' if only tested in DevTools/simulator

**Acceptance:** Dashboard works correctly on all mobile device sizes in portrait and landscape (subject to physical device verification per Requirement 11.9)

### 11.3 Manual Testing - Tablet Devices (768-1024px)
- [~] Test on iPad portrait (768 × 1024) or simulator
- [~] Test on iPad Air (820 × 1180) or simulator
- [~] Test on iPad landscape (1024 × 768) or simulator
- [~] Verify sidebar behavior (hidden with hamburger menu < 1024px)
- [~] Verify metric cards layout (2 columns)
- [~] Verify charts adapt properly
- [ ] Flag as 'Pending Physical Device QA' if only tested in DevTools/simulator

**Acceptance:** Dashboard works correctly on all tablet sizes in portrait and landscape (subject to physical device verification per Requirement 11.9)

### 11.4 Manual Testing - Desktop Devices (1280-1920px)
- [~] Test on laptop (1280 × 720) or browser resize
- [~] Test on common laptop (1366 × 768) or browser resize
- [~] Test on MacBook (1440 × 900) or browser resize
- [~] Test on desktop (1920 × 1080) or browser resize
- [~] Verify sidebar is visible and functional
- [~] Verify metric cards layout (4 columns)
- [~] Verify all features accessible
- [~] Flag as 'Pending Physical Device QA' if only tested in DevTools/browser resize

**Acceptance:** Dashboard works correctly on all desktop sizes with full functionality (subject to physical device verification per Requirement 11.9)

### 11.5 Test Ultra-Wide Displays (> 1920px)
- [~] Test at 2560 × 1440 (2K)
- [~] Test at 3840 × 2160 (4K)
- [~] Verify max-width constraint prevents excessive stretching
- [~] Verify content remains centered and readable
- [~] Verify no awkward gaps or spacing issues

**Acceptance:** Dashboard remains properly constrained and centered on ultra-wide displays

### 11.6 Document Test Results
- [~] Create test report with results for each viewport
- [~] Include screenshots showing responsive behavior
- [~] Document any issues found and resolutions
- [~] Create checklist of passing criteria
- [~] Get stakeholder sign-off on visual design at each breakpoint

**Acceptance:** Complete test report documenting responsive behavior across all breakpoints

---

## Task 12: Accessibility Audit

### 12.1 Run Automated Accessibility Tests
- [~] Install axe DevTools browser extension
- [~] Run axe scan on dashboard page at mobile viewport
- [~] Run axe scan on dashboard page at desktop viewport
- [~] Fix any violations found (contrast, ARIA, focus, etc.)
- [~] Re-run until 0 violations
- [~] Document test results

**Acceptance:** axe DevTools reports 0 accessibility violations on dashboard

### 12.2 Manual Keyboard Navigation Testing
- [~] Test Tab key navigation through all interactive elements
- [~] Test Shift+Tab backward navigation
- [~] Test Enter/Space key activation of buttons
- [~] Test Escape key closes modals/sidebars
- [~] Test arrow keys in dropdowns/menus
- [~] Verify no keyboard traps (except intentional focus traps)
- [~] Verify focus indicators are visible

**Acceptance:** All functionality is accessible via keyboard with visible focus indicators

### 12.3 Screen Reader Testing
- [~] Test with NVDA (Windows) or JAWS
- [~] Test with VoiceOver (macOS/iOS)
- [~] Test with TalkBack (Android)
- [~] Verify page structure is announced correctly
- [~] Verify interactive elements are announced with their purpose
- [~] Verify state changes are announced (sidebar open/close, etc.)
- [~] Fix any missing or incorrect ARIA labels

**Acceptance:** Dashboard is fully navigable and understandable with screen readers

### 12.4 Color Blindness Testing
- [~] Use Chrome DevTools to emulate protanopia, deuteranopia, tritanopia
- [~] Verify status indicators (online/offline, active/idle) are distinguishable
- [~] Verify chart colors are distinguishable
- [~] Ensure information isn't conveyed by color alone
- [~] Add text labels or icons where needed

**Acceptance:** Dashboard is usable for users with color blindness

---

## Task 13: Performance Testing & Optimization

### 13.1 Measure Performance Metrics
- [~] Use Lighthouse to measure performance on mobile (3G throttling)
- [~] Record First Contentful Paint (FCP) - target < 2s
- [~] Record Largest Contentful Paint (LCP) - target < 2.5s
- [~] Record Time to Interactive (TTI)
- [~] Record Total Blocking Time (TBT)
- [~] Create baseline performance report

**Acceptance:** Performance metrics meet acceptable thresholds on mobile

### 13.2 Profile Component Rendering
- [~] Use React DevTools Profiler to record dashboard mount
- [~] Identify components with excessive render time
- [~] Identify components with unnecessary re-renders
- [~] Optimize identified components with memoization
- [~] Re-profile to verify improvements

**Acceptance:** Component rendering is optimized with no excessive re-renders

### 13.3 Optimize Bundle Size
- [~] Use webpack-bundle-analyzer or Vite's rollup-plugin-visualizer
- [~] Identify large dependencies
- [~] Verify tree-shaking is working
- [~] Lazy load large components (charts, etc.)
- [~] Re-analyze bundle after optimizations

**Acceptance:** Bundle size is minimized through code splitting and lazy loading

### 13.4 Test on Slow Networks
- [~] Use Chrome DevTools network throttling (Slow 3G, Fast 3G)
- [~] Verify loading states display correctly
- [~] Verify page remains usable during data loading
- [~] Test offline behavior (if applicable)
- [~] Optimize API request timing if needed

**Acceptance:** Dashboard loads and functions acceptably on slow mobile networks

---

## Task 14: Integration & Final Testing

### 14.1 Integration Testing with Existing Features
- [~] Test authentication flow on mobile
- [~] Test Public User view on mobile
- [~] Test Admin User view on mobile
- [~] Test WebSocket real-time updates on mobile
- [~] Test theme switching (light/dark) on mobile
- [~] Test all navigation links work on mobile
- [~] Test chat interface works on mobile

**Acceptance:** All existing features work correctly on mobile devices

### 14.2 Cross-Browser Testing
- [~] Test on Chrome (mobile and desktop)
- [~] Test on Firefox (mobile and desktop)
- [~] Test on Safari (iOS and macOS)
- [~] Test on Edge (desktop)
- [~] Test on Samsung Internet (Android)
- [~] Document any browser-specific issues
- [~] Add polyfills or fallbacks if needed

**Acceptance:** Dashboard works correctly on all major browsers

### 14.3 Regression Testing - Desktop
- [~] Verify desktop layout is unchanged (except improvements)
- [~] Verify all desktop features still work
- [~] Verify sidebar expand/collapse works
- [~] Verify all charts display correctly
- [~] Verify all admin features are accessible
- [~] Run existing test suite

**Acceptance:** Desktop functionality is preserved with no regressions

### 14.4 User Acceptance Testing
- [~] Deploy to staging environment
- [~] Provide test devices or emulators to stakeholders
- [~] Walk through key user flows on mobile
- [~] Walk through key user flows on tablet
- [~] Walk through key user flows on desktop
- [~] Collect feedback on UX and visual design
- [~] Address any critical feedback items

**Acceptance:** Stakeholders approve responsive design for production deployment

### 14.5 Update Documentation
- [~] Update README with responsive design information
- [~] Document breakpoint strategy
- [~] Document mobile-specific behaviors
- [~] Update component documentation with responsive props
- [~] Add screenshots of responsive layouts
- [~] Document browser/device support matrix

**Acceptance:** Documentation reflects responsive design implementation

---

## Task 15: Production Deployment

### 15.1 Final Pre-Deployment Checks
- [~] Run full test suite (unit, integration, e2e)
- [~] Verify TypeScript compiles with 0 errors
- [~] Verify no console errors in production build
- [~] Run Lighthouse audit on production build
- [~] Verify bundle size is acceptable
- [~] Create deployment checklist

**Acceptance:** All pre-deployment checks pass successfully

### 15.2 Deploy to Production
- [~] Create deployment branch with all responsive changes
- [~] Deploy to production environment
- [~] Smoke test on production: verify dashboard loads
- [~] Test on actual devices: mobile phone, tablet, desktop
- [~] Monitor error logs for any issues
- [~] Verify analytics/monitoring shows no spike in errors

**Acceptance:** Responsive dashboard is live in production with no critical issues

### 15.3 Post-Deployment Monitoring
- [~] Monitor performance metrics for 24-48 hours
- [~] Monitor error rates and user feedback
- [~] Track mobile vs. desktop usage analytics
- [~] Address any issues reported by users
- [~] Create post-deployment report

**Acceptance:** Dashboard performs well in production with positive user feedback

---

## Summary

**Total Tasks:** 15 major categories, ~80 subtasks

**Estimated Timeline:**
- Week 1: Tasks 1-3 (Foundation, sidebar, metrics)
- Week 2: Tasks 4-7 (Charts, tables, headers, chat)
- Week 3: Tasks 8-10 (Viewport, performance, accessibility)
- Week 4: Tasks 11-15 (Testing, integration, deployment)

**Key Milestones:**
1. Foundation hooks and sidebar working (End of Week 1)
2. All components responsive (End of Week 2)
3. Accessibility and performance optimized (End of Week 3)
4. Fully tested and deployed (End of Week 4)

**Dependencies:**
- Tasks 1 must complete before other tasks (foundation)
- Tasks 2-7 can be done in parallel after Task 1
- Tasks 8-10 should follow component work
- Tasks 11-12 are validation tasks
- Tasks 13-15 are final stages

