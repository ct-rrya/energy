import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, MessageSquare, Stethoscope, FileText, Menu, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';

interface MobileBottomNavProps {
  className?: string;
  onOpenMenu?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  ariaLabel?: string;
  onClick: () => void;
}

/**
 * MobileBottomNav Component
 * 
 * Persistent bottom navigation bar with role-optimized tabs:
 * - Admin view: Central, Analytics, Tile Diagnostics, Reports, More/Menu
 * - Guest view: Central, Analytics, EcoChat, Admin, Menu
 */
export function MobileBottomNav({ className = '', onOpenMenu }: MobileBottomNavProps) {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRoleStr = (user?.role || '').toLowerCase();
  const isSuperAdmin = isAuthenticated && (userRoleStr === 'super_admin' || userRoleStr === 'admin');
  const isSystemAdmin = isAuthenticated && userRoleStr === 'system_admin';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;

  const isCentral = location.pathname === ROUTES.DASHBOARD || location.pathname === '/';
  const isAnalytics = location.pathname.startsWith(ROUTES.ANALYTICS);
  const isDiagnostics = location.pathname.startsWith(ROUTES.ADMIN_DIAGNOSTICS);
  const isReports = location.pathname.startsWith(ROUTES.REPORTS);
  const isAdminLogin = location.pathname.startsWith(ROUTES.ADMIN_LOGIN);

  const handleOpenEcoChat = () => {
    window.dispatchEvent(new CustomEvent('ecostep:openchat', { bubbles: true }));
  };

  const handleOpenMenu = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else {
      window.dispatchEvent(new CustomEvent('ecostep:opendrawer', { bubbles: true }));
    }
  };

  const adminNavItems: NavItem[] = [
    {
      id: 'central',
      label: 'Central',
      icon: Home,
      isActive: isCentral,
      onClick: () => navigate(ROUTES.DASHBOARD),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      isActive: isAnalytics,
      onClick: () => navigate(ROUTES.ANALYTICS),
    },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: Stethoscope,
      isActive: isDiagnostics,
      onClick: () => navigate(ROUTES.ADMIN_DIAGNOSTICS),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      isActive: isReports,
      onClick: () => navigate(ROUTES.REPORTS),
    },
  ];

  const guestNavItems: NavItem[] = [
    {
      id: 'central',
      label: 'Central',
      icon: Home,
      isActive: isCentral,
      onClick: () => navigate(ROUTES.DASHBOARD),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      isActive: isAnalytics,
      onClick: () => navigate(ROUTES.ANALYTICS),
    },
    {
      id: 'ecochat',
      label: 'EcoChat',
      icon: MessageSquare,
      isActive: false,
      onClick: handleOpenEcoChat,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      isActive: isAdminLogin,
      ariaLabel: 'Admin Sign In',
      onClick: () => navigate(ROUTES.ADMIN_LOGIN),
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      isActive: false,
      ariaLabel: 'Open navigation menu',
      onClick: handleOpenMenu,
    },
  ];

  const navItems = isAnyAdmin ? adminNavItems : guestNavItems;

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors ${className}`}
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(11, 19, 43, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="max-w-md mx-auto px-2 sm:px-4 h-14 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const activeColor = theme === 'dark' ? '#39FF88' : '#16a34a';
          const inactiveColor = theme === 'dark' ? '#94a3b8' : '#64748b';

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-label={item.ariaLabel || item.label}
              className="flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-w-[56px] sm:min-w-[64px] rounded-xl transition-transform active:scale-95 cursor-pointer"
            >
              <Icon
                size={item.isActive ? 20 : 18}
                strokeWidth={item.isActive ? 2.4 : 1.8}
                style={{
                  color: item.isActive ? activeColor : inactiveColor,
                }}
              />
              <span
                className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 transition-colors truncate max-w-[68px]"
                style={{
                  fontWeight: item.isActive ? 700 : 500,
                  color: item.isActive ? activeColor : inactiveColor,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
