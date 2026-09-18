import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

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
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    const { theme } = useTheme();
    const colors = getThemeColors(theme);

    // Determine border color based on state
    const getBorderColor = () => {
      if (error) return colors.error;
      if (isFocused) return colors.accent;
      if (isHovered) return colors.accent;
      return colors.border;
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-medium"
            style={{ color: colors.textPrimary }}
          >
            {label}
            {props.required && <span className="ml-1" style={{ color: colors.error }}>*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full rounded-lg border-2 px-4 py-2.5 transition-all',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isPassword && 'pr-12',
              className
            )}
            style={{
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: getBorderColor(),
              boxShadow: isFocused ? `0 0 0 3px ${error ? colors.error : colors.accent}20` : 'none'
            }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors focus:outline-none"
              style={{
                color: colors.textMuted
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.accent;
                e.currentTarget.style.backgroundColor = colors.hoverBackground;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
            className="mt-2 text-sm font-medium"
            style={{ color: colors.error }}
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            className="mt-2 text-sm"
            style={{ color: colors.textSecondary }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
