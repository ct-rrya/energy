import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  path?: string;
  children?: { id: string; path: string }[];
}

interface NotchPosition {
  y: number;
  height: number;
  itemId: string;
}

/**
 * Hook for managing the liquid notch indicator position
 * 
 * Tracks active nav item position and provides smooth animated transitions
 * with the signature liquid stretch effect.
 */
export function useLiquidNotch(
  navItems: NavItem[],
  isExpanded: boolean
) {
  const location = useLocation();
  const [notchPosition, setNotchPosition] = useState<NotchPosition | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Register nav item ref
  const registerItemRef = (id: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  };

  // Find active item
  const findActiveItem = (): string | null => {
    const currentPath = location.pathname;
    
    for (const item of navItems) {
      // Check direct path match
      if (item.path === currentPath) {
        return item.id;
      }
      
      // Check children paths
      if (item.children) {
        for (const child of item.children) {
          if (child.path === currentPath) {
            return child.id;
          }
        }
      }
    }
    
    return null;
  };

  // Measure and update notch position
  const updateNotchPosition = () => {
    const activeItemId = findActiveItem();
    if (!activeItemId || !navRef.current) {
      setNotchPosition(null);
      return;
    }

    const itemElement = itemRefs.current.get(activeItemId);
    if (!itemElement) {
      setNotchPosition(null);
      return;
    }

    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();
    
    const y = itemRect.top - navRect.top + navRef.current.scrollTop;
    const height = itemRect.height;

    setNotchPosition({ y, height, itemId: activeItemId });
  };

  // Initial positioning (no transition)
  useEffect(() => {
    const init = async () => {
      // Wait for fonts to load
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      
      // Small delay to ensure refs are registered
      await new Promise(resolve => setTimeout(resolve, 50));
      
      updateNotchPosition();
    };

    init();
  }, []);

  // Update on route change (with transition)
  useEffect(() => {
    if (!notchPosition) {
      // First paint - no transition
      updateNotchPosition();
      return;
    }

    setIsTransitioning(true);
    updateNotchPosition();
    
    const duration = prefersReducedMotion.current ? 0 : 600;
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  // Update on resize or expand/collapse
  useEffect(() => {
    const handleResize = () => {
      updateNotchPosition();
    };

    // Update after expand/collapse transition
    const transitionTimeout = setTimeout(() => {
      updateNotchPosition();
    }, 450);

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(transitionTimeout);
    };
  }, [isExpanded]);

  // Update on scroll (for nav list scrolling)
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      updateNotchPosition();
    };

    navElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      navElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    notchPosition,
    isTransitioning,
    navRef,
    registerItemRef,
  };
}
