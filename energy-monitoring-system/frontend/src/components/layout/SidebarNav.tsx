import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Footprints,
  House,
  Activity,
  TrendingUp,
  Menu,
  Sun,
  Moon,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLiquidNotch } from '@/hooks/useLiquidNotch';
import { ROUTES } from '@/routes/routes.config';
import { showToast } from '@/components/common/Toast';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface SidebarNavProps {
  isAdmin: boolean;
  userName?: string;
  userRole?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', path: ROUTES.HOME, label: 'Home', icon: House },
  { id: 'dashboard', path: ROUTES.DASHBOARD, label: 'EcoStep Central', icon: Activity },
  { id: 'analytics', path: ROUTES.ANALYTICS, label: 'Historical Analytics', icon: TrendingUp },
];

// Geometry constants
const RAIL_WIDTH_COLLAPSED = 80;
const RAIL_WIDTH_EXPANDED = 264;
const ASIDE_WIDTH_COLLAPSED = 112; // 80px rail + 32px padding
const ASIDE_WIDTH_EXPANDED = 296; // 264px rail + 32px padding

const CIRCLE_DIAMETER = 54;
const CIRCLE_RADIUS = 27;
const NOTCH_X_COLLAPSED = 55; // 15px right of rail center in collapsed
const MASK_RADIUS = 35; // Hole radius (27px circle + 8px ring)
const RING_WIDTH = 8;

/**
 * SidebarNav Component
 * 
 * Floating capsule sidebar with liquid notch indicator.
 * Healthcare-inspired dark rail design with smooth transitions.
 */
