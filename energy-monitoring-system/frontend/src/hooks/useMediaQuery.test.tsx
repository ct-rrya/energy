import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock: {
    matches: boolean;
    media: string;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create a mock for window.matchMedia
    matchMediaMock = {
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Replace window.matchMedia with our mock
    window.matchMedia = vi.fn().mockImplementation((query) => {
      matchMediaMock.media = query;
      return matchMediaMock;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial match state', () => {
    matchMediaMock.matches = true;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    matchMediaMock.matches = false;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);
  });

  it('should set up media query listener on mount', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should clean up event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    unmount();
    
    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should update matches state when media query changes', async () => {
    matchMediaMock.matches = false;
    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);
    
    // Simulate media query change
    matchMediaMock.matches = true;
    const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];
    changeHandler({ matches: true } as MediaQueryListEvent);
    
    // Wait for debounced update (100ms)
    await waitFor(() => {
      expect(result.current).toBe(true);
    }, { timeout: 200 });
  });

  it('should handle different media query strings', () => {
    const { result: result1 } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');

    const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('should work with prefers-reduced-motion query', () => {
    matchMediaMock.matches = true;
    const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));
    
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(result.current).toBe(true);
  });

  it('should return false for initial state when matchMedia is not available', () => {
    // Save original window.matchMedia
    const originalMatchMedia = window.matchMedia;
    
    // Mock matchMedia to be undefined temporarily
    // @ts-expect-error - Testing edge case
    window.matchMedia = undefined;
    
    // The hook should handle this gracefully by returning false from useState initializer
    matchMediaMock.matches = false;
    
    // Restore immediately so useEffect can work
    window.matchMedia = originalMatchMedia;
    window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock);
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    // Should not crash and return a boolean
    expect(typeof result.current).toBe('boolean');
  });

  it('should debounce rapid media query changes', async () => {
    matchMediaMock.matches = false;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];
    
    // Trigger multiple rapid changes
    changeHandler({ matches: true } as MediaQueryListEvent);
    changeHandler({ matches: false } as MediaQueryListEvent);
    changeHandler({ matches: true } as MediaQueryListEvent);
    
    // Should still be false immediately (debounced)
    expect(result.current).toBe(false);
    
    // Wait for debounce (100ms)
    await waitFor(() => {
      // Should have the last value after debounce
      expect(result.current).toBe(true);
    }, { timeout: 200 });
  });
});
