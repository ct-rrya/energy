import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { DesktopDashboardLayout } from './DesktopDashboardLayout';
import { TabletDashboardLayout } from './TabletDashboardLayout';
import { MobileDashboardLayout } from './MobileDashboardLayout';

interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * Dashboard Layout with Hybrid Responsive Architecture
 * 
 * Dynamically renders:
 * - DesktopDashboardLayout (>= 1024px): 100% original EcoSidebar, liquid notch, and desktop layout
 * - TabletDashboardLayout (768px - 1023px): Tablet-adapted header, drawer, and spacious canvas
 * - MobileDashboardLayout (< 768px): Dedicated mobile header, slide-out drawer, touch-friendly UI
 * 
 * Reuses all existing routes, Socket.IO connections, queries, and business logic without duplication.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDesktop, isTablet } = useDeviceLayout();

  if (isDesktop) {
    return <DesktopDashboardLayout>{children ?? <Outlet />}</DesktopDashboardLayout>;
  }

  if (isTablet) {
    return <TabletDashboardLayout>{children ?? <Outlet />}</TabletDashboardLayout>;
  }

  return <MobileDashboardLayout>{children ?? <Outlet />}</MobileDashboardLayout>;
}