export function SidebarNav({ isAdmin, userName }: SidebarNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  const navListRef = useRef<HTMLDivElement>(null);

  // Initialize collapsed, then apply stored value after mount to avoid hydration mismatch
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Liquid notch hook
  const { notchPosition, isTransitioning, navRef, registerItemRef } = useLiquidNotch(
    NAV_ITEMS,
    isExpanded
  );

  // Track scroll offset for notch positioning
  const [scrollTop, setScrollTop] = useState(0);

  // Apply stored state after mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('ecostep.sidebar.v2');
      if (stored === 'expanded' || stored === 'collapsed') {
        setIsExpanded(stored === 'expanded');
      }
    } catch (e) {
      // Invalid storage, stay collapsed
    }
  }, []);

  // Persist collapse state
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      localStorage.setItem('ecostep.sidebar.v2', isExpanded ? 'expanded' : 'collapsed');
    } catch (e) {
      // Storage failed, continue
    }
    
    document.documentElement.style.setProperty(
      '--side-w',
      isExpanded ? `${ASIDE_WIDTH_EXPANDED}px` : `${ASIDE_WIDTH_COLLAPSED}px`
    );
  }, [isExpanded, isMounted]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Handle nav list scroll
  useEffect(() => {
    const listEl = navListRef.current;
    if (!listEl) return;

    const handleScroll = () => {
      setScrollTop(listEl.scrollTop);
    };

    listEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => listEl.removeEventListener('scroll', handleScroll);
  }, []);

  // DEV-ONLY: Verify active icon alignment with notch circle/pill
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    if (!isDev) return;
    if (!notchPosition || !isMounted) return;

    const checkAlignment = () => {
      // Find active link and its icon wrapper
      const activeLink = document.querySelector('[aria-current="page"]');
      if (!activeLink) return;

      const iconWrapper = activeLink.querySelector('div[style*="left"]') as HTMLElement;
      const pillElement = document.querySelector('[style*="left: 28px"]') as HTMLElement; // Green pill

      if (!iconWrapper || !pillElement) return;

      const iconRect = iconWrapper.getBoundingClientRect();
      const pillRect = pillElement.getBoundingClientRect();

      // Icon center
      const iconCenterX = iconRect.left + iconRect.width / 2;
      const iconCenterY = iconRect.top + iconRect.height / 2;

      // Pill/circle center (for collapsed: circle center, for expanded: left round end center)
      const pillCenterX = isExpanded 
        ? pillRect.left + CIRCLE_RADIUS // Left round end center in expanded
        : pillRect.left + pillRect.width / 2; // Circle center in collapsed
      const pillCenterY = pillRect.top + pillRect.height / 2;

      // Check horizontal and vertical alignment (0.5px tolerance)
      const horizontalDiff = Math.abs(iconCenterX - pillCenterX);
      const verticalDiff = Math.abs(iconCenterY - pillCenterY);

      if (horizontalDiff > 0.5 || verticalDiff > 0.5) {
        console.warn(
          `🔴 Icon misalignment detected:`,
          `\n  Icon center: (${iconCenterX.toFixed(2)}, ${iconCenterY.toFixed(2)})`,
          `\n  ${isExpanded ? 'Pill' : 'Circle'} center: (${pillCenterX.toFixed(2)}, ${pillCenterY.toFixed(2)})`,
          `\n  Horizontal diff: ${horizontalDiff.toFixed(2)}px (max 0.5px)`,
          `\n  Vertical diff: ${verticalDiff.toFixed(2)}px (max 0.5px)`,
          `\n  State: ${isExpanded ? 'expanded' : 'collapsed'}`
        );
      }
    };

    // Check after transitions, fonts load, and on various events
    const timers: number[] = [];
    
    // Immediate check
    timers.push(window.setTimeout(checkAlignment, 50));
    
    // After transition (600ms + buffer)
    timers.push(window.setTimeout(checkAlignment, 700));
    
    // After fonts load
    if (document.fonts) {
      document.fonts.ready.then(() => {
        timers.push(window.setTimeout(checkAlignment, 100));
      });
    }

    // On resize
    const handleResize = () => {
      timers.push(window.setTimeout(checkAlignment, 100));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      window.removeEventListener('resize', handleResize);
    };
  }, [notchPosition, isExpanded, isMounted, location.pathname, isTransitioning]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
    } catch (error) {
      showToast('Failed to logout', 'error');
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const isActivePath = (path: string) => location.pathname === path;

  // Calculate dynamic dimensions
  const railWidth = isExpanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH_COLLAPSED;
  const notchX = isExpanded ? NOTCH_X_COLLAPSED : NOTCH_X_COLLAPSED; // Icon stays at same x in both states
  const pillWidth = isExpanded && notchPosition ? railWidth - 28 + 2 : CIRCLE_DIAMETER; // Left edge at 28px, extends 2px past right edge
  const pillLeft = 28; // Always 28px from rail left
  
  // Calculate notch position accounting for scroll
  const notchY = notchPosition ? notchPosition.y - scrollTop : 0;
  const notchCenterY = notchY + (notchPosition?.height || 0) / 2;

  // Mask hole dimensions
  const holeWidth = pillWidth + (RING_WIDTH * 2);
  const holeHeight = CIRCLE_DIAMETER + (RING_WIDTH * 2);
  const holeLeft = pillLeft - RING_WIDTH;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[rgb(var(--rail))] text-[rgb(var(--rail-ink))] shadow-lg transition-transform hover:scale-105"
        aria-label="Open navigation menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 p-4 flex flex-col gap-6
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: isMobileOpen ? `${ASIDE_WIDTH_EXPANDED}px` : (isExpanded ? `${ASIDE_WIDTH_EXPANDED}px` : `${ASIDE_WIDTH_COLLAPSED}px`),
        }}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[rgb(var(--rail))] text-[rgb(var(--rail-ink))] z-10"
          aria-label="Close navigation menu"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Logo Badge / Pill */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-3 bg-[rgb(var(--rail))] shadow-lg self-center transition-all duration-[450ms] overflow-hidden"
          style={{
            width: railWidth,
            height: 80,
            borderRadius: 40,
            transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.15, 1)',
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-[rgb(var(--rail))]">
            <Footprints
              size={28}
              strokeWidth={1.5}
              className="text-[rgb(var(--green))]"
            />
          </div>
          {(isExpanded || isMobileOpen) && (
            <div
              className="flex flex-col transition-all duration-200"
              style={{
                opacity: (isExpanded || isMobileOpen) ? 1 : 0,
                transform: (isExpanded || isMobileOpen) ? 'translateX(0)' : 'translateX(-6px)',
                transitionDelay: '150ms',
              }}
            >
              <span className="font-bricolage font-extrabold text-[20px] text-white leading-none whitespace-nowrap">
                EcoStep
              </span>
              <span className="font-bricolage font-semibold text-[12px] text-[rgb(var(--rail-ink))] leading-none mt-1 whitespace-nowrap">
                Energy monitoring
              </span>
            </div>
          )}
        </Link>

        {/* Navigation Rail Wrapper - NO OVERFLOW CLIPPING */}
        <div
          ref={navRef as React.RefObject<HTMLDivElement>}
          className="relative flex-1"
          style={{
            width: railWidth,
            transition: 'width 450ms cubic-bezier(0.65, 0, 0.15, 1)',
            // CSS variables for notch position and icon alignment (SINGLE SOURCE OF TRUTH)
            ['--rail-w' as string]: `${railWidth}px`,
            ['--icon-x' as string]: `${RAIL_WIDTH_COLLAPSED / 2}px`, // Rail center = 40px
            ['--notch-x' as string]: `${notchX}px`, // Active icon position = 55px
            ['--notch-y' as string]: notchPosition ? `${notchCenterY}px` : '0px',
            ['--notch-w' as string]: `${pillWidth}px`,
          }}
        >
          {/* Layer 1: Rail Fill with SVG Mask Cutout */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Clip path to prevent fillet bleed */}
              <clipPath id="rail-clip">
                <rect width="100%" height="100%" rx="44" />
              </clipPath>

              {/* Define the mask with the hole */}
              <mask id="rail-mask">
                {/* White fill for visible area */}
                <rect width="100%" height="100%" fill="white" rx="44" />
                {/* Black rounded rect for the hole */}
                {notchPosition && (
                  <rect
                    x={holeLeft}
                    y={notchCenterY - holeHeight / 2}
                    width={holeWidth}
                    height={holeHeight}
                    rx={MASK_RADIUS}
                    fill="black"
                    style={{
                      transition: isTransitioning
                        ? `y var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1), width var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1), height var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1)`
                        : 'width 450ms cubic-bezier(0.65, 0, 0.15, 1)',
                    }}
                  />
                )}
              </mask>

              {/* Fillet pieces for smooth junctions */}
              <radialGradient id="fillet-top">
                <stop offset="0%" stopColor="rgb(var(--rail))" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(var(--rail))" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fillet-bottom">
                <stop offset="0%" stopColor="rgb(var(--rail))" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(var(--rail))" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g clipPath="url(#rail-clip)">
              {/* Rail background with mask applied */}
              <rect
                width="100%"
                height="100%"
                fill="rgb(var(--rail))"
                mask="url(#rail-mask)"
                rx="44"
              />

              {/* Fillet smoothing pieces at junction points (right edge only) */}
              {notchPosition && !isExpanded && (
                <>
                  {/* Top fillet */}
                  <circle
                    cx={RAIL_WIDTH_COLLAPSED}
                    cy={notchCenterY - MASK_RADIUS}
                    r="6"
                    fill="url(#fillet-top)"
                    style={{
                      transition: isTransitioning
                        ? `cy var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1)`
                        : 'none',
                    }}
                  />
                  {/* Bottom fillet */}
                  <circle
                    cx={RAIL_WIDTH_COLLAPSED}
                    cy={notchCenterY + MASK_RADIUS}
                    r="6"
                    fill="url(#fillet-bottom)"
                    style={{
                      transition: isTransitioning
                        ? `cy var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1)`
                        : 'none',
                    }}
                  />
                </>
              )}
            </g>
          </svg>

          {/* Layer 2: Green Active Pill/Circle */}
          {notchPosition && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: pillWidth,
                height: CIRCLE_DIAMETER,
                left: pillLeft,
                top: notchCenterY - CIRCLE_RADIUS,
                backgroundColor: `rgb(var(--green))`,
                borderRadius: CIRCLE_RADIUS,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: isTransitioning
                  ? `top var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1), width var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1), transform var(--sidebar-indicator-duration) cubic-bezier(0.65, 0, 0.15, 1)`
                  : 'width 450ms cubic-bezier(0.65, 0, 0.15, 1)',
                transform: isTransitioning ? 'scaleY(1.12)' : 'scaleY(1)',
              }}
            />
          )}

          {/* Layer 3: Nav Content (scrollable) */}
          <div className="absolute inset-0 rounded-[44px] flex flex-col pointer-events-auto">
            {/* Top Section: Hamburger Toggle */}
            <div className="pt-6 pb-3 px-4">
              <button
                onClick={handleToggleExpand}
                className="w-full h-14 flex items-center gap-3 rounded-full transition-colors duration-200 hover:bg-white/8 px-3"
                aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={isExpanded}
                aria-controls="sidebar-nav"
                style={{
                  justifyContent: (isExpanded || isMobileOpen) ? 'flex-start' : 'center',
                }}
              >
                <Menu size={22} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))] shrink-0" />
                {(isExpanded || isMobileOpen) && (
                  <span
                    className="font-bricolage font-semibold text-[15px] text-[rgb(var(--rail-ink))] whitespace-nowrap transition-all duration-200"
                    style={{
                      opacity: (isExpanded || isMobileOpen) ? 1 : 0,
                      transform: (isExpanded || isMobileOpen) ? 'translateX(0)' : 'translateX(-6px)',
                      transitionDelay: '150ms',
                    }}
                  >
                    Collapse
                  </span>
                )}
              </button>
              {/* Divider */}
              <div
                className="h-px bg-white/8 transition-all duration-[450ms]"
                style={{
                  marginLeft: 16,
                  marginRight: 16,
                  marginTop: 12,
                }}
              />
            </div>

            {/* Middle Section: Nav Items (scrollable) */}
            <div
              ref={navListRef}
              id="sidebar-nav"
              className="flex-1 py-3 px-4 overflow-y-auto overflow-x-visible"
              style={{
                overflowX: 'visible',
              }}
            >
              <ul className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = isActivePath(item.path);
                  const Icon = item.icon;

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        ref={(el) => registerItemRef(item.id, el)}
                        className="relative flex items-center h-14 rounded-full z-30"
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        title={!(isExpanded || isMobileOpen) ? item.label : undefined}
                        style={{
                          // Per-row variable: inactive uses --icon-x (40px), active uses --notch-x (55px)
                          ['--ix' as string]: isActive ? 'var(--notch-x)' : 'var(--icon-x)',
                          color: isActive ? 'rgb(var(--green-ink))' : 'rgb(var(--rail-ink))',
                          transition: '--ix 600ms cubic-bezier(0.65, 0, 0.15, 1), color 300ms',
                        }}
                      >
                        {/* Hover background - hidden when active */}
                        {!isActive && (
                          <div
                            className="absolute inset-0 rounded-full bg-white/8 opacity-0 hover:opacity-100 transition-opacity duration-200"
                            style={{
                              inset: '6px 8px',
                            }}
                          />
                        )}

                        {/* Icon wrapper - positioned from --ix variable */}
                        <div
                          className="absolute top-1/2 flex items-center justify-center shrink-0 pointer-events-none"
                          style={{
                            width: 22,
                            height: 22,
                            left: 0,
                            transform: 'translate(calc(var(--ix) - 11px), -50%)',
                          }}
                        >
                          <Icon
                            size={22}
                            strokeWidth={1.5}
                            className="transition-all duration-200"
                            style={{
                              opacity: isActive ? 1 : 0.72,
                            }}
                          />
                        </div>

                        {/* Label - positioned from --ix variable */}
                        <span
                          className="absolute top-1/2 font-bricolage font-semibold text-[15px] whitespace-nowrap pointer-events-none"
                          style={{
                            left: 'calc(var(--ix) + 24px)',
                            transform: 'translateY(-50%)',
                            opacity: (isExpanded || isMobileOpen) ? 1 : 0,
                            fontWeight: isActive ? 800 : 600,
                            transition: 'opacity 200ms 150ms',
                          }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bottom Section: Controls */}
            <div className="pt-3 pb-6 px-4">
              {/* Divider */}
              <div
                className="h-px bg-white/8 transition-all duration-[450ms]"
                style={{
                  marginLeft: 16,
                  marginRight: 16,
                  marginBottom: 12,
                }}
              />
              
              <div className="flex flex-col gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full h-11 flex items-center gap-3 rounded-full transition-colors duration-200 hover:bg-white/8 px-3"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  style={{
                    justifyContent: (isExpanded || isMobileOpen) ? 'flex-start' : 'center',
                  }}
                >
                  {theme === 'light' ? (
                    <Moon size={22} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))] shrink-0" />
                  ) : (
                    <Sun size={22} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))] shrink-0" />
                  )}
                  {(isExpanded || isMobileOpen) && (
                    <span
                      className="font-bricolage font-semibold text-[15px] text-[rgb(var(--rail-ink))] whitespace-nowrap transition-all duration-200"
                      style={{
                        opacity: (isExpanded || isMobileOpen) ? 1 : 0,
                        transform: (isExpanded || isMobileOpen) ? 'translateX(0)' : 'translateX(-6px)',
                        transitionDelay: '150ms',
                      }}
                    >
                      Theme
                    </span>
                  )}
                </button>

                {/* Identity Row */}
                <div
                  className="w-full h-11 flex items-center gap-3 rounded-full px-3"
                  style={{
                    justifyContent: (isExpanded || isMobileOpen) ? 'flex-start' : 'center',
                  }}
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/8 shrink-0">
                    <User size={20} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))]" />
                  </div>
                  {(isExpanded || isMobileOpen) && (
                    <div
                      className="flex flex-col min-w-0 flex-1 transition-all duration-200"
                      style={{
                        opacity: (isExpanded || isMobileOpen) ? 1 : 0,
                        transform: (isExpanded || isMobileOpen) ? 'translateX(0)' : 'translateX(-6px)',
                        transitionDelay: '150ms',
                      }}
                    >
                      <span className="font-bricolage font-semibold text-[14px] text-white leading-tight truncate">
                        {isAdmin ? userName || 'Admin' : 'Guest'}
                      </span>
                      <span className="font-bricolage text-[12px] text-[rgb(var(--rail-ink))] leading-tight">
                        {isAdmin ? 'Administrator' : 'Read-only access'}
                      </span>
                    </div>
                  )}
                  {isAdmin && (isExpanded || isMobileOpen) && (
                    <button
                      onClick={handleLogout}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/8 shrink-0"
                      aria-label="Logout"
                      title="Logout"
                    >
                      <LogOut size={18} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))]" />
                    </button>
                  )}
                </div>

                {/* Logout Button (Collapsed, Admin Only) */}
                {isAdmin && !(isExpanded || isMobileOpen) && (
                  <button
                    onClick={handleLogout}
                    className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/8 mx-auto"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut size={22} strokeWidth={1.5} className="text-[rgb(var(--rail-ink))]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
