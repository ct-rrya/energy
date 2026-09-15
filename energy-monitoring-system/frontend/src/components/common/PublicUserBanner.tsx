import { Info } from 'lucide-react';
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
 * Displays an informational banner for unauthenticated users
 * showing they are in guest mode with read-only access
 */
export function PublicUserBanner({
  message = 'You are viewing in guest mode with read-only access to system monitoring and analytics.',
  className = '',
}: PublicUserBannerProps) {
  const { theme } = useTheme();

  const colors = {
    bg: theme === 'light' ? '#EAF6FF' : '#1A2332',
    text: theme === 'light' ? '#1A1D23' : '#EDEEF0',
    subtext: theme === 'light' ? '#4B5563' : '#9CA3AF',
    accent: theme === 'light' ? '#2563EB' : '#60A5FA',
    buttonBg: theme === 'light' ? '#2563EB' : '#3B82F6',
    buttonText: '#FFFFFF',
    border: theme === 'light' ? '#BFDBFE' : '#1E3A5F',
  };

  return (
    <div
      className={`rounded-2xl p-4 flex items-start gap-4 ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: colors.accent + '20',
          color: colors.accent,
        }}
      >
        <Info className="w-5 h-5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: colors.text }}
        >
          Guest Mode
        </h3>
        <p className="text-sm" style={{ color: colors.subtext }}>
          {message}
        </p>
      </div>
    </div>
  );
}
