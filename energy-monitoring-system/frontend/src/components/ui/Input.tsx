import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Input Props
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input Component
 * Reusable form input with label, error, and password toggle
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-medium text-[#1A1D23] dark:text-[#EDEEF0]"
          >
            {label}
            {props.required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full rounded-lg border-2 px-4 py-2.5 transition-all',
              'bg-white dark:bg-[#12141A]',
              'text-[#1A1D23] dark:text-[#EDEEF0]',
              'placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                : 'border-[#E5E7EB] dark:border-[#2A2E37] hover:border-[#2FBF71] dark:hover:border-[#3ED98A] focus:border-[#2FBF71] dark:focus:border-[#3ED98A] focus:ring-[#2FBF71]/20 dark:focus:ring-[#3ED98A]/20',
              isPassword && 'pr-12',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${props.id}-error`
                : helperText
                ? `${props.id}-helper`
                : undefined
            }
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#2FBF71] dark:hover:text-[#3ED98A] hover:bg-[#F5F6F8] dark:hover:bg-[#2A2E37] focus:outline-none focus:ring-2 focus:ring-[#2FBF71]/30 dark:focus:ring-[#3ED98A]/30 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-2 text-sm font-medium text-[#EF4444]"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            className="mt-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
