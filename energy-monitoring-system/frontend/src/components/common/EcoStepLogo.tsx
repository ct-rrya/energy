import React from 'react';
import { Link } from 'react-router-dom';

export interface EcoStepMarkProps extends React.SVGProps<SVGSVGElement> {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * EcoStep Mark Component
 * Renders the official 10-tile "E" mark with energized hot tile (2,1).
 * Geometry strictly from ecostep-mark-inline-themeable.svg (viewBox 276 188 258 434).
 * Themeable via CSS variables: --es-tile, --es-panel, --es-hot, --es-hot-panel.
 */
export function EcoStepMark({
  height = 30,
  className = '',
  style,
  ...props
}: EcoStepMarkProps) {
  // Calculate proportional width so the mark never stretches (aspect ratio 258:434)
  const calculatedWidth = Math.round(height * (258 / 434));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="276 188 258 434"
      width={calculatedWidth}
      height={height}
      role="img"
      aria-label="EcoStep"
      preserveAspectRatio="xMidYMid meet"
      className={`es-mark-svg shrink-0 select-none ${className}`}
      style={{
        height: `${height}px`,
        width: `${calculatedWidth}px`,
        display: 'inline-block',
        ...style,
      }}
      {...props}
    >
      {/* Row 0 */}
      <rect x="278.44" y="189.84" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="292.34" y="203.74" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
      <rect x="367.03" y="189.84" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="380.93" y="203.74" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
      <rect x="455.62" y="189.84" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="469.52" y="203.74" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />

      {/* Row 1 */}
      <rect x="278.44" y="278.44" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="292.34" y="292.34" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />

      {/* Row 2 (hot tile at 2,1) */}
      <rect x="278.44" y="367.03" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="292.34" y="380.93" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
      <rect x="367.03" y="367.03" width="75.94" height="75.94" rx="8.86" fill="var(--es-hot,#ffd84a)" />
      <rect x="380.93" y="380.93" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-hot-panel,#c99a00)" strokeWidth="4.05" strokeOpacity="0.55" />

      {/* Row 3 */}
      <rect x="278.44" y="455.62" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="292.34" y="469.52" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />

      {/* Row 4 */}
      <rect x="278.44" y="544.22" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="292.34" y="558.12" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
      <rect x="367.03" y="544.22" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="380.93" y="558.12" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
      <rect x="455.62" y="544.22" width="75.94" height="75.94" rx="8.86" fill="var(--es-tile,#1fd566)" />
      <rect x="469.52" y="558.12" width="48.1" height="48.1" rx="6.3" fill="none" stroke="var(--es-panel,#12a24f)" strokeWidth="4.05" strokeOpacity="0.55" />
    </svg>
  );
}

export interface EcoStepWordmarkProps {
  fontSize?: number | string;
  className?: string;
}

/**
 * EcoStep Wordmark
 * "Eco" in Poppins 700, "Step" in Poppins 500.
 * Follows light/dark mode via CSS variables (--es-ink and --es-step).
 */
export function EcoStepWordmark({
  fontSize = '1.15rem',
  className = '',
}: EcoStepWordmarkProps) {
  return (
    <span
      className={`es-brand-wordmark inline-flex items-baseline tracking-[-0.02em] leading-none select-none ${className}`}
      style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: 'var(--es-ink, #0e1f15)',
        }}
      >
        Eco
      </span>
      <span
        style={{
          fontWeight: 500,
          color: 'var(--es-step, #12a24f)',
        }}
      >
        Step
      </span>
    </span>
  );
}

export interface EcoStepBrandLockupProps {
  markHeight?: number;
  wordmarkSize?: number | string;
  showWordmark?: boolean;
  href?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Official EcoStep Brand Lockup (Mark + Wordmark)
 * Clicking navigates to landing page (#home).
 */
export function EcoStepBrandLockup({
  markHeight = 30,
  wordmarkSize = '1.15rem',
  showWordmark = true,
  href = '/#home',
  className = '',
  onClick,
}: EcoStepBrandLockupProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <EcoStepMark height={markHeight} />
      {showWordmark && <EcoStepWordmark fontSize={wordmarkSize} />}
    </span>
  );

  if (href) {
    if (href.startsWith('/#') || href.startsWith('#')) {
      return (
        <a
          href={href}
          onClick={onClick}
          aria-label="EcoStep"
          className="inline-flex items-center text-inherit no-underline cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        to={href}
        onClick={onClick}
        aria-label="EcoStep"
        className="inline-flex items-center text-inherit no-underline cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="EcoStep"
      className="inline-flex items-center text-inherit cursor-pointer"
    >
      {content}
    </div>
  );
}

/**
 * Backwards compatible EcoStepLogo component
 */
export function EcoStepLogo({
  className = 'h-8 w-8',
}: {
  className?: string;
}) {
  return <EcoStepMark height={30} className={className} />;
}
