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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: theme === 'light' 
          ? 'radial-gradient(ellipse at 50% 20%, rgba(57, 255, 136, 0.05) 0%, rgba(245, 247, 250, 0) 70%), linear-gradient(135deg, #F5F7FA 0%, #E8EFF7 50%, #F5F7FA 100%)'
          : 'radial-gradient(ellipse at 50% 20%, rgba(57, 255, 136, 0.08) 0%, rgba(11, 19, 43, 0) 70%), linear-gradient(135deg, #070D18 0%, #0F1621 50%, #070D18 100%)'
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div 
          className="rounded-3xl shadow-2xl p-7 sm:p-9 border transition-all duration-300"
          style={{
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
            borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.15)',
            boxShadow: theme === 'light'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.08)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(57, 255, 136, 0.06)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-2xl mb-4 border transition-transform duration-300 hover:scale-105"
              style={{
                background: theme === 'light' 
                  ? 'linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%)' 
                  : 'linear-gradient(135deg, rgba(57, 255, 136, 0.12) 0%, rgba(11, 19, 43, 0.8) 100%)',
                borderColor: theme === 'light' ? 'rgba(31, 163, 92, 0.2)' : 'rgba(57, 255, 136, 0.25)',
                boxShadow: '0 0 24px rgba(57, 255, 136, 0.15)',
              }}
            >
              <Shield className="w-8 h-8" style={{ color: '#39FF88' }} />
            </div>
            <h1 
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
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
            <div>
              <div className="flex gap-2.5 sm:gap-3 justify-center">
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
                    aria-label={`Access code segment ${index + 1} of 4`}
                    className="w-16 sm:w-20 h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold tracking-widest border-2 rounded-xl transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: error 
                        ? (theme === 'light' ? '#FEF2F2' : 'rgba(220, 38, 38, 0.1)')
                        : (theme === 'light' ? '#F9FAFB' : '#0B132B'),
                      borderColor: error
                        ? '#EF4444'
                        : (theme === 'light' ? '#E5E7EB' : 'rgba(57, 255, 136, 0.2)'),
                      color: theme === 'light' ? '#0B132B' : '#F5F7FA',
                    }}
                    onFocus={(e) => {
                      if (!error) {
                        e.currentTarget.style.borderColor = '#39FF88';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(57, 255, 136, 0.2), 0 0 16px rgba(57, 255, 136, 0.15)';
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
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="flex items-center gap-2.5 p-3 rounded-xl border text-sm"
                style={{
                  backgroundColor: theme === 'light' ? '#FEF2F2' : 'rgba(220, 38, 38, 0.12)',
                  borderColor: theme === 'light' ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)',
                  color: theme === 'light' ? '#991B1B' : '#FCA5A5'
                }}
              >
                <AlertCircle 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ color: '#EF4444' }} 
                />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || codeParts.join('').length !== 12}
              className="w-full font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                backgroundColor: (isLoading || codeParts.join('').length !== 12) 
                  ? (theme === 'light' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.06)')
                  : '#39FF88',
                color: (isLoading || codeParts.join('').length !== 12)
                  ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                  : '#070D18',
                border: (isLoading || codeParts.join('').length !== 12)
                  ? (theme === 'light' ? '1px solid #D1D5DB' : '1px solid rgba(255, 255, 255, 0.08)')
                  : '1px solid #39FF88',
                cursor: (isLoading || codeParts.join('').length !== 12) ? 'not-allowed' : 'pointer',
                boxShadow: (!isLoading && codeParts.join('').length === 12)
                  ? '0 8px 24px -4px rgba(57, 255, 136, 0.35)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && codeParts.join('').length === 12) {
                  e.currentTarget.style.backgroundColor = '#2FD670';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(57, 255, 136, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && codeParts.join('').length === 12) {
                  e.currentTarget.style.backgroundColor = '#39FF88';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(57, 255, 136, 0.35)';
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

          {/* Footer Navigation */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 group"
              style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#39FF88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme === 'light' ? '#6B7280' : '#9CA3AF';
              }}
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back to Public Monitoring
            </button>
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
