import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Footprints, Menu, House, Activity, TrendingUp, Sun, Moon, User, LogOut, Stethoscope, FileText, Settings, Users } from 'lucide-react';
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
  { to: ROUTES.SETTINGS, label: 'Settings', Icon: Settings, systemAdminOnly: true },
  // SUPER_ADMIN only route (admin management)
  { to: ROUTES.ADMIN_MANAGEMENT, label: 'Admin Management', Icon: Users, superAdminOnly: true },
];

interface EcoSidebarProps {
  children: React.ReactNode;
}

export function EcoSidebar({ children }: EcoSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const capRef = useRef<HTMLElement>(null);

  // Determine user role
  const isSuperAdmin = isAuthenticated && user && user.role === 'SUPER_ADMIN';
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

  // Place notch function - exactly as in reference
  const place = () => {
    const el = capRef.current;
    if (!el) return;
    const a = el.querySelector<HTMLElement>('.es-row[aria-current="page"]');
    if (!a) return;
    el.style.setProperty('--notch-y', a.offsetTop + a.offsetHeight / 2 + 'px');
  };

  // Call place after route changes (layout effect)
  useLayoutEffect(() => {
    place();
  }, [location.pathname, expanded]);

  // Mount effect - exactly as in reference
  useEffect(() => {
    // Read storage after mount
    try {
      const stored = localStorage.getItem('ecostep.sidebar.v2');
      if (stored === 'expanded') {
        setExpanded(true);
      }
    } catch {}

    // Add ready class after two rAFs
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReady(true);
      });
    });

    // Place after fonts ready
    if (document.fonts?.ready) {
      document.fonts.ready.then(place);
    }

    // Place on resize
    window.addEventListener('resize', place);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', place);
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

        <nav className="es-capsule" id="capsule" ref={capRef} aria-label="Main">
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
            
            <button
              className="es-row"
              id="theme"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <span className="es-ico">
                {theme === 'dark' ? (
                  <Sun size={22} strokeWidth={1.5} />
                ) : (
                  <Moon size={22} strokeWidth={1.5} />
                )}
              </span>
              <span className="es-label">Theme</span>
            </button>
            
            {isAnyAdmin && (
              <button
                className="es-row"
                id="logout"
                aria-label="Sign out"
                onClick={handleLogout}
              >
                <span className="es-ico">
                  <LogOut size={22} strokeWidth={1.5} />
                </span>
                <span className="es-label">Sign Out</span>
              </button>
            )}
            
            <div className="es-row es-who" style={{ marginBottom: 0, cursor: 'default' }}>
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
            </div>
          </div>
        </nav>
      </aside>
      <main className="es-main">{children}</main>
    </div>
  );
}
