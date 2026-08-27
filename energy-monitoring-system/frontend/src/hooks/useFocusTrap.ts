import { useEffect, useRef } from 'react';

/**
 * useFocusTrap Hook
 * 
 * Traps focus within a container element (useful for modals/dialogs).
 * 
 * @param enabled - Whether focus trap is enabled
 * @returns ref to attach to the container element
 * 
 * @example
 * const trapRef = useFocusTrap(isDialogOpen);
 * 
 * <div ref={trapRef} role="dialog">
 *   <input /> // Focus trapped here
 *   <button /> // And here
 * </div>
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  enabled: boolean
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );
    };

    // Focus first element on mount
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return containerRef;
}
