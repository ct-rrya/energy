import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

/**
 * Dialog Props
 */
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Dialog Component
 * 
 * Modal dialog with backdrop and close functionality.
 * 
 * Features:
 * - Backdrop click to close
 * - Escape key to close
 * - Multiple sizes
 * - Scroll locking
 * 
 * @example
 * <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Alert Details">
 *   <p>Content here</p>
 * </Dialog>
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: DialogProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full mx-4 rounded-lg',
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: colors.cardBackground,
          boxShadow: colors.shadowLg
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        {title && (
          <div 
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <h2
              id="dialog-title"
              className="text-lg font-semibold"
              style={{ color: colors.accent }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 transition-colors"
              style={{ color: colors.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBackground;
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textMuted;
              }}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Dialog Footer Component
 * 
 * Optional footer section for dialog actions.
 */
interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4',
        className
      )}
      style={{ borderTop: `1px solid ${colors.border}` }}
    >
      {children}
    </div>
  );
}
