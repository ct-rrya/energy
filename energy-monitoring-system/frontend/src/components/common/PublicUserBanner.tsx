import { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Public User Banner Props
 */
interface PublicUserBannerProps {
  message?: string;
  className?: string;
}

/**
 * Public User Banner Component
 * Displays an informational banner for unauthenticated users showing read-only guest mode.
 * On mobile, renders as a slim compact row that can be expanded on tap to reduce vertical clutter.
 * Preserves the full standard desktop layout.
 */
export function PublicUserBanner({
  message = 'You are viewing in guest mode with read-only access to system monitoring and analytics.',
  className = '',
}: PublicUserBannerProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = {
    bg: theme === 'light' ? '#EAF6FF' : '#1A2332',
    text: theme === 'light' ? '#1A312C' : '#F9FAFB',
    subtext: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: theme === 'light' ? '#2563EB' : '#60A5FA',
    border: theme === 'light' ? '#BFDBFE' : '#1E3A5F',
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* Compact Header Row (Mobile: slim row with expand button; Desktop: standard top alignment) */}
      <div className="flex items-center sm:items-start justify-between gap-3 p-2.5 sm:p-4">
        <div className="flex items-center sm:items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="flex items-center justify-center flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg"
            style={{
              backgroundColor: colors.accent + '20',
              color: colors.accent,
            }}
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
          </div>

          {/* Title & Mobile Tag */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:mb-1">
              <h3
                className="font-semibold text-xs sm:text-sm"
                style={{ color: colors.text }}
              >
                Guest Mode
              </h3>
              <span
                className="text-[11px] sm:hidden font-medium"
                style={{ color: colors.subtext }}
              >
                • Read-only access
              </span>
            </div>

            {/* Desktop Message (Always visible on sm and up) */}
            <p
              className="hidden sm:block text-xs sm:text-sm leading-relaxed"
              style={{ color: colors.subtext }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Mobile Expand / Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex-shrink-0"
          style={{
            color: colors.accent,
            backgroundColor: colors.accent + '15',
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse guest mode details' : 'Expand guest mode details'}
        >
          <span>{isExpanded ? 'Less' : 'Details'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Mobile Expandable Explanation Body */}
      {isExpanded && (
        <div
          className="sm:hidden px-3 pb-2.5 pt-1.5 text-xs leading-relaxed border-t"
          style={{
            borderColor: colors.border,
            color: colors.subtext,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
