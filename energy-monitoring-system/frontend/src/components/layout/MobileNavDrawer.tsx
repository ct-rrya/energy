import { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Footprints, 
  House, 
  Activity, 
  TrendingUp, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Stethoscope, 
  FileText, 
  Settings, 
  Users,
  X,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  Icon: React.ElementType;
  end?: boolean;
  systemAdminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: ROUTES.HOME, label: 'Home', Icon: House, end: true },
  { to: ROUTES.DASHBOARD, label: 'EcoStep Central', Icon: Activity },
  { to: ROUTES.ANALYTICS, label: 'Historical Analytics', Icon: TrendingUp },
  { to: ROUTES.ADMIN_DIAGNOSTICS, label: 'System Diagnostics', Icon: Stethoscope, systemAdminOnly: true },
  { to: ROUTES.REPORTS, label: 'Reports', Icon: FileText, systemAdminOnly: true },
  { to: ROUTES.ADMIN_MANAGEMENT, label: 'Admin Management', Icon: Users, superAdminOnly: true },
];

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = isAuthenticated && user && (user.role === 'SUPER_ADMIN' || user.role === 'admin');
  const isSystemAdmin = isAuthenticated && user && user.role === 'SYSTEM_ADMIN';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;

  // Filter nav items based on user role
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.systemAdminOnly && !item.superAdminOnly) return true;
    if (item.systemAdminOnly && isSystemAdmin) return true;
    if (item.superAdminOnly && isSuperAdmin) return true;
    return false;
  });

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      onClose();
      await logout();
      navigate(ROUTES.HOME);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userName = user?.name || 'Guest';
  const userRole = isSuperAdmin 
    ? 'Super Administrator' 
    : isSystemAdmin 
    ? 'System Administrator' 
    : 'Read-only access';
  const isSettingsActive = location.pathname.startsWith(ROUTES.SETTINGS);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
    >
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative flex flex-col w-[85%] max-w-[320px] h-full shadow-2xl z-10 transition-transform duration-300 ease-out"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(180deg, #101a30 0%, #0a1122 100%)' 
            : 'linear-gradient(180deg, #101a30 0%, #0d1628 100%)',
          color: '#eaf3ee',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Drawer Header: Brand + Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#19d46a] text-[#05361f] grid place-items-center shadow-md shadow-[#19d46a]/20 flex-shrink-0">
              <Footprints size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-tight">EcoStep</div>
              <div className="text-[11px] font-medium text-white/60">Energy monitoring</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* User Account Card */}
        <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 text-[#19d46a] border border-[#19d46a]/30 flex items-center justify-center flex-shrink-0">
            <User size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-white truncate">{userName}</div>
            <div className="text-xs text-white/60 truncate">{userRole}</div>
          </div>
        </div>

        {/* Navigation Items (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 overscroll-contain">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
            Navigation
          </div>

          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                flex items-center justify-between w-full px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                ${isActive 
                  ? 'bg-[#19d46a] text-[#05361f] shadow-md shadow-[#19d46a]/20 font-bold' 
                  : 'text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={19} strokeWidth={1.8} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </div>
              <ChevronRight size={15} strokeWidth={2} className="opacity-40 flex-shrink-0" />
            </NavLink>
          ))}
        </div>

        {/* Footer Actions: Settings, Theme Toggle & Sign Out */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-1">
          {/* Settings Item */}
          {isAnyAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.SETTINGS);
              }}
              className={`
                flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isSettingsActive 
                  ? 'bg-[#19d46a]/15 text-[#19d46a] font-bold' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} strokeWidth={1.75} />
                <span>Settings</span>
              </div>
              {isSettingsActive && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#19d46a]/20 text-[#19d46a]">
                  Active
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
              <span>Appearance</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 capitalize">
              {theme}
            </span>
          </button>

          {/* Auth Action */}
          {isAnyAdmin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all"
            >
              <LogOut size={18} strokeWidth={1.75} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.ADMIN_LOGIN);
              }}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#19d46a] hover:bg-[#19d46a]/15 transition-all"
            >
              <User size={18} strokeWidth={1.75} />
              <span>Admin Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
