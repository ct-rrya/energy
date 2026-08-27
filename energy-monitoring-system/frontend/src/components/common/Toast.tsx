import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast Type
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Toast Props
 */
interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast Component
 * Displays temporary notification messages
 */
export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-secondary-500 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-primary-500 text-white',
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300',
        colors[type],
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Toast Container
 * Manages multiple toasts
 */
interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

let toasts: ToastMessage[] = [];
let listeners: Array<(toasts: ToastMessage[]) => void> = [];

/**
 * Subscribe to toast changes
 */
export function useToasts() {
  const [state, setState] = useState<ToastMessage[]>(toasts);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return state;
}

/**
 * Show a toast notification
 */
export function showToast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { id, message, type };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));
}

/**
 * Remove a toast
 */
export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(toasts));
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
export function ToastContainer() {
  const toastMessages = useToasts();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4 sm:p-6">
      {toastMessages.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
