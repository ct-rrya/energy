import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Sun, 
  Moon, 
  Home, 
  Settings, 
  LogOut, 
  LogIn, 
  User, 
  Menu, 
  X,
  ChevronRight,
  Shield,
  SlidersHorizontal
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';

interface MobileHeaderProps {
  onOpenMenu?: () => void;
  showMenuButton?: boolean;
}

export function MobileHeader({ onOpenMenu, showMenuButton = false }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const userRoleStr = (user?.role || '').toLowerCase();
  const isSuperAdmin = isAuthenticated && (userRoleStr === 'super_admin' || userRoleStr === 'admin');
  const isSystemAdmin = isAuthenticated && userRoleStr === 'system_admin';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;

  // Close dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);
      await logout();
      navigate(ROUTES.HOME);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userName = user?.name || (isAuthenticated ? 'Admin' : 'Guest User');
  const userRole = isSuperAdmin 
    ? 'Super Admin' 
    : isSystemAdmin 
    ? 'System Admin' 
    : 'Guest Access';

  return (
    <header
      className="sticky top-0 z-40 w-full h-14 px-3.5 sm:px-4 flex items-center justify-between border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(11, 19, 43, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        color: theme === 'dark' ? '#eaf3ee' : '#0d1b14',
      }}
    >
      {/* Left: Brand Logo & Title */}
      <Link
        to={ROUTES.DASHBOARD}
        className="flex items-center gap-2.5 min-w-0"
        aria-label="EcoStep Dashboard"
      >
        <div className="w-8 h-8 rounded-lg bg-[#16a34a] dark:bg-[#22c55e] text-white grid place-items-center shadow-xs flex-shrink-0">
          <Zap size={18} strokeWidth={2.4} fill="currentColor" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-base tracking-tight leading-none text-current">
            EcoStep
          </span>
          {isAnyAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-[#39FF88] border border-emerald-500/20">
              Admin
            </span>
          )}
        </div>
      </Link>

      {/* Right: Quick Action & Expandable Menu Icon */}
      <div className="flex items-center gap-1.5 sm:gap-2 relative">
        {/* Quick Home / Landing Link */}
        <Link
          to={ROUTES.HOME}
          aria-label="Go to landing page"
          className="w-9 h-9 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Home size={17} strokeWidth={2} />
        </Link>

        {/* Navigation Drawer Button */}
        {showMenuButton && onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="w-9 h-9 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        )}

        {/* Expandable Menu Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle user & options menu"
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
            isMenuOpen 
              ? 'bg-[#16a34a] dark:bg-[#22c55e] text-white border-transparent ring-2 ring-emerald-500/30' 
              : 'border-neutral-200 dark:border-white/10 text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {isMenuOpen ? (
            <X size={17} strokeWidth={2.2} />
          ) : (
            <SlidersHorizontal size={17} strokeWidth={2} />
          )}
        </button>

        {/* Expandable Dropdown Menu Popover */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="User Options Menu"
            className="absolute top-12 right-0 w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(16, 26, 48, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
              color: theme === 'dark' ? '#eaf3ee' : '#0d1b14',
              boxShadow: theme === 'dark' 
                ? '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(57, 255, 136, 0.08)' 
                : '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header: User Profile Info */}
            <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#39FF88] border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                {isAnyAdmin ? (
                  <Shield size={20} strokeWidth={2.2} />
                ) : (
                  <User size={20} strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate text-current">{userName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <span className="text-xs text-current/60 font-medium truncate">{userRole}</span>
                </div>
              </div>
            </div>

            {/* Core Action Buttons: Theme, Settings, Logout */}
            <div className="p-2 space-y-1">
              {/* 1. Theme Button */}
              <button
                type="button"
                onClick={toggleTheme}
                role="menuitem"
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-current">
                    {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
                  </div>
                  <span>Appearance / Theme</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-current/90 capitalize">
                  {theme}
                </span>
              </button>

              {/* 2. Settings Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate(ROUTES.SETTINGS);
                }}
                role="menuitem"
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  location.pathname.startsWith(ROUTES.SETTINGS)
                    ? 'bg-[#16a34a]/15 text-[#16a34a] dark:text-[#39FF88] font-bold'
                    : 'text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-current">
                    <Settings size={15} strokeWidth={2} />
                  </div>
                  <span>Settings</span>
                </div>
                <ChevronRight size={14} className="opacity-40" />
              </button>

              {/* 3. Logout / Sign In Button */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
                      <LogOut size={15} strokeWidth={2} />
                    </div>
                    <span>Sign Out</span>
                  </div>
                  <span className="text-[11px] opacity-70">Exit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(ROUTES.ADMIN_LOGIN);
                  }}
                  role="menuitem"
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-[#39FF88] hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-[#39FF88]">
                      <LogIn size={15} strokeWidth={2} />
                    </div>
                    <span>Admin Sign In</span>
                  </div>
                  <ChevronRight size={14} className="opacity-60" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
