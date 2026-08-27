import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { showToast } from '@/components/common/Toast';
import { ROUTES } from '@/routes/routes.config';
import type { ApiError } from '@/types';

/**
 * Login Form Component
 * Handles user authentication with validation
 */
export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      
      // Call login function from AuthContext
      await login(data);

      // Show success message
      showToast('Login successful! Welcome back.', 'success');

      // Redirect to dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error instanceof AxiosError) {
        const apiError = error.response?.data as ApiError;
        
        if (error.code === 'ERR_NETWORK' || !error.response) {
          showToast(
            'Cannot connect to server. Please make sure the backend is running at http://localhost:3000',
            'error'
          );
        } else if (error.response?.status === 401) {
          showToast(
            'Invalid email or password. Please try again.',
            'error'
          );
        } else if (error.response?.status === 500) {
          showToast(
            'Server error. Please try again later.',
            'error'
          );
        } else {
          showToast(
            apiError?.message || `Error: ${error.message}`,
            'error'
          );
        }
      } else if (error instanceof Error) {
        showToast(
          `Error: ${error.message}`,
          'error'
        );
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email Input */}
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="admin@example.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isSubmitting}
        required
        {...register('email')}
      />

      {/* Password Input */}
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        required
        {...register('password')}
      />

      {/* Remember Me */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-2 border-[rgb(var(--color-neutral-300))] text-[rgb(var(--color-secondary-400))] focus:ring-[rgb(var(--color-secondary-400))] focus:ring-offset-0 transition-colors cursor-pointer"
          />
          <span className="text-sm font-medium text-[rgb(var(--color-neutral-700))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors">
            Remember me
          </span>
        </label>
        <button
          type="button"
          className="text-sm font-medium text-[rgb(var(--color-secondary-400))] hover:text-[rgb(var(--color-secondary-500))] hover:underline transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button - More prominent */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgb(var(--color-neutral-200))]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-[rgb(var(--color-neutral-500))] font-medium">
            Quick Login
          </span>
        </div>
      </div>

      {/* Quick Login Hint */}
      <div className="text-center">
        <p className="text-xs text-[rgb(var(--color-neutral-600))]">
          Use the demo credentials below to sign in
        </p>
      </div>
    </form>
  );
}
