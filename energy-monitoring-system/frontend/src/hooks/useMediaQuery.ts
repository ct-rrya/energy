import { useState, useEffect } from 'react';
import { debounce } from 'lodash-es';

/**
 * useMediaQuery Hook
 * 
 * Listens to media query changes and returns a boolean indicating if the query matches.
 * Includes debouncing (100ms) to prevent excessive re-renders during window resize.
 * 
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * // Check if screen is mobile size
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * 
 * @example
 * // Check if screen is desktop size
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * 
 * @example
 * // Check for reduced motion preference
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with current match state
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Early return for SSR environments
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value immediately
    setMatches(media.matches);
    
    const updateMatches = () => {
      if (typeof window !== 'undefined') {
        setMatches(window.matchMedia(query).matches);
      }
    };

    // Debounce for performance (80ms delay)
    const listener = debounce(updateMatches, 80);
    
    // Add event listeners for media query changes and window resize
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else if ((media as any).addListener) {
      (media as any).addListener(listener);
    }
    window.addEventListener('resize', listener);
    
    // Cleanup function
    return () => {
      listener.cancel();
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else if ((media as any).removeListener) {
        (media as any).removeListener(listener);
      }
      window.removeEventListener('resize', listener);
    };
  }, [query]);

  return matches;
}
