# Design Document: Responsive Design & Mobile Optimization

## Overview

This design document outlines the technical approach for implementing comprehensive responsive design and mobile optimization across the EcoStep Energy Monitoring Dashboard. The implementation follows a mobile-first strategy using Tailwind CSS utilities, ensuring the dashboard is fully usable from 320px mobile screens to 1920px+ desktop displays while preserving all existing functionality, branding, and architecture.

## Design Principles

### 1. Mobile-First Approach

Base styles target mobile devices (320px+) with progressive enhancement for larger screens:

```css
/* Mobile base (320px+) */
.element { padding: 1rem; }

/* Tablet enhancement (768px+) */
@media (min-width: 768px) {
  .element { padding: 1.5rem; }
}

/* Desktop enhancement (1024px+) */
@media (min-width: 1024px) {
  .element { padding: 2rem; }
}
```

Tailwind equivalent: `p-4 md:p-6 lg:p-8`

### 2. Breakpoint Strategy

Using Tailwind's default breakpoints consistently across all components:

| Breakpoint | Min Width | Target Devices | Layout Strategy |
|------------|-----------|----------------|-----------------|
| (base) | 0px | Mobile portrait (320-639px) | Single column, stacked, full-width |
| sm | 640px | Large mobile, phablet | 2 columns for cards, larger touch targets |
| md | 768px | Tablet portrait | Sidebar menu, 2-column grids |
| lg | 1024px | Tablet landscape, small laptop | Sidebar visible, 3-4 column grids |
| xl | 1280px | Desktop, laptop | Full sidebar, multi-column layouts |
| 2xl | 1536px | Large desktop | Max-width constraints, centered content |

### 3. Touch Target Sizing

All interactive elements meet WCAG minimum 44x44px touch target:

```tsx
// Minimum touch target
<button className="min-w-[44px] min-h-[44px] p-2">Icon</button>

// Comfortable touch target
<button className="px-4 py-3">Action</button>
```

### 4. Fluid Typography

Font sizes scale responsively:

```tsx
// Headings
className="text-2xl md:text-3xl lg:text-4xl" // h1
className="text-xl md:text-2xl lg:text-3xl"   // h2
className="text-lg md:text-xl lg:text-2xl"    // h3

// Body text
className="text-sm md:text-base"              // Small text
className="text-base md:text-lg"              // Body text
```

### 5. Container Max-Width

Prevent excessive stretching on ultra-wide screens:

```tsx
<div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>
```

## Component-Specific Design

### 1. DashboardLayout - Sidebar Transformation

#### Current Issues

```tsx
// Fixed positioning with margins
<aside style={{ 
  position: 'fixed',
  left: '24px',
  top: '24px',
  width: `${sidebarWidth}px` // 64px or 200px
}} />

<main style={{
  marginLeft: `${sidebarWidth + 48}px` // Fixed offset
}} />
```

**Problem:** Sidebar always visible on mobile, blocks content

#### Responsive Solution

**Mobile & Tablet (< 1024px):**

Hamburger menu provides sidebar access across mobile and tablet sizes for consistency.

```tsx
// Hamburger menu button
{!isDesktop && (
  <button
    onClick={() => setMobileSidebarOpen(true)}
    className="fixed top-4 left-4 z-50 w-12 h-12 rounded-xl bg-[#1E2128]"
    aria-label="Open menu"
  >
    <Menu className="w-6 h-6" />
  </button>
)}

// Overlay sidebar
{mobileSidebarOpen && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 z-40"
      onClick={() => setMobileSidebarOpen(false)}
    />
    
    {/* Sidebar slides in */}
    <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 transform transition-transform duration-300">
      {/* Sidebar content */}
    </aside>
  </>
)}

// Main content no margin
<main className="p-4">
  {children}
</main>
```

**Desktop (≥ 1024px):**

Current collapsible behavior preserved

#### Implementation Pattern

