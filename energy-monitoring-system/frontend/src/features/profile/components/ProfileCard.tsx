import { useState } from 'react';
import type { UserProfile } from '@/types/user.types';
import { EcoCard } from '@/components/common';
import { User as UserIcon, Mail, Shield, Calendar, Edit2, X, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useUpdateProfile } from '../hooks';

/**
 * Profile Card Props
 */
interface ProfileCardProps {
  user: UserProfile;
}

/**
 * Profile Card Component
 * 
 * Displays user profile information with inline editing.
 * 
 * Features:
 * - Display mode
 * - Edit mode
 * - Inline form submission
 * - Loading states
 */
export function ProfileCard({ user }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === user.name) {
      setIsEditing(false);
      return;
    }

    updateProfile(
      { name: name.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setName(user.name);
    setIsEditing(false);
  };

  return (
    <EcoCard>
      <h2 className="eco-card-title mb-6">Profile Information</h2>

      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
            <UserIcon className="inline h-4 w-4 mr-2" />
            Name
          </label>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                minLength={2}
                maxLength={100}
                required
                disabled={isPending}
                className="eco-input flex-1"
              />
              <button
                type="submit"
                disabled={isPending || name.trim().length < 2}
                className="eco-btn-primary px-3"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="eco-btn-secondary px-3"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[#1A312C] dark:text-[#FFF4E1]">{user.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="eco-btn-secondary px-3 py-1 text-sm"
              >
                <Edit2 className="h-3 w-3 mr-1 inline" />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email Field (Read-only) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
            <Mail className="inline h-4 w-4 mr-2" />
            Email
          </label>
          <div className="text-[#1A312C] dark:text-[#FFF4E1]">{user.email}</div>
          <p className="text-xs mt-1" style={{ color: 'rgba(26, 49, 44, 0.5)' }}>Email cannot be changed</p>
        </div>

        {/* Role Field (Read-only) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
            <Shield className="inline h-4 w-4 mr-2" />
            Role
          </label>
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium" style={{ 
            background: 'rgba(137, 215, 183, 0.15)',
            color: '#428475',
            border: '1px solid rgba(137, 215, 183, 0.3)'
          }}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        {/* Account Created */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
            <Calendar className="inline h-4 w-4 mr-2" />
            Account Created
          </label>
          <div className="text-[#1A312C] dark:text-[#FFF4E1]">{formatDate(new Date(user.createdAt))}</div>
        </div>

        {/* Last Login */}
        {user.lastLoginAt && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#428475' }}>
              <Calendar className="inline h-4 w-4 mr-2" />
              Last Login
            </label>
            <div className="text-[#1A312C] dark:text-[#FFF4E1]">{formatDate(new Date(user.lastLoginAt))}</div>
          </div>
        )}
      </div>
    </EcoCard>
  );
}
