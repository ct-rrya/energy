import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Custom Dropdown Component
 * Theme-aware dropdown that replaces native <select> elements
 * Supports light/dark mode with proper styling
 */
export function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) {
        // Open dropdown on Enter or Space when closed
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsOpen(true);
          setFocusedIndex(options.findIndex((opt) => opt.value === value));
        }
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev < options.length - 1 ? prev + 1 : 0;
            scrollToOption(nextIndex);
            return nextIndex;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : options.length - 1;
            scrollToOption(nextIndex);
            return nextIndex;
          });
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].value);
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          scrollToOption(0);
          break;

        case 'End':
          event.preventDefault();
          setFocusedIndex(options.length - 1);
          scrollToOption(options.length - 1);
          break;
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, options, value]);

  function scrollToOption(index: number) {
    if (listRef.current) {
      const option = listRef.current.children[index] as HTMLElement;
      if (option) {
        option.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  function handleSelect(newValue: string) {
    onChange(newValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  }

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Set focus to currently selected item when opening
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setFocusedIndex(-1);
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="eco-input py-1.5 px-3 text-sm flex items-center justify-between gap-2 w-full min-w-[140px]"
        style={{ color: colors.textPrimary }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: colors.textMuted }}
          strokeWidth={2}
        />
      </button>

      {/* Options List */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-[200] mt-1 w-full min-w-[140px] max-h-[240px] overflow-y-auto rounded-lg py-1"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            boxShadow: colors.shadowLg
          }}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className="px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors duration-150"
                style={{
                  backgroundColor: isFocused ? colors.hoverBackground : 'transparent',
                  color: isSelected || isFocused ? colors.accent : colors.textPrimary
                }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: colors.accent }}
                    strokeWidth={2}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
