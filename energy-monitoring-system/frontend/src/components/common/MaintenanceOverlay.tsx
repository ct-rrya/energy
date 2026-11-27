import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Wrench, Clock, ShieldCheck, PauseCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/routes/routes.config';

function formatEstimatedResume(iso: string | null): {
  formatted: string;
  relative: string | null;
} | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;

  const formatted = target.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const diffMs = target.getTime() - Date.now();
  let relative: string | null = null;
  if (diffMs > 60_000) {
    const mins = Math.round(diffMs / 60_000);
    if (mins < 60) {
      relative = `in about ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    } else {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      relative =
        remMins >= 10
          ? `in about ${hrs}h ${remMins}m`
          : `in about ${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }
  }

  return { formatted, relative };
}

/**
 * Full-screen Maintenance Notice Overlay for Public Visitors
 *
 * Portaled directly to document.body with explicit opaque theme tokens so it
 * cleanly covers both the Landing page and Dashboard views without CSS leakage.
 * Authenticated administrators bypass this overlay automatically.
 */
export function MaintenanceOverlay() {
  const { isAuthenticated } = useAuth();
  const { state } = useMaintenance();
  const { theme } = useTheme();

  if (!state.enabled || isAuthenticated || typeof document === 'undefined') {
    return null;
  }

  const isDark = theme === 'dark';
  const resumeInfo = formatEstimatedResume(state.estimatedResumeAt);

  const bgColor = isDark ? '#09110d' : '#f7faf8';
  const textColor = isDark ? '#eaf7ee' : '#0d1b14';
  const mutedColor = isDark ? '#8ea598' : '#52665b';
  const lineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(13, 27, 20, 0.1)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecostep-maintenance-title"
      className="fixed inset-0 flex flex-col items-center justify-between px-6 py-10 overflow-y-auto"
      style={{
        zIndex: 99999,
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
      }}
    >
      {/* Top brand bar */}
      <div className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs"
          style={{
            backgroundColor: 'rgba(25, 212, 106, 0.15)',
            border: '1px solid rgba(25, 212, 106, 0.35)',
            color: '#19D46A',
          }}
        >
          E
        </span>
        <span style={{ color: textColor }}>EcoStep</span>
      </div>

      {/* Main editorial notice */}
      <main className="w-full max-w-xl my-auto py-10 text-center flex flex-col items-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: isDark ? '#fbbf24' : '#b45309',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance in Progress</span>
        </div>

        <h1
          id="ecostep-maintenance-title"
          style={{
            fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            color: textColor,
            margin: 0,
            maxWidth: '34rem',
          }}
        >
          EcoStep is Temporarily Paused for Maintenance
        </h1>

        <p
          style={{
            marginTop: '1rem',
            marginBottom: 0,
            fontSize: '1rem',
            lineHeight: 1.65,
            color: isDark ? 'rgba(234, 247, 238, 0.88)' : 'rgba(13, 27, 20, 0.85)',
            maxWidth: '32rem',
          }}
        >
          {state.message}
        </p>

        {/* Details strip */}
        <div
          className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 text-left divide-y sm:divide-y-0 sm:divide-x"
          style={{
            borderTop: `1px solid ${lineColor}`,
            borderBottom: `1px solid ${lineColor}`,
            ['--tw-divide-opacity' as any]: 1,
            borderColor: lineColor,
          }}
        >
          <div className="py-4 sm:pr-5 flex items-start gap-3">
            <PauseCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: mutedColor }}
              >
                Hardware Status
              </div>
              <div
                className="text-sm font-medium mt-0.5"
                style={{ color: textColor }}
              >
                Live floor mat recording paused
              </div>
            </div>
          </div>

          <div
            className="py-4 sm:pl-5 flex items-start gap-3"
            style={{ borderColor: lineColor }}
          >
            <Clock className="w-4 h-4 text-[#19D46A] shrink-0 mt-0.5" />
            <div>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: mutedColor }}
              >
                Estimated Completion
              </div>
              <div
                className="text-sm font-medium mt-0.5 tabular-nums"
                style={{ color: textColor }}
              >
                {resumeInfo ? resumeInfo.formatted : 'Will resume shortly'}
              </div>
              {resumeInfo?.relative && (
                <div className="text-xs mt-0.5" style={{ color: mutedColor }}>
                  {resumeInfo.relative}
                </div>
              )}
            </div>
          </div>
        </div>

        <p
          className="mt-6 text-xs sm:text-sm max-w-md leading-relaxed m-0"
          style={{ color: mutedColor }}
        >
          This page will automatically restore normal live monitoring as soon as maintenance is complete—no refresh needed.
        </p>
      </main>

      {/* Discreet Maintenance Office / Admin Sign-In link */}
      <footer className="pt-4">
        <Link
          to={ROUTES.ADMIN_LOGIN}
          className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-100 opacity-75 no-underline"
          style={{ color: mutedColor }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Sign In</span>
        </Link>
      </footer>
    </div>,
    document.body,
  );
}
