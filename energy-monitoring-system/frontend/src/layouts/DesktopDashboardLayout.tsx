import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { EcoSidebar } from '@/components/layout/EcoSidebar';

interface DesktopDashboardLayoutProps {
  children?: ReactNode;
}

/**
 * DesktopDashboardLayout Component
 * 
 * Preserves 100% of the existing desktop design, liquid notch physics,
 * expandable capsule profile trigger, and navigation layout for viewport >= 1024px.
 */
export function DesktopDashboardLayout({ children }: DesktopDashboardLayoutProps) {
  return <EcoSidebar>{children ?? <Outlet />}</EcoSidebar>;
}
