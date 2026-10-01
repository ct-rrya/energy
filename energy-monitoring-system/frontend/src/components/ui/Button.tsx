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
        'bg-[#525252] text-white hover:bg-[#404040] hover:opacity-95 active:bg-[#333333] focus:ring-[#525252]/30 font-medium',
      primary:
        'bg-[#39FF88] text-[#0B132B] hover:bg-[#2EE577] hover:opacity-95 active:bg-[#1FA35C] focus:ring-[#39FF88]/30 font-semibold',
      secondary:
        'bg-[#F5F5F5] dark:bg-[#2A2E37] text-[#525252] dark:text-[#9CA3AF] border border-[rgba(26,49,44,0.08)] dark:border-[rgba(137,215,183,0.12)] hover:bg-[#E5E5E5] dark:hover:bg-[#3A3E47] hover:opacity-95 active:bg-[#D4D4D8] dark:active:bg-[#3A3E47] focus:ring-[#39FF88]/20 font-medium',
      danger:
        'bg-[#EF4444] text-white hover:bg-[#DC2626] hover:opacity-95 active:bg-[#B91C1C] focus:ring-[#EF4444]/30 font-medium',
      outline:
        'border border-[#39FF88] text-[#39FF88] bg-transparent hover:bg-[#39FF88]/10 hover:opacity-95 active:bg-[#39FF88]/20 focus:ring-[#39FF88]/20 font-medium',
      ghost:
        'text-[#525252] dark:text-[#9CA3AF] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2E37] hover:opacity-95 hover:text-[#171717] dark:hover:text-[#F9FAFB] active:bg-[#E5E5E5] dark:active:bg-[#2A2E37] focus:ring-[#39FF88]/20 font-medium',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm font-medium',
      md: 'px-4 py-2.5 text-base font-medium',
      lg: 'px-6 py-3 text-lg font-medium',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
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
