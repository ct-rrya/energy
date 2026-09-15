import { type ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Settings,
  User,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import Logo from '@/assets/logo/1.svg?react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/components/common/Toast';
import { ROUTES } from '@/routes/routes.config';
import { getUserRole, getUserPermissions, type UserRole } from '@/lib/permissions';

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
  // Dashboard - always visible
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
    visible: permissions.canAccessDashboard
  },
  // Analytics - only for admin users
  ...(isAdminUser ? [{
    path: ROUTES.ANALYTICS,
    label: 'Analytics',
    icon: BarChart3,
    visible: permissions.canAccessAnalytics
  }] : []),
  // Admin-only items
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: FileText,
    visible: permissions.canAccessReports
  },
  {
    path: ROUTES.ALERTS,
    label: 'Notifications',
    icon: Bell,
    visible: permissions.canAccessAlerts
  },
  {
    path: ROUTES.SETTINGS,
    label: 'Settings',
    icon: Settings,
    visible: permissions.canAccessSettings
  },
].filter(item => item.visible);

  const sidebarWidth = isExpanded ? 200 : 64;
  const sidebarBg = theme === 'light' ? '#1E2128' : '#0B0D12';
  const accentColor = theme === 'light' ? '#2FBF71' : '#3ED98A';

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme === 'light' ? '#F5F6F8' : '#12141A'
      }}
    >
      {/* COLLAPSIBLE FLOATING SIDEBAR */}
      <aside 
        className="fixed left-6 top-6 bottom-6 z-50 flex flex-col py-6 transition-all duration-250"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: sidebarBg,
          borderRadius: '32px',
          boxShadow: theme === 'light' 
            ? '0 4px 20px rgba(0,0,0,0.08)' 
            : '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* Logo + Toggle Button */}
        <div className="flex items-center justify-between px-4 mb-6">
          {isExpanded ? (
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center p-2 flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, #3ED98A 100%)`,
                  color: '#FFFFFF'
                }}
              >
                <Logo className="h-full w-full" />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#EDEEF0' }}>
                EcoStep
              </span>
            </div>
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center p-2 mx-auto"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, #3ED98A 100%)`,
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
              style={{ color: '#9CA3AF' }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Role Indicator Badge */}
        {isExpanded && (
          <div className="px-4 mb-6">
            <div 
              className="px-3 py-2 rounded-lg text-xs font-medium text-center"
              style={{
                backgroundColor: isAdminUser 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(168, 85, 247, 0.1)',
                color: isAdminUser ? '#60A5FA' : '#C084FC',
                border: `1px solid ${isAdminUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`
              }}
              role="status"
              aria-label={`Current role: ${isAdminUser ? 'Admin' : 'Public Viewer'}`}
            >
              {isAdminUser ? '👤 Admin Access' : '👁️ Public View'}
            </div>
          </div>
        )}
        
        {!isExpanded && (
          <div className="px-3 mb-6">
            <div 
              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-lg"
              style={{
                backgroundColor: isAdminUser 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(168, 85, 247, 0.1)',
                border: `1px solid ${isAdminUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`
              }}
              role="status"
              aria-label={`Current role: ${isAdminUser ? 'Admin' : 'Public Viewer'}`}
              title={isAdminUser ? 'Admin Access' : 'Public View'}
            >
              {isAdminUser ? '👤' : '👁️'}
            </div>
          </div>
        )}

        {/* Expand Button (only show when collapsed) */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-10 h-10 mx-auto mb-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5"
            style={{ color: '#9CA3AF' }}
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
                className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
                  isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
                }`}
                style={{
                  backgroundColor: isActive ? accentColor : 'transparent',
                  color: isActive ? '#FFFFFF' : '#9CA3AF'
                }}
                title={!isExpanded ? label : undefined}
              >
                <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {label}
                  </span>
                )}
                
                {/* Tooltip for collapsed mode */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                    style={{
                      backgroundColor: theme === 'light' ? '#1A1D23' : '#EDEEF0',
                      color: theme === 'light' ? '#EDEEF0' : '#1A1D23',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle - Always visible in navigation */}
        <div className="px-3 pb-4">
          <button
            onClick={toggleTheme}
            className={`group relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-white/5 ${
              isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
            }`}
            style={{ color: '#9CA3AF' }}
            title={!isExpanded ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    Dark Mode
                  </span>
                )}
              </>
            ) : (
              <>
                <Sun className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    Light Mode
                  </span>
                )}
              </>
            )}
            
            {/* Tooltip for collapsed mode */}
            {!isExpanded && (
              <div className="absolute left-full ml-4 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                style={{
                  backgroundColor: theme === 'light' ? '#1A1D23' : '#EDEEF0',
                  color: theme === 'light' ? '#EDEEF0' : '#1A1D23',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </div>
            )}
          </button>
        </div>

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
                <span className="text-lg">👁️</span>
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
              className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-white/5 ${
                isExpanded ? 'px-4 py-3' : 'p-3 justify-center'
              }`}
            >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, #3ED98A 100%)`,
                color: '#FFFFFF'
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            
            {isExpanded && (
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-sm font-medium truncate" style={{ color: '#EDEEF0' }}>
                  {user?.name}
                </div>
                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                  {user?.email}
                </div>
              </div>
            )}
            </button>
          )}

          {/* Account Menu Popover - Only for admin users */}
          {isAdminUser && showAccountMenu && (
            <div 
              className="fixed rounded-2xl p-2 min-w-[200px] z-[100]"
              style={{
                backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
                boxShadow: theme === 'light' 
                  ? '0 8px 30px rgba(0,0,0,0.12)' 
                  : '0 8px 30px rgba(0,0,0,0.5)',
                // Position to the right of sidebar in collapsed mode, above in expanded mode
                left: isExpanded ? `${24 + 12}px` : `${24 + sidebarWidth + 8}px`, // sidebar margin + sidebar width + gap
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: theme === 'light' ? '#1A1D23' : '#EDEEF0' }}
              >
                <User className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  navigate(ROUTES.SETTINGS);
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: theme === 'light' ? '#1A1D23' : '#EDEEF0' }}
              >
                <Settings className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">Settings</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: theme === 'light' ? '#1A1D23' : '#EDEEF0' }}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">Light Mode</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="my-2 h-px" style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#2A2E37' }} />

              {/* Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-500/10"
                style={{ color: '#EF4444' }}
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Dynamic offset based on sidebar width */}
      <main 
        className="min-h-screen transition-all duration-250"
        style={{
          marginLeft: `${sidebarWidth + 48}px` // sidebar width + 24px margin on each side
        }}
      >
        {children}
      </main>
    </div>
  );
}