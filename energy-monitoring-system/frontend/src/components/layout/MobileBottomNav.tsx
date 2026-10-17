import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, MessageSquare } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/routes/routes.config';

interface MobileBottomNavProps {
  className?: string;
}

/**
 * MobileBottomNav Component
 * 
 * Persistent bottom navigation bar with exactly 3 items:
 * - Central (links to /dashboard)
 * - Analytics (links to /analytics)
 * - EcoChat (triggers EcoChat panel)
 */
export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isCentral = location.pathname === ROUTES.DASHBOARD || location.pathname === '/';
  const isAnalytics = location.pathname.startsWith(ROUTES.ANALYTICS);

  const handleOpenEcoChat = () => {
    // Open EcoChat floating panel via global custom event
    window.dispatchEvent(new CustomEvent('ecostep:openchat', { bubbles: true }));
  };

  const navItems = [
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
  ];

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
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const activeColor = theme === 'dark' ? '#39FF88' : '#16a34a';
          const inactiveColor = theme === 'dark' ? '#94a3b8' : '#64748b';

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className="flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-transform active:scale-95 cursor-pointer"
            >
              <Icon
                size={19}
                strokeWidth={item.isActive ? 2.4 : 1.8}
                style={{
                  color: item.isActive ? activeColor : inactiveColor,
                }}
              />
              <span
                className="text-[11px] mt-1 transition-colors"
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
