import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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
 * - Light/Dark mode support with EcoStep theme
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
  const { theme } = useTheme();

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
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: theme === 'light' 
          ? 'linear-gradient(135deg, #F5F7FA 0%, #E8EFF7 50%, #F5F7FA 100%)'
          : 'linear-gradient(135deg, #0B132B 0%, #0F1621 50%, #0B132B 100%)'
      }}
    >
      <div className="w-full max-w-lg">
        {/* Card */}
        <div 
          className="rounded-2xl shadow-2xl p-8 border transition-colors duration-200"
          style={{
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
            borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)',
              }}
            >
              <Shield className="w-10 h-10" style={{ color: '#39FF88' }} />
            </div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
            >
              Administrator Access
            </h1>
            <p 
              className="text-sm"
              style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
            >
              Enter your personal 12-character access code
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Inputs */}
            <div className="space-y-3">
              <label 
                className="block text-sm font-medium"
                style={{ color: theme === 'light' ? '#374151' : '#D1D5DB' }}
              >
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
                    className="w-20 h-16 text-center text-2xl font-mono font-bold tracking-wider border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4"
                    style={{
                      backgroundColor: error 
                        ? (theme === 'light' ? '#FEF2F2' : 'rgba(220, 38, 38, 0.1)')
                        : (theme === 'light' ? '#FFFFFF' : '#0B132B'),
                      borderColor: error
                        ? '#EF4444'
                        : (theme === 'light' ? '#E5E7EB' : 'rgba(57, 255, 136, 0.2)'),
                      color: theme === 'light' ? '#0B132B' : '#F5F7FA',
                    }}
                    onFocus={(e) => {
                      if (!error) {
                        e.currentTarget.style.borderColor = '#39FF88';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(57, 255, 136, 0.2)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!error) {
                        e.currentTarget.style.borderColor = theme === 'light' ? '#E5E7EB' : 'rgba(57, 255, 136, 0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                ))}
              </div>
              <p 
                className="text-xs text-center mt-2"
                style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}
              >
                Format: ABC-123-DEF-456 (12 alphanumeric characters)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="flex items-start gap-2 p-3 rounded-lg border"
                style={{
                  backgroundColor: theme === 'light' ? '#FEF2F2' : 'rgba(220, 38, 38, 0.1)',
                  borderColor: theme === 'light' ? '#FCA5A5' : 'rgba(220, 38, 38, 0.3)'
                }}
              >
                <AlertCircle 
                  className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  style={{ color: '#EF4444' }} 
                />
                <p 
                  className="text-sm"
                  style={{ color: theme === 'light' ? '#991B1B' : '#FCA5A5' }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || codeParts.join('').length !== 12}
              className="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: (isLoading || codeParts.join('').length !== 12) 
                  ? (theme === 'light' ? '#D1D5DB' : '#374151')
                  : '#39FF88',
                color: (isLoading || codeParts.join('').length !== 12)
                  ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                  : '#0B132B',
                cursor: (isLoading || codeParts.join('').length !== 12) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && codeParts.join('').length === 12) {
                  e.currentTarget.style.backgroundColor = '#2FD670';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(57, 255, 136, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && codeParts.join('').length === 12) {
                  e.currentTarget.style.backgroundColor = '#39FF88';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
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
          <div 
            className="mt-6 pt-6 border-t"
            style={{
              borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
            }}
          >
            <div className="space-y-3">
              <div 
                className="rounded-lg p-3 border"
                style={{
                  backgroundColor: theme === 'light' ? '#EFF6FF' : 'rgba(57, 255, 136, 0.05)',
                  borderColor: theme === 'light' ? '#DBEAFE' : 'rgba(57, 255, 136, 0.15)'
                }}
              >
                <h3 
                  className="text-sm font-semibold mb-1"
                  style={{ color: theme === 'light' ? '#1E3A8A' : '#39FF88' }}
                >
                  🔒 Security Note
                </h3>
                <p 
                  className="text-xs leading-relaxed"
                  style={{ color: theme === 'light' ? '#1E40AF' : '#9CA3AF' }}
                >
                  Your session will automatically expire after 10 minutes of
                  inactivity. You'll receive a warning at 9 minutes.
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                  style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#39FF88';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme === 'light' ? '#6B7280' : '#9CA3AF';
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Public Monitoring
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <p 
            className="text-xs"
            style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}
          >
            Lost your access code? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
