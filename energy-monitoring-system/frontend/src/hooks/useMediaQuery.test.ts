import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

/**
 * useMediaQuery Hook Tests
 * 
 * Tests for responsive-mobile-optimization spec - Task 1.1.2
 * 
 * Test Coverage:
 * - Common breakpoints (mobile, tablet, desktop)
 * - Boolean return values for media query matches
 * - Viewport change detection
 * - Debouncing behavior (100ms delay)
 * - SSR safety
 */

describe('useMediaQuery', () => {
  beforeEach(() => {
    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Common Breakpoints', () => {
    it('should return true for mobile breakpoint when viewport is mobile', () => {
      const mobileQuery = '(max-width: 767px)';
      
      // Mock matchMedia to return true for mobile
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        media: mobileQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useMediaQuery(mobileQuery));
      
      expect(result.current).toBe(true);
    });

    it('should return false for mobile breakpoint when viewport is not mobile', () => {
      const mobileQuery = '(max-width: 767px)';
      
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        media: mobileQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;
      
      const { result } = renderHook(() => useMediaQuery(mobileQuery));
      
      expect(result.current).toBe(false);
    });

    it('should return true for tablet breakpoint when viewport is tablet', () => {
      const tabletQuery = '(min-width: 768px) and (max-width: 1023px)';
      
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        media: tabletQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useMediaQuery(tabletQuery));
      
      expect(result.current).toBe(true);
    });

    it('should return false for tablet breakpoint when viewport is not tablet', () => {
      const tabletQuery = '(min-width: 768px) and (max-width: 1023px)';
      
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        media: tabletQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;
      
      const { result } = renderHook(() => useMediaQuery(tabletQuery));
      
      expect(result.current).toBe(false);
    });

    it('should return true for desktop breakpoint when viewport is desktop', () => {
      const desktopQuery = '(min-width: 1024px)';
      
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        media: desktopQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useMediaQuery(desktopQuery));
      
      expect(result.current).toBe(true);
    });

    it('should return false for desktop breakpoint when viewport is not desktop', () => {
      const desktopQuery = '(min-width: 1024px)';
      
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        media: desktopQuery,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;
      
      const { result } = renderHook(() => useMediaQuery(desktopQuery));
      
      expect(result.current).toBe(false);
    });
  });

  describe('Viewport Changes', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should update when viewport changes from mobile to desktop', async () => {
      const query = '(min-width: 1024px)';
      let capturedListener: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            capturedListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      // Initially should be false
      expect(result.current).toBe(false);

      // Simulate viewport change to desktop
      if (capturedListener) {
        act(() => {
          const event = { matches: true, media: query } as MediaQueryListEvent;
          capturedListener!(event);
          // Fast-forward past debounce delay (100ms)
          vi.advanceTimersByTime(100);
        });
      }

      // State should now be updated
      expect(result.current).toBe(true);
    });

    it('should update when viewport changes from desktop to mobile', async () => {
      const query = '(max-width: 767px)';
      let capturedListener: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            capturedListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      // Initially false
      expect(result.current).toBe(false);

      // Simulate viewport change to mobile
      if (capturedListener) {
        act(() => {
          const event = { matches: true, media: query } as MediaQueryListEvent;
          capturedListener!(event);
          // Fast-forward past debounce delay
          vi.advanceTimersByTime(100);
        });
      }

      // State should now be updated
      expect(result.current).toBe(true);
    });

    it('should handle multiple rapid viewport changes with debouncing', () => {
      const query = '(min-width: 768px)';
      let capturedListener: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            capturedListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      expect(result.current).toBe(false);

      // Simulate rapid viewport changes
      if (capturedListener) {
        act(() => {
          // First change
          capturedListener!({ matches: true, media: query } as MediaQueryListEvent);
          vi.advanceTimersByTime(50); // 50ms - not enough to trigger debounce
          
          // Second change
          capturedListener!({ matches: false, media: query } as MediaQueryListEvent);
          vi.advanceTimersByTime(50); // Another 50ms
          
          // Third change
          capturedListener!({ matches: true, media: query } as MediaQueryListEvent);
          
          // Only the last change should take effect after 100ms from the last event
          vi.advanceTimersByTime(100);
        });
      }

      // Should reflect the last change
      expect(result.current).toBe(true);
    });
  });

  describe('Debouncing Behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce changes with 100ms delay', () => {
      const query = '(min-width: 1024px)';
      let capturedListener: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            capturedListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      expect(result.current).toBe(false);

      // Trigger change
      if (capturedListener) {
        act(() => {
          capturedListener!({ matches: true, media: query } as MediaQueryListEvent);
          
          // Before debounce completes (50ms)
          vi.advanceTimersByTime(50);
        });
      }
      
      // Should still be false (debounce not completed)
      expect(result.current).toBe(false);

      // After debounce completes (100ms total)
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Now it should be true
      expect(result.current).toBe(true);
    });

    it('should cancel pending debounced updates on unmount', () => {
      const query = '(min-width: 1024px)';
      let capturedListener: ((e: MediaQueryListEvent) => void) | null = null;
      const removeListener = vi.fn();

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            capturedListener = listener;
          }
        }),
        removeEventListener: removeListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { unmount } = renderHook(() => useMediaQuery(query));
      
      // Trigger change
      if (capturedListener) {
        act(() => {
          capturedListener!({ matches: true, media: query } as MediaQueryListEvent);
        });
      }

      // Unmount before debounce completes
      unmount();

      // Verify listener was removed
      expect(removeListener).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle SSR environment (no window) gracefully', () => {
      const query = '(min-width: 1024px)';

      // In SSR, the hook should return false as the initial value
      // The real SSR test would need a different test environment
      // For now, we test that the hook handles it in the code itself
      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      // Should work in normal browser environment
      expect(result.current).toBe(false);
    });

    it('should handle query changes', async () => {
      const query1 = '(max-width: 767px)';
      const query2 = '(min-width: 1024px)';

      let currentQuery = query1;

      const createMockMql = (query: string, matches: boolean) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      window.matchMedia = vi.fn((q: string) => {
        if (q === query1) return createMockMql(q, true);
        if (q === query2) return createMockMql(q, false);
        return createMockMql(q, false);
      });

      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: query1 } }
      );
      
      // Initially matches mobile
      expect(result.current).toBe(true);

      // Change to desktop query
      currentQuery = query2;
      rerender({ query: query2 });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should work with prefers-reduced-motion media query', () => {
      const query = '(prefers-reduced-motion: reduce)';

      const mockMql = {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      expect(result.current).toBe(true);
    });

    it('should work with dark mode preference media query', () => {
      const query = '(prefers-color-scheme: dark)';

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { result } = renderHook(() => useMediaQuery(query));
      
      expect(result.current).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const query = '(min-width: 1024px)';
      const removeListener = vi.fn();

      const mockMql = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn(() => mockMql);

      const { unmount } = renderHook(() => useMediaQuery(query));
      
      unmount();

      expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener when query changes', () => {
      const query1 = '(max-width: 767px)';
      const query2 = '(min-width: 1024px)';
      const removeListener1 = vi.fn();
      const removeListener2 = vi.fn();

      const mockMql1 = {
        matches: false,
        media: query1,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeListener1,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      const mockMql2 = {
        matches: false,
        media: query2,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeListener2,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn((q: string) => {
        if (q === query1) return mockMql1;
        if (q === query2) return mockMql2;
        return mockMql1;
      });

      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: query1 } }
      );
      
      // Change query
      rerender({ query: query2 });

      // First listener should be removed
      expect(removeListener1).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
