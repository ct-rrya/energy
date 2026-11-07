import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';

export interface SplashScreenProps {
  /**
   * Callback fired when the splash screen has completed both its
   * minimum 3.5s animation and any background data loading, and is dismissed.
   */
  onComplete?: () => void;
  /**
   * Whether the dashboard data/shell is ready.
   * If false, the splash screen holds on the finished logo until ready.
   * Defaults to true.
   */
  isReady?: boolean;
  /**
   * If true, forces the splash screen to play even if previously shown in this session.
   */
  forceShow?: boolean;
  /**
   * Session storage key to avoid repeating splash in the same browser session.
   * Defaults to 'ecostep_splash_shown'.
   */
  sessionKey?: string;
  /**
   * Whether to show the replay pill button after animation completes (at 4.1s).
   * Defaults to true.
   */
  showReplayButton?: boolean;
  /**
   * Optional manual override for light/dark mode.
   * If omitted, respects the app's ThemeContext or prefers-color-scheme.
   */
  themeOverride?: 'light' | 'dark';
  /**
   * If true, keeps the splash screen mounted (e.g. for standalone preview page /splash).
   */
  standalone?: boolean;
}

const PITCH = 88.59375;
const X0 = 278.4375;
const Y0 = 189.84375;

interface TileConfig {
  place: string;
  delay: string;
  flashDelay: string;
  isHot: boolean;
}

const CELLS: [number, number][] = [
  [0, 0], [0, 1], [0, 2],
  [1, 0],
  [2, 0], [2, 1],
  [3, 0],
  [4, 0], [4, 1], [4, 2],
];

const TILES: TileConfig[] = CELLS.map(([r, c], i) => {
  const dist = Math.sqrt((r - 2) * (r - 2) + (c - 1) * (c - 1));
  return {
    place: `translate(${(X0 + c * PITCH).toFixed(3)} ${(Y0 + r * PITCH).toFixed(3)})`,
    delay: (0.3 + i * 0.08).toFixed(2),
    flashDelay: (1.9 + dist * 0.1).toFixed(2),
    isHot: r === 2 && c === 1,
  };
});

/**
 * EcoStep Splash & Logo Reveal Component
 * 
 * Mobile-first (375x812 reference frame) splash screen:
 * - 10 floor tiles forming capital "E", tile (2,1) energizes yellow with expanding shockwave rings
 * - Outward ripple of white flash across tiles
 * - "EcoStep" wordmark fade-up in DM Sans
 * - Adaptive light/dark gradients and ink colors
 * - Pure CSS timeline with cubic-bezier(0.22, 1, 0.36, 1) and animation-delays
 * - Respects prefers-reduced-motion
 */
function useSafeIsFetching(): number {
  try {
    return useIsFetching();
  } catch {
    return 0;
  }
}

