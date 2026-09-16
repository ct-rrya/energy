# useMediaQuery Hook Usage Examples

## Overview

The `useMediaQuery` hook listens to CSS media queries and returns a boolean indicating whether the query matches the current viewport. It includes 100ms debouncing to prevent excessive re-renders during window resize.

## Import

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery';
```

## Common Breakpoint Examples

### Mobile Detection

```typescript
const isMobile = useMediaQuery('(max-width: 767px)');

return (
  <div>
    {isMobile ? (
      <MobileNavigation />
    ) : (
      <DesktopNavigation />
    )}
  </div>
);
```

### Desktop Detection

```typescript
const isDesktop = useMediaQuery('(min-width: 1024px)');

return (
  <div>
    {/* Show full sidebar only on desktop */}
    {isDesktop && <Sidebar />}
    
    {/* Show hamburger menu on mobile/tablet */}
    {!isDesktop && <HamburgerMenu />}
  </div>
);
```

### Tablet Range

```typescript
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

const chartHeight = isTablet ? 300 : isMobile ? 250 : 400;

return <ResponsiveContainer height={chartHeight}>...</ResponsiveContainer>;
```

## Tailwind Breakpoints

Aligns with Tailwind's default breakpoints:

```typescript
// Mobile portrait (base, 0px+)
const isMobile = useMediaQuery('(max-width: 639px)');

// Small screens (sm, 640px+)
const isSmall = useMediaQuery('(min-width: 640px)');

// Medium screens (md, 768px+)
const isMedium = useMediaQuery('(min-width: 768px)');

// Large screens (lg, 1024px+)
const isLarge = useMediaQuery('(min-width: 1024px)');

// Extra large screens (xl, 1280px+)
const isXLarge = useMediaQuery('(min-width: 1280px)');

// 2X large screens (2xl, 1536px+)
const is2XLarge = useMediaQuery('(min-width: 1536px)');
```

## Chart Responsive Configuration

```typescript
import { ResponsiveContainer, LineChart } from 'recharts';

function PowerChart() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  return (
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
        <Line 
          type="monotone" 
          dataKey="power"
          strokeWidth={isMobile ? 2 : 3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Accessibility Features

### Reduced Motion Preference

```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

const animationClass = prefersReducedMotion 
  ? 'transition-none' 
  : 'transition-transform duration-300';

return <div className={animationClass}>...</div>;
```

### Orientation Detection

```typescript
const isPortrait = useMediaQuery('(orientation: portrait)');
const isLandscape = useMediaQuery('(orientation: landscape)');

return (
  <div>
    {isPortrait && <PortraitLayout />}
    {isLandscape && <LandscapeLayout />}
  </div>
);
```

## DashboardLayout Example

```typescript
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function DashboardLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  return (
    <div>
      {/* Hamburger menu for mobile/tablet */}
      {!isDesktop && (
        <button onClick={() => setMobileSidebarOpen(true)}>
          Open Menu
        </button>
      )}
      
      {/* Mobile overlay sidebar */}
      {!isDesktop && mobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </aside>
        </>
      )}
      
      {/* Desktop sidebar */}
      {isDesktop && <Sidebar />}
      
      <main>{children}</main>
    </div>
  );
}
```

## Performance Considerations

### Debouncing

The hook includes 100ms debouncing by default to prevent excessive re-renders during window resize:

- Multiple rapid changes within 100ms will only trigger one update
- The last change will take effect after the debounce delay
- Timers are properly cleaned up on component unmount

### SSR Support

The hook safely handles server-side rendering by:

- Returning `false` during SSR
- Only accessing `window.matchMedia` in the browser
- Initializing state correctly on hydration

## Testing

The hook is fully tested with 23 test cases covering:

- Basic functionality (match/no-match, event listeners)
- Common breakpoints (mobile, tablet, desktop)
- Viewport change handling
- Debouncing behavior (100ms delay)
- Query parameter changes
- Edge cases (preferences, orientation, empty strings)
- Multiple instances
- Memory leak prevention (cleanup on unmount)

Run tests with:

```bash
npm test -- src/hooks/useMediaQuery.test.ts
```

## TypeScript Support

The hook is fully typed:

```typescript
function useMediaQuery(query: string): boolean
```

- `query`: CSS media query string
- Returns: `boolean` indicating if the query matches
