import { useState, useEffect } from 'react';

/**
 * ViewportSize interface
 * Represents the current viewport dimensions
 */
export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * useViewportSize Hook
 * 
 * Tracks the current viewport dimensions and updates on window resize.
 * 
 * @returns ViewportSize object with current width and height
 * 
 * @example
 * // Get current viewport dimensions
 * const { width, height } = useViewportSize();
 * 
 * @example
 * // Use for responsive logic
 * const { width } = useViewportSize();
 * const isMobile = width < 768;
 * const isTablet = width >= 768 && width < 1024;
 * const isDesktop = width >= 1024;
 */
export function useViewportSize(): ViewportSize {
  // Initialize with current viewport size using useState
  const [size, setSize] = useState<ViewportSize>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    // Return default values for SSR
    return {
      width: 0,
      height: 0,
    };
  });

  // useEffect for tracking window size changes with debounced resize listener
  useEffect(() => {
    // Early return for SSR environments
    if (typeof window === 'undefined') {
      return;
    }

    // Update size on mount to ensure current values
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Debounced resize handler to prevent excessive re-renders
    // Using 100ms delay for optimal performance as specified in design
    let timeoutId: number | undefined;
    
    const handleResize = () => {
      // Clear any existing timeout
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      
      // Set new timeout to update size after debounce delay
      timeoutId = window.setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // Cleanup function to remove event listener and clear timeout
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []); // Empty dependency array - only runs on mount

  return size;
}
