# React Custom Hooks

This directory contains custom React hooks for the EcoStep Energy Monitoring Dashboard.

## Available Hooks

### `useMediaQuery`

A React hook for responsive design that listens to CSS media query changes and returns a boolean indicating whether the query matches.

**Location:** `./useMediaQuery.ts`

#### Features

- ✅ Media query matching using `window.matchMedia()`
- ✅ Reactive updates when viewport changes
- ✅ Debounced updates (100ms) to prevent excessive re-renders
- ✅ SSR-safe with typeof window checks
- ✅ Proper event listener cleanup
- ✅ TypeScript support
- ✅ Comprehensive test coverage

#### Usage

```typescript
import { useMediaQuery } from './hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

#### Common Breakpoints

Based on Tailwind CSS defaults:

| Breakpoint | Query | Target |
|------------|-------|--------|
| Mobile | `(max-width: 639px)` | < 640px |
| Small | `(min-width: 640px)` | ≥ 640px |
| Medium | `(min-width: 768px)` | ≥ 768px |
| Large | `(min-width: 1024px)` | ≥ 1024px |
| XL | `(min-width: 1280px)` | ≥ 1280px |
| 2XL | `(min-width: 1536px)` | ≥ 1536px |

#### Examples

See `useMediaQuery.example.tsx` for comprehensive usage examples including:
- Mobile detection
- Multiple breakpoints
- Accessibility (reduced motion)
- Orientation detection
- Touch device detection
- Conditional rendering

#### Testing

Run the test suite:

```bash
npm test -- useMediaQuery.test.tsx --run
```

**Test Coverage:**
- ✅ Initial match state
- ✅ Media query listener setup
- ✅ Event listener cleanup
- ✅ State updates on media query changes
- ✅ Different query strings
- ✅ Reduced motion queries
- ✅ Edge cases (SSR, undefined matchMedia)
- ✅ Debouncing behavior

#### Implementation Details

**State Management:**
- Uses `useState` with lazy initialization to check initial match state
- Prevents unnecessary work on every render

**Effect Management:**
- `useEffect` sets up `window.matchMedia()` listener
- Cleanup function removes event listener on unmount
- Recreates listener when query changes

**Debouncing:**
- 100ms delay prevents excessive re-renders during window resize
- Timeout is properly cleared on unmount or rapid changes

**Performance:**
- Minimal re-renders due to debouncing
- Efficient event listener management
- No memory leaks with proper cleanup

#### Browser Support

Works in all modern browsers supporting:
- `window.matchMedia()` API
- `MediaQueryList.addEventListener()` (replaces deprecated `addListener`)

#### Related Files

- `useMediaQuery.ts` - Hook implementation
- `useMediaQuery.test.tsx` - Test suite
- `useMediaQuery.example.tsx` - Usage examples

---

## Future Hooks

Additional hooks to be added for responsive mobile optimization:

- `useViewportSize` - Track window width and height
- `useTouchDevice` - Detect touch capability
- `useOrientation` - Track device orientation
- `useSafeArea` - Handle mobile safe areas (notches, etc.)

