import { type ReactNode } from 'react';
import { EcoSidebar } from '@/components/layout/EcoSidebar';

/**
 * Dashboard Layout Props
 */
interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard Layout with EcoStep Sidebar
 * 
 * Unified layout for both public viewers and admins.
 * Features:
 * - EcoStep floating capsule sidebar
 * - Liquid notch indicator
 * - Role-based navigation
 * - Theme toggle
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <EcoSidebar>{children}</EcoSidebar>;
}
