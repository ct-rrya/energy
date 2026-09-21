import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      className="border-b dark:bg-[#1C1F28] dark:border-[rgba(137,215,183,0.12)]" 
      style={{ 
        borderColor: 'rgba(26, 49, 44, 0.08)',
        backgroundColor: '#FFFFFF'
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
                '--tw-ring-color': '#89D7B7' 
              } as React.CSSProperties}
              aria-label="EcoStep home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
                <Logo className="h-full w-full" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold dark:text-[#F9FAFB]" style={{ color: '#1A312C' }}>EcoStep</h1>
                <p className="text-xs dark:text-[#9CA3AF]" style={{ color: '#428475' }}>Energy Monitoring System</p>
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
                  ? 'nav-link-active text-white dark:text-white' 
                  : 'nav-link-inactive text-[#1A312C] dark:text-[#F9FAFB]'
                }
              `}
              style={{
                backgroundColor: isActivePath(ROUTES.HOME) ? '#428475' : 'transparent',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label="Navigate to home page"
              aria-current={isActivePath(ROUTES.HOME) ? 'page' : undefined}
            >
              Home
            </button>

            {/* Dashboard Link */}
            <button
              onClick={() => handleNavigate(ROUTES.DASHBOARD)}
              className={`
                nav-link
                rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.DASHBOARD) 
                  ? 'nav-link-active text-white dark:text-white' 
                  : 'nav-link-inactive text-[#1A312C] dark:text-[#F9FAFB]'
                }
              `}
              style={{
                backgroundColor: isActivePath(ROUTES.DASHBOARD) ? '#428475' : 'transparent',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label={isAuthenticated ? "Navigate to dashboard" : "Navigate to login to access dashboard"}
              aria-current={isActivePath(ROUTES.DASHBOARD) ? 'page' : undefined}
            >
              Dashboard
            </button>

            {/* Login/User Button */}
            {isAuthenticated && user ? (
              <div 
                className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white border"
                style={{
                  backgroundColor: '#3DDC97',
                  borderColor: 'rgba(61, 220, 151, 0.2)',
                }}
                role="img"
                aria-label={`User: ${user.name || user.email}`}
                title={user.name || user.email}
              >
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="ml-2 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-[#35c27b]"
                style={{ 
                  backgroundColor: '#3DDC97',
                  '--tw-ring-color': '#89D7B7'
                } as React.CSSProperties}
                aria-label="Login to your account"
              >
                Login
              </button>
            )}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="ml-2 flex items-center justify-center rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border dark:border-[rgba(137,215,183,0.12)] hover:bg-[rgba(66,132,117,0.15)] dark:hover:bg-[rgba(137,215,183,0.1)]"
              style={{
                color: '#1A312C',
                backgroundColor: 'rgba(66, 132, 117, 0.08)',
                borderColor: 'rgba(26, 49, 44, 0.12)',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5 text-[#F9FAFB]" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 md:hidden hover:bg-[rgba(66,132,117,0.1)] dark:hover:bg-[rgba(137,215,183,0.1)]"
            style={{
              color: '#1A312C',
              '--tw-ring-color': '#89D7B7'
            } as React.CSSProperties}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              // Close icon
              <svg 
                className="h-6 w-6 dark:text-[#F9FAFB]" 
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
                className="h-6 w-6 dark:text-[#F9FAFB]" 
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
            className="mt-4 flex flex-col gap-2 border-t pt-4 md:hidden dark:border-[rgba(137,215,183,0.12)]"
            style={{ borderColor: 'rgba(26, 49, 44, 0.1)' }}
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
                  ? 'text-white dark:text-white' 
                  : 'text-[#1A312C] dark:text-[#F9FAFB]'
                }
              `}
              style={{
                backgroundColor: isActivePath(ROUTES.HOME) ? '#428475' : 'transparent',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label="Navigate to home page"
              aria-current={isActivePath(ROUTES.HOME) ? 'page' : undefined}
            >
              Home
            </button>

            {/* Dashboard Link */}
            <button
              onClick={() => handleNavigate(ROUTES.DASHBOARD)}
              className={`
                nav-link-mobile
                rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActivePath(ROUTES.DASHBOARD) 
                  ? 'text-white dark:text-white' 
                  : 'text-[#1A312C] dark:text-[#F9FAFB]'
                }
              `}
              style={{
                backgroundColor: isActivePath(ROUTES.DASHBOARD) ? '#428475' : 'transparent',
                '--tw-ring-color': '#89D7B7'
              } as React.CSSProperties}
              aria-label={isAuthenticated ? "Navigate to dashboard" : "Navigate to login to access dashboard"}
              aria-current={isActivePath(ROUTES.DASHBOARD) ? 'page' : undefined}
            >
              Dashboard
            </button>

            {/* Login/User Info */}
            {isAuthenticated && user ? (
              <div 
                className="flex items-center gap-3 rounded-lg px-4 py-3 border dark:border-[rgba(137,215,183,0.12)]"
                style={{ 
                  backgroundColor: 'rgba(61, 220, 151, 0.05)',
                  borderColor: 'rgba(61, 220, 151, 0.15)'
                }}
              >
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white border"
                  style={{
                    backgroundColor: '#3DDC97',
                    borderColor: 'rgba(61, 220, 151, 0.2)',
                  }}
                  role="img"
                  aria-label={`User: ${user.name || user.email}`}
                >
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-[#F9FAFB]" style={{ color: '#1A312C' }}>
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs dark:text-[#9CA3AF]" style={{ color: '#428475' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate(ROUTES.LOGIN);
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-[#35c27b]"
                style={{ 
                  backgroundColor: '#3DDC97',
                  '--tw-ring-color': '#89D7B7'
                } as React.CSSProperties}
                aria-label="Login to your account"
              >
                Login
              </button>
            )}
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
