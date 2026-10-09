import { useRef, type RefObject } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Footprints, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
import { ROUTES } from '@/routes/routes.config';

interface LandingNavProps {
  activeIndex: number;
  sectionRefs: RefObject<HTMLElement | null>[];
}

const NAV_ITEMS = [
  { label: 'Home', sectionId: 'home' },
  { label: 'How it works', sectionId: 'how' },
  { label: 'Dashboard', href: ROUTES.DASHBOARD }, // Real route, not section
  { label: 'EcoChat', sectionId: 'ecochat' },
  { label: 'About', sectionId: 'about' },
];

/**
 * LandingNav Component
 * 
 * Floating glass-pill navigation with sliding highlight indicator.
 * Signature feature: very smooth tab transitions with cubic-bezier easing.
 * 
 * Features:
 * - Floating translucent pill with backdrop blur
 * - Sliding highlight that follows hover, focus, and active state
 * - Scroll-spy integration
 * - Smooth scroll to sections
 * - Responsive: full-width row on mobile
 * - Footprints icon (EcoStep identity) instead of bolt
 * - Theme toggle
 * - Admin login button
 */
export function LandingNav({ activeIndex, sectionRefs }: LandingNavProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);
  
  // Create refs for each tab
  const tabRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  const { position, handleMouseEnter, handleMouseLeave, handleFocus, handleBlur, isInitialPlacement } =
    useSlidingIndicator(
      activeIndex,
      tabRefs.current,
      containerRef
    );

  const handleTabClick = (index: number, item: typeof NAV_ITEMS[number]) => {
    if (item.href) {
      // Navigate to real route
      navigate(item.href);
    } else if (item.sectionId) {
      // Smooth scroll to section
      const section = sectionRefs[index]?.current;
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header
      className="bar"
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 24px',
        pointerEvents: 'none',
      }}
    >
      {/* All children have pointerEvents auto */}
      
      {/* Brand */}
      <button
        onClick={() => handleTabClick(0, NAV_ITEMS[0])}
        className="brand"
        aria-label="EcoStep home"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 800,
          fontSize: '19px',
          letterSpacing: '-0.02em',
          color: 'var(--landing-ink)',
          textDecoration: 'none',
          pointerEvents: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <i
          className="logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--landing-green)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--landing-green-ink)',
          }}
        >
          <Footprints size={20} strokeWidth={2.4} />
        </i>
        <span className="brand-text">EcoStep</span>
      </button>

      {/* Navigation Tabs */}
      <nav
        ref={containerRef}
        className="tabs"
        id="tabs"
        aria-label="Sections"
        style={{
          position: 'relative',
          display: 'flex',
          gap: '2px',
          padding: '5px',
          borderRadius: '999px',
          background: 'var(--landing-pill)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--landing-line)',
          boxShadow: 'var(--landing-shadow)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          maxWidth: '100%',
          pointerEvents: 'auto',
        }}
      >
        {/* Hide scrollbar */}
        <style>{`
          .tabs::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Sliding indicator */}
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
              : 'transform 0.55s cubic-bezier(0.65, 0, 0.15, 1), width 0.55s cubic-bezier(0.65, 0, 0.15, 1), opacity 0.3s',
            opacity: position.opacity,
          }}
        />

        {/* Tabs */}
        {NAV_ITEMS.map((item, index) => {
          const isActive = index === activeIndex && !item.href;
          
          // Use Link for routes, 'a' for sections
          if (item.href) {
            return (
              <Link
                key={item.label}
                to={item.href}
                ref={(el: HTMLAnchorElement | null) => {
                  tabRefs.current[index] = el as any;
                }}
                className={isActive ? 'on' : ''}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '9px 18px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: isActive ? 'var(--landing-ink)' : 'var(--landing-mute)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.3s',
                  textDecoration: 'none',
                }}
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
              className={isActive ? 'on' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(index, item);
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '9px 18px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '15px',
                color: isActive ? 'var(--landing-ink)' : 'var(--landing-mute)',
                whiteSpace: 'nowrap',
                transition: 'color 0.3s',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Right group: Admin login + Theme toggle */}
      <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
        <Link
          to={ROUTES.ADMIN_LOGIN}
          className="btn go"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '15px',
            border: '1px solid var(--landing-green)',
            background: 'var(--landing-green)',
            color: 'var(--landing-green-ink)',
            textDecoration: 'none',
            transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Admin login
        </Link>

        <button
          onClick={toggleTheme}
          className="btn icon"
          aria-label="Toggle light and dark theme"
          style={{
            width: '42px',
            height: '42px',
            padding: 0,
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '15px',
            border: '1px solid var(--landing-line)',
            background: 'var(--landing-surface)',
            color: 'var(--landing-ink)',
            cursor: 'pointer',
            transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Mobile responsive adjustments */}
      <style>{`
        @media (max-width: 900px) {
          .brand-text {
            display: none;
          }
          .btn.go {
            padding: 11px 14px;
          }
        }
        @media (max-width: 560px) {
          .bar {
            flex-wrap: wrap;
            padding: 10px 14px;
          }
          .tabs {
            order: 3;
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
