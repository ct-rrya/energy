import { useState, useEffect } from 'react';

export type DeviceLayout = 'mobile' | 'tablet' | 'desktop';

export interface DeviceLayoutState {
  layout: DeviceLayout;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

// Breakpoints consistent with Tailwind and modern devices
// Mobile: < 768px (iPhone SE 320px/375px, modern phones 390px-430px)
// Tablet: 768px - 1023px (iPad Mini 768px, iPad Pro 834px-1024px)
// Desktop: >= 1024px (Laptops 1280px-1440px, Desktops 1920px+)
export const BREAKPOINTS = {
  MOBILE_MAX: 767,
  TABLET_MIN: 768,
  TABLET_MAX: 1023,
  DESKTOP_MIN: 1024,
} as const;

function getLayoutFromWidth(width: number): DeviceLayout {
  if (width < BREAKPOINTS.TABLET_MIN) {
    return 'mobile';
  }
  if (width < BREAKPOINTS.DESKTOP_MIN) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * useDeviceLayout Hook
 * 
 * Provides reactive device layout detection with support for resize events.
 * Enables the hybrid responsive architecture to switch between dedicated desktop,
 * tablet, and mobile layouts without page reloads.
 */
export function useDeviceLayout(): DeviceLayoutState {
  const [layoutState, setLayoutState] = useState<DeviceLayoutState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const layout = getLayoutFromWidth(width);
    return {
      layout,
      isMobile: layout === 'mobile',
      isTablet: layout === 'tablet',
      isDesktop: layout === 'desktop',
      width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use matchMedia queries for efficient and accurate layout detection
    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`);
    const tabletQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`);
    const desktopQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`);

    const updateLayout = () => {
      const width = window.innerWidth;
      const layout = getLayoutFromWidth(width);
      setLayoutState({
        layout,
        isMobile: layout === 'mobile',
        isTablet: layout === 'tablet',
        isDesktop: layout === 'desktop',
        width,
      });
    };

    // Listen to media query changes
    mobileQuery.addEventListener('change', updateLayout);
    tabletQuery.addEventListener('change', updateLayout);
    desktopQuery.addEventListener('change', updateLayout);
    window.addEventListener('resize', updateLayout);

    return () => {
      mobileQuery.removeEventListener('change', updateLayout);
      tabletQuery.removeEventListener('change', updateLayout);
      desktopQuery.removeEventListener('change', updateLayout);
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  return layoutState;
}
