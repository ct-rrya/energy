import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopDashboardLayout } from './DesktopDashboardLayout';

interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * Dashboard Layout with Unified EcoStep Central Shell
 *
 * Renders the EcoSidebar shell across all viewports:
 * - Desktop (> 768px): Left navigation sidebar, center main column, right EcoGuide panel
 * - Mobile (<= 768px): Top bar, single-column main content, fixed bottom tab bar,
 *   EcoGuide full-height bottom sheet, and Guest/User bottom sheet
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DesktopDashboardLayout>{children ?? <Outlet />}</DesktopDashboardLayout>;
}
