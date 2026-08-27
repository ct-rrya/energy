import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full mx-4 rounded-lg',
          'bg-white dark:bg-[#1C1F26]',
          'shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#2A2E37] px-6 py-4">
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-[#2FBF71] dark:text-[#3ED98A]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F5F6F8] dark:hover:bg-[#2A2E37] hover:text-[#1A1D23] dark:hover:text-[#EDEEF0] transition-colors"
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
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-[#E5E7EB] dark:border-[#2A2E37] px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}
