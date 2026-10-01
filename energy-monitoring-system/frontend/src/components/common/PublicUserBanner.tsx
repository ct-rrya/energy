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
    text: theme === 'light' ? '#1A312C' : '#F9FAFB',
    subtext: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: theme === 'light' ? '#2563EB' : '#60A5FA',
    buttonBg: theme === 'light' ? '#2563EB' : '#3B82F6',
    buttonText: '#FFFFFF',
    border: theme === 'light' ? '#BFDBFE' : '#1E3A5F',
  };

  return (
    <div
      className={`flex items-start gap-4 ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px', // Design system: 12px border-radius
        padding: '16px', // Card padding adjusted for banner
        transition: 'all 200ms ease', // Design system: 200ms transitions
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px', // Design system: 8px for smaller elements
          backgroundColor: colors.accent + '20',
          color: colors.accent,
        }}
      >
        <Info className="w-5 h-5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold"
          style={{ 
            color: colors.text,
            fontSize: '14px',
            marginBottom: '4px',
          }}
        >
          Guest Mode
        </h3>
        <p 
          style={{ 
            color: colors.subtext,
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
