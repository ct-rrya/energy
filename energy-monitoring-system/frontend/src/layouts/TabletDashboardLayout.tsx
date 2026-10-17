import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { useTheme } from '@/contexts/ThemeContext';

interface TabletDashboardLayoutProps {
  children?: ReactNode;
}

/**
 * TabletDashboardLayout Component
 * 
 * Tablet-adapted layout for viewports 768px - 1023px:
 * - Clean header with title context and navigation drawer
 * - Spacious tablet padding (px-6 py-6) allowing charts and tables full breathing room
 * - Prevents awkward narrow sidebar squeeze on 768px screens
 */
export function TabletDashboardLayout({ children }: TabletDashboardLayoutProps) {
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
      {/* Tablet Header */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} />

      {/* Slide-out Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />

      {/* Tablet Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden px-6 py-6">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
