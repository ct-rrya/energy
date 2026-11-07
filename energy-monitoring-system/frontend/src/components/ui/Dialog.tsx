import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const dialogElement = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-10 w-full rounded-2xl flex flex-col my-auto max-h-[calc(100dvh-32px)] sm:max-h-[85vh]',
          sizeClasses[size],
          className
        )}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: colors.cardBackground,
          boxShadow: theme === 'light' 
            ? '0 20px 50px rgba(0, 0, 0, 0.2)' 
            : '0 20px 50px rgba(0, 0, 0, 0.7)',
          border: theme === 'light'
            ? '1px solid rgba(26, 49, 44, 0.12)'
            : '1px solid rgba(137, 215, 183, 0.16)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div 
            className="flex items-center justify-between px-5 sm:px-6 py-4 flex-shrink-0"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <h2
              id="dialog-title"
              className="text-base sm:text-lg font-bold"
              style={{ color: colors.textPrimary }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors cursor-pointer"
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
        <div className="px-5 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(dialogElement, document.body);
  }

  return dialogElement;
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
