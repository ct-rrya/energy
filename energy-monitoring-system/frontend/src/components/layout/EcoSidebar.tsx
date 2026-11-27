import { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
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
  ChevronUp, 
  ChevronLeft,
  Pin,
  MessageSquare,
  MessageSquareHeart,
  ScrollText,
  Info,
  Pencil,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalVisitor } from '@/contexts/VisitorContext';
import { ROUTES } from '@/routes/routes.config';
import { EcoStepMark, EcoStepWordmark } from '@/components/common/EcoStepLogo';
const ChatPanel = lazy(() => import('@/features/chat').then(m => ({ default: m.ChatPanel })));
import '@/styles/eco-sidebar.css';

interface NavItem {
  to: string;
  label: string;
  Icon: React.ElementType;
  end?: boolean;
  publicOnly?: boolean;
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Public routes (shown to everyone)
  { to: ROUTES.DASHBOARD, label: 'Central', Icon: Activity },
  { to: ROUTES.ANALYTICS, label: 'Analytics', Icon: TrendingUp },
  { to: ROUTES.REPORTS, label: 'Reports', Icon: FileText },
  { to: ROUTES.FEEDBACK, label: 'ECommunity', Icon: MessageSquareHeart },
  { to: ROUTES.ABOUT, label: 'About', Icon: Info },
  // Unified Admin routes
  { to: ROUTES.ADMIN_DIAGNOSTICS, label: 'Health', Icon: Stethoscope, adminOnly: true },
  { to: ROUTES.ADMIN_LOGS, label: 'Logs', Icon: ScrollText, adminOnly: true },
  { to: ROUTES.SETTINGS, label: 'Settings', Icon: Settings, adminOnly: true },
];

const HOVER_ENTER_DELAY_MS = 140;
const HOVER_LEAVE_DELAY_MS = 200;

const canUseDesktopHover = (): boolean => {
  if (typeof window === 'undefined' || window.innerWidth <= 768) {
    return false;
  }
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
};

interface EcoSidebarProps {
  children: React.ReactNode;
}

