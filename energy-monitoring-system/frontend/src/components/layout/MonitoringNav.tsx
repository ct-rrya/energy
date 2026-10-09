import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart } from 'lucide-react';
import { useSlidingIndicator } from '@/features/landing/hooks/useSlidingIndicator';

/**
 * MonitoringNav - Glass pill navigation for monitoring pages
 * Matches the landing page design with sliding indicator
 * Used for public/viewer users on /dashboard and /analytics routes
 */
export const MonitoringNav: React.FC = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLElement>(null);

  const tabs = [
    { path: '/dashboard', label: 'EcoStep Central', icon: LayoutDashboard },
    { path: '/analytics', label: 'Historical Analytics', icon: LineChart },
  ];

  // Find active index based on current location
  const activeIndex = tabs.findIndex((tab) => location.pathname === tab.path);

  // Create refs for each tab
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const { position, handleMouseEnter, handleMouseLeave, handleFocus, handleBlur, isInitialPlacement } =
    useSlidingIndicator(activeIndex >= 0 ? activeIndex : 0, tabRefs.current, containerRef);

  return (
    <nav
      ref={containerRef}
      className="flex items-center"
    >
      <div className="relative flex items-center gap-1 rounded-full bg-[var(--landing-pill)] backdrop-blur-md border border-[rgb(var(--landing-line))] p-1.5 shadow-sm">
        {/* Sliding indicator */}
        <i
          aria-hidden="true"
          style={{
            position: 'absolute',
            zIndex: 0,
            top: '6px',
            left: 0,
            height: 'calc(100% - 12px)',
            width: `${position.width}px`,
            borderRadius: '999px',
            background: 'rgb(var(--landing-surface))',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transform: `translateX(${position.left}px)`,
            transition: isInitialPlacement
              ? 'none'
              : 'transform 0.55s cubic-bezier(0.65, 0, 0.15, 1), width 0.55s cubic-bezier(0.65, 0, 0.15, 1), opacity 0.3s',
            opacity: position.opacity,
          }}
        />

        {/* Tab buttons */}
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              ref={(el: HTMLAnchorElement | null) => {
                tabRefs.current[index] = el;
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive ? 'rgb(var(--landing-ink))' : 'rgb(var(--landing-mute))',
              }}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
