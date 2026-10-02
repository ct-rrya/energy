import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

/**
 * Inactivity Context State
 */
interface InactivityContextState {
  /** Time remaining in seconds until timeout */
  timeRemaining: number;
  /** Whether the warning modal should be shown (< 60 seconds remaining) */
  showWarning: boolean;
  /** Reset the inactivity timer (on user activity) */
  resetTimer: () => void;
  /** Whether inactivity tracking is active */
  isActive: boolean;
}

/**
 * Inactivity Context
 */
const InactivityContext = createContext<InactivityContextState | undefined>(
  undefined,
);

/**
 * Inactivity Provider Props
 */
interface InactivityProviderProps {
  children: ReactNode;
  /** Timeout duration in milliseconds (default: 10 minutes) */
  timeout?: number;
  /** Warning threshold in milliseconds (default: 1 minute) */
  warningThreshold?: number;
}

/**
 * Inactivity Provider Component
 *
 * Manages 10-minute inactivity timeout for administrator sessions.
 *
 * Features:
 * - Tracks mouse movement, clicks, and keyboard events
 * - Shows warning modal at 9 minutes (1 minute remaining)
 * - Automatically logs out at 10 minutes
 * - Ignores background activity (polling, WebSocket updates)
 * - Only active for SYSTEM_ADMIN and SUPER_ADMIN users
 *
 * Security:
 * - Prevents unauthorized access to shared workstation
 * - Complies with 10-minute inactivity requirement
 * - User activity resets timer immediately
 */
export function InactivityProvider({
  children,
  timeout = 10 * 60 * 1000, // 10 minutes
  warningThreshold = 1 * 60 * 1000, // 1 minute
}: InactivityProviderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Check if inactivity tracking should be active
   * Only for SYSTEM_ADMIN and SUPER_ADMIN users
   */
  const isActive =
    isAuthenticated &&
    user?.role &&
    (user.role === 'SYSTEM_ADMIN' || user.role === 'SUPER_ADMIN');

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  /**
   * Reset the inactivity timer
   */
  const resetTimer = useCallback(() => {
    if (!isActive) return;

    // Clear existing timers
    clearTimers();

    // Reset state
    lastActivityRef.current = Date.now();
    setTimeRemaining(timeout);
    setShowWarning(false);

    // Start countdown interval (update every second)
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = timeout - elapsed;

      setTimeRemaining(Math.max(0, remaining));

      // Show warning when 1 minute remaining
      if (remaining <= warningThreshold && remaining > 0) {
        setShowWarning(true);
      }

      // Auto-logout when time expires
      if (remaining <= 0) {
        clearTimers();
        logout();
      }
    }, 1000);

    // Set main timeout (fallback if interval fails)
    timerRef.current = setTimeout(() => {
      clearTimers();
      logout();
    }, timeout);
  }, [isActive, timeout, warningThreshold, clearTimers, logout]);

  /**
   * Handle user activity events
   */
  const handleActivity = useCallback(() => {
    if (!isActive) return;
    resetTimer();
  }, [isActive, resetTimer]);

  /**
   * Setup activity listeners
   */
  useEffect(() => {
    if (!isActive) {
      clearTimers();
      return;
    }

    // Activity events that should reset the timer
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [isActive, handleActivity, resetTimer, clearTimers]);

  /**
   * Stop tracking when user logs out
   */
  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setTimeRemaining(timeout);
      setShowWarning(false);
    }
  }, [isAuthenticated, timeout, clearTimers]);

  const value: InactivityContextState = {
    timeRemaining,
    showWarning,
    resetTimer,
    isActive: isActive || false,
  };

  return (
    <InactivityContext.Provider value={value}>
      {children}
    </InactivityContext.Provider>
  );
}

/**
 * Custom hook to use Inactivity Context
 */
export function useInactivity(): InactivityContextState {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error('useInactivity must be used within an InactivityProvider');
  }
  return context;
}
