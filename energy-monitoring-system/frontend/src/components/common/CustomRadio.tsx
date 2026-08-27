import { Check } from 'lucide-react';

export interface RadioOption {
  value: string;
  label: string;
}

interface CustomRadioProps {
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Custom Radio Component
 * Theme-aware radio button group that replaces native radio inputs
 * Supports light/dark mode with proper styling
 */
export function CustomRadio({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}: CustomRadioProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <label
            key={option.value}
            className={`
              flex items-center gap-2 cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`
                relative w-5 h-5 rounded-full border-2 transition-all duration-200
                flex items-center justify-center flex-shrink-0
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-[#2FBF71] dark:border-[#3ED98A] bg-[#2FBF71] dark:bg-[#3ED98A] focus:ring-[#2FBF71] dark:focus:ring-[#3ED98A]'
                    : 'border-[#9CA3AF] dark:border-[#6B7280] bg-transparent hover:border-[#2FBF71] dark:hover:border-[#3ED98A] focus:ring-[#2FBF71] dark:focus:ring-[#3ED98A]'
                }
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <Check
                  className="h-3 w-3 text-white"
                  strokeWidth={3}
                />
              )}
            </button>
            <span className="text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