```tsx
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const sidebarWidth = isExpanded ? 200 : 64;

  return (
    <div className="min-h-screen">
      {/* Hamburger menu for mobile & tablet */}
      {!isDesktop && <MobileMenuButton onClick={() => setMobileSidebarOpen(true)} />}
      
      {/* Overlay sidebar for mobile & tablet */}
      {!isDesktop && mobileSidebarOpen && (
        <MobileSidebar onClose={() => setMobileSidebarOpen(false)} />
      )}
      
      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      )}
      
      {/* Main content with responsive margin using CSS custom properties */}
      <main 
        className="p-4 md:p-6 lg:p-8"
        style={isDesktop ? {
          '--sidebar-width': `${sidebarWidth}px`,
          marginLeft: 'calc(var(--sidebar-width) + 48px)'
        } as React.CSSProperties : {}}
      >
        {children}
      </main>
    </div>
  );
}
```

### 2. Metric Cards Grid

#### Current Issues

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

**Problem:** Always 2 columns on mobile, even at 320px (cards become cramped)

#### Responsive Solution

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  {/* Metric Card */}
  <div className="rounded-3xl p-4 sm:p-6">
    <div className="text-xs sm:text-sm font-medium mb-2">
      Voltage
    </div>
    <div className="text-2xl sm:text-3xl font-bold">
      {value}
      <span className="text-base sm:text-lg ml-1">V</span>
    </div>
  </div>
</div>
```

**Breakpoint Behavior:**

- **320-639px:** 1 column (stacked vertically)
- **640-767px:** 2 columns
- **768-1023px:** 2 columns
- **1024px+:** 4 columns (original)

### 3. Charts Responsive Configuration

#### Current Issues

Charts may use fixed width or improper ResponsiveContainer configuration

#### Responsive Solution

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

export function PowerChart() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  return (
    <div className="w-full">
      <ResponsiveContainer 
        width="100%" 
        height={isMobile ? 250 : 400}
      >
        <LineChart 
          data={data}
          margin={{ 
            top: 5, 
            right: isMobile ? 5 : 20, 
            left: isMobile ? -20 : 0, 
            bottom: 5 
          }}
        >
          <XAxis 
            dataKey="timestamp"
            tick={{ fontSize: isMobile ? 11 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 11 : 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="power"
            strokeWidth={isMobile ? 2 : 3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Mobile Optimizations:**

- Reduced chart height (250px vs 400px)
- Smaller margins
- Smaller font sizes (11px vs 12px)
- Rotated X-axis labels (-45deg) to prevent overlap
- Thinner stroke width for cleaner mobile appearance

### 4. Tables Responsive Pattern

Default to horizontal scroll containers with visual indicators per requirements 5.1-5.3. Card-based mobile layout (5.4) is marked as MAY (optional) and should only be implemented if explicitly required.

#### Horizontal Scroll Container (Default Pattern)

For tables with many columns:

```tsx
<div className="overflow-x-auto -mx-4 md:mx-0">
  <div className="inline-block min-w-full align-middle">
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table content */}
      </table>
    </div>
  </div>
</div>
```

**Scroll Indicators:**

```tsx
<div className="relative overflow-x-auto">
  {/* Shadow gradient on right edge */}
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
  
  <table className="min-w-full">
    {/* Content */}
  </table>
</div>
```

#### Card-Based Mobile Layout (Optional - MAY Requirement)

For simple tables, transform to cards on mobile only if explicitly required:

```tsx
{/* Desktop table */}
<table className="hidden md:table">
  <thead>
    <tr>
      <th>Node</th>
      <th>Status</th>
      <th>Voltage</th>
      <th>Current</th>
    </tr>
  </thead>
  <tbody>
    {nodes.map(node => (
      <tr key={node.id}>
        <td>{node.name}</td>
        <td>{node.status}</td>
        <td>{node.voltage}</td>
        <td>{node.current}</td>
      </tr>
    ))}
  </tbody>
</table>

{/* Mobile cards */}
<div className="md:hidden space-y-3">
  {nodes.map(node => (
    <div key={node.id} className="rounded-xl border p-4">
      <div className="font-semibold">{node.name}</div>
      <div className="mt-2 space-y-1 text-sm">
        <div>Status: {node.status}</div>
        <div>Voltage: {node.voltage}</div>
        <div>Current: {node.current}</div>
      </div>
    </div>
  ))}
