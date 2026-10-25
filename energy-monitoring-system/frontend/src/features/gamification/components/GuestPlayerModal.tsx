import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Gamepad2, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

export function GuestPlayerModal() {
  const { isModalOpen, closePlayerModal, createPlayer, isSubmitting, error, clearError } = usePlayer();
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isModalOpen) {
      setUsername('');
      setValidationError(null);
      clearError();
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, clearError]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isSubmitting) {
        closePlayerModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSubmitting, closePlayerModal]);

  if (!isModalOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    clearError();

    const trimmed = val.trim();
    if (!trimmed) {
      setValidationError(null);
      return;
    }

    if (trimmed.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }

    if (trimmed.length > 20) {
      setValidationError('Username cannot exceed 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setValidationError('Only letters, numbers, underscores (_), and hyphens (-) allowed');
      return;
    }

    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      setValidationError('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setValidationError('Only letters, numbers, underscores (_), and hyphens (-) allowed');
      return;
    }

    await createPlayer(trimmed);
  };

  const isFormValid = username.trim().length >= 3 && username.trim().length <= 20 && !validationError;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-player-title"
      className="ov fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        background: 'rgba(13, 27, 20, 0.45)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          closePlayerModal();
        }
      }}
    >
      <div
        className="md relative w-full"
        style={{
          maxWidth: '536px',
          width: '100%',
          borderRadius: '24px',
          padding: '34px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
          color: 'var(--t)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closePlayerModal}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="ib absolute top-5 right-5 flex items-center justify-center transition-colors"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--soft)',
            border: 'none',
            color: 'var(--mu)',
            cursor: 'pointer',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #BFF0D2, #19D46A)',
              color: '#0D1B14',
            }}
          >
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <h2
              id="guest-player-title"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--t)',
                lineHeight: 1.2,
              }}
            >
              Play &amp; Learn
            </h2>
            <p
              className="lb"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--acc)',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              Guest Player Experience
            </p>
          </div>
        </div>

        {/* Informational Subtext */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.7,
            color: 'var(--mu)',
            marginBottom: '20px',
          }}
        >
          Choose a username to join the EcoStep gamified experience. No password, email, or registration form required.
        </p>

        {/* Error Banners */}
        {error && (
          <div
            className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
            }}
          >
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Username Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="guest-username-input"
                className="lb"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--mu)',
                }}
              >
                Choose Your Username
              </label>
              <span className="text-xs font-mono" style={{ color: 'var(--mu)' }}>
                {username.trim().length}/20
              </span>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                id="guest-username-input"
                type="text"
                value={username}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="e.g. EcoExplorer42"
                maxLength={20}
                autoComplete="off"
                spellCheck="false"
                style={{
                  borderRadius: '16px',
                  padding: '14px 18px 15px',
                  backgroundColor: 'var(--soft)',
                  border: validationError ? '1px solid #EF4444' : '1px solid var(--line)',
                  color: 'var(--t)',
                  width: '100%',
                  fontSize: '14px',
                  outline: 'none',
                }}
                className="transition-all focus:border-[#19D46A] focus:ring-4 focus:ring-[#19D46A]/20"
              />
              {isFormValid && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#19D46A]">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </div>

            {validationError ? (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {validationError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--mu)' }}>
                Allowed: Letters, numbers, hyphens (-), and underscores (_)
              </p>
            )}
          </div>

          {/* Browser Storage Notice */}
          <div
            className="p-3 text-xs leading-relaxed"
            style={{
              borderRadius: '14px',
              backgroundColor: 'var(--soft)',
              border: '1px solid var(--line)',
              color: 'var(--mu)',
            }}
          >
            <span className="font-semibold" style={{ color: 'var(--t)' }}>
              Session Notice:
            </span>{' '}
            Your guest player profile is recognized automatically on this browser. Clearing your browser data will reset your anonymous session.
          </div>

          {/* Form Actions - Footer Grid 1fr 2fr gap 12px, margin-top 28px */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: '1fr 2fr',
              gap: '12px',
              marginTop: '28px',
            }}
          >
            <button
              type="button"
              onClick={closePlayerModal}
              disabled={isSubmitting}
              style={{
                borderRadius: '16px',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'var(--soft)',
                border: '1px solid var(--line)',
                color: 'var(--mu)',
                cursor: 'pointer',
              }}
              className="transition-colors hover:opacity-80"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              style={{
                borderRadius: '16px',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: isFormValid && !isSubmitting ? '#19D46A' : 'var(--dis)',
                color: isFormValid && !isSubmitting ? '#0D1B14' : 'var(--disT)',
                border: 'none',
                cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              }}
              className="flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Start Playing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
