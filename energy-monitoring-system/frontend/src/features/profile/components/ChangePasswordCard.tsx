import { useState } from 'react';
import { EcoCard } from '@/components/common';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '../hooks';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Change Password Card Component
 * 
 * Form for changing user password.
 * 
 * Features:
 * - Current password verification
 * - New password strength validation
 * - Show/hide password toggle
 * - Form validation
 * - Success/error handling
 */
export function ChangePasswordCard() {
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: changePassword, isPending } = useChangePassword();

  // Theme-aware colors
  const colors = {
    textPrimary: theme === 'light' ? '#1F2937' : '#F9FAFB',
    textSecondary: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: '#10B981',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return;
    }

    changePassword(
      {
        currentPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          // Reset form
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;
  const isNewPasswordValid = newPassword.length >= 8;
  const canSubmit =
    currentPassword.length >= 6 &&
    isNewPasswordValid &&
    newPassword === confirmPassword &&
    currentPassword !== newPassword;

  return (
    <EcoCard>
      <div className="mb-6">
        <h2 className="eco-card-title">Change Password</h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Update your password to keep your account secure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.accent }}>
            <Lock className="inline h-4 w-4 mr-2" />
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              minLength={6}
              required
              disabled={isPending}
              className="eco-input"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: colors.accent }}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.accent }}>
            <Lock className="inline h-4 w-4 mr-2" />
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={8}
              required
              disabled={isPending}
              className="eco-input"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: colors.accent }}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-xs" style={{ color: colors.textSecondary }}>Password must contain:</p>
            <ul className="text-xs space-y-0.5 ml-4 list-disc" style={{ color: colors.textSecondary }}>
              <li className={newPassword.length >= 8 ? 'font-medium' : ''} style={{ color: newPassword.length >= 8 ? colors.accent : colors.textSecondary }}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'font-medium' : ''} style={{ color: /[A-Z]/.test(newPassword) ? colors.accent : colors.textSecondary }}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'font-medium' : ''} style={{ color: /[a-z]/.test(newPassword) ? colors.accent : colors.textSecondary }}>
                One lowercase letter
              </li>
              <li className={/\d/.test(newPassword) ? 'font-medium' : ''} style={{ color: /\d/.test(newPassword) ? colors.accent : colors.textSecondary }}>
                One number
              </li>
              <li className={/[@$!%*?&]/.test(newPassword) ? 'font-medium' : ''} style={{ color: /[@$!%*?&]/.test(newPassword) ? colors.accent : colors.textSecondary }}>
                One special character (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.accent }}>
            <Lock className="inline h-4 w-4 mr-2" />
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              disabled={isPending}
              className={`eco-input ${!passwordsMatch ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: colors.accent }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={!canSubmit || isPending} 
            className="eco-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </EcoCard>
  );
}