import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Admin Access Code Login Page
 *
 * Provides access code authentication for administrators on shared workstations.
 *
 * Features:
 * - 12-character access code input (4 boxes of 3 characters each)
 * - Auto-focus and auto-advance between boxes
 * - Paste support (full access code)
 * - Clear error messaging
 * - Loading state during authentication
 * - Redirects to appropriate page based on role
 *
 * Security:
 * - Access code never shown or logged
 * - Generic error messages
 * - Rate limiting handled by backend
 */
export default function AdminAccessCodePage() {
  const navigate = useNavigate();
  const { loginWithAccessCode } = useAuth();
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Access code state (4 parts of 3 characters each)
  const [codeParts, setCodeParts] = useState(['', '', '', '']);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for input boxes
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  /**
   * Focus first input on mount
   */
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  /**
   * Handle input change
   */
  const handleChange = (index: number, value: string) => {
    // Only allow alphanumeric characters (PRESERVE CASE - access codes are case-sensitive)
    const sanitized = value.replace(/[^A-Za-z0-9]/g, '');

    // Take only first 3 characters
    const truncated = sanitized.slice(0, 3);

    // Update state
    const newCodeParts = [...codeParts];
    newCodeParts[index] = truncated;
    setCodeParts(newCodeParts);

    // Clear error on input
    if (error) {
      setError('');
    }

    // Auto-advance to next box if this one is full
    if (truncated.length === 3 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  /**
   * Handle paste event
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData('text')
      .replace(/[^A-Za-z0-9]/g, ''); // Strip dashes and special chars but PRESERVE CASE

    // Distribute pasted text across boxes (3 chars each)
    const newCodeParts = [
      pastedText.slice(0, 3),
      pastedText.slice(3, 6),
      pastedText.slice(6, 9),
      pastedText.slice(9, 12),
    ];

    setCodeParts(newCodeParts);

    // Focus last filled box or first empty box
    const lastFilledIndex = newCodeParts.findIndex((part) => part.length < 3);
    const focusIndex = lastFilledIndex === -1 ? 3 : lastFilledIndex;
    inputRefs[focusIndex].current?.focus();

    // Clear error
    if (error) {
      setError('');
    }
  };

  /**
   * Handle key down (backspace navigation)
   */
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Navigate back on backspace if current box is empty
    if (e.key === 'Backspace' && codeParts[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine code parts
    const accessCode = codeParts.join('');

    // Validate length
    if (accessCode.length !== 12) {
      setError('Please enter the complete 12-character access code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await loginWithAccessCode({ accessCode });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Access code login failed:', err);
      setError(
        err.response?.data?.message ||
          'Invalid access code. Please try again.',
      );
      // Clear code on error
      setCodeParts(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Administrator Access
            </h1>
            <p className="text-sm text-gray-600">
              Enter your personal 12-character access code
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Inputs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Access Code
              </label>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    value={codeParts[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    maxLength={3}
                    className={`w-20 h-16 text-center text-2xl font-mono font-bold tracking-wider border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 ${
                      error
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Format: ABC-123-DEF-456 (12 alphanumeric characters)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || codeParts.join('').length !== 12}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  ðŸ” Security Note
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Your session will automatically expire after 10 minutes of
                  inactivity. You'll receive a warning at 9 minutes.
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  â† Back to Public Monitoring
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            Lost your access code? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
