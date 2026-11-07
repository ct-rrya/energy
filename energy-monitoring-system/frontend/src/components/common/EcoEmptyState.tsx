import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * EcoEmptyState Props
 */
interface EcoEmptyStateProps {
  icon: LucideIcon;
  badge?: string;
  title: string;
  description?: string;
  hint?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}

/**
 * EcoStep Empty State Component
 *
 * Visually engaging, theme-aware empty state with radial aura,
 * elegant iconography, crisp typography, and witty brand storytelling.
 */
export function EcoEmptyState({
  icon: Icon,
  badge,
  title,
  description,
  hint,
  action,
  secondaryAction,
}: EcoEmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 sm:px-8 select-none">
      {/* Ambient background glow behind the icon */}
      <div className="relative mb-5 flex items-center justify-center">
        <div
          className="absolute w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all duration-500"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(31, 213, 102, 0.28) 0%, rgba(31, 213, 102, 0) 70%)'
              : 'radial-gradient(circle, rgba(18, 162, 79, 0.18) 0%, rgba(18, 162, 79, 0) 70%)',
          }}
          aria-hidden="true"
        />

        {/* Icon Frame */}
        <div
          className="relative z-10 p-4 sm:p-5 rounded-2xl flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: isDark ? 'rgba(31, 213, 102, 0.08)' : 'rgba(18, 162, 79, 0.08)',
            border: `1px solid ${isDark ? 'rgba(31, 213, 102, 0.22)' : 'rgba(18, 162, 79, 0.2)'}`,
            boxShadow: isDark
              ? '0 0 24px rgba(31, 213, 102, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
              : '0 4px 16px rgba(18, 162, 79, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
            color: isDark ? '#39FF88' : '#12A24F',
          }}
        >
          <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.8} />
        </div>
      </div>

      {/* Pill Badge */}
      {badge && (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide transition-all"
          style={{
            backgroundColor: isDark ? 'rgba(31, 213, 102, 0.12)' : 'rgba(18, 162, 79, 0.08)',
            color: isDark ? '#39FF88' : '#12A24F',
            border: `1px solid ${isDark ? 'rgba(31, 213, 102, 0.25)' : 'rgba(18, 162, 79, 0.2)'}`,
          }}
        >
          {badge}
        </span>
      )}

      {/* Title */}
      <h2
        className={`text-base sm:text-lg tracking-tight max-w-lg ${description ? 'font-bold text-lg sm:text-xl mb-2' : 'font-medium mb-0'}`}
        style={{
          color: isDark ? '#FFFFFF' : '#0B132B',
          fontFamily: "'DM Sans', 'Poppins', sans-serif",
        }}
      >
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p
          className="text-sm leading-relaxed max-w-md mb-4"
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          {description}
        </p>
      )}

      {/* Hint / Witty Pro-tip Box */}
      {hint && (
        <div
          className="px-4 py-2.5 rounded-xl text-xs max-w-md mb-5 leading-normal border text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
            color: isDark ? '#CBD5E1' : '#475569',
          }}
        >
          {hint}
        </div>
      )}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
