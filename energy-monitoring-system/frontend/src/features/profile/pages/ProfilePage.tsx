import { useAuth } from '@/contexts/AuthContext';
import { EcoPageHeader, EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { User } from 'lucide-react';
import { ProfileCard } from '../components/ProfileCard';
import { ChangePasswordCard } from '../components/ChangePasswordCard';
import { useProfile } from '../hooks';
import type { UserProfile } from '@/types/user.types';

/**
 * Profile Page Component
 * Redesigned with EcoStep design system
 */
export function ProfilePage() {
  const { user: authUser } = useAuth();
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useProfile();

  // Loading state
  if (isLoading) {
    return (
      <div className="eco-page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={User}
          title="Unable to Load Profile"
          description="Could not connect to the backend server. Please ensure the server is running and try again."
          action={
            <button onClick={() => refetch()} className="eco-btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // Use profile data from API if available, otherwise fall back to auth user
  // Convert auth user to UserProfile format if needed
  const user: UserProfile | null = profileData?.data || (authUser ? {
    id: authUser._id,
    email: authUser.email,
    name: authUser.name,
    role: authUser.role,
    isActive: true, // auth user is always active if logged in
    createdAt: authUser.createdAt,
    updatedAt: authUser.updatedAt,
  } : null);

  if (!user) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={User}
          title="Profile Not Found"
          description="Unable to load profile information. Please try logging in again."
        />
      </div>
    );
  }

  return (
    <div className="eco-page-container">
      {/* Page Header */}
      <EcoPageHeader
        title="Profile & Settings"
        subtitle="Manage your account information and preferences."
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      <div className="space-y-6">
        {/* Content Grid */}
        <div className="eco-grid-2">
          {/* Left Column - Profile Information */}
          <ProfileCard user={user} />

          {/* Right Column - Change Password */}
          <ChangePasswordCard />
        </div>

        {/* Account Status */}
        <EcoCard>
          <h2 className="eco-card-title mb-4">Account Status</h2>
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                user.isActive ? 'bg-[#89D7B7]' : 'bg-[rgb(var(--color-error-500))]'
              }`}
            />
            <span className="text-[#1A312C] dark:text-[#89D7B7] font-medium">
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {user.isActive && (
            <p className="mt-3 text-sm text-[rgb(var(--color-neutral-600))]">
              Your account is active and all features are available.
            </p>
          )}
        </EcoCard>
      </div>
    </div>
  );
}
