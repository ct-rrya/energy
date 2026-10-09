import { useState, useEffect, useCallback, useRef } from 'react';

interface IndicatorPosition {
  width: number;
  height: number;
  left: number;
  top: number;
  opacity: number;
}

type Axis = 'horizontal' | 'vertical';

/**
 * useSlidingIndicator Hook
 * 
 * Manages sliding highlight indicators for navigation and segmented controls.
 * Supports both horizontal (tabs) and vertical (sidebar) orientations.
 * Handles hover, focus, active state, and smooth transitions.
 * 
 * @param activeIndex - Index of the currently active item
 * @param itemRefsArray - Array of item DOM elements
 * @param containerRef - Ref to the container for auto-scroll
 * @param axis - 'horizontal' or 'vertical' (default: 'horizontal')
 * @returns Indicator position and event handlers
 */
export function useSlidingIndicator(
  activeIndex: number,
  itemRefsArray: (HTMLElement | null)[],
  containerRef: React.RefObject<HTMLElement | null>,
  axis: Axis = 'horizontal'
) {
  const [position, setPosition] = useState<IndicatorPosition>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    opacity: 0,
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInitialPlacement, setIsInitialPlacement] = useState(true);

  // Store previous position to prevent unnecessary updates
  const prevPositionRef = useRef<IndicatorPosition>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    opacity: 0,
  });

  // Calculate position for a given item index
  const calculatePosition = useCallback(
    (index: number): IndicatorPosition => {
      const element = itemRefsArray[index];
      if (!element) {
        return { width: 0, height: 0, left: 0, top: 0, opacity: 0 };
      }

      return {
        width: element.offsetWidth,
        height: element.offsetHeight,
        left: element.offsetLeft,
        top: element.offsetTop,
        opacity: 1,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty - we read from itemRefsArray closure
  );

  // Update indicator position
  const updatePosition = useCallback(
    (index: number, instant = false) => {
      const newPosition = calculatePosition(index);
      
      // Only update state if position actually changed
      const prev = prevPositionRef.current;
      if (
        prev.width === newPosition.width &&
        prev.height === newPosition.height &&
        prev.left === newPosition.left &&
        prev.top === newPosition.top &&
        prev.opacity === newPosition.opacity
      ) {
        return; // Skip update if position hasn't changed
      }

      prevPositionRef.current = newPosition;
      setPosition(newPosition);

      if (instant) {
        setIsInitialPlacement(false);
      }

      // Auto-scroll the item into view
      const container = containerRef.current;
      const element = itemRefsArray[index];
      if (container && element) {
        if (axis === 'horizontal') {
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
        } else {
          // Vertical scrolling
          const scrollTop =
            element.offsetTop - (container.clientHeight - element.offsetHeight) / 2;
          
          try {
            container.scrollTo({
              top: scrollTop,
              behavior: instant ? 'auto' : 'smooth',
            });
          } catch (e) {
            container.scrollTop = scrollTop;
          }
        }
      }
    },
    [calculatePosition, containerRef, itemRefsArray, axis]
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
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
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

  // Expose a method to re-measure (useful after collapse/expand animations)
  const remeasure = useCallback(() => {
    updatePosition(activeIndex, true);
  }, [activeIndex, updatePosition]);

  return {
    position,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    isInitialPlacement,
    remeasure,
  };
}