</div>
```

### 5. FloatingChatButton Responsive Behavior

#### Current Implementation

```tsx
// Fixed 400x600px with media query for mobile full-screen
@media (max-width: 768px) {
  .floating-chat-panel {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    border-radius: 0 !important;
  }
}
```

**Issue:** Good mobile handling already exists, needs verification

#### Enhanced Responsive Implementation

```tsx
export function FloatingChatButton() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const panelStyle = {
    // Mobile: Full-screen
    ...(isMobile && {
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100dvh', // Dynamic viewport height
      borderRadius: 0,
    }),
    
    // Tablet: 90% width/height, centered
    ...(isTablet && {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      height: '90%',
      maxWidth: '600px',
      maxHeight: '800px',
      borderRadius: '16px',
    }),
    
    // Desktop: Fixed panel
    ...(isDesktop && {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '400px',
      height: '600px',
      borderRadius: '16px',
    }),
  };
  
  return (
    <>
      {!isExpanded && (
        <button
          className="fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full"
          onClick={() => setIsExpanded(true)}
        >
          {/* Icon */}
        </button>
      )}
      
      {isExpanded && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setIsExpanded(false)}
            />
          )}
          
          <div style={panelStyle} className="z-[10000]">
            <ChatInterface />
          </div>
        </>
      )}
    </>
  );
}
```

### 6. Header Action Buttons

#### Current Issues

```tsx
<div className="flex items-center gap-2">
  <button>Settings</button>
  <button>Alerts <Badge>3</Badge></button>
  <button>Export</button>
</div>
```

**Problem:** May overflow on narrow mobile screens

#### Responsive Solution

**Option A: Icon-Only on Mobile**

```tsx
<div className="flex items-center gap-2">
  <button className="px-3 py-2 md:px-4 md:py-2">
    <Settings className="w-5 h-5" />
    <span className="hidden md:inline ml-2">Settings</span>
  </button>
  
  <button className="px-3 py-2 md:px-4 md:py-2 relative">
    <Bell className="w-5 h-5" />
    <span className="hidden md:inline ml-2">Alerts</span>
    {!isPublicUser && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs">
        3
      </span>
    )}
  </button>
  
  <button className="px-3 py-2 md:px-4 md:py-2">
    <Download className="w-5 h-5" />
    <span className="hidden md:inline ml-2">Export</span>
  </button>
</div>
```

**Option B: Overflow Menu on Mobile**

```tsx
{isMobile ? (
  <DropdownMenu>
    <DropdownMenuTrigger className="px-3 py-2">
      <MoreVertical className="w-5 h-5" />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Alerts (3)</DropdownMenuItem>
      <DropdownMenuItem>Export</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <div className="flex items-center gap-2">
    {/* Full buttons */}
  </div>
)}
```

## Utility Hooks

### useMediaQuery Hook

For responsive logic in components:

```tsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 767px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
```

### useViewportSize Hook

For components needing exact dimensions:

```tsx
import { useState, useEffect } from 'react';

