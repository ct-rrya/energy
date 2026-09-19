import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Settings,
  User,
  ArrowLeft,
  Menu,
  X,
  Activity,
  TrendingUp
} from 'lucide-react';
import Logo from '@/assets/logo/1.svg?react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/components/common/Toast';
import { ROUTES } from '@/routes/routes.config';
import { getUserRole, getUserPermissions, type UserRole } from '@/lib/permissions';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getThemeColors, SPACING, TYPOGRAPHY } from '@/lib/theme';

/**
 * Dashboard Layout Props
 */
interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Professional Collapsible Sidebar Layout
 * Clean, minimal, SaaS-style with account menu
 * Supports both public (unauthenticated) and admin (authenticated) users
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine user role and permissions
  const userRole: UserRole = getUserRole(isAuthenticated, user);
  const permissions = getUserPermissions(isAuthenticated, user);
  const isAdminUser = userRole === 'admin';
  const isPublicUser = userRole === 'public';
  
  // Sidebar collapse state (persisted to localStorage)
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? JSON.parse(saved) : false;
  });

  // Account menu state
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Task 2.1: Mobile Sidebar State Management
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  
  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    if (isDesktop && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop, mobileSidebarOpen]);

  // Task 2.6: Body Scroll Lock for Mobile Sidebar
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  // Task 2.4: Focus Trapping and Keyboard Management for Mobile Sidebar
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes sidebar
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
        hamburgerButtonRef.current?.focus();
        return;
      }

      // Tab key focus trapping
      if (e.key === 'Tab') {
        const sidebar = document.querySelector('.mobile-sidebar');
        if (!sidebar) return;

        const focusableElements = sidebar.querySelectorAll<HTMLElement>(
          'a, button, input, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first interactive element when sidebar opens
    setTimeout(() => {
      const sidebar = document.querySelector('.mobile-sidebar');
      const firstFocusable = sidebar?.querySelector<HTMLElement>(
        'a, button, input, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 50);

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.account-menu-container')) {
        setShowAccountMenu(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccountMenu(false);
      }
    };
    
    if (showAccountMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showAccountMenu]);

  const handleLogout = () => {
    console.log('[LOGOUT] Starting logout process...');
    
    // Clear auth state first
    logout();
    
    console.log('[LOGOUT] After logout() - clearing auth state');
    
    // Show success message
    showToast('Logged out successfully', 'info');
    
    console.log('[LOGOUT] Redirecting to landing page...');
    
    // Use window.location to force full page reload and bypass ProtectedRoute race condition
    window.location.href = '/';
  };

  const isActivePath = (path: string) => location.pathname === path;

const navigationItems = [
  // Back to Home button - only for public users
  ...(isPublicUser ? [{
    path: ROUTES.HOME,
    label: 'Back to Home',
    icon: ArrowLeft,
    visible: true,
    isBackButton: true
  }] : []),
  
  // EcoStep Central - the single central monitoring hub (combines Dashboard + Energy Monitoring)
  {
    path: ROUTES.DASHBOARD,
    label: 'EcoStep Central',
    icon: Activity,
    visible: permissions.canAccessDashboard
  },
  
  // Historical Analytics - past data and trends
  {
    path: ROUTES.ANALYTICS,
    label: 'Historical Analytics',
    icon: TrendingUp,
    visible: true // Public access per requirements
  },
  
  // System Diagnostics - admin only
  ...(isAdminUser ? [{
    path: ROUTES.ADMIN_DIAGNOSTICS,
    label: 'System Diagnostics',
    icon: Activity,
    visible: permissions.canAccessReports // Using as proxy for admin-only
  }] : []),
  
  // Reports - admin only
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: FileText,
    visible: permissions.canAccessReports
  },
  
  // Settings - admin only
  {
    path: ROUTES.SETTINGS,
    label: 'Settings',
    icon: Settings,
    visible: permissions.canAccessSettings
  },
].filter(item => item.visible);

  const colors = getThemeColors(theme);
  const sidebarWidth = isExpanded ? SPACING.sidebarWidth.expanded : SPACING.sidebarWidth.collapsed;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: colors.pageBackground
      }}
    >
      {/* Task 10.3: Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          border: `3px solid ${colors.accent}`,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          fontSize: TYPOGRAPHY.fontSize.sm
        }}
      >
        Skip to main content
      </a>

      {/* Task 2.2: Mobile Hamburger Menu Button */}
      {!isDesktop && (
        <button
          ref={hamburgerButtonRef}
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{
            backgroundColor: colors.sidebarBackground,
            color: colors.textPrimary
          }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" strokeWidth={2} />
        </button>
      )}

      {/* Task 2.3: Mobile Sidebar Overlay */}
      {!isDesktop && mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setMobileSidebarOpen(false);
              hamburgerButtonRef.current?.focus();
            }}
            aria-hidden="true"
          />
          
          {/* Mobile Sidebar */}
          <aside 
            className={`mobile-sidebar fixed left-0 top-0 bottom-0 z-50 flex flex-col py-6 w-64 ${
              prefersReducedMotion ? '' : 'transform transition-transform duration-300'
            }`}
            style={{
              backgroundColor: colors.sidebarBackground,
              borderTopRightRadius: '20px',
              borderBottomRightRadius: '20px',
              boxShadow: colors.shadowLg
            }}
          >
            {/* Close Button */}
            <div className="flex items-center justify-between px-4 mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center p-2 flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent} 100%)`,
                    color: '#FFFFFF'
                  }}
                >
                  <Logo className="h-full w-full" />
                </div>
                <span 
                  className="text-sm font-semibold" 
                  style={{ 
                    color: colors.textPrimary,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold
                  }}
                >
                  EcoStep
                </span>
              </div>
              
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  hamburgerButtonRef.current?.focus();
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5 flex-shrink-0"
                style={{ color: colors.navIconInactive }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Role Indicator Badge - Non-clickable status indicator */}
            <div className="px-4 mb-5">
              <div 
                className="px-3 py-2 rounded-lg text-xs font-semibold text-center tracking-wide uppercase"
                style={{
                  backgroundColor: isAdminUser 
                    ? colors.accentSubtle
                    : 'rgba(168, 85, 247, 0.1)',
                  color: isAdminUser ? colors.accent : '#C084FC',
                  border: `1px solid ${isAdminUser ? colors.accent + '30' : 'rgba(168, 85, 247, 0.2)'}`,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  fontSize: TYPOGRAPHY.fontSize.xs
                }}
                role="status"
                aria-label={`Current role: ${isAdminUser ? 'Administrator' : 'Public Viewer'}`}
              >
                {isAdminUser ? 'Administrator' : 'Public Viewer'}
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col gap-1 px-3">
              {navigationItems.map(({ path, label, icon: Icon }) => {
                const isActive = isActivePath(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      hamburgerButtonRef.current?.focus();
                    }}
                    className="group relative flex items-center gap-3 rounded-lg transition-all duration-200 px-4 py-3"
                    style={{
                      backgroundColor: isActive ? colors.activeBackground : 'transparent',
                      color: isActive ? colors.navTextActive : colors.navText,
                      height: `${SPACING.navItem.height}px`
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                    <span 
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ fontWeight: isActive ? TYPOGRAPHY.fontWeight.semibold : TYPOGRAPHY.fontWeight.medium }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Account Section */}
            <div className="px-3 pt-4 border-t" style={{ borderColor: colors.border }}>
              {isPublicUser ? (
                /* PUBLIC USER - Guest Mode Indicator */
                <div className="relative w-full flex items-center gap-3 rounded-lg px-4 py-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: colors.inputBackground,
                      color: colors.textSecondary
                    }}
                  >
                    <span className="text-lg">???</span>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div 
                      className="text-sm font-medium" 
                      style={{ 
                        color: colors.textSecondary,
                        fontWeight: TYPOGRAPHY.fontWeight.medium 
                      }}
                    >
                      Guest Mode
                    </div>
                    <div 
                      className="text-xs" 
                      style={{ 
                        color: colors.textTertiary,
                        fontSize: TYPOGRAPHY.fontSize.xs 
                      }}
                    >
                      Read-only access
                    </div>
                  </div>
                </div>
              ) : (
                /* ADMIN USER - Show Logout Button */
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-500/10"
                  style={{ color: colors.error }}
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                  <span 
                    className="text-sm font-medium"
                    style={{ fontWeight: TYPOGRAPHY.fontWeight.medium }}
                  >
                    Logout
                  </span>
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* COLLAPSIBLE FLOATING SIDEBAR - Desktop Only */}
      {isDesktop && (
        <aside 
          className="fixed left-6 top-6 bottom-6 z-50 flex flex-col py-6 transition-all duration-250"
          style={{
            width: `${sidebarWidth}px`,
            backgroundColor: colors.sidebarBackground,
            borderRadius: '20px',
            boxShadow: colors.shadowLg
          }}
        >
        {/* Logo + Toggle Button */}
        <div className="flex items-center justify-between px-4 mb-6">
          {isExpanded ? (
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center p-2 flex-shrink-0"
                style={{
                  background: colors.accent,
                  color: '#FFFFFF'
                }}
              >
                <Logo className="h-full w-full" />
              </div>
              <span 
                className="text-sm font-semibold" 
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold
                }}
              >
                EcoStep
              </span>
            </div>
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center p-2 mx-auto"
              style={{
                background: colors.accent,
                color: '#FFFFFF'
              }}
            >
              <Logo className="h-full w-full" />
            </div>
          )}
          
          {/* Toggle Button (only show when expanded) */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5 flex-shrink-0"
              style={{ color: colors.navIconInactive }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Role Indicator Badge - Non-clickable status indicator */}
        {isExpanded && (
          <div className="px-4 mb-5">
            <div 
              className="px-3 py-2 rounded-lg text-xs font-semibold text-center tracking-wide uppercase"
              style={{
                backgroundColor: isAdminUser 
                  ? colors.accentSubtle
                  : 'rgba(168, 85, 247, 0.1)',
                color: isAdminUser ? colors.accent : '#C084FC',
                border: `1px solid ${isAdminUser ? colors.accent + '30' : 'rgba(168, 85, 247, 0.2)'}`,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}
              role="status"
              aria-label={`Current role: ${isAdminUser ? 'Administrator' : 'Public Viewer'}`}
            >
              {isAdminUser ? 'Administrator' : 'Public Viewer'}
            </div>
          </div>
        )}
        
        {!isExpanded && (
          <div className="px-3 mb-5">
            <div 
              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: isAdminUser 
                  ? colors.accentSubtle
                  : 'rgba(168, 85, 247, 0.1)',
                color: isAdminUser ? colors.accent : '#C084FC',
                border: `1px solid ${isAdminUser ? colors.accent + '30' : 'rgba(168, 85, 247, 0.2)'}`,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}
              role="status"
              aria-label={`Current role: ${isAdminUser ? 'Administrator' : 'Public Viewer'}`}
              title={isAdminUser ? 'Administrator' : 'Public Viewer'}
            >
              {isAdminUser ? 'A' : 'P'}
            </div>
          </div>
        )}

        {/* Expand Button (only show when collapsed) */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-10 h-10 mx-auto mb-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5"
            style={{ color: colors.navIconInactive }}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navigationItems.map(({ path, label, icon: Icon }) => {
            const isActive = isActivePath(path);
            return (
              <Link
                key={path}
                to={path}
                className={`group relative flex items-center gap-3 rounded-lg transition-all duration-200 ${
                  isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
                }`}
                style={{
                  backgroundColor: isActive ? colors.activeBackground : 'transparent',
                  color: isActive ? colors.navTextActive : colors.navText,
                  height: !isExpanded ? `${SPACING.navItem.height}px` : 'auto'
                }}
                title={!isExpanded ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                
                {isExpanded && (
                  <span 
                    className="text-sm font-medium whitespace-nowrap"
                    style={{ fontWeight: isActive ? TYPOGRAPHY.fontWeight.semibold : TYPOGRAPHY.fontWeight.medium }}
                  >
                    {label}
                  </span>
                )}
                
                {/* Tooltip for collapsed mode */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                    style={{
                      backgroundColor: colors.elevatedBackground,
                      color: colors.textPrimary,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontWeight: TYPOGRAPHY.fontWeight.medium,
                      boxShadow: colors.shadowLg
                    }}
                  >
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Account Section with Menu - Different for public vs admin */}
        <div className="px-3 pt-4 border-t account-menu-container relative" style={{ borderColor: '#2A2E37' }}>
          {isPublicUser ? (
            /* PUBLIC USER - Guest Mode Indicator */
            <div
              className={`relative w-full flex items-center gap-3 rounded-xl ${
                isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: theme === 'light' ? '#E5E7EB' : '#2A2E37',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              >
                <span className="text-lg">???</span>
              </div>
              
              {isExpanded && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                    Guest Mode
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    Read-only access
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ADMIN USER - Show Account Menu */
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAccountMenu(!showAccountMenu);
              }}
              className={`relative w-full flex items-center gap-3 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
              }`}
            >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{
                background: colors.accent,
                color: '#FFFFFF',
                fontWeight: TYPOGRAPHY.fontWeight.semibold
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            
            {isExpanded && (
              <div className="flex-1 text-left overflow-hidden">
                <div 
                  className="text-sm font-medium truncate" 
                  style={{ 
                    color: colors.textPrimary,
                    fontWeight: TYPOGRAPHY.fontWeight.medium
                  }}
                >
                  {user?.name}
                </div>
                <div 
                  className="text-xs truncate" 
                  style={{ 
                    color: colors.textSecondary,
                    fontSize: TYPOGRAPHY.fontSize.xs
                  }}
                >
                  {user?.email}
                </div>
              </div>
            )}
            </button>
          )}

          {/* Account Menu Popover - Only for admin users */}
          {isAdminUser && showAccountMenu && (
            <div 
              className="fixed rounded-xl p-2 min-w-[200px] z-[100]"
              style={{
                backgroundColor: colors.elevatedBackground,
                boxShadow: colors.shadowLg,
                border: `1px solid ${colors.border}`,
                left: isExpanded ? `${24 + 12}px` : `${24 + sidebarWidth + 8}px`,
                bottom: '32px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile */}
              <button
                onClick={() => {
                  navigate(ROUTES.PROFILE);
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.medium
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBackground}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  navigate(ROUTES.SETTINGS);
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.medium
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBackground}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Settings</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.medium
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBackground}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm">Light Mode</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="my-2 h-px" style={{ backgroundColor: colors.border }} />

              {/* Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{ 
                  color: colors.error,
                  fontWeight: TYPOGRAPHY.fontWeight.medium
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
        </aside>
      )}

      {/* Task 2.5: MAIN CONTENT AREA - Responsive margin logic */}
      {/* Task 10.3: Added id and tabIndex for skip link navigation */}
      <main 
        id="main-content"
        tabIndex={-1}
        className="min-h-screen transition-all duration-250 p-4 sm:p-6 lg:p-8"
        style={isDesktop ? {
          '--sidebar-width': `${sidebarWidth}px`,
          marginLeft: 'calc(var(--sidebar-width) + 48px)'
        } as React.CSSProperties : {}}
      >
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}