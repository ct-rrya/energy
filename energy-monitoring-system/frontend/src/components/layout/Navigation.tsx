import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Shield, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import Logo from '@/assets/logo/1.svg?react';
import { ROUTES } from '@/routes/routes.config';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Navigation Component
 * 
 * Main navigation bar for EcoStep application with production-grade styling
 * 
 * Design Refinements (Task 18.2):
 * - Flat colors for active/hover states (no gradients)
 * - No transform: scale effects on hover (Req 9.3)
 * - Visible focus states with outline/border (Req 17.3)
 * - Consistent typography (font-weight: 600)
 * - EcoStep green used sparingly for primary actions only
 * 
 * Requirements: 
 * - 9.3: No transform effects on button/nav hover
 * - 17.3: Visible focus states (outline or border)
 * - 12.1: Consistent EcoStep design system colors
 * - 18.1: ARIA labels for all interactive elements
 * - 18.2: Keyboard navigation support
 */
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchAdministrator } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActivePath = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
  // Navigate directly without authentication check
  // Dashboard is now public-accessible with limited features for non-authenticated users
  navigate(path);
  // Close mobile menu after navigation
  setIsMobileMenuOpen(false);
};


  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('nav') && !target.closest('[aria-label="Toggle menu"]')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header 
      className="border-b bg-[#0B132B] dark:bg-[#0B132B]" 
      style={{ 
        borderColor: 'rgba(57, 255, 136, 0.12)',
      }}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <Link 
              to={ROUTES.HOME} 
              className="flex items-center gap-3 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:rounded-lg"
              style={{ 
                '--tw-ring-color': '#39FF88' 
              } as React.CSSProperties}
              aria-label="EcoStep home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
                <Logo className="h-full w-full" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#F5F7FA]">EcoStep</h1>
                <p className="text-xs text-[#39FF88]">Energy Monitoring System</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav 
            className="hidden items-center gap-2 md:flex"
            aria-label="Main navigation"
            role="navigation"
          >
            {/* Home Link */}
            <button
              onClick={() => handleNavigate(ROUTES.HOME)}
              className={`
                nav-link
                rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.HOME) 
                  ? 'nav-link-active text-[#0B132B] bg-[#39FF88]' 
                  : 'nav-link-inactive text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                }
              `}
              style={{
                '--tw-ring-color': '#39FF88'
              } as React.CSSProperties}
              aria-label="Navigate to home page"
              aria-current={isActivePath(ROUTES.HOME) ? 'page' : undefined}
            >
              Home
            </button>

            {/* Monitoring Link (was EcoStep Central) */}
            <button
              onClick={() => handleNavigate(ROUTES.DASHBOARD)}
              className={`
                nav-link
                rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.DASHBOARD) 
                  ? 'nav-link-active text-[#0B132B] bg-[#39FF88]' 
                  : 'nav-link-inactive text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                }
              `}
              style={{
                '--tw-ring-color': '#39FF88'
              } as React.CSSProperties}
              aria-label="Navigate to monitoring dashboard"
              aria-current={isActivePath(ROUTES.DASHBOARD) ? 'page' : undefined}
            >
              Monitoring
            </button>

            {/* Admin Management (SUPER_ADMIN only) */}
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => handleNavigate(ROUTES.ADMIN_MANAGEMENT)}
                className={`
                  nav-link
                  rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isActivePath(ROUTES.ADMIN_MANAGEMENT) 
                    ? 'nav-link-active text-[#0B132B] bg-[#39FF88]' 
                    : 'nav-link-inactive text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                  }
                `}
                style={{
                  '--tw-ring-color': '#39FF88'
                } as React.CSSProperties}
                aria-label="Navigate to administrator management"
                aria-current={isActivePath(ROUTES.ADMIN_MANAGEMENT) ? 'page' : undefined}
              >
                Admin Management
              </button>
            )}
            {/* Login / Admin Identity */}
            {!isAuthenticated ? (
              <button
                onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
                className="ml-2 rounded-lg px-6 py-2 text-sm font-semibold text-[#0B132B] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-[#2FD670]"
                style={{ 
                  backgroundColor: '#39FF88',
                  '--tw-ring-color': '#39FF88',
                  boxShadow: '0 2px 8px rgba(57, 255, 136, 0.3)'
                } as React.CSSProperties}
                aria-label="Administrator login"
              >
                Admin Login
              </button>
            ) : (
              <div className="ml-2 relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-[rgba(57,255,136,0.1)]"
                  style={{
                    backgroundColor: 'rgba(57, 255, 136, 0.08)',
                    borderColor: 'rgba(57, 255, 136, 0.15)',
                    '--tw-ring-color': '#39FF88'
                  } as React.CSSProperties}
                  aria-label="User menu"
                >
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-[#0B132B]"
                    style={{ backgroundColor: '#39FF88' }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#F5F7FA]">
                      {user?.name || 'Administrator'}
                    </p>
                    <div className="flex items-center gap-1">
                      {user?.role === 'SUPER_ADMIN' ? (
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                      ) : user?.role === 'SYSTEM_ADMIN' ? (
                        <Shield className="w-3 h-3 text-blue-400" />
                      ) : null}
                      <p className="text-xs text-gray-400">
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN') && (
                        <>
                          <button
                            onClick={() => {
                              switchAdministrator();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Switch Administrator
                          </button>
                          <div className="border-t border-gray-200 my-1" />
                        </>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="ml-2 flex items-center justify-center rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border hover:bg-[rgba(57,255,136,0.15)]"
              style={{
                color: '#F5F7FA',
                backgroundColor: 'rgba(57, 255, 136, 0.08)',
                borderColor: 'rgba(57, 255, 136, 0.15)',
                '--tw-ring-color': '#39FF88'
              } as React.CSSProperties}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5 text-[#39FF88]" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 md:hidden hover:bg-[rgba(57,255,136,0.1)]"
            style={{
              color: '#F5F7FA',
              '--tw-ring-color': '#39FF88'
            } as React.CSSProperties}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              // Close icon
              <svg 
                className="h-6 w-6 text-[#F5F7FA]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg 
                className="h-6 w-6 text-[#F5F7FA]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="mt-4 flex flex-col gap-2 border-t pt-4 md:hidden"
            style={{ borderColor: 'rgba(57, 255, 136, 0.12)' }}
            aria-label="Mobile navigation"
            role="navigation"
          >
            {/* Home Link */}
            <button
              onClick={() => handleNavigate(ROUTES.HOME)}
              className={`
                nav-link-mobile
                rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.HOME) 
                  ? 'text-[#0B132B] bg-[#39FF88]' 
                  : 'text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                }
              `}
              style={{
                '--tw-ring-color': '#39FF88'
              } as React.CSSProperties}
              aria-label="Navigate to home page"
              aria-current={isActivePath(ROUTES.HOME) ? 'page' : undefined}
            >
              Home
            </button>

            {/* Monitoring Link (was EcoStep Central) */}
            <button
              onClick={() => handleNavigate(ROUTES.DASHBOARD)}
              className={`
                nav-link-mobile
                rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.DASHBOARD) 
                  ? 'text-[#0B132B] bg-[#39FF88]' 
                  : 'text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                }
              `}
              style={{
                '--tw-ring-color': '#39FF88'
              } as React.CSSProperties}
              aria-label="Navigate to monitoring dashboard"
              aria-current={isActivePath(ROUTES.DASHBOARD) ? 'page' : undefined}
            >
              Monitoring
            </button>

            {/* Admin Management (SUPER_ADMIN only) */}
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => handleNavigate(ROUTES.ADMIN_MANAGEMENT)}
                className={`
                  nav-link-mobile
                  rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isActivePath(ROUTES.ADMIN_MANAGEMENT) 
                    ? 'text-[#0B132B] bg-[#39FF88]' 
                    : 'text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)]'
                  }
                `}
                style={{
                  '--tw-ring-color': '#39FF88'
                } as React.CSSProperties}
                aria-label="Navigate to administrator management"
                aria-current={isActivePath(ROUTES.ADMIN_MANAGEMENT) ? 'page' : undefined}
              >
                Admin Management
              </button>
            )}
            {/* Login/User Info */}
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  navigate(ROUTES.ADMIN_LOGIN);
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: '#39FF88',
                  color: '#0B132B',
                  '--tw-ring-color': '#39FF88',
                  boxShadow: '0 2px 8px rgba(57, 255, 136, 0.3)'
                } as React.CSSProperties}
                aria-label="Administrator login"
              >
                Admin Login
              </button>
            ) : user ? (
              <div className="space-y-2">
                <div 
                  className="flex items-center gap-3 rounded-lg px-4 py-3 border"
                  style={{ 
                    backgroundColor: 'rgba(57, 255, 136, 0.08)',
                    borderColor: 'rgba(57, 255, 136, 0.15)'
                  }}
                >
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-[#0B132B]"
                    style={{ backgroundColor: '#39FF88' }}
                  >
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F5F7FA]">
                      {user.name || 'Administrator'}
                    </p>
                    <div className="flex items-center gap-1">
                      {user.role === 'SUPER_ADMIN' ? (
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                      ) : user.role === 'SYSTEM_ADMIN' ? (
                        <Shield className="w-3 h-3 text-blue-400" />
                      ) : null}
                      <p className="text-xs text-gray-400">
                        {user.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                {(user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') && (
                  <button
                    onClick={() => {
                      switchAdministrator();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold text-[#F5F7FA] hover:bg-[rgba(57,255,136,0.1)] transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Switch Administrator
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-400 hover:bg-red-900/20 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : null}
            {/* Theme Toggle Button - Mobile */}
            <button
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-3 border dark:border-[rgba(137,215,183,0.12)] hover:bg-[rgba(66,132,117,0.15)] dark:hover:bg-[rgba(137,215,183,0.1)]"
              style={{
                color: '#1A312C',
                backgroundColor: 'rgba(66, 132, 117, 0.08)',
                borderColor: 'rgba(26, 49, 44, 0.12)',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 text-[#F9FAFB]" />
                  <span className="text-[#F9FAFB]">Light Mode</span>
                </>
              )}
            </button>

          </nav>
        )}
      </div>
    </header>
  );
}