export function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
const { width, height } = useViewportSize();
const isMobile = width < 768;
```

## Performance Optimizations

### 1. Debounced Resize Handling

```tsx
import { useState, useEffect } from 'react';
import { debounce } from 'lodash-es';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    // Debounce for performance
    const listener = debounce((e: MediaQueryListEvent) => {
      setMatches(e.matches);
    }, 100);
    
    media.addEventListener('change', listener);
    return () => {
      listener.cancel();
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
```

### 2. Memoized Responsive Components

```tsx
import { memo } from 'react';

export const MetricCard = memo(function MetricCard({ 
  label, 
  value, 
  unit 
}: MetricCardProps) {
  return (
    <div className="rounded-3xl p-4 sm:p-6">
      <div className="text-xs sm:text-sm">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold">
        {value}<span className="text-base sm:text-lg ml-1">{unit}</span>
      </div>
    </div>
  );
});
```

#### Memoization Contract for Live-Updating Cards

When memoizing components that receive live WebSocket data, special attention is required to prevent memo invalidation on every update:

**Contract Requirements:**

1. **Primitive Props Only:** MetricCard must receive only primitive types (label: string, value: number, unit: string)
2. **Parent Selectors:** Parent components must use useMemo or selectors to extract primitives from WebSocket data objects
3. **Stable References:** Avoid passing new object/array references on each WebSocket update

**Correct Pattern:**

```tsx
// Parent component with WebSocket data
function DashboardMetrics({ sensorData }: { sensorData: SensorData }) {
  // Extract primitives to prevent memo invalidation
  const voltage = useMemo(() => sensorData.voltage, [sensorData.voltage]);
  const current = useMemo(() => sensorData.current, [sensorData.current]);
  
  return (
    <>
      <MetricCard label="Voltage" value={voltage} unit="V" />
      <MetricCard label="Current" value={current} unit="A" />
    </>
  );
}
```

**Incorrect Pattern (causes unnecessary re-renders):**

```tsx
// DON'T: Passing object references breaks memo
<MetricCard data={sensorData.voltage} /> // Object reference changes every update
<MetricCard config={{ label: 'Voltage', unit: 'V' }} /> // New object every render
```

**Verification:** Before implementing MetricCard memo in Task 9.2, verify that the parent component's WebSocket data flow passes primitives or uses proper selectors. Memoization without this contract will provide no performance benefit.
```

### 3. Lazy Loading for Below-Fold Content

```tsx
import { lazy, Suspense } from 'react';

const ChartsLayoutContainer = lazy(() => 
  import('../components/ChartsLayoutContainer')
);

export function DashboardPage() {
  return (
    <div>
      {/* Above-fold content */}
      <MetricCardsGrid />
      
      {/* Lazy load charts */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsLayoutContainer />
      </Suspense>
    </div>
  );
}
```

### 4. Virtual Scrolling for Long Lists

If sensor node list exceeds 100 items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function SensorNodeList({ nodes }: { nodes: SensorNode[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <SensorNodeCard node={nodes[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Accessibility Implementation

### Focus Management for Mobile Sidebar

```tsx
export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus first interactive element when opened
    const firstFocusable = sidebarRef.current?.querySelector<HTMLElement>(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    // Trap focus within sidebar
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a, button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div ref={sidebarRef} className="fixed left-0 top-0 bottom-0 w-64 z-50">
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10"
        aria-label="Close menu"
      >
        <X className="w-6 h-6" />
      </button>
      {/* Sidebar content */}
    </div>
  );
}
```

### Skip Link for Keyboard Navigation

```tsx
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
      >
        Skip to main content
      </a>

      <Sidebar />
      
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

### ARIA Labels for Icon-Only Buttons

```tsx
<button
  className="w-10 h-10 rounded-lg"
  aria-label="Open settings"
  title="Settings"
>
  <Settings className="w-5 h-5" aria-hidden="true" />
</button>
```

## Testing Strategy

### Breakpoint Testing Checklist

**Note:** DevTools responsive mode results per Requirement 11.9 SHALL be verified on actual physical devices. Automated tests provide initial validation but cannot replace device testing.

For each viewport size in Requirement 11.1:

```typescript
const testViewports = [
  { width: 320, height: 568, name: 'iPhone SE' },
  { width: 360, height: 800, name: 'Android Small' },
  { width: 390, height: 844, name: 'iPhone 12/13/14' },
  { width: 412, height: 915, name: 'Android Large' },
  { width: 480, height: 800, name: 'Landscape Mobile' },
  { width: 768, height: 1024, name: 'iPad Portrait' },
  { width: 820, height: 1180, name: 'iPad Air' },
  { width: 1024, height: 768, name: 'iPad Landscape' },
  { width: 1280, height: 720, name: 'Laptop' },
  { width: 1366, height: 768, name: 'Common Laptop' },
  { width: 1440, height: 900, name: 'MacBook' },
  { width: 1920, height: 1080, name: 'Desktop' },
];

// Test checklist per viewport
const testChecks = [
  'No horizontal scrolling (except tables)',
  'No clipped content',
  'No overlapping elements',
  'Text remains readable',
  'Buttons are accessible',
  'Touch targets ≥ 44x44px',
  'Focus indicators visible',
  'Contrast ratios meet WCAG AA',
];
```

### Visual Regression Testing

Use Playwright or Cypress with screenshot comparison:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Responsive Dashboard', () => {
  testViewports.forEach(({ width, height, name }) => {
    test(`${name} (${width}x${height}) - Dashboard layout`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="metric-cards"]');
      
      // Take screenshot
      await expect(page).toHaveScreenshot(`dashboard-${width}x${height}.png`, {
        fullPage: true,
      });
      
      // Check for horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
    });
  });
});
```

### Accessibility Testing

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('Dashboard meets WCAG AA standards on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});
```

## Migration Path

### Phase 1: Foundation (Week 1)

1. Add `useMediaQuery` and `useViewportSize` hooks
2. Update DashboardLayout with mobile hamburger menu
3. Fix Main_Content_Area margins for mobile
4. Update Metric_Cards grid to 1/2/2/4 columns
5. Add responsive padding/spacing utilities

### Phase 1 Checkpoint: Structural Validation

**Critical Checkpoint:** Run Playwright viewport tests (320, 768, 1280, 1920) on DashboardLayout + Main_Content_Area + Metric_Cards BEFORE proceeding to Phase 2.

**Verification Criteria:**
- No horizontal scroll at any of the 4 test viewports
- Sidebar visibility correct at each breakpoint (hidden < 1024px, visible ≥ 1024px)
- Margin calculations work correctly with CSS custom properties
- Metric cards display in correct column count (1/2/2/4)
- Touch targets meet 44x44px minimum
- No element overlap or clipping

**Purpose:** This catches structural layout issues early before adding complexity with charts, tables, and other components. Fixing foundation problems after Phase 2 requires significantly more rework.

**Action if checkpoint fails:** Debug and fix structural issues before proceeding. Do not continue to Phase 2 with failing viewport tests.

### Phase 2: Components (Week 2)

1. Make charts responsive (ResponsiveContainer configuration)
2. Implement table horizontal scroll containers
3. Update FloatingChatButton mobile handling
4. Convert header action buttons to icon-only on mobile
5. Add touch target sizing throughout

### Phase 3: Polish (Week 3)

1. Add focus management for mobile sidebar
2. Implement skip links
3. Test all breakpoints systematically
4. Fix any remaining overflow issues
5. Performance optimization (memoization, lazy loading)

### Phase 4: Testing & Validation (Week 4)

1. Visual regression testing across all breakpoints
2. Accessibility audit (axe, WAVE, manual testing)
3. Physical device testing (iOS, Android, tablets)
4. Performance testing on mobile networks
5. User acceptance testing

## Risk Mitigation

### Risk 1: Layout Breaking Changes

**Risk:** Responsive changes may break existing layouts

**Mitigation:**
- Implement mobile-first progressively (mobile → tablet → desktop)
- Keep desktop layout identical initially
- Add breakpoints incrementally
- Test each component in isolation before integration

### Risk 2: Performance Degradation

**Risk:** Excessive re-renders or layout calculations on resize

**Mitigation:**
- Debounce resize handlers
- Memoize responsive components
- Use CSS media queries over JS where possible
- Profile performance before/after changes

### Risk 3: Browser Compatibility

**Risk:** Modern CSS features may not work in older browsers

**Mitigation:**
- Feature detection for container queries
- Graceful degradation with fallback styles
- Document minimum browser versions
- Test on target browser matrix

### Risk 4: Touch Target Conflicts

**Risk:** Increasing touch targets may cause layout overflow

**Mitigation:**
- Design with 44x44px minimum from start
- Use icon-only buttons on mobile where needed
- Collapse secondary actions into menus
- Allow wrapping for button groups

## Success Metrics

1. **No horizontal scroll:** 0 instances across all test viewports
2. **Touch targets:** 100% of interactive elements ≥ 44x44px on mobile
3. **Accessibility:** 0 WCAG AA violations in axe audit
4. **Performance:** First Contentful Paint < 2s on 3G mobile
5. **Coverage:** 100% of breakpoints in Requirement 11.1 tested
6. **Preservation:** All existing functionality operational
7. **Build:** TypeScript compilation with 0 errors
8. **Tests:** 100% of existing tests passing

## Conclusion

This design provides a comprehensive, pragmatic approach to making the EcoStep dashboard fully responsive while preserving all existing functionality and branding. The mobile-first strategy with Tailwind utilities ensures maintainable, performant responsive behavior across all device sizes.

Key decisions:
- **Sidebar:** Hamburger menu on mobile (< 768px), full sidebar on desktop (≥ 1024px)
- **Cards:** 1/2/2/4 column grid across breakpoints
- **Charts:** Responsive containers with mobile-optimized sizing and labels
- **Tables:** Horizontal scroll with visual indicators
- **Chat:** Full-screen on mobile, floating panel on desktop
- **Performance:** Debouncing, memoization, lazy loading
- **Accessibility:** Focus management, skip links, ARIA labels, WCAG AA compliance
