import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Footprints, 
  Menu, 
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
  ChevronUp 
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';
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
  // SYSTEM_ADMIN only routes (operational features)
  { to: ROUTES.ADMIN_DIAGNOSTICS, label: 'System Diagnostics', Icon: Stethoscope, systemAdminOnly: true },
  { to: ROUTES.REPORTS, label: 'Reports', Icon: FileText, systemAdminOnly: true },
  // SUPER_ADMIN only route (admin management)
  { to: ROUTES.ADMIN_MANAGEMENT, label: 'Admin Management', Icon: Users, superAdminOnly: true },
];

interface EcoSidebarProps {
  children: React.ReactNode;
}

// Cache last known notch Y position across renders to maintain smooth transitions
let lastKnownNotchY: string | null = null;

export function EcoSidebar({ children }: EcoSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize expanded synchronously from localStorage to prevent delayed expand on load
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ecostep.sidebar.v2') === 'expanded';
    } catch {
      return false;
    }
  });
  const [ready, setReady] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const capRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

  // Close menu on route changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Click outside and Escape key handler for user menu popover
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        userTriggerRef.current?.focus();
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
  }, [userMenuOpen]);

  // Determine user role
  const isSuperAdmin = isAuthenticated && user && (user.role === 'SUPER_ADMIN' || user.role === 'admin');
  const isSystemAdmin = isAuthenticated && user && user.role === 'SYSTEM_ADMIN';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;

  // Filter nav items based on role
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter(item => {
      // Public routes: show to everyone
      if (!item.systemAdminOnly && !item.superAdminOnly) {
        return true;
      }
      // SYSTEM_ADMIN only routes
      if (item.systemAdminOnly && isSystemAdmin) {
        return true;
      }
      // SUPER_ADMIN only routes
      if (item.superAdminOnly && isSuperAdmin) {
        return true;
      }
      return false;
    });
  }, [isSystemAdmin, isSuperAdmin]);

  // Place notch function - uses getBoundingClientRect for fractional precision
  const place = () => {
    const el = capRef.current;
    if (!el) return;
    const a = el.querySelector<HTMLElement>('.es-row[aria-current="page"]');
    if (!a) return;
    const capsuleRect = el.getBoundingClientRect();
    const rowRect = a.getBoundingClientRect();
    const y = (rowRect.top - capsuleRect.top + rowRect.height / 2) + 'px';
    lastKnownNotchY = y;
    el.style.setProperty('--notch-y', y);
  };

  // Auto density: count rows and recalculate layout
  const fit = () => {
    const el = capRef.current;
    if (!el) return;
    const rowCount = el.querySelectorAll('.es-row').length;
    el.style.setProperty('--rows', String(rowCount));
    place();
  };

  // Call place after route changes (layout effect)
  useLayoutEffect(() => {
    place();
    if (!ready) {
      const id = requestAnimationFrame(() => {
        setReady(true);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [location.pathname, expanded, navItems.length, ready]);

  // Recalculate when nav items change (role change adds/removes items)
  useEffect(() => {
    fit();
  }, [navItems.length]);

  // Mount effect - fit and place on mount, resize, and font ready
  useEffect(() => {
    // Initial fit
    fit();

    // Place after fonts ready
    if (document.fonts?.ready) {
      document.fonts.ready.then(fit);
    }

    // Fit on resize (row heights change with viewport height)
    const handleResize = () => fit();
    window.addEventListener('resize', handleResize);

    // Observe capsule size changes (row heights are dynamic)
    let resizeObserver: ResizeObserver | null = null;
    if (capRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => place());
      resizeObserver.observe(capRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Persist expanded state
  const handleToggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ecostep.sidebar.v2', next ? 'expanded' : 'collapsed');
      } catch {}
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to landing page after logout
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userName = user?.name || 'Guest';
  const userRole = isSuperAdmin ? 'Super Administrator' : isSystemAdmin ? 'System Administrator' : 'Read-only access';
  const isSettingsActive = location.pathname.startsWith(ROUTES.SETTINGS);

  return (
    <div
      className={`es-shell${ready ? ' es-ready' : ''}`}
      id="shell"
      data-theme={theme}
      data-expanded={String(expanded)}
    >
      <aside className="es-side">
        <a className="es-badge" href="/" aria-label="EcoStep home">
          <span className="es-ico">
            <Footprints size={26} strokeWidth={1.75} />
          </span>
          <span className="es-brand">
            <b>EcoStep</b>
            <small>Energy monitoring</small>
          </span>
        </a>

        <nav 
          className="es-capsule" 
          id="capsule" 
          ref={capRef} 
          aria-label="Main"
          style={lastKnownNotchY ? ({ '--notch-y': lastKnownNotchY } as React.CSSProperties) : undefined}
        >
          <div className="es-fill"></div>
          <div className="es-ring"></div>
          <div className="es-blob"></div>
          <div className="es-content">
            <button
              className="es-row"
              id="toggle"
              aria-expanded={expanded}
              aria-label="Toggle sidebar"
              onClick={handleToggle}
            >
              <span className="es-ico">
                <Menu size={22} strokeWidth={1.5} />
              </span>
              <span className="es-label">Collapse</span>
            </button>
            <div className="es-sep"></div>
            
            {navItems.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="es-row"
                data-route
              >
                <span className="es-ico">
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <span className="es-label">{label}</span>
              </NavLink>
            ))}
            
            <div className="es-grow"></div>
            <div className="es-sep"></div>

            {/* Expandable User / Settings / Theme Row */}
            <div className="es-user-anchor" ref={userMenuRef}>
              {userMenuOpen && (
                <div 
                  className="es-user-popover" 
                  role="menu"
                  aria-label="User settings and account menu"
                >
                  <div className="es-popover-header">
                    <div className="es-popover-avatar">
                      <User size={18} strokeWidth={2} />
                    </div>
                    <div className="es-popover-user-info">
                      <div className="es-popover-name">{userName}</div>
                      <div className="es-popover-role">{userRole}</div>
                      {user?.email && (
                        <div className="es-popover-email">{user.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="es-popover-sep" />

                  <div className="es-popover-body">
                    {/* Settings Navigation */}
                    {isAnyAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        className={`es-popover-item ${isSettingsActive ? 'es-active' : ''}`}
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate(ROUTES.SETTINGS);
                        }}
                      >
                        <span className="es-popover-icon">
                          <Settings size={18} strokeWidth={1.75} />
                        </span>
                        <span className="es-popover-label">Settings</span>
                        {isSettingsActive && (
                          <span className="es-popover-pill">Active</span>
                        )}
                      </button>
                    )}

                    {/* Theme Toggle */}
                    <button
                      type="button"
                      role="menuitem"
                      className="es-popover-item"
                      onClick={toggleTheme}
                    >
                      <span className="es-popover-icon">
                        {theme === 'dark' ? (
                          <Sun size={18} strokeWidth={1.75} />
                        ) : (
                          <Moon size={18} strokeWidth={1.75} />
                        )}
                      </span>
                      <span className="es-popover-label">Theme</span>
                      <span className="es-popover-badge">
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {/* Auth Action */}
                    {isAnyAdmin ? (
                      <>
                        <div className="es-popover-sep" />
                        <button
                          type="button"
                          role="menuitem"
                          className="es-popover-item es-popover-logout"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <span className="es-popover-icon">
                            <LogOut size={18} strokeWidth={1.75} />
                          </span>
                          <span className="es-popover-label">Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        className="es-popover-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate(ROUTES.LOGIN);
                        }}
                      >
                        <span className="es-popover-icon">
                          <User size={18} strokeWidth={1.75} />
                        </span>
                        <span className="es-popover-label">Sign In</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                ref={userTriggerRef}
                className={`es-row es-user-trigger ${userMenuOpen ? 'es-open' : ''}`}
                id="user-menu-trigger"
                aria-label="User account and settings"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-current={isSettingsActive ? 'page' : undefined}
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                <span className="es-avatar">
                  <span className="es-ico">
                    <User size={22} strokeWidth={1.5} />
                  </span>
                </span>
                <span className="es-label">
                  {isAnyAdmin ? (
                    <>
                      {userName}<small>{userRole}</small>
                    </>
                  ) : (
                    <>
                      Guest<small>Read-only access</small>
                    </>
                  )}
                </span>
                <span className={`es-user-chevron ${userMenuOpen ? 'es-open' : ''}`}>
                  <ChevronUp size={16} strokeWidth={2} />
                </span>
              </button>
            </div>
          </div>
        </nav>
      </aside>
      <main className="es-main">{children}</main>
    </div>
  );
}
