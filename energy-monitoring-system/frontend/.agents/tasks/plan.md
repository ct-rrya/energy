# EcoStep Monitoring Pages Redesign - Implementation Plan

## Project Overview
Visual and UX upgrade of the EcoStep monitoring area (EcoStep Central and Historical Analytics) to match the existing Jitter-style landing page design. This is a **frontend-only visual redesign** — all data fetching, routing, authentication, roles, and business logic remain unchanged.

## Technology Stack (Discovered)
- **Framework**: React 19 + TypeScript + Vite
- **Router**: React Router v7
- **Styling**: Tailwind CSS v4 + CSS custom properties
- **Icons**: Lucide React v1.25
- **Charts**: Recharts v3.9
- **State**: React Query (TanStack) + Context API
- **Build**: `npm run build` (TypeScript + Vite)
- **Test**: `vitest run` (no tests exist for these pages yet)

## Current State Analysis

### Design System
- **Landing page** uses: Bricolage Grotesque font, `--landing-*` CSS variables, glass pill navigation with sliding highlight (useSlidingIndicator hook), 28-32px border-radius, smooth cubic-bezier easing
- **Monitoring pages** use: Inter font, `--color-*` CSS variables from index.css, heavy floating sidebar (DashboardLayout), 6-12px border-radius

### Layout
- **Public viewers**: See floating dark sidebar with purple "PUBLIC VIEWER" badge, "Back to Home" link, and a "Guest Mode" card at bottom
- **Admin users (SYSTEM_ADMIN, SUPER_ADMIN)**: See same sidebar with green "Administrator" badge and more nav links (Admin Management, System Diagnostics, Reports, Settings)
- **Navigation**: DashboardLayout.tsx controls the sidebar; LandingNav.tsx shows the target floating pill nav pattern

### Problems to Fix
1. Two separate time-range controls on Analytics page (one at page level, one inside chart card)
2. Guest status shown 3 times (purple badge, info banner, footer card)
3. Inconsistent headings (ALL CAPS on Central, sentence case on Analytics)
4. Offline system shows "0.0" for KPIs (looks like real data, not "no reading")
5. Raw error messages ("Network Error", "Technical Details") shown to public users
6. Heavy sidebar takes too much width for only 3 links (public view)
7. No "last reading" timestamp or skeleton loading states
8. Low-contrast color-coded KPI numbers

### User Roles
- **Public/Guest (userRole === 'public')**: Unauthenticated, read-only access to Dashboard and Analytics
- **SYSTEM_ADMIN**: Full dashboard + analytics + reports + settings + diagnostics
- **SUPER_ADMIN**: Admin management only (no dashboard/analytics per current logic)

---

## Implementation Plan

### FEAT-001: Shared Design System - Add Missing Tokens & MonitoringNav Component

**Type**: `chore`  
**Description**: Extend the existing design system with landing page tokens and create a shared MonitoringNav component that reuses the LandingNav sliding indicator pattern for the monitoring area.

**Steps**:

1. **Add missing design tokens to index.css**  
   - Open `frontend/src/index.css` and add these tokens to `:root` (light mode):
     ```css
     --landing-bg: #f5f8f3;
     --landing-surface: #ffffff;
     --landing-ink: #0d1b14;
     --landing-mute: #5b6b62;
     --landing-line: #dfe8e1;
     --landing-green: #19d46a;
     --landing-green-ink: #05361f;
     --landing-soft: #e4f7ea;
     --landing-pill: rgba(255,255,255,0.78);
     --landing-blue: #2563eb;
     --landing-blue-soft: #e5eeff;
     --landing-amber: #b45309;
     --landing-amber-soft: #fdf0d9;
     --landing-danger: #dc2626;
     --landing-danger-soft: #fde8e8;
     ```
   - Add dark mode overrides in `.dark` selector:
     ```css
     --landing-bg: #0a1224;
     --landing-surface: #111b30;
     --landing-ink: #eaf3ee;
     --landing-mute: #93a39b;
     --landing-line: #1f2b44;
     --landing-soft: #10301f;
     --landing-pill: rgba(17,27,48,0.78);
     --landing-blue: #6ea3ff;
     --landing-blue-soft: #14254a;
     --landing-amber: #f5b04c;
     --landing-amber-soft: #3a2a0e;
     --landing-danger: #ff7b7b;
     --landing-danger-soft: #3b1518;
     ```
   - Add signature easing and radii utilities if missing:
     ```css
     .eco-signature-ease { transition-timing-function: cubic-bezier(0.65, 0, 0.15, 1); }
     .eco-radius-pill { border-radius: 999px; }
     .eco-radius-card { border-radius: 28px; }
     .eco-radius-panel { border-radius: 32px; }
     .eco-radius-tile { border-radius: 20px; }
     ```
   - **Files**: `frontend/src/index.css`

