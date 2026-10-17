import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileDashboardLayoutProps {
  children?: ReactNode;
}

/**
 * MobileDashboardLayout Component
 * 
 * Dedicated mobile layout for viewports < 768px:
 * - Fixed 56px touch header with title and quick actions
 * - Slide-out navigation drawer with role-based routing and account menu
 * - Persistent bottom navigation bar (Home, Activity, Assistant, Settings)
 * - Zero horizontal overflow container with touch-friendly spacing
 */
export function MobileDashboardLayout({ children }: MobileDashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div 
      className="min-h-screen w-full flex flex-col overflow-x-hidden"
      style={{
        backgroundColor: theme === 'dark' ? '#0b132b' : '#f5f7fa',
        color: theme === 'dark' ? '#eaf3ee' : '#0d1b14',
      }}
    >
      {/* Mobile Top Header */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} />

      {/* Slide-out Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />

      {/* Mobile Main Content Area (pb-20 ensures content is not hidden by bottom nav) */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden p-3.5 sm:p-5 pb-20">
        {children ?? <Outlet />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
