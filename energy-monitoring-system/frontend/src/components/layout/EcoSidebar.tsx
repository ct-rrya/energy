import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
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
  ChevronUp, 
  ChevronLeft,
  Gamepad2, 
  GraduationCap,
  Trophy,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { ROUTES } from '@/routes/routes.config';
import { ChatPanel } from '@/features/chat';
import '@/styles/eco-sidebar.css';

interface NavItem {
  to: string;
  label: string;
  Icon: React.ElementType;
  end?: boolean;
  systemAdminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Public routes (shown to everyone)
  { to: ROUTES.HOME, label: 'Home', Icon: House, end: true },
  { to: ROUTES.DASHBOARD, label: 'EcoStep Central', Icon: Activity },
  { to: ROUTES.ANALYTICS, label: 'Historical Analytics', Icon: TrendingUp },
  { to: ROUTES.MISSIONS, label: 'Educational Missions', Icon: GraduationCap },
  { to: ROUTES.LEADERBOARD, label: 'Leaderboard', Icon: Trophy },
  // Operational features for all admins
  { to: ROUTES.ADMIN_DIAGNOSTICS, label: 'Tile Performance Diagnostics', Icon: Stethoscope, systemAdminOnly: true },
  { to: ROUTES.REPORTS, label: 'Reports', Icon: FileText, systemAdminOnly: true },
  // SUPER_ADMIN only route (admin management)
  { to: ROUTES.ADMIN_MANAGEMENT, label: 'Admin Management', Icon: Users, superAdminOnly: true },
];

interface EcoSidebarProps {
  children: React.ReactNode;
}

