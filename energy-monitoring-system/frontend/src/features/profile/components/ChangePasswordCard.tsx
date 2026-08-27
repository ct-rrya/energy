import { useState } from 'react';
import { EcoCard } from '@/components/common';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '../hooks';

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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: changePassword, isPending } = useChangePassword();

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
        <p className="text-sm mt-1" style={{ color: 'rgba(26, 49, 44, 0.65)' }}>
          Update your password to keep your account secure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
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
              style={{ color: '#428475' }}
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
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
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
              style={{ color: '#428475' }}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-xs" style={{ color: 'rgba(26, 49, 44, 0.6)' }}>Password must contain:</p>
            <ul className="text-xs space-y-0.5 ml-4 list-disc" style={{ color: 'rgba(26, 49, 44, 0.6)' }}>
              <li className={newPassword.length >= 8 ? 'text-[#428475] font-medium' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-[#428475] font-medium' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-[#428475] font-medium' : ''}>
                One lowercase letter
              </li>
              <li className={/\d/.test(newPassword) ? 'text-[#428475] font-medium' : ''}>
                One number
              </li>
              <li className={/[@$!%*?&]/.test(newPassword) ? 'text-[#428475] font-medium' : ''}>
                One special character (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
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
              style={{ color: '#428475' }}
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
