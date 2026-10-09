import { useState, useEffect, type RefObject } from 'react';

/**
 * useScrollSpy Hook
 * 
 * Tracks which section is currently in view based on scroll position.
 * Trigger line is at 35% of viewport height.
 * At the very bottom of the page, the last section becomes active.
 * 
 * @param sectionRefs - Array of React refs to section elements
 * @returns Index of the active section
 */
export function useScrollSpy(sectionRefs: RefObject<HTMLElement | null>[]): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const triggerLine = scrollY + viewportHeight * 0.35;
      
      // Check if we're at the bottom of the page
      const isAtBottom = window.innerHeight + scrollY >= document.body.scrollHeight - 4;
      
      if (isAtBottom) {
        setActiveIndex(sectionRefs.length - 1);
        return;
      }

      // Find the section that's currently in view
      let currentIndex = 0;
      sectionRefs.forEach((ref, index) => {
        const element = ref.current;
        if (element && element.offsetTop <= triggerLine) {
          currentIndex = index;
        }
      });

      setActiveIndex(currentIndex);
    };

    // Initial check
    handleScroll();

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Re-measure when fonts are loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        handleScroll();
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionRefs]);

  return activeIndex;
}