export function EcoSidebar({ children }: EcoSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Left panel pinned/collapsed state (default collapsed on first visit)
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() => {
    try {
      const pinned = localStorage.getItem('ecostep.leftPinned');
      if (pinned !== null) return pinned !== 'true';
      return true;
    } catch {
      return true;
    }
  });

  // Right EcoGuide panel pinned/collapsed state (default collapsed on first visit)
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => {
    try {
      const pinned = localStorage.getItem('ecostep.rightPinned');
      if (pinned !== null) return pinned !== 'true';
      return true;
    } catch {
      return true;
    }
  });

  // Desktop hover-to-expand overlay state (left navigation panel)
  const [leftHoverExpanded, setLeftHoverExpanded] = useState(false);

  // Desktop EcoGuide floating overlay state (opens on hover/click, stays overlapped until explicitly closed or pinned)
  const [rightOverlayOpen, setRightOverlayOpen] = useState(false);

  const leftEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent immediate hover re-open right after clicking Collapse while pointer is still over panel
  const leftSuppressHoverRef = useRef(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserSheetOpen, setMobileUserSheetOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const leftVisuallyExpanded = !leftCollapsed || leftHoverExpanded || userMenuOpen;
  const leftVisuallyCollapsed = !leftVisuallyExpanded;
  const leftFloating = leftCollapsed && leftVisuallyExpanded;

  const rightPinned = !rightCollapsed;
  const rightVisuallyExpanded = rightPinned || rightOverlayOpen;
  const rightVisuallyCollapsed = !rightVisuallyExpanded;
  const rightFloating = !rightPinned && rightOverlayOpen;

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

  const clearLeftHoverTimers = useCallback(() => {
    if (leftEnterTimerRef.current) {
      clearTimeout(leftEnterTimerRef.current);
      leftEnterTimerRef.current = null;
    }
    if (leftLeaveTimerRef.current) {
      clearTimeout(leftLeaveTimerRef.current);
      leftLeaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      clearLeftHoverTimers();
    };
  }, [clearLeftHoverTimers]);

  // Clear desktop floating state if viewport shrinks to mobile
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.innerWidth <= 768) {
        clearLeftHoverTimers();
        setLeftHoverExpanded(false);
        setRightOverlayOpen(false);
      }
    };

    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, [clearLeftHoverTimers]);

  const handleLeftMouseEnter = useCallback(() => {
    if (!leftCollapsed || leftSuppressHoverRef.current || !canUseDesktopHover()) return;
    if (leftLeaveTimerRef.current) {
      clearTimeout(leftLeaveTimerRef.current);
      leftLeaveTimerRef.current = null;
    }
    if (leftHoverExpanded) return;
    if (leftEnterTimerRef.current) clearTimeout(leftEnterTimerRef.current);
    leftEnterTimerRef.current = setTimeout(() => {
      leftEnterTimerRef.current = null;
      setLeftHoverExpanded(true);
    }, HOVER_ENTER_DELAY_MS);
  }, [leftCollapsed, leftHoverExpanded]);

  const handleLeftMouseLeave = useCallback(() => {
    leftSuppressHoverRef.current = false;
    if (leftEnterTimerRef.current) {
      clearTimeout(leftEnterTimerRef.current);
      leftEnterTimerRef.current = null;
    }
    if (!leftCollapsed) return;
    if (leftLeaveTimerRef.current) clearTimeout(leftLeaveTimerRef.current);
    leftLeaveTimerRef.current = setTimeout(() => {
      leftLeaveTimerRef.current = null;
      setLeftHoverExpanded(false);
    }, HOVER_LEAVE_DELAY_MS);
  }, [leftCollapsed]);

  // Toggle Left panel (Pin / Unpin)
  const toggleLeft = useCallback(() => {
    clearLeftHoverTimers();
    startAnimation();
    setLeftCollapsed((prev) => {
      const next = !prev;
      if (next) {
        // Collapsing/unpinning while pointer may still be over the button
        leftSuppressHoverRef.current = true;
        setLeftHoverExpanded(false);
      } else {
        leftSuppressHoverRef.current = false;
        setLeftHoverExpanded(false);
      }
      try {
        localStorage.setItem('ecostep.leftPinned', String(!next));
        localStorage.setItem('ecostep.leftCollapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [clearLeftHoverTimers, startAnimation]);

  // Pin / Unpin EcoGuide as part of the page layout (unpinning closes it)
  const toggleRightPin = useCallback(() => {
    startAnimation();
    setRightCollapsed((prev) => {
      const nextCollapsed = !prev;
      if (nextCollapsed) {
        // Unpinning closes EcoGuide back to the 56px rail
        setRightOverlayOpen(false);
        const active = document.activeElement as HTMLElement | null;
        if (active && document.getElementById('ecoguide-panel')?.contains(active)) {
          active.blur();
        }
      } else {
        // Pinning docks EcoGuide into the page layout
        setRightOverlayOpen(false);
      }
      try {
        localStorage.setItem('ecostep.rightPinned', String(!nextCollapsed));
        localStorage.setItem('ecostep.rightCollapsed', String(nextCollapsed));
        localStorage.setItem('ecostep_chat_docked_expanded', String(!nextCollapsed));
      } catch {
        /* ignore */
      }
      return nextCollapsed;
    });
  }, [startAnimation]);

  // Close / Collapse EcoGuide back to the 56px rail (works from both floating and pinned)
  const closeRight = useCallback(() => {
    setRightOverlayOpen(false);
    if (!rightCollapsed) {
      startAnimation();
      setRightCollapsed(true);
      try {
        localStorage.setItem('ecostep.rightPinned', 'false');
        localStorage.setItem('ecostep.rightCollapsed', 'true');
        localStorage.setItem('ecostep_chat_docked_expanded', 'false');
      } catch {
        /* ignore */
      }
    }
    const active = document.activeElement as HTMLElement | null;
    if (active && document.getElementById('ecoguide-panel')?.contains(active)) {
      active.blur();
    }
  }, [rightCollapsed, startAnimation]);

  // Toggle Right EcoGuide via rail click or keyboard shortcut (] / Ctrl+J)
  const toggleRight = useCallback(() => {
    if (rightVisuallyExpanded) {
      closeRight();
    } else {
      setRightOverlayOpen(true);
    }
  }, [rightVisuallyExpanded, closeRight]);

  // Compute portal popover coordinates from user card bounding rect
  const updatePopoverPosition = useCallback(() => {
    if (!userTriggerRef.current) return;
    const card = userTriggerRef.current.getBoundingClientRect();
    const popoverWidth = 250;
    const margin = 12;

    let left: number;
    let bottom: number;

    if (leftVisuallyCollapsed) {
      // Collapsed rail (72px): anchor to right edge + 8px, bottom-aligned with avatar
      left = card.right + 8;
      bottom = window.innerHeight - card.bottom;
    } else {
      // Expanded (pinned or floating): sit 8px above the user card
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
  }, [leftVisuallyCollapsed]);

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
    setMobileUserSheetOpen(false);
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

  // Set scrollTop = 0 on sidebar, main, and guide on mount and on every route change,
  // and observe page cards/sections for entrance blur-fade motion
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    const guideEl = document.getElementById('ecoguide-panel');
    if (guideEl) {
      guideEl.scrollTop = 0;
    }

    if (!mainEl || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const observedSet = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('es-blur-in');
          }
        });
      },
      { root: mainEl, threshold: 0.01, rootMargin: '40px 0px 40px 0px' }
    );

    const registerTargets = () => {
      const selectors = [
        '.page > *',
        '.analytics-charts-grid > *',
        '.dashboard-secondary-metrics > *',
        '.g4 > *',
        '.g3 > *',
        '.g2 > *',
      ].join(', ');

      const nodes = mainEl.querySelectorAll<HTMLElement>(selectors);
      nodes.forEach((el, idx) => {
        if (observedSet.has(el)) return;
        observedSet.add(el);
        // Do not hide a wrapper that itself holds a grid whose children we animate
        if (
          el.classList.contains('analytics-charts-grid') ||
          el.classList.contains('dashboard-secondary-metrics') ||
          el.classList.contains('g4') ||
          el.classList.contains('g3') ||
          el.classList.contains('g2') ||
          el.classList.contains('es-splash-root') ||
          el.hasAttribute('data-no-blur') ||
          el.getAttribute('role') === 'dialog'
        ) {
          return;
        }
        el.classList.add('es-blur-reveal');
        el.style.animationDelay = `${Math.min(idx % 6, 3) * 20}ms`;
        io.observe(el);
      });
    };

    registerTargets();
    const mo = new MutationObserver(() => {
      registerTargets();
    });
    mo.observe(mainEl, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [location.pathname]);

  // Unified Admin role (all authenticated admin accounts get identical admin access)
  const isAnyAdmin = Boolean(isAuthenticated && user);

  // Filter nav items based on role
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => {
      if (item.publicOnly && isAnyAdmin) {
        return false;
      }
      if (item.adminOnly) {
        return isAnyAdmin;
      }
      return true;
    });
  }, [isAnyAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const visitor = useOptionalVisitor();
  const userName = isAnyAdmin ? (user?.name || 'Admin') : (visitor?.nickname || 'Guest');
  const userRole = isAnyAdmin ? 'Administrator' : 'Public visitor';
  const cardUserRole = isAnyAdmin ? 'Admin' : 'Public visitor';
  const isSettingsActive = location.pathname.startsWith(ROUTES.SETTINGS);
  const avatarInitial =
    isAuthenticated && (user?.name || user?.email)
      ? (user.name || user.email || 'A')[0].toUpperCase()
      : (visitor?.nickname ? visitor.nickname[0].toUpperCase() : 'G');

  const handleOpenMobileEcoGuide = useCallback(() => {
    setMobileUserSheetOpen(false);
    window.dispatchEvent(new CustomEvent('ecostep:openchat'));
  }, []);

  return (
    <div
      ref={shellRef}
      className={`es-shell sh ${isAnimating ? 'is-animating' : ''}`}
      id="shell"
      data-theme={theme}
      style={{
        '--left-w': leftCollapsed ? '72px' : '224px',
        '--left-panel-w': leftVisuallyCollapsed ? '72px' : '224px',
        '--right-w': rightPinned ? '330px' : '56px',
        '--right-panel-w': rightVisuallyCollapsed ? '56px' : '330px',
      } as React.CSSProperties}
    >
      {/* Left Navigation */}
      <nav 
        ref={sidebarRef}
        className={`es-side nv sidebar ${leftVisuallyCollapsed ? 'collapsed nv-collapsed' : ''} ${leftFloating ? 'is-floating' : ''}`}
        id="left-sidebar"
        aria-label="Main"
        onMouseEnter={handleLeftMouseEnter}
        onMouseLeave={handleLeftMouseLeave}
      >
        {/* Header with Wordmark and Collapse/Pin Toggle */}
        <div className="es-nav-header" style={{ minHeight: '34px' }}>
          <a href="/#home" className="es-brand-link" aria-label="EcoStep home" title="EcoStep">
            <EcoStepMark height={24} />
            <span className="es-brand-text">
              <EcoStepWordmark fontSize="1rem" />
            </span>
          </a>
          {!leftVisuallyCollapsed && (
            <button
              type="button"
              className="es-toggle-btn ib"
              onClick={toggleLeft}
              aria-expanded={!leftCollapsed}
              aria-controls="left-sidebar"
              aria-label={leftCollapsed ? "Expand sidebar (Toggle sidebar)" : "Collapse sidebar (Toggle sidebar)"}
              title={leftCollapsed ? "Pin sidebar open ( [ )" : "Collapse sidebar ( [ )"}
            >
              {leftFloating ? (
                <Pin size={14} strokeWidth={2} />
              ) : (
                <ChevronLeft size={16} strokeWidth={2} className="es-toggle-icon" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="es-nav-list">
          {navItems.map((item, idx) => {
            const { to, label, Icon, end } = item;
            const prevItem = idx > 0 ? navItems[idx - 1] : null;
            const isFirstAdminItem =
              Boolean(item.adminOnly) &&
              Boolean(prevItem && !prevItem.adminOnly);

            return (
              <div key={to} className="contents">
                {isFirstAdminItem && (
                  <div className="es-nav-divider" role="separator" aria-label="Admin section">
                    <span className="es-nav-divider-label">Admin</span>
                  </div>
                )}
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `es-nav-item nav-link ${isActive ? 'active on' : ''}`}
                  title={leftVisuallyCollapsed ? label : undefined}
                  aria-label={label}
                >
                  <span className="es-nav-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="es-nav-label">
                    {label}
                  </span>
                </NavLink>
              </div>
            );
          })}
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
            title={leftVisuallyCollapsed ? `${userName} (${userRole})` : undefined}
          >
            <div className="es-user-avatar av">
              <span>{avatarInitial}</span>
            </div>
            <div className="es-user-info info">
              <div className="es-user-name">{userName}</div>
              <div className="es-user-sub">{cardUserRole}</div>
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
            onMouseEnter={handleLeftMouseEnter}
            onMouseLeave={handleLeftMouseLeave}
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
                <div className="um-role es-popover-role text-xs text-[var(--mu)]">{userRole}</div>
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

              {/* Change Nickname (Public visitor only) */}
              {!isAnyAdmin && visitor && (
                <button
                  type="button"
                  role="menuitem"
                  className="um-item es-popover-item it"
                  onClick={() => {
                    closeMenu(false);
                    visitor.openNicknameModal();
                  }}
                >
                  <Pencil size={18} strokeWidth={1.8} />
                  <span>Change Nickname</span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                role="menuitem"
                className="um-item es-popover-item it"
                onClick={() => {
                  toggleTheme();
                  setUserMenuOpen(false);
                }}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
                <span>Theme</span>
                <span className="um-badge es-popover-badge tg">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Auth Actions */}
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
              )}
            </div>
          </div>,
          document.body
        )}
      </nav>

      {/* Main Column */}
      <main ref={mainRef} className="es-main mn es-main-col main">
        <div className="es-main-edge-top" aria-hidden="true" />

        {/* Mobile Top Bar (<= 768px) */}
        <header className="es-mobile-topbar" aria-label="Mobile top bar">
          <a href="/#home" className="es-mobile-brand" aria-label="EcoStep">
            <EcoStepMark height={28} />
            <span className="es-mobile-brand-text">
              <EcoStepWordmark fontSize="1.1rem" />
            </span>
          </a>

          <div className="es-mobile-topbar-actions">
            <button
              type="button"
              className={`es-mobile-avatar-btn ${mobileUserSheetOpen ? 'is-active' : ''}`}
              onClick={() => setMobileUserSheetOpen((prev) => !prev)}
              aria-label="User account and settings"
              aria-expanded={mobileUserSheetOpen}
              aria-haspopup="dialog"
            >
              <span>{avatarInitial}</span>
            </button>
          </div>
        </header>

        {children}
        <div className="es-main-edge-bottom" aria-hidden="true" />
      </main>

      {/* Mobile Fixed Bottom Tab Bar (<= 768px) */}
      <nav className={`es-mobile-tabbar ${isAnyAdmin ? 'is-admin' : 'is-public'}`} aria-label="Primary mobile navigation">
        <NavLink
          to={ROUTES.DASHBOARD}
          className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
          aria-label="Central"
        >
          <span className="es-mobile-tab-pill">
            <Activity size={18} strokeWidth={2} />
          </span>
          <span className="es-mobile-tab-label">Central</span>
        </NavLink>

        {isAnyAdmin ? (
          <>
            <NavLink
              to={ROUTES.ANALYTICS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Analytics"
            >
              <span className="es-mobile-tab-pill">
                <TrendingUp size={17} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Analytics</span>
            </NavLink>

            <NavLink
              to={ROUTES.REPORTS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Reports"
            >
              <span className="es-mobile-tab-pill">
                <FileText size={17} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Reports</span>
            </NavLink>

            <button
              type="button"
              className="es-mobile-tab es-mobile-tab-ecoguide"
              onClick={handleOpenMobileEcoGuide}
              aria-label="Open EcoGuide"
            >
              <span className="es-mobile-ecoguide-fab">
                <MessageSquare size={20} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label es-mobile-tab-label-ecoguide">EcoGuide</span>
            </button>

            <NavLink
              to={ROUTES.ADMIN_LOGS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Logs"
            >
              <span className="es-mobile-tab-pill">
                <ScrollText size={17} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Logs</span>
            </NavLink>

            <NavLink
              to={ROUTES.ADMIN_DIAGNOSTICS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Health"
            >
              <span className="es-mobile-tab-pill">
                <Stethoscope size={17} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Health</span>
            </NavLink>

            <NavLink
              to={ROUTES.SETTINGS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Settings"
            >
              <span className="es-mobile-tab-pill">
                <Settings size={17} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Settings</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to={ROUTES.ANALYTICS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Analytics"
            >
              <span className="es-mobile-tab-pill">
                <TrendingUp size={18} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Analytics</span>
            </NavLink>

            <button
              type="button"
              className="es-mobile-tab es-mobile-tab-ecoguide"
              onClick={handleOpenMobileEcoGuide}
              aria-label="Open EcoGuide"
            >
              <span className="es-mobile-ecoguide-fab">
                <MessageSquare size={22} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label es-mobile-tab-label-ecoguide">EcoGuide</span>
            </button>

            <NavLink
              to={ROUTES.FEEDBACK}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="ECommunity"
            >
              <span className="es-mobile-tab-pill">
                <MessageSquareHeart size={18} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">ECommunity</span>
            </NavLink>

            <NavLink
              to={ROUTES.REPORTS}
              className={({ isActive }) => `es-mobile-tab ${isActive ? 'active' : ''}`}
              aria-label="Reports"
            >
              <span className="es-mobile-tab-pill">
                <FileText size={18} strokeWidth={2} />
              </span>
              <span className="es-mobile-tab-label">Reports</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Mobile Guest / User Bottom Sheet (<= 768px) */}
      {mobileUserSheetOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="es-mobile-sheet-backdrop"
          onClick={() => setMobileUserSheetOpen(false)}
          role="presentation"
        >
          <div
            className="es-mobile-user-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="User settings and account menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="es-sheet-handle" aria-hidden="true" />

            <div className="es-sheet-user-head">
              <div className="es-sheet-user-avatar">
                {isAuthenticated && (user?.name || user?.email) ? (
                  <span>{(user.name || user.email || 'A')[0].toUpperCase()}</span>
                ) : (
                  <User size={22} strokeWidth={2} />
                )}
              </div>
              <div className="es-sheet-user-info">
                <div className="es-sheet-user-name">{userName}</div>
                <div className="es-sheet-user-role">{userRole}</div>
              </div>
            </div>

            <div className="es-sheet-user-body">
              {/* Direct Navigation Links for Mobile */}
              <NavLink
                to={ROUTES.DASHBOARD}
                className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileUserSheetOpen(false)}
              >
                <Activity size={20} strokeWidth={1.8} />
                <span>Central</span>
              </NavLink>

              <NavLink
                to={ROUTES.ANALYTICS}
                className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileUserSheetOpen(false)}
              >
                <TrendingUp size={20} strokeWidth={1.8} />
                <span>Analytics</span>
              </NavLink>

              <NavLink
                to={ROUTES.REPORTS}
                className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileUserSheetOpen(false)}
              >
                <FileText size={20} strokeWidth={1.8} />
                <span>Reports</span>
              </NavLink>

              <NavLink
                to={ROUTES.FEEDBACK}
                className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileUserSheetOpen(false)}
              >
                <MessageSquareHeart size={20} strokeWidth={1.8} />
                <span>ECommunity</span>
              </NavLink>

              {!isAnyAdmin && (
                <NavLink
                  to={ROUTES.HOME}
                  className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setMobileUserSheetOpen(false)}
                >
                  <House size={20} strokeWidth={1.8} />
                  <span>Home</span>
                </NavLink>
              )}

              {isAnyAdmin && (
                <>
                  <NavLink
                    to={ROUTES.ADMIN_DIAGNOSTICS}
                    className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setMobileUserSheetOpen(false)}
                  >
                    <Stethoscope size={20} strokeWidth={1.8} />
                    <span>Health</span>
                  </NavLink>

                  <NavLink
                    to={ROUTES.ADMIN_LOGS}
                    className={({ isActive }) => `es-sheet-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setMobileUserSheetOpen(false)}
                  >
                    <ScrollText size={20} strokeWidth={1.8} />
                    <span>Logs</span>
                  </NavLink>
                </>
              )}

              <div className="my-1 border-t border-[var(--line)] opacity-60" />

              {/* Settings Navigation (Admin only) */}
              {isAnyAdmin && (
                <button
                  type="button"
                  className="es-sheet-item"
                  onClick={() => {
                    setMobileUserSheetOpen(false);
                    navigate(ROUTES.SETTINGS);
                  }}
                >
                  <Settings size={20} strokeWidth={1.8} />
                  <span>Settings</span>
                  {isSettingsActive && (
                    <span className="es-sheet-badge">Active</span>
                  )}
                </button>
              )}

              {/* Change Nickname (Public visitor only) */}
              {!isAnyAdmin && visitor && (
                <button
                  type="button"
                  className="es-sheet-item"
                  onClick={() => {
                    setMobileUserSheetOpen(false);
                    visitor.openNicknameModal();
                  }}
                >
                  <Pencil size={20} strokeWidth={1.8} />
                  <span>Change Nickname</span>
                </button>
              )}

              <button
                type="button"
                className="es-sheet-item"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
                <span>Theme</span>
                <span className="es-sheet-badge">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {isAnyAdmin ? (
                <button
                  type="button"
                  className="es-sheet-item"
                  onClick={() => {
                    setMobileUserSheetOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={20} strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="es-sheet-item"
                  onClick={() => {
                    setMobileUserSheetOpen(false);
                    navigate(ROUTES.LOGIN);
                  }}
                >
                  <User size={20} strokeWidth={1.8} />
                  <span>Admin Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Right EcoGuide Panel — Click-to-open Persistent Floating Overlay + Pin to Page + Separate Close */}
      <Suspense fallback={null}>
        <ChatPanel 
          isCollapsed={rightVisuallyCollapsed}
          isFloating={rightFloating}
          isPinned={rightPinned}
          onToggleCollapse={toggleRight}
          onTogglePin={toggleRightPin}
          onClosePanel={closeRight}
        />
      </Suspense>
    </div>
  );
}
