import { Button } from '../ui/Button';
import { Dialog, DialogFooter } from '../ui/Dialog';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Confirmation Dialog Variant
 */
export type ConfirmVariant = 'danger' | 'warning' | 'info';

/**
 * Confirmation Dialog Props
 */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

/**
 * Confirmation Dialog Component
 * 
 * Reusable confirmation dialog for destructive or important actions.
 * 
 * Features:
 * - Multiple variants (danger, warning, info)
 * - Loading state support
 * - Keyboard navigation (Enter/Escape)
 * - Icon indicators
 * - Customizable button text
 * 
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Report"
 *   message="Are you sure you want to delete this report? This action cannot be undone."
 *   variant="danger"
 *   confirmText="Delete"
 * />
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      buttonVariant: 'default' as const,
    },
    info: {
      icon: HelpCircle,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      buttonVariant: 'default' as const,
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Message */}
        <p className="text-sm text-neutral-700 leading-relaxed">
          {message}
        </p>
      </div>

      <DialogFooter>
        <Button
          onClick={handleClose}
          variant="secondary"
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant={config.buttonVariant}
          disabled={isLoading}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

/**
 * useConfirmDialog Hook
 * 
 * Convenient hook for managing confirmation dialogs.
 * 
 * @example
 * const { isOpen, openConfirm, closeConfirm, confirmAction } = useConfirmDialog();
 * 
 * <button onClick={() => openConfirm(() => deleteItem(id))}>Delete</button>
 * 
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={closeConfirm}
 *   onConfirm={confirmAction}
 *   title="Delete Item"
 *   message="Are you sure?"
 *   variant="danger"
 * />
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [action, setAction] = React.useState<(() => void) | null>(null);

  const openConfirm = React.useCallback((callback: () => void) => {
    setAction(() => callback);
    setIsOpen(true);
  }, []);

  const closeConfirm = React.useCallback(() => {
    setIsOpen(false);
    setAction(null);
  }, []);

  const confirmAction = React.useCallback(() => {
    if (action) {
      action();
    }
    closeConfirm();
  }, [action, closeConfirm]);

  return {
    isOpen,
    openConfirm,
    closeConfirm,
    confirmAction,
  };
}

// Add React import for hook
import * as React from 'react';
