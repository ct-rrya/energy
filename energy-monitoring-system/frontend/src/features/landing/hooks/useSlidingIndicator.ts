import { useState, useEffect, useCallback, useRef } from 'react';

interface IndicatorPosition {
  width: number;
  left: number;
  opacity: number;
}

/**
 * useSlidingIndicator Hook
 * 
 * Manages the sliding highlight indicator for navigation tabs.
 * Handles hover, focus, active state, and smooth transitions.
 * 
 * @param activeIndex - Index of the currently active tab
 * @param tabRefsArray - Array of tab DOM elements (not RefObjects)
 * @param containerRef - Ref to the tabs container for auto-scroll
 * @returns Indicator position and event handlers
 */
export function useSlidingIndicator(
  activeIndex: number,
  tabRefsArray: (HTMLElement | null)[],
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = useState<IndicatorPosition>({
    width: 0,
    left: 0,
    opacity: 0,
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInitialPlacement, setIsInitialPlacement] = useState(true);

  // Store previous position to prevent unnecessary updates
  const prevPositionRef = useRef<IndicatorPosition>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  // Calculate position for a given tab index
  // Remove tabRefsArray from dependencies - we access it directly from closure
  const calculatePosition = useCallback(
    (index: number): IndicatorPosition => {
      const element = tabRefsArray[index];
      if (!element) {
        return { width: 0, left: 0, opacity: 0 };
      }

      return {
        width: element.offsetWidth,
        left: element.offsetLeft,
        opacity: 1,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty - we read from tabRefsArray closure
  );

  // Update indicator position
  const updatePosition = useCallback(
    (index: number, instant = false) => {
      const newPosition = calculatePosition(index);
      
      // Only update state if position actually changed
      const prev = prevPositionRef.current;
      if (
        prev.width === newPosition.width &&
        prev.left === newPosition.left &&
        prev.opacity === newPosition.opacity
      ) {
        return; // Skip update if position hasn't changed
      }

      prevPositionRef.current = newPosition;
      setPosition(newPosition);

      if (instant) {
        setIsInitialPlacement(false);
      }

      // Auto-scroll the tab into view on mobile
      const container = containerRef.current;
      const element = tabRefsArray[index];
      if (container && element) {
        const scrollLeft =
          element.offsetLeft - (container.clientWidth - element.offsetWidth) / 2;
        
        try {
          container.scrollTo({
            left: scrollLeft,
            behavior: instant ? 'auto' : 'smooth',
          });
        } catch (e) {
          container.scrollLeft = scrollLeft;
        }
      }
    },
    [calculatePosition, containerRef, tabRefsArray]
  );

  // Initial placement and updates when active index changes
  useEffect(() => {
    updatePosition(activeIndex, isInitialPlacement);
  }, [activeIndex, updatePosition, isInitialPlacement]);

  // Re-measure on window resize
  useEffect(() => {
    const handleResize = () => {
      updatePosition(hoveredIndex ?? activeIndex, true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, hoveredIndex, updatePosition]);

  // Re-measure when fonts are ready
  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setIsInitialPlacement(true);
        updatePosition(activeIndex, true);
      });
    }
  }, [activeIndex, updatePosition]);

  // Mouse enter handler
  const handleMouseEnter = useCallback(
    (index: number) => {
      setHoveredIndex(index);
      updatePosition(index, false);
    },
    [updatePosition]
  );

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    updatePosition(activeIndex, false);
  }, [activeIndex, updatePosition]);

  // Focus handler
  const handleFocus = useCallback(
    (index: number) => {
      setHoveredIndex(index);
      updatePosition(index, false);
    },
    [updatePosition]
  );

  // Blur handler
  const handleBlur = useCallback(() => {
    setHoveredIndex(null);
    updatePosition(activeIndex, false);
  }, [activeIndex, updatePosition]);

  return {
    position,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    isInitialPlacement,
  };
}