export function SplashScreen({
  onComplete,
  isReady,
  forceShow = false,
  sessionKey = 'ecostep_splash_shown',
  showReplayButton = true,
  themeOverride,
  standalone = false,
}: SplashScreenProps) {
  const { theme } = useTheme();
  const isFetching = useSafeIsFetching();
  const effectiveIsReady = isReady !== undefined ? isReady : isFetching === 0;

  // Determine effective theme: prop override -> app theme -> system preference -> dark fallback
  const isDark = useMemo(() => {
    if (themeOverride) return themeOverride === 'dark';
    if (theme) return theme === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  }, [themeOverride, theme]);

  // Check if previously shown in this session
  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    if (standalone || forceShow) return true;
    try {
      if (typeof window !== 'undefined') {
        const hasShown = sessionStorage.getItem(sessionKey);
        return hasShown !== 'true';
      }
    } catch {
      // Fallback if sessionStorage is disabled
    }
    return true;
  });

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(!shouldShow);
  const [playIteration, setPlayIteration] = useState(0);

  // Responsive scale down for screens shorter than 812px or narrower than 375px
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (typeof window === 'undefined') return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextScale = Math.min(1, vw / 375, vh / 812);
      setScale(nextScale);
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Minimum duration: 3.5s for normal animation (reaches wordmark), 100ms for reduced-motion
  useEffect(() => {
    if (!shouldShow || standalone) return;
    const duration = prefersReducedMotion ? 100 : 3500;
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, duration);
    return () => clearTimeout(timer);
  }, [shouldShow, standalone, prefersReducedMotion, playIteration]);

  // Handle auto-dismiss once min time elapsed AND data is ready
  useEffect(() => {
    if (standalone || !shouldShow) return;
    if (minTimeElapsed && effectiveIsReady && !isExiting && !isDismissed) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setIsDismissed(true);
        try {
          sessionStorage.setItem(sessionKey, 'true');
        } catch {
          // ignore storage error
        }
        if (onComplete) onComplete();
      }, 500); // 500ms smooth fade-out
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, effectiveIsReady, isExiting, isDismissed, standalone, shouldShow, sessionKey, onComplete]);

  // Replay handler
  const handleReplay = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMinTimeElapsed(false);
    setIsExiting(false);
    setIsDismissed(false);
    setShouldShow(true);
    setPlayIteration((prev) => prev + 1);
  }, []);

  const canPortal = typeof document !== 'undefined' && !!document.body;

  if (isDismissed || !shouldShow || !canPortal) {
    return null;
  }

  const splashContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="EcoStep loading screen"
      data-no-blur="true"
      className="es-splash-root fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden select-none"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #06120c, #0d2418)'
          : 'linear-gradient(180deg, #dcefe2, #f3f9f4)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        filter: 'none',
        WebkitFilter: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      {/* Scoped CSS Keyframes and Physics Variables */}
      <style>{`
        .es-splash-root, .es-splash-root * {
          filter: none !important;
          -webkit-filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        @keyframes ecostep-tilein {
          from { opacity: 0; transform: scale(0.55); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ecostep-flash {
          0% { opacity: 0; }
          40% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes ecostep-energize {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ecostep-ring {
          0% { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.3); }
        }
        @keyframes ecostep-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes ecostep-halo {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ecostep-fadeup {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecostep-fadein {
          0% { opacity: 0; visibility: hidden; }
          1% { visibility: visible; }
          100% { opacity: 1; visibility: visible; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ecostep-anim {
            animation-duration: 0.01ms !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>

      {/* 375x812 Reference Frame Stage with Centered Scale Support */}
      <div
        key={playIteration}
        style={{
          width: 375,
          height: 812,
          position: 'relative',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          ['--out' as any]: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* SVG Logo Stage */}
        <svg
          width="375"
          height="812"
          viewBox="0 0 375 812"
          style={{ position: 'absolute', left: 0, top: 0, display: 'block' }}
          role="img"
          aria-label="EcoStep logo: an E made of floor tiles, one tile lights up"
        >
          <defs>
            <radialGradient id={`ecostep-halo-${playIteration}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#1fd566" stopOpacity="0.45" />
              <stop offset="1" stopColor="#1fd566" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Radial Glow Halo: 170px radius centered at (187.5, 371) */}
          <circle
            cx="187.5"
            cy="371"
            r="170"
            fill={`url(#ecostep-halo-${playIteration})`}
            className="ecostep-anim"
            style={{
              opacity: 0,
              transformOrigin: '187.5px 371px',
              animation: 'ecostep-halo 1.4s var(--out) 0.2s forwards',
            }}
          />

          {/* Floor Tile Grid: 107px tall E (scaled 0.25 from 810 viewBox) */}
          <g transform="translate(187.5 371) scale(0.25) translate(-405 -405)">
            {TILES.map((t, idx) => (
              <g key={idx} transform={t.place}>
                {/* Tile Base + Inset + Flash Overlay */}
                <g
                  className="ecostep-anim"
                  style={{
                    opacity: 0,
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `ecostep-tilein 0.7s var(--out) ${t.delay}s forwards`,
                  }}
                >
                  {/* Outer Tile: 75.94 x 75.94, rx 8.86 */}
                  <rect width="75.94" height="75.94" rx="8.86" fill="#1fd566" />

                  {/* Inset Panel: 48.1 x 48.1 at (13.9, 13.9), stroke 4.05 */}
                  <rect
                    x="13.9"
                    y="13.9"
                    width="48.1"
                    height="48.1"
                    rx="6.3"
                    fill="none"
                    stroke="#12a24f"
                    strokeWidth="4.05"
                    opacity="0.55"
                  />

                  {/* Outward Light Wave Flash Overlay */}
                  <rect
                    width="75.94"
                    height="75.94"
                    rx="8.86"
                    fill="#ffffff"
                    className="ecostep-anim"
                    style={{
                      opacity: 0,
                      animation: `ecostep-flash 0.8s ease-in-out ${t.flashDelay}s forwards`,
                    }}
                  />
                </g>

                {/* Hot Tile Energization: Tile (2, 1) */}
                {t.isHot && (
                  <>
                    {/* Yellow Tile Pop & Crossfade */}
                    <g
                      className="ecostep-anim"
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: 'ecostep-pop 0.6s var(--out) 1.9s 1',
                      }}
                    >
                      <rect
                        width="75.94"
                        height="75.94"
                        rx="8.86"
                        fill="#ffd84a"
                        className="ecostep-anim"
                        style={{
                          opacity: 0,
                          animation: 'ecostep-energize 0.35s ease-out 1.9s forwards',
                        }}
                      />
                      <rect
                        x="13.9"
                        y="13.9"
                        width="48.1"
                        height="48.1"
                        rx="6.3"
                        fill="none"
                        stroke="#c99a00"
                        strokeWidth="4.05"
                        strokeOpacity="0.55"
                        className="ecostep-anim"
                        style={{
                          opacity: 0,
                          animation: 'ecostep-energize 0.35s ease-out 1.9s forwards',
                        }}
                      />
                    </g>

                    {/* Expanding Yellow Ring 1: starts at 1.9s */}
                    <rect
                      width="75.94"
                      height="75.94"
                      rx="8.86"
                      fill="none"
                      stroke="#ffd84a"
                      strokeWidth="5"
                      className="ecostep-anim"
                      style={{
                        opacity: 0,
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: 'ecostep-ring 1s ease-out 1.9s forwards',
                      }}
                    />

                    {/* Expanding Yellow Ring 2: starts at 2.15s */}
                    <rect
                      width="75.94"
                      height="75.94"
                      rx="8.86"
                      fill="none"
                      stroke="#ffd84a"
                      strokeWidth="5"
                      className="ecostep-anim"
                      style={{
                        opacity: 0,
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: 'ecostep-ring 1s ease-out 2.15s forwards',
                      }}
                    />
                  </>
                )}
              </g>
            ))}
          </g>
        </svg>

        {/* Wordmark: Eco in DM Sans 700, Step in DM Sans 500, ~30px */}
        <div
          className="ecostep-anim"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 452,
            textAlign: 'center',
            fontSize: 30,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontFamily: "'DM Sans', sans-serif",
            color: isDark ? '#eaf7ee' : '#0e1f15',
            opacity: 0,
            animation: 'ecostep-fadeup 0.9s var(--out) 2.5s forwards',
          }}
        >
          <span style={{ fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Eco</span>
          <span
            style={{
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              color: isDark ? '#22e06a' : '#12a24f',
            }}
          >
            Step
          </span>
        </div>

        {/* Optional Replay Button (appears at 4.1s when in standalone mode or requested) */}
        {showReplayButton && standalone && (
          <div
            style={{
              position: 'absolute',
              bottom: 28,
              left: 0,
              right: 0,
              zIndex: 6,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={handleReplay}
              className="ecostep-anim cursor-pointer transition-transform hover:scale-105 active:scale-95"
              style={{
                height: 44,
                padding: '0 18px',
                borderRadius: 22,
                border: isDark ? '1px solid rgba(234,247,238,0.25)' : '1px solid rgba(14,31,21,0.18)',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
                color: isDark ? '#eaf7ee' : '#0e1f15',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: 0,
                visibility: 'hidden',
                animation: 'ecostep-fadein 0.4s ease 4.1s forwards',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12a8 8 0 1 0 3-6.2" />
                <path d="M4 4v5h5" />
              </svg>
              <span>Replay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(splashContent, document.body);
}

