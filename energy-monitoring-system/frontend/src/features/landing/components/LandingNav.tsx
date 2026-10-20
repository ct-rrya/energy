import { useState, useEffect, useRef, type RefObject } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Footprints, Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
import { ROUTES } from '@/routes/routes.config';

interface LandingNavProps {
  activeIndex: number;
  sectionRefs: RefObject<HTMLElement | null>[];
}

const NAV_ITEMS = [
  { label: 'Home', sectionId: 'home' },
  { label: 'How it works', sectionId: 'how' },
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'EcoChat', sectionId: 'ecochat' },
  { label: 'About', sectionId: 'about' },
];

/**
 * LandingNav Component
 * 
 * Jitter.video inspired navigation pattern:
 * - At top of page: Logo on the far left, tabs in center, CTAs on the far right.
 * - When scrolled: All navigation collapses into ONE expandable menu button on the top right.
 * - Logo remains clean on the far left with brand text smoothly tucked in.
 * - Clicking the expandable top-right button opens a floating card with all nav links,
 *   Admin login, and Theme toggle.
 */
export function LandingNav({ activeIndex, sectionRefs }: LandingNavProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 899px)');

  // Scroll detection with hysteresis buffer
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 90) {
            setIsScrolled(true);
          } else if (y < 45) {
            setIsScrolled(false);
            setIsMenuOpen(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  // Sliding indicator for top tabs
  const { position, handleMouseEnter, handleMouseLeave, handleFocus, handleBlur, isInitialPlacement } =
    useSlidingIndicator(
      activeIndex,
      tabRefs.current,
      containerRef
    );

  const handleItemSelect = (index: number, item: typeof NAV_ITEMS[number]) => {
    setIsMenuOpen(false);
    if (item.href) {
      navigate(item.href);
    } else if (item.sectionId) {
      const target = sectionRefs[index]?.current;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const showCollapsedMenu = isScrolled || isMobile;

  return (
    <header
      className="landing-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 28px',
      }}
    >
      {/* =========================================================================
          FAR LEFT: ECOSTEP LOGO ONLY (No menu button here)
         ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* EcoStep Logo & Brand */}
        <button
          type="button"
          onClick={() => handleItemSelect(0, NAV_ITEMS[0])}
          aria-label="EcoStep Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--landing-ink)',
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '-0.02em',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Logo Icon */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--landing-green)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--landing-green-ink)',
              boxShadow: '0 4px 12px rgba(25, 212, 106, 0.3)',
              flexShrink: 0,
            }}
          >
            <Footprints size={20} strokeWidth={2.4} />
          </div>

          {/* Brand Text: Slides away smoothly when scrolling on desktop, stays visible on mobile */}
          <span
            className="brand-text"
            style={{
              position: 'relative',
              zIndex: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              transform: !isMobile && showCollapsedMenu ? 'translateX(-32px)' : 'translateX(0)',
              opacity: !isMobile && showCollapsedMenu ? 0 : 1,
              maxWidth: !isMobile && showCollapsedMenu ? '0px' : '90px',
              marginLeft: !isMobile && showCollapsedMenu ? '0px' : '9px',
              transition:
                'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1), margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: !isMobile && showCollapsedMenu ? 'none' : 'auto',
            }}
          >
            EcoStep
          </span>
        </button>
      </div>

      {/* =========================================================================
          CENTER: NAVIGATION TABS (Visible when at top of page on desktop)
         ========================================================================= */}
      <div
        className="landing-center-nav"
        style={{
          display: showCollapsedMenu ? 'none' : 'block',
          pointerEvents: showCollapsedMenu ? 'none' : 'auto',
          opacity: showCollapsedMenu ? 0 : 1,
          transform: showCollapsedMenu ? 'translate3d(0, -12px, 0)' : 'translate3d(0, 0, 0)',
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <nav
          ref={containerRef}
          className="tabs"
          style={{
            position: 'relative',
            display: 'flex',
            gap: '2px',
            padding: '5px',
            borderRadius: '999px',
            background: 'var(--landing-pill)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--landing-line)',
            boxShadow: 'var(--landing-shadow)',
          }}
        >
          {/* Sliding highlight indicator */}
          <i
            className="ind"
            aria-hidden="true"
            style={{
              position: 'absolute',
              zIndex: 0,
              top: '5px',
              left: 0,
              height: 'calc(100% - 10px)',
              width: `${position.width}px`,
              borderRadius: '999px',
              background: 'var(--landing-soft)',
              boxShadow: 'inset 0 0 0 1px var(--landing-line)',
              transform: `translateX(${position.left}px)`,
              transition: isInitialPlacement
                ? 'none'
                : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s',
              opacity: position.opacity,
            }}
          />

          {NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex && !item.href;
            const commonStyle: React.CSSProperties = {
              position: 'relative',
              zIndex: 1,
              padding: '9px 18px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '15px',
              color: isActive ? 'var(--landing-ink)' : 'var(--landing-mute)',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s ease',
              textDecoration: 'none',
              cursor: 'pointer',
            };

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  ref={(el: HTMLAnchorElement | null) => {
                    tabRefs.current[index] = el as any;
                  }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => handleFocus(index)}
                  onBlur={handleBlur}
                  style={commonStyle}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <a
                key={item.label}
                ref={(el: HTMLAnchorElement | null) => {
                  tabRefs.current[index] = el as any;
                }}
                href={`#${item.sectionId}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemSelect(index, item);
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                style={commonStyle}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* =========================================================================
          FAR RIGHT: UN-SCROLLED CTAs OR EXPANDABLE MENU (TOP RIGHT - Jitter.video style)
         ========================================================================= */}
      <div
        ref={menuContainerRef}
        className="landing-nav-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Mobile View: Dedicated Expandable Menu Button (Handled via CSS .landing-mobile-menu-btn) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          className="landing-mobile-menu-btn"
          style={{
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: isMenuOpen ? 'var(--landing-soft)' : 'var(--landing-surface)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--landing-line)',
            color: 'var(--landing-ink)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--landing-shadow)',
            whiteSpace: 'nowrap',
            pointerEvents: 'auto',
          }}
        >
          {isMenuOpen ? <X size={18} strokeWidth={2.4} /> : <Menu size={18} strokeWidth={2.4} />}
          <span>{isMenuOpen ? 'Close' : 'Menu'}</span>
        </button>

        {/* Desktop View: State A (top of page) or State B (scrolled) - Handled via CSS .landing-desktop-controls */}
        <div className="landing-desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* State A: Admin Login + Theme Toggle (Visible when at top of page on desktop) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: isScrolled ? 0 : 1,
              transform: isScrolled ? 'translate3d(14px, 0, 0) scale(0.96)' : 'translate3d(0, 0, 0) scale(1)',
              pointerEvents: isScrolled ? 'none' : 'auto',
              transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              position: isScrolled ? 'absolute' : 'relative',
              right: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <Link
              to={ROUTES.ADMIN_LOGIN}
              className="btn go"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '15px',
                border: '1px solid var(--landing-green)',
                background: 'var(--landing-green)',
                color: 'var(--landing-green-ink)',
                textDecoration: 'none',
                boxShadow: 'var(--landing-shadow)',
                transform: 'translate3d(0, 0, 0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, -2px, 0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(25, 212, 106, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
              }}
            >
              Admin login
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light and dark theme"
              style={{
                width: '42px',
                height: '42px',
                padding: 0,
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                border: '1px solid var(--landing-line)',
                background: 'var(--landing-surface)',
                color: 'var(--landing-ink)',
                cursor: 'pointer',
                boxShadow: 'var(--landing-shadow)',
                transform: 'translate3d(0, 0, 0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, -2px, 0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {/* State B: Single Expandable Menu Button (Visible when scrolled on desktop) */}
          <div
            style={{
              opacity: isScrolled ? 1 : 0,
              transform: isScrolled ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(14px, 0, 0) scale(0.96)',
              pointerEvents: isScrolled ? 'auto' : 'none',
              transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              position: isScrolled ? 'relative' : 'absolute',
              right: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '999px',
                background: isMenuOpen ? 'var(--landing-soft)' : 'var(--landing-pill)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--landing-line)',
                color: 'var(--landing-ink)',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--landing-shadow)',
                whiteSpace: 'nowrap',
                transform: 'translate3d(0, 0, 0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, -2px, 0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
              }}
            >
              {isMenuOpen ? <X size={16} strokeWidth={2.4} /> : <Menu size={16} strokeWidth={2.4} />}
              <span>{isMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>

        {/* Dropdown Menu attached to top-right */}
        {isMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              background: 'var(--landing-surface)',
              border: '1px solid var(--landing-line)',
              borderRadius: '20px',
              padding: '10px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              minWidth: isMobile ? 'min(240px, calc(100vw - 32px))' : '220px',
              zIndex: 60,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {NAV_ITEMS.map((item, index) => {
                const isTabActive = index === activeIndex && !item.href;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleItemSelect(index, item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isTabActive ? 'var(--landing-soft)' : 'transparent',
                      color: isTabActive ? 'var(--landing-ink)' : 'var(--landing-mute)',
                      fontWeight: isTabActive ? 700 : 500,
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = 'var(--landing-soft)';
                        e.currentTarget.style.color = 'var(--landing-ink)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--landing-mute)';
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.href ? (
                      <ArrowUpRight size={14} style={{ opacity: 0.6 }} />
                    ) : isTabActive ? (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--landing-green)',
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}

              {/* Divider between nav links and actions */}
              <div
                style={{
                  height: '1px',
                  background: 'var(--landing-line)',
                  margin: '6px 4px',
                }}
              />

              {/* Admin Login Button */}
              <Link
                to={ROUTES.ADMIN_LOGIN}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--landing-green)',
                  background: 'var(--landing-green)',
                  color: 'var(--landing-green-ink)',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(25, 212, 106, 0.25)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, -1px, 0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(25, 212, 106, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 212, 106, 0.25)';
                }}
              >
                <span>Admin login</span>
                <ArrowUpRight size={14} strokeWidth={2.4} />
              </Link>

              {/* Theme Toggle in Menu */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--landing-ink)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--landing-soft)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                  <span>Appearance</span>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--landing-soft)',
                    color: 'var(--landing-ink)',
                    textTransform: 'capitalize',
                  }}
                >
                  {theme}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
