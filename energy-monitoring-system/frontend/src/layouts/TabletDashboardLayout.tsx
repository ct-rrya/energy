import { useState, useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatPanel } from '@/features/chat';

interface TabletDashboardLayoutProps {
  children?: ReactNode;
}

/**
 * TabletDashboardLayout Component
 * 
 * Tablet-adapted layout for viewports 768px - 1023px:
 * - Clean header with title context and navigation drawer
 * - Middle main panel flex: 1, min-width: 0, scrolls independently
 * - Docked ChatPanel to the right edge (defaults to collapsed slim rail)
 */
export function TabletDashboardLayout({ children }: TabletDashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useTheme();

  // Support custom event for drawer opening
  useEffect(() => {
    const handleOpenDrawerEvent = () => setDrawerOpen(true);
    window.addEventListener('ecostep:opendrawer', handleOpenDrawerEvent);
    return () => window.removeEventListener('ecostep:opendrawer', handleOpenDrawerEvent);
  }, []);

  return (
    <div 
      className="h-screen h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: theme === 'dark' ? '#0b132b' : '#f5f7fa',
        color: theme === 'dark' ? '#eaf3ee' : '#0d1b14',
      }}
    >
      {/* Tablet Header */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} showMenuButton={true} />

      {/* Slide-out Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />

      {/* Tablet Content Area & Docked Chat Panel */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        <main className="flex-1 min-w-0 overflow-y-auto px-6 py-6">
          {children ?? <Outlet />}
        </main>
        <ChatPanel />
      </div>
    </div>
  );
}
