import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';

/**
 * Button Variants
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default';
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button Props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button Component
 * Reusable button with variants, sizes, and loading state
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        'bg-gradient-to-br from-[rgb(var(--color-secondary-400))] to-[rgb(var(--color-secondary-500))] text-white hover:from-[rgb(var(--color-secondary-500))] hover:to-[rgb(var(--color-secondary-600))] active:from-[rgb(var(--color-secondary-600))] active:to-[rgb(var(--color-secondary-700))] focus:ring-[rgb(var(--color-secondary-400))]/30 shadow-lg hover:shadow-xl hover:translate-y-[-2px] font-semibold',
      primary:
        'bg-[#2FBF71] dark:bg-[#3ED98A] text-white dark:text-[#0B0D12] hover:bg-[#28a863] dark:hover:bg-[#35c27b] active:bg-[#239153] dark:active:bg-[#2cab6c] focus:ring-[#2FBF71]/30 dark:focus:ring-[#3ED98A]/30 shadow-lg hover:shadow-xl hover:translate-y-[-1px] font-semibold transition-all duration-200',
      secondary:
        'glass text-[rgb(var(--color-primary-500))] border-2 border-[rgb(var(--color-primary-500))]/30 hover:border-[rgb(var(--color-primary-500))] hover:bg-white/60 active:bg-white/80 focus:ring-[rgb(var(--color-primary-500))]/20 font-medium',
      danger:
        'bg-gradient-to-br from-[rgb(var(--color-error-500))] to-[rgb(var(--color-error-600))] text-white hover:from-[rgb(var(--color-error-600))] hover:to-[rgb(var(--color-error-700))] active:from-[rgb(var(--color-error-700))] active:to-[rgb(var(--color-error-600))] focus:ring-[rgb(var(--color-error-500))]/30 shadow-lg hover:shadow-xl hover:translate-y-[-2px] font-semibold',
      outline:
        'border-2 border-[rgb(var(--color-secondary-400))] text-[rgb(var(--color-secondary-400))] bg-transparent hover:bg-[rgb(var(--color-secondary-50))] active:bg-[rgb(var(--color-secondary-100))] focus:ring-[rgb(var(--color-secondary-400))]/20 font-medium',
      ghost:
        'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F5F6F8] dark:hover:bg-[#2A2E37] hover:text-[#1A1D23] dark:hover:text-[#EDEEF0] active:bg-[#E5E7EB] dark:active:bg-[#2A2E37] focus:ring-[#2FBF71]/20 dark:focus:ring-[#3ED98A]/20 font-medium',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner size="sm" className="absolute left-4" />
        )}
        <span className={cn(isLoading && 'opacity-0')}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