2. **Load Bricolage Grotesque font globally**  
   - Check if `index.html` or `index.css` already loads Bricolage Grotesque. If not, add to `<head>` in `frontend/index.html`:
     ```html
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" rel="stylesheet">
     ```
   - Update CSS to set Bricolage Grotesque as fallback for headings or as primary font for monitoring pages.
   - **Files**: `frontend/index.html`, `frontend/src/index.css`

3. **Create MonitoringNav component**  
   - New file: `frontend/src/components/layout/MonitoringNav.tsx`
   - Reuse the useSlidingIndicator hook from `frontend/src/features/landing/hooks/useSlidingIndicator.ts`
   - Tabs: **Home** (house icon, ROUTES.HOME), **EcoStep Central** (activity icon, ROUTES.DASHBOARD), **Historical Analytics** (trending-up icon, ROUTES.ANALYTICS)
   - Active tab determined by `useLocation().pathname` match
   - Sliding highlight animates on hover/focus, returns to active on leave
   - Right side: theme toggle (sun/moon icon calling `toggleTheme()` from ThemeContext)
   - Brand left: EcoStep footprints logo + "EcoStep" text
   - Public users: no extra right-side actions beyond theme toggle
   - Admin users: could add a small account menu or logout button on the right (optional; spec says "theme toggle and chat/home actions right" but current implementation doesn't have chat launcher in monitoring area, so just theme toggle is acceptable)
   - Use `--landing-*` tokens for colors, `999px` border-radius for pill, `cubic-bezier(0.65, 0, 0.15, 1)` for transitions
   - **Files**: `frontend/src/components/layout/MonitoringNav.tsx`

4. **Export MonitoringNav from layout index**  
   - Update `frontend/src/components/layout/index.ts` (or create if missing) to export MonitoringNav
   - **Files**: `frontend/src/components/layout/index.ts`

**Acceptance Criteria**:
- [ ] Missing `--landing-*` tokens are present in index.css for both light and dark themes
- [ ] Bricolage Grotesque font loads globally
- [ ] MonitoringNav component renders a floating glass pill with 3 tabs, brand left, theme toggle right
- [ ] Sliding highlight animates smoothly between tabs on hover and focus
- [ ] Active tab is highlighted based on current route
- [ ] Clicking tabs navigates to the correct route

**Verification**:
1. Run `npm run build` from `frontend/` directory — build succeeds with no TypeScript errors
2. Start dev server (`npm run dev`) and navigate to `/dashboard` — MonitoringNav renders at top, sliding indicator moves on hover
3. Check browser DevTools → Computed styles — `--landing-*` variables are defined
4. Toggle theme — colors update correctly in MonitoringNav

---

### FEAT-002: DashboardLayout Redesign - Replace Sidebar for Public, Restyle for Admin

**Type**: `refactor`  
**Description**: For public/viewer role, replace the heavy floating sidebar with MonitoringNav at the top. For admin roles, keep a sidebar but restyle it with `--landing-surface` background, `--landing-line` border, soft active highlight with sliding indicator, collapsible to icon-only, and role badge as a small quiet chip. Remove redundant guest messaging (purple badge, info banner, footer card).

**Steps**:

1. **Update DashboardLayout.tsx imports**  
   - Import `MonitoringNav` from `@/components/layout/MonitoringNav`
   - Import `Footprints` icon from `lucide-react` if not already imported
   - **Files**: `frontend/src/layouts/DashboardLayout.tsx`

2. **Detect user role and choose layout mode**  
   - At top of `DashboardLayout` component body, read `userRole` from `getUserRole(isAuthenticated, user)`
   - `const isPublicUser = userRole === 'public';`
   - `const isAdminUser = ['admin'].includes(userRole);` (current code uses `user?.role === 'SYSTEM_ADMIN'` or `'SUPER_ADMIN'`; keep existing logic)
   - **Files**: `frontend/src/layouts/DashboardLayout.tsx`

3. **Public layout: Replace sidebar with MonitoringNav**  
   - Wrap the `<DashboardLayout>` return with a conditional:
     ```tsx
     if (isPublicUser) {
       return (
         <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--landing-bg)' }}>
           <MonitoringNav />
           <main id="main-content" style={{ paddingTop: '80px' }}>
             {children}
           </main>
         </div>
       );
     }
     ```
   - No sidebar, no purple badge, no "Guest Mode" card
   - **Files**: `frontend/src/layouts/DashboardLayout.tsx`

4. **Admin layout: Restyle sidebar**  
   - Keep the existing desktop sidebar structure (logo, nav items, account section)
   - Change sidebar background to `var(--landing-surface)`
   - Change border to `1px solid var(--landing-line)`
   - Change border-radius to `28px` (from `12px`)
   - Replace solid neon-green active block with soft highlight: `background: var(--landing-soft)` when active
   - Add sliding indicator to nav items (reuse useSlidingIndicator hook or mimic the logic with a positioned div that slides)
   - Role badge: change from uppercase purple/green card to a small chip (14px text, `--landing-mute` color, `--landing-line` border, 999px radius, no background fill or very subtle `rgba(255,255,255,0.05)`)
   - Collapsible behavior: keep existing `isExpanded` state
   - **Files**: `frontend/src/layouts/DashboardLayout.tsx`

5. **Remove PublicUserBanner usage**  
   - PublicUserBanner is rendered in DashboardPage.tsx and AnalyticsPage.tsx — we'll remove it in those components (FEAT-003 and FEAT-004)
   - **Files**: N/A (changes in FEAT-003, FEAT-004)

6. **Admin mobile sidebar: Apply same restyling**  
   - The mobile sidebar overlay also needs `--landing-*` colors, 28px radius, soft highlight
   - **Files**: `frontend/src/layouts/DashboardLayout.tsx`

**Acceptance Criteria**:
- [ ] Public users see MonitoringNav at top, no sidebar, no guest banner in layout
- [ ] Admin users see restyled sidebar with `--landing-surface` background, 28px radius, soft active highlight, small role chip
- [ ] Sidebar active highlight uses `var(--landing-soft)`, not solid neon green
- [ ] No purple "PUBLIC VIEWER" badge anywhere
- [ ] Collapsible sidebar still works for admins

**Verification**:
1. Run `npm run build` — build succeeds
2. Start dev server, navigate to `/dashboard` as public (not logged in) — MonitoringNav renders, no sidebar
3. Log in as SYSTEM_ADMIN, navigate to `/dashboard` — sidebar renders with new styling, role chip is small and subtle, active link has soft green highlight
4. Click collapse button — sidebar collapses to icon-only, role chip shows single letter

---

### FEAT-003: DashboardPage (EcoStep Central) Redesign

**Type**: `feat`  
**Description**: Redesign the EcoStep Central page with sentence-case headings, a single quiet "Read-only" chip for public users, status pill (wifi/wifi-off + Live/Offline), last reading timestamp, KPI cards showing "--" when offline (not "0.0"), dim offline cards, and skeleton loading. Remove PublicUserBanner. Remove ALL-CAPS titles. Use Bricolage Grotesque for headings.

**Steps**:

1. **Remove PublicUserBanner**  
   - Delete the `<PublicUserBanner />` line from `DashboardPage.tsx`
   - Remove the import statement for `PublicUserBanner`
   - **Files**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

2. **Redesign DashboardHeader component**  
   - Open `frontend/src/features/dashboard/components/DashboardHeader.tsx`
   - Title: "EcoStep Central" (sentence case, not ALL CAPS), weight 800, `clamp(30px, 4vw, 44px)`, letter-spacing `-0.03em`, font-family Bricolage Grotesque
   - Subtitle: "Real-time monitoring of the piezoelectric energy harvesting system" (sentence case, 15px, weight 400, `--landing-mute` color)
   - If `isPublicUser` prop is true, render a small chip: "Read-only" text, `info` icon (lucide-react), 14px text, `--landing-mute` color, `--landing-line` border, 999px radius, no background or subtle `rgba(255,255,255,0.05)`, tooltip: "You're viewing as a guest. Monitoring and analytics are read-only."
   - Status pill: `wifi` or `wifi-off` icon + "Live" or "Offline" text, pill shape (999px radius), green for Live (`--landing-green` bg, `--landing-green-ink` text), red for Offline (`--landing-danger` bg, white text), pulse animation on Live (subtle opacity fade), `role="status"` `aria-live="polite"`
   - Last reading timestamp: "Last reading N min ago" text, `clock` icon, 13px, `--landing-mute` color, updates every 30s via `setInterval` comparing `Date.now()` to last reading time
   - **Files**: `frontend/src/features/dashboard/components/DashboardHeader.tsx`

3. **Update KPI MetricCard component**  
   - Open `frontend/src/features/dashboard/components/MetricCard.tsx`
   - When `value` prop is `undefined` OR system is offline (pass a prop `isOffline: boolean`), display "--" instead of "0.0" or the number
   - When offline, apply `opacity: 0.5` to the entire card
   - Icon tile: voltage = blue (`--landing-blue` bg, `--landing-blue-soft` icon), current = amber (`--landing-amber` bg, `--landing-amber-soft` icon), power = green (`--landing-green` bg, `--landing-green-ink` icon)
   - KPI number: 44-56px, weight 800, `font-variant-numeric: tabular-nums`
   - Unit label: 15px, `--landing-mute`
   - Section label: 13px, weight 600, `--landing-mute`, uppercase
   - Card background: `var(--landing-surface)`, border `1px solid var(--landing-line)`, border-radius `28px`
   - **Files**: `frontend/src/features/dashboard/components/MetricCard.tsx`

4. **Update DashboardPage to pass isOffline prop**  
   - In `DashboardPage.tsx`, compute `const isOffline = getSystemStatus() === 'disconnected';`
   - Pass `isOffline` prop to each `<MetricCard>` component
   - **Files**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

5. **Add skeleton loading for KPI cards**  
   - When `isInitialLoading` is true, render `<MetricCardSkeleton>` components (if not exists, create a simple skeleton: card shape with opacity pulse animation on a gray background bar where the number would be)
   - **Files**: `frontend/src/features/dashboard/components/MetricCardSkeleton.tsx` (already exists), `frontend/src/features/dashboard/pages/DashboardPage.tsx`

6. **Restyle HeroEnergyCard**  
   - Open `frontend/src/features/dashboard/components/HeroEnergyCard.tsx`
   - Background: `var(--landing-surface)`
   - Border: `1px solid var(--landing-line)`
   - Border-radius: `32px`
   - Title: Bricolage Grotesque, weight 600, 20px
   - Energy value: Bricolage Grotesque, weight 800, 56px, tabular-nums
   - Chart: use Recharts with `--landing-green` stroke, grid lines in `--landing-line`
   - Loading: skeleton with opacity pulse
   - Error state: friendly message (no raw "Network Error"), "Unable to load energy data" title, "circle-alert" icon, Retry button (pill shape, `--landing-green` bg)
   - **Files**: `frontend/src/features/dashboard/components/HeroEnergyCard.tsx`

7. **Update page background and padding**  
   - In `DashboardPage.tsx`, set page background to `var(--landing-bg)` (light: `#f5f8f3`, dark: `#0a1224`)
   - Padding: `24px 32px` on desktop, `16px 20px` on mobile
   - **Files**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

8. **Responsive breakpoints**  
   - Desktop 1100px+: KPIs 3 across in a row next to hero chart
   - Tablet 768-1023px: KPIs 2-3 in a grid below hero
   - Mobile <560px: single column, 2-column KPI grid if space allows
   - **Files**: `frontend/src/features/dashboard/pages/DashboardPage.tsx` (inline styles or CSS module)

9. **Accessibility**  
   - Visible focus ring: `outline: 3px solid var(--landing-green)` on all interactive elements
   - Icon-only buttons have `aria-label`
   - Status pill has `role="status"` `aria-live="polite"`
   - Chart has summary text via `aria-label` on SVG
   - `prefers-reduced-motion` guard: skip all transitions if user has motion preference disabled
   - **Files**: All dashboard components

**Acceptance Criteria**:
- [ ] PublicUserBanner is removed from DashboardPage
- [ ] Page title is "EcoStep Central" (sentence case), subtitle is sentence case
- [ ] Public users see a single small "Read-only" chip next to title
- [ ] Status pill shows "Live" (green, pulse) or "Offline" (red, no pulse)
- [ ] Last reading timestamp displays and updates every 30s
- [ ] KPI cards show "--" when offline or no data, not "0.0"
- [ ] Offline cards are dimmed (opacity 0.5)
- [ ] Skeleton loading shows on initial load
- [ ] All headings use Bricolage Grotesque, sentence case
- [ ] Card backgrounds use `--landing-surface`, borders use `--landing-line`, radii 28-32px
- [ ] Focus ring is visible (3px solid green)

**Verification**:
1. Run `npm run build` — build succeeds
2. Start dev server, navigate to `/dashboard` as public (not logged in) — page renders with new design, "Read-only" chip visible, KPIs show "--" if no data
3. Open DevTools → Network, throttle to Offline — status pill shows "Offline" (red), KPIs dim and show "--"
4. Tab through interactive elements — focus ring is visible
5. Check responsive breakpoints (resize browser) — layout adapts correctly

---

### FEAT-004: AnalyticsPage (Historical Analytics) Redesign

**Type**: `feat`  
**Description**: Redesign the Historical Analytics page with sentence-case headings, a single unified control bar (Chart/Table view switch + time-range group, NO duplicate time toggle), summary strip showing total energy/peak/average (or "--" while loading), chart cards with `--landing-surface` background and 28px radius, table with sticky header and tabular-nums, Export CSV button, friendly error state, skeleton loading. Remove PublicUserBanner. Remove the duplicate second time toggle inside chart cards.

**Steps**:

1. **Remove PublicUserBanner**  
   - Delete the `<PublicUserBanner />` line from `AnalyticsPage.tsx`
   - Remove the import statement
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

2. **Redesign page header**  
   - Title: "Historical analytics" (sentence case, not "Analytics"), Bricolage Grotesque, weight 800, `clamp(30px, 4vw, 44px)`, letter-spacing `-0.03em`
   - Subtitle: "Comprehensive historical data and trends for the EcoStep energy harvesting system", 15px, weight 400, `--landing-mute`
   - If `isPublicUser`, render "Read-only" chip (same as DashboardPage)
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

3. **Create unified control bar**  
   - One row with two pill groups:
     - LEFT: Chart/Table view switch (segmented pill: `chart-column` icon for Chart, `table-2` icon for Table, sliding highlight, active view gets `--landing-soft` background)
     - RIGHT: Time-range group (segmented pill: Today / 7d / 30d / 3mo, sliding highlight, active range gets `--landing-soft` background)
   - State persists in URL query params: `?range=7d&view=chart` via `useSearchParams`
   - Remove the duplicate time toggle that currently exists inside chart cards
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

4. **Add summary strip**  
   - Below control bar, show 3 summary tiles: "Total energy generated", "Peak power", "Average power"
   - Values: large numbers (28px, weight 800, tabular-nums) + units, labels (13px, weight 600, `--landing-mute`)
   - Show "--" while loading, show calculated values from API once data arrives
   - Tiles: inline-flex, gap 16px, each tile has `--landing-surface` background, `--landing-line` border, 20px radius, padding 16px 20px
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

5. **Restyle chart components**  
   - All chart cards: background `var(--landing-surface)`, border `1px solid var(--landing-line)`, border-radius `28px`, padding `24px`
   - Chart titles: Bricolage Grotesque, weight 600, 18px
   - Axis labels: Bricolage Grotesque, 13px
   - Grid lines: `--landing-line` color
   - Chart colors: voltage = `--landing-blue`, current = `--landing-amber`, power/energy = `--landing-green`, danger = `--landing-danger`
   - Remove duplicate time toggle from inside PowerGenerationChart (or whatever chart component has it)
   - **Files**: `frontend/src/features/analytics/components/charts/*.tsx`, `frontend/src/components/dashboard/PowerGenerationChart.tsx`, `frontend/src/components/dashboard/EnergyPeriodChart.tsx`, `frontend/src/components/dashboard/CumulativeEnergyChart.tsx`, `frontend/src/components/dashboard/StepsChart.tsx`, `frontend/src/components/dashboard/VoltageCurrentChart.tsx`

6. **Restyle HistoricalDataView (table)**  
   - Table header: sticky, background `var(--landing-surface)`, border-bottom `2px solid var(--landing-line)`, weight 600, 14px
   - Table rows: border-bottom `1px solid var(--landing-line)`, hover background `var(--landing-soft)`
   - Numeric columns: `font-variant-numeric: tabular-nums`, right-aligned
   - Pagination controls: pill buttons, `--landing-green` active, `--landing-line` border
   - **Files**: `frontend/src/features/analytics/components/HistoricalDataView.tsx`

7. **Add Export CSV button**  
   - If the analytics hooks provide data export capability (check `useAnalyticsData` or similar), add an "Export CSV" button (download icon, pill shape, `--landing-green` background on hover)
   - Place it in the control bar or summary strip area
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

8. **Friendly error state**  
   - Replace raw "Network Error" / "Technical Details" with a friendly message: "Unable to load chart data" title, "circle-alert" icon, Retry button
   - No stack traces or raw error text shown to public users
   - **Files**: All analytics chart components

9. **Skeleton loading**  
   - While `isLoading`, show skeleton cards with opacity pulse animation (gray bars where chart lines would be, gray blocks where table rows would be)
   - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`, chart components

10. **Responsive breakpoints**  
    - Desktop: 2-column chart grid where specified
    - Tablet: single-column charts
    - Mobile: single-column everything, segmented controls scroll horizontally, 44px touch targets
    - **Files**: `frontend/src/features/analytics/pages/AnalyticsPage.tsx`

11. **Accessibility**  
    - Same as DashboardPage: visible focus ring, aria-labels on icon buttons, chart summaries, prefers-reduced-motion guard
    - **Files**: All analytics components

**Acceptance Criteria**:
- [ ] PublicUserBanner is removed from AnalyticsPage
- [ ] Page title is "Historical analytics" (sentence case)
- [ ] Public users see a single "Read-only" chip
- [ ] One unified control bar with Chart/Table switch (left) and time-range group (right), NO duplicate time toggle inside charts
- [ ] Summary strip shows total energy, peak power, average power (or "--" while loading)
- [ ] All chart cards use `--landing-surface` background, `--landing-line` border, 28px radius
- [ ] Table has sticky header, tabular-nums, pagination
- [ ] Export CSV button is present (if data export is available)
- [ ] Friendly error state (no raw "Network Error")
- [ ] Skeleton loading shows on initial load
- [ ] All headings use Bricolage Grotesque, sentence case
- [ ] Focus ring is visible (3px solid green)

**Verification**:
1. Run `npm run build` — build succeeds
2. Start dev server, navigate to `/analytics` as public — page renders with new design, unified control bar, summary strip
3. Click time-range buttons — URL updates (`?range=30d`), data refetches
4. Click Chart/Table switch — view changes
5. Check responsive breakpoints — layout adapts, segmented controls scroll horizontally on mobile
6. Tab through interactive elements — focus ring is visible

---

### FEAT-005: Remove Dead Code & Final Polish

**Type**: `chore`  
**Description**: Remove PublicUserBanner component file (no longer used), remove any unused CSS classes, verify all pages use the new design tokens consistently, run final build and visual QA.

**Steps**:

1. **Delete PublicUserBanner component**  
   - Delete `frontend/src/components/common/PublicUserBanner.tsx`
   - Remove any exports from `frontend/src/components/common/index.ts`
   - **Files**: `frontend/src/components/common/PublicUserBanner.tsx`, `frontend/src/components/common/index.ts`

2. **Audit for unused CSS classes**  
   - Search codebase for old class names (e.g., `.eco-card-header` that might no longer be used after redesign)
   - Remove unused utilities from `index.css` (optional cleanup, not critical)
   - **Files**: `frontend/src/index.css`

3. **Verify design token usage**  
   - Grep for hardcoded hex colors in dashboard/analytics components (`#F5F7FA`, `#0B132B`, etc.)
   - Replace with CSS variables (`var(--landing-*)`)
   - **Files**: All dashboard and analytics component files

4. **Final build and smoke test**  
   - Run `npm run build` — build succeeds with no TypeScript errors
   - Start dev server, test all user flows:
     - Public user: visit landing → click Dashboard → see MonitoringNav, new KPI layout, no sidebar
     - Public user: visit Analytics → see unified control bar, summary strip, charts
     - Admin user: log in → visit Dashboard → see restyled sidebar, role chip
     - Admin user: visit Analytics → see same page as public (analytics is public-accessible)
     - Theme toggle: click sun/moon icon → colors update correctly
     - Responsive: resize browser → layouts adapt
   - **Files**: N/A (testing only)

5. **Accessibility final check**  
   - Run axe DevTools or Lighthouse accessibility audit on `/dashboard` and `/analytics`
   - Fix any reported issues (missing aria-labels, low-contrast text, keyboard traps)
   - **Files**: Various (depends on audit findings)

**Acceptance Criteria**:
- [ ] PublicUserBanner.tsx is deleted
- [ ] No unused CSS classes remain (or cleanup is documented)
- [ ] No hardcoded hex colors in component files (all use CSS variables)
- [ ] Build succeeds with zero errors
- [ ] All user flows work correctly (public and admin)
- [ ] Theme toggle works
- [ ] Responsive layouts work
- [ ] Accessibility audit passes (or findings documented)

**Verification**:
1. Run `npm run build` from `frontend/` — build succeeds
2. Run `npm run lint` — no errors
3. Start dev server, manually test all flows above
4. Run Lighthouse accessibility audit on `/dashboard` and `/analytics` — score > 90
5. Check git diff — PublicUserBanner.tsx is deleted, no broken imports remain

---

## Ordered File Checklist

Implementation order (tackle in this sequence):

1. `frontend/src/index.css` — Add `--landing-*` tokens
2. `frontend/index.html` — Load Bricolage Grotesque font
3. `frontend/src/components/layout/MonitoringNav.tsx` — Create new MonitoringNav component
4. `frontend/src/components/layout/index.ts` — Export MonitoringNav
5. `frontend/src/layouts/DashboardLayout.tsx` — Replace sidebar for public, restyle for admin
6. `frontend/src/features/dashboard/components/DashboardHeader.tsx` — Redesign header
7. `frontend/src/features/dashboard/components/MetricCard.tsx` — Update KPI cards
8. `frontend/src/features/dashboard/components/HeroEnergyCard.tsx` — Restyle hero card
9. `frontend/src/features/dashboard/pages/DashboardPage.tsx` — Remove PublicUserBanner, update layout
10. `frontend/src/features/analytics/pages/AnalyticsPage.tsx` — Redesign header, unified control bar, summary strip
11. `frontend/src/features/analytics/components/HistoricalDataView.tsx` — Restyle table
12. `frontend/src/components/dashboard/PowerGenerationChart.tsx` — Restyle chart, remove duplicate time toggle
13. `frontend/src/components/dashboard/EnergyPeriodChart.tsx` — Restyle chart
14. `frontend/src/components/dashboard/CumulativeEnergyChart.tsx` — Restyle chart
15. `frontend/src/components/dashboard/StepsChart.tsx` — Restyle chart
16. `frontend/src/components/dashboard/VoltageCurrentChart.tsx` — Restyle chart
17. All other analytics chart components in `frontend/src/features/analytics/components/charts/`
18. `frontend/src/components/common/PublicUserBanner.tsx` — Delete file
19. `frontend/src/components/common/index.ts` — Remove PublicUserBanner export
20. Final audit: search codebase for hardcoded hex colors, replace with CSS variables

---

## Testing Strategy

Since no unit tests exist for these pages yet, testing is manual:

1. **Build verification**: `npm run build` must succeed with zero TypeScript errors
2. **Dev server smoke test**: Start `npm run dev`, navigate to `/dashboard` and `/analytics` as public and admin, verify all visual changes are present
3. **Theme toggle**: Click sun/moon icon, verify colors update correctly in both pages
4. **Responsive**: Resize browser to mobile (< 560px), tablet (768-1023px), desktop (1100px+), verify layouts adapt
5. **Accessibility**: Use keyboard only (Tab, Enter, Space) to navigate both pages, verify focus ring is visible, all interactive elements are reachable
6. **Offline mode**: Open DevTools → Network → Throttle to Offline, verify status pill shows "Offline", KPIs show "--", cards are dimmed
7. **Data loading**: Hard-refresh page, verify skeleton loading appears, then real data renders

---

## Design Principles (Reminder)

Per the spec:

1. **NO GRADIENTS** — Use flat colors exclusively
2. **NO GLASSMORPHISM** — Solid backgrounds with hairline borders
3. **RESTRAINED SHADOWS** — Only for floating elements (modals, dropdowns, tooltips), not cards
4. **DATA-FIRST HIERARCHY** — Numeric values are visual heroes, not icons
5. **SEMANTIC COLORS** — Colors communicate meaning (green = healthy, amber = warning, red = error)
6. **TABULAR NUMERALS** — All numeric displays use `font-variant-numeric: tabular-nums`
7. **HAIRLINE BORDERS** — 1px borders for definition, not shadows
8. **MODERATE RADIUS** — 28-32px for cards, 999px for pills/badges
9. **DARK MODE CONSISTENCY** — Same hierarchy and spacing as light mode
10. **ACCESSIBILITY** — Visible focus rings, aria-labels, prefers-reduced-motion

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing data hooks | Do not change any hook imports or API calls; only change JSX/CSS |
| Breaking admin routes | Test all admin flows after layout change; ensure sidebar nav still works |
| Theme toggle stops working | Reuse existing ThemeContext, do not modify toggle logic |
| Responsive layouts break | Test all breakpoints; use CSS Grid/Flexbox defensively |
| Accessibility regressions | Run Lighthouse audit before/after; fix any new issues |
| Build errors from missing icons | Verify all Lucide icons are imported correctly |
| Chart library conflicts | Do not change Recharts version; only restyle via props |

---

## Definition of Done

- [ ] All 5 FEATs are completed and merged
- [ ] Build succeeds with zero errors
- [ ] Dev server runs without console errors
- [ ] Public user flow: landing → dashboard → analytics (all visual changes present, no broken links)
- [ ] Admin user flow: login → dashboard → analytics (restyled sidebar, role chip, all visual changes present)
- [ ] Theme toggle works on all pages
- [ ] Responsive layouts work on mobile, tablet, desktop
- [ ] Focus ring is visible on all interactive elements
- [ ] Offline mode shows correct UI (status pill "Offline", KPIs "--", dimmed cards)
- [ ] Skeleton loading appears on initial page load
- [ ] No PublicUserBanner renders anywhere
- [ ] No duplicate time-range controls on Analytics page
- [ ] All headings are sentence case (no ALL CAPS)
- [ ] All design tokens (`--landing-*`) are used consistently
- [ ] Bricolage Grotesque font loads and applies to headings
- [ ] Lighthouse accessibility score > 90 on `/dashboard` and `/analytics`
- [ ] Git diff shows PublicUserBanner.tsx deleted, no broken imports

---

## Context for Implementer

This is a **visual redesign only**. Do NOT:
- Change any data fetching logic (hooks, API calls, WebSocket connections)
- Change routing or authentication logic
- Change role-based access control (permissions.ts)
- Change any backend code or API contracts
- Add new dependencies (except possibly a font loader if needed)

DO:
- Reuse existing components where possible (MetricCard, HeroEnergyCard, etc.) by restyling them
- Reuse existing hooks (useSlidingIndicator, useDashboardMetrics, useSystemHealth, useLiveSensorData, useAnalyticsData)
- Reuse existing design system (`--landing-*` tokens from landing.css, now added to index.css)
- Follow the exact design spec (Bricolage Grotesque, 28-32px radius, `--landing-*` colors, sentence case, no gradients, no glassmorphism)
- Test thoroughly on both public and admin user flows

Good luck! 🚀