export function EcoSidebar({ children }: EcoSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { player, openPlayerModal, logout: playerLogout } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();

  // Left panel collapsed state with localStorage persistence
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ecostep.leftCollapsed');
      if (stored !== null) return stored === 'true';
      if (typeof window !== 'undefined') {
        return window.innerWidth < 1024;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Right EcoGuide panel collapsed state with localStorage persistence
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ecostep.rightCollapsed');
      if (stored !== null) return stored === 'true';
      if (typeof window !== 'undefined') {
        return window.innerWidth < 1280;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
      window.dispatchEvent(new Event('resize'));
    }, 270);
  }, []);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  // Toggle Left panel
  const toggleLeft = useCallback(() => {
    startAnimation();
    setLeftCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ecostep.leftCollapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [startAnimation]);

  // Toggle Right panel
  const toggleRight = useCallback(() => {
    startAnimation();
    setRightCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ecostep.rightCollapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [startAnimation]);

  // Compute portal popover coordinates from user card bounding rect
  const updatePopoverPosition = useCallback(() => {
    if (!userTriggerRef.current) return;
    const card = userTriggerRef.current.getBoundingClientRect();
    const popoverWidth = 250;
    const margin = 12;

    let left: number;
    let bottom: number;

    if (leftCollapsed) {
      // Collapsed rail (72px): anchor to right edge + 8px, bottom-aligned with avatar
      left = card.right + 8;
      bottom = window.innerHeight - card.bottom;
    } else {
      // Expanded: sit 8px above the user card
      left = card.left;
      bottom = (window.innerHeight - card.top) + 8;
    }

    // Viewport clamping with 12px margin
    if (left + popoverWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - popoverWidth);
    }
    if (left < margin) {
      left = margin;
    }

    const popoverHeight = popoverRef.current?.offsetHeight || 230;
    const maxBottom = window.innerHeight - popoverHeight - margin;
    if (bottom > maxBottom) {
      bottom = Math.max(margin, maxBottom);
    }
    if (bottom < margin) {
      bottom = margin;
    }

    setPopoverPos({ left, bottom });
  }, [leftCollapsed]);

  // Keyboard shortcuts: [ toggles left, ] toggles right (ignore while typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '[') {
        e.preventDefault();
        toggleLeft();
      } else if (e.key === ']') {
        e.preventDefault();
        toggleRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeft, toggleRight]);

  // Close menu on route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Outside click, window resize, scroll, and keyboard handlers for portal popover
  useEffect(() => {
    if (!userMenuOpen) return;

    updatePopoverPosition();
    const frameId = requestAnimationFrame(() => {
      updatePopoverPosition();
      const firstItem = popoverRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]');
      firstItem?.focus();
    });

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        userTriggerRef.current &&
        !userTriggerRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleResize = () => {
      updatePopoverPosition();
    };

    const handleScroll = () => {
      setUserMenuOpen(false);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [userMenuOpen, updatePopoverPosition]);

  // Keyboard navigation within the user menu
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      popoverRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') || []
    );
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setUserMenuOpen(false);
      userTriggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setUserMenuOpen(false);
    }
  };

  const closeMenu = (returnFocus = true) => {
    setUserMenuOpen(false);
    if (returnFocus) {
      userTriggerRef.current?.focus();
    }
  };

  // Listen for custom events to toggle panels
  useEffect(() => {
    const handleToggleRight = () => toggleRight();
    window.addEventListener('ecostep:toggleright', handleToggleRight);
    return () => window.removeEventListener('ecostep:toggleright', handleToggleRight);
  }, [toggleRight]);

  // Set scrollTop = 0 on sidebar and guide on mount and on every route change
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
    const guideEl = document.getElementById('ecoguide-panel');
    if (guideEl) {
      guideEl.scrollTop = 0;
    }
  }, [location.pathname]);

  // Determine user role
  const isSuperAdmin = isAuthenticated && user && (user.role === 'SUPER_ADMIN' || user.role === 'admin');
  const isSystemAdmin = isAuthenticated && user && user.role === 'SYSTEM_ADMIN';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;

  // Filter nav items based on role
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter(item => {
      if (!item.systemAdminOnly && !item.superAdminOnly) {
        return true;
      }
      if (item.systemAdminOnly && isAnyAdmin) {
        return true;
      }
      if (item.superAdminOnly && isSuperAdmin) {
        return true;
      }
      return false;
    });
  }, [isAnyAdmin, isSuperAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userName = user?.name || (player ? player.username : 'Guest');
  const userRole = isSuperAdmin ? 'Super Administrator' : isSystemAdmin ? 'System Administrator' : 'Read-only access';
  const isSettingsActive = location.pathname.startsWith(ROUTES.SETTINGS);

  return (
    <div
      ref={shellRef}
      className={`es-shell sh ${isAnimating ? 'is-animating' : ''}`}
      id="shell"
      data-theme={theme}
      style={{
        '--left-w': leftCollapsed ? '72px' : '200px',
        '--left-panel-w': leftCollapsed ? '72px' : '200px',
        '--right-w': rightCollapsed ? '56px' : '330px',
        '--right-panel-w': rightCollapsed ? '56px' : '330px',
      } as React.CSSProperties}
    >
      {/* Left Navigation */}
      <nav 
        ref={sidebarRef}
        className={`es-side nv sidebar ${leftCollapsed ? 'collapsed nv-collapsed' : ''}`}
        id="left-sidebar"
        aria-label="Main"
      >
        {/* Header with Wordmark and Collapse Toggle */}
        <div className="es-nav-header">
          <a href="/" className="es-brand-link" aria-label="EcoStep home" title="EcoStep">
            <span className="es-brand-mark-circle">E</span>
            <span className="es-brand-text">EcoStep</span>
          </a>
          <button
            type="button"
            className="es-toggle-btn ib"
            onClick={toggleLeft}
            aria-expanded={!leftCollapsed}
            aria-controls="left-sidebar"
            aria-label={leftCollapsed ? "Expand sidebar (Toggle sidebar)" : "Collapse sidebar (Toggle sidebar)"}
            title={leftCollapsed ? "Expand sidebar ( [ )" : "Collapse sidebar ( [ )"}
          >
            <ChevronLeft size={16} strokeWidth={2} className="es-toggle-icon" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="es-nav-list">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `es-nav-item nav-link ${isActive ? 'active on' : ''}`}
              title={leftCollapsed ? label : undefined}
              aria-label={label}
            >
              <span className="es-nav-icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="es-nav-label">
                {label}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Pinned Bottom User Card */}
        <div className="es-user-anchor" ref={userMenuRef}>
          <button
            ref={userTriggerRef}
            type="button"
            className="es-user-card uc"
            id="user-menu-trigger"
            aria-label="User account and settings"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((prev) => !prev)}
            title={leftCollapsed ? `${userName} (${userRole})` : undefined}
          >
            <div className="es-user-avatar av">
              {isAuthenticated && (user?.name || user?.email) ? (
                <span>{(user.name || user.email || 'A')[0].toUpperCase()}</span>
              ) : player ? (
                <span>{(player.username || 'P')[0].toUpperCase()}</span>
              ) : (
                <span>T</span>
              )}
            </div>
            <div className="es-user-info info">
              <div className="es-user-name">{userName}</div>
              <div className="es-user-sub">{player ? 'Guest Player' : userRole}</div>
            </div>
            <ChevronUp 
              size={16} 
              strokeWidth={1.8} 
              className="es-user-chevron"
              style={{
                transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                color: 'var(--mu)',
                flexShrink: 0
              }}
            />
          </button>
        </div>

        {/* User Menu Popover in Document Portal */}
        {userMenuOpen && typeof document !== 'undefined' && createPortal(
          <div 
            ref={popoverRef}
            className="user-menu es-user-popover pop" 
            role="menu"
            aria-label="User settings and account menu"
            onKeyDown={handleMenuKeyDown}
            style={{
              position: 'fixed',
              left: `${popoverPos.left}px`,
              bottom: `${popoverPos.bottom}px`,
              zIndex: 50,
            }}
          >
            {/* Header: avatar 40px | name (15px/600) + role (12px muted) */}
            <div className="um-head es-popover-header h">
              <div className="um-avatar es-popover-avatar c">
                {isAuthenticated && (user?.name || user?.email) ? (
                  <span>{(user.name || user.email || 'A')[0].toUpperCase()}</span>
                ) : (
                  <User size={18} strokeWidth={2} />
                )}
              </div>
              <div className="um-info es-popover-user-info">
                <div className="um-name es-popover-name font-semibold text-sm">{userName}</div>
                <div className="um-role es-popover-role text-xs text-[var(--mu)]">{player ? 'Guest Player' : userRole}</div>
                {user?.email && (
                  <div className="text-[11px] text-[var(--mu)] truncate">{user.email}</div>
                )}
              </div>
            </div>

            {/* Flat Menu Body (single buttons, no second dividers) */}
            <div className="um-body es-popover-body">
              {/* Settings Navigation (Admin only) */}
              {isAnyAdmin && (
                <button
                  type="button"
                  role="menuitem"
                  className="um-item es-popover-item it"
                  onClick={() => {
                    closeMenu(false);
                    navigate(ROUTES.SETTINGS);
                  }}
                >
                  <Settings size={18} strokeWidth={1.8} />
                  <span>Settings</span>
                  {isSettingsActive && (
                    <span className="um-badge es-popover-badge tg">Active</span>
                  )}
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                role="menuitem"
                className="um-item es-popover-item it"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
                <span>Theme</span>
                <span className="um-badge es-popover-badge tg">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Auth / Player Actions */}
              {isAnyAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  className="um-item es-popover-item it"
                  onClick={() => {
                    closeMenu(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={18} strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  {player ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="um-item es-popover-item it"
                      onClick={async () => {
                        closeMenu(false);
                        await playerLogout();
                      }}
                    >
                      <LogOut size={18} strokeWidth={1.8} />
                      <span>Switch Player</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="um-item es-popover-item it text-[#087A3A] dark:text-[#19D46A]"
                      onClick={() => {
                        closeMenu(false);
                        openPlayerModal();
                      }}
                    >
                      <Gamepad2 size={18} strokeWidth={1.8} />
                      <span>Play &amp; Learn</span>
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="um-item es-popover-item it"
                    onClick={() => {
                      closeMenu(false);
                      navigate(ROUTES.LOGIN);
                    }}
                  >
                    <User size={18} strokeWidth={1.8} />
                    <span>Admin Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      </nav>

      {/* Main Column */}
      <main ref={mainRef} className="es-main mn es-main-col main">
        {children}
      </main>

      {/* Right EcoGuide Panel */}
      <ChatPanel 
        isCollapsed={rightCollapsed} 
        onToggleCollapse={toggleRight} 
      />
    </div>
  );
}
