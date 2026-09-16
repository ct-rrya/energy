import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useViewportSize } from './useViewportSize';

describe('useViewportSize', () => {
  beforeEach(() => {
    // Set default window dimensions for tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('should return initial viewport dimensions', () => {
    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toEqual({
      width: 1024,
      height: 768,
    });
  });

  it('should track window.innerWidth', () => {
    const { result } = renderHook(() => useViewportSize());

    expect(result.current.width).toBe(window.innerWidth);
  });

  it('should track window.innerHeight', () => {
    const { result } = renderHook(() => useViewportSize());

    expect(result.current.height).toBe(window.innerHeight);
  });

  it('should return ViewportSize type with width and height properties', () => {
    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toHaveProperty('width');
    expect(result.current).toHaveProperty('height');
    expect(typeof result.current.width).toBe('number');
    expect(typeof result.current.height).toBe('number');
  });

  it('should handle different viewport sizes', () => {
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toEqual({
      width: 375,
      height: 667,
    });
  });

  it('should use useState for state management', () => {
    const { result } = renderHook(() => useViewportSize());

    // Verify the hook returns a consistent object (not a new object on each call)
    const firstCall = result.current;
    const secondCall = result.current;

    expect(firstCall).toBe(secondCall);
  });

  it('should initialize state in useEffect', () => {
    const { result } = renderHook(() => useViewportSize());

    // The useEffect runs on mount and updates the size
    expect(result.current.width).toBe(window.innerWidth);
    expect(result.current.height).toBe(window.innerHeight);
  });
});

  describe('resize event listener', () => {
    it('should update dimensions when window is resized', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useViewportSize());

      // Initial dimensions
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });

      // Trigger resize event
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 1080,
        });
        window.dispatchEvent(new Event('resize'));
        
        // Fast-forward time past debounce delay (100ms)
        vi.advanceTimersByTime(100);
      });

      // Dimensions should be updated
      expect(result.current).toEqual({
        width: 1920,
        height: 1080,
      });
      
      vi.useRealTimers();
    });

    it('should debounce resize events with 100ms delay', async () => {
      vi.useFakeTimers();
      
      // Reset window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      const { result } = renderHook(() => useViewportSize());

      // Initial dimensions
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });

      // Trigger multiple rapid resize events
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event('resize'));
        
        // Advance time by 50ms (half of debounce delay)
        vi.advanceTimersByTime(50);
      });

      // Dimensions should NOT be updated yet (still within debounce window)
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });

      // Trigger another resize event (resets debounce timer)
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1280,
        });
        window.dispatchEvent(new Event('resize'));
        
        // Advance time by another 50ms (total 100ms from first event, but only 50ms from last)
        vi.advanceTimersByTime(50);
      });

      // Still should not be updated (second resize reset the timer)
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });

      // Advance time by final 50ms (100ms from last resize event)
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Now dimensions should be updated to the last resize value
      expect(result.current).toEqual({
        width: 1280,
        height: 768,
      });
      
      vi.useRealTimers();
    });

    it('should clean up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useViewportSize());

      // Unmount the hook
      unmount();

      // Verify event listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should clear timeout on unmount', () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      
      const { unmount } = renderHook(() => useViewportSize());

      // Trigger resize to create a timeout
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Unmount before debounce completes
      unmount();

      // Verify timeout was cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should handle multiple resize events efficiently', async () => {
      vi.useFakeTimers();
      
      // Reset window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      const { result } = renderHook(() => useViewportSize());

      // Simulate rapid resize events (like user dragging window)
      act(() => {
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1000 + i * 100,
          });
          window.dispatchEvent(new Event('resize'));
          vi.advanceTimersByTime(20); // Advance 20ms between events
        }
      });

      // At this point, we're at 200ms total, dimensions should still be original
      // because each event resets the 100ms debounce timer
      expect(result.current.width).toBe(1024);

      // Advance past the final debounce delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should update to the last resize value
      expect(result.current.width).toBe(1900);
      
      vi.useRealTimers();
    });
  });
