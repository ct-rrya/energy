import { AlertTriangle, Clock } from 'lucide-react';
import { useInactivity } from '@/contexts/InactivityContext';

/**
 * Session Warning Modal
 *
 * Displays a warning modal when the user's session is about to expire
 * due to inactivity (< 60 seconds remaining).
 *
 * Features:
 * - Shows countdown timer
 * - "Continue Session" button to reset timer
 * - Prominent warning styling
 * - Auto-dismisses when user activity detected
 *
 * Only shown for SYSTEM_ADMIN and SUPER_ADMIN users.
 */
export function SessionWarningModal() {
  const { timeRemaining, showWarning, resetTimer, isActive } = useInactivity();

  // Don't render if not active or not showing warning
  if (!isActive || !showWarning) {
    return null;
  }

  // Calculate remaining seconds
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Session About to Expire
              </h2>
              <p className="text-sm text-gray-600">
                Your administrator session will expire due to inactivity.
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 mb-6 border border-amber-200">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-900 tabular-nums">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  Time Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              To protect your account and maintain security, administrator
              sessions automatically expire after 10 minutes of inactivity.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={resetTimer}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue Session
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Any activity (mouse, keyboard, click) will automatically extend your
            session
          </p>
        </div>
      </div>
    </>
  );
}
