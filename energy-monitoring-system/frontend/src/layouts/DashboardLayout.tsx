import { useEffect, type ReactNode } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DesktopDashboardLayout } from './DesktopDashboardLayout';
import { SplashScreen } from '@/components/common/SplashScreen';
import { NicknameWelcomeModal } from '@/components/common/NicknameWelcomeModal';
import { VisitorOnboardingTour } from '@/components/common/VisitorOnboardingTour';
import { MaintenanceOverlay } from '@/components/common/MaintenanceOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useSocket } from '@/contexts/SocketContext';
import { showToast } from '@/components/common/Toast';
import { useAuditPageView } from '@/hooks/useAuditPageView';

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
  useAuditPageView();
  const { isAuthenticated } = useAuth();
  const { state: maintenanceState } = useMaintenance();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();
  const forceSplash = searchParams.get('splash') === 'true';
  const showPublicMaintenance = maintenanceState.enabled && !isAuthenticated;

  // Real-time in-app health/system alert toast for logged-in admins
  useEffect(() => {
    if (!isAuthenticated || !socket) return;
    const handleAlertCreated = (alert: { title?: string; severity?: string }) => {
      if (!alert?.title) return;
      const tone: 'error' | 'info' =
        alert.severity === 'critical' || alert.severity === 'warning'
          ? 'error'
          : 'info';
      showToast(`Alert: ${alert.title}`, tone);
    };
    socket.on('alert:created', handleAlertCreated);
    return () => {
      socket.off('alert:created', handleAlertCreated);
    };
  }, [isAuthenticated, socket]);

  return (
    <>
      <SplashScreen forceShow={forceSplash} />
      {!showPublicMaintenance && <NicknameWelcomeModal />}
      {!showPublicMaintenance && <VisitorOnboardingTour />}
      <MaintenanceOverlay />
      <DesktopDashboardLayout>{children ?? <Outlet />}</DesktopDashboardLayout>
    </>
  );
}
