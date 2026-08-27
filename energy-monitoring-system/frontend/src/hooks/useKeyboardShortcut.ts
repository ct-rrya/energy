import { useEffect } from 'react';

/**
 * Keyboard Shortcut Configuration
 */
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * useKeyboardShortcut Hook
 * 
 * Registers a keyboard shortcut handler.
 * 
 * @param shortcut - Keyboard shortcut configuration
 * @param callback - Function to call when shortcut is pressed
 * @param enabled - Whether the shortcut is enabled (default: true)
 * 
 * @example
 * // Ctrl/Cmd + K
 * useKeyboardShortcut(
 *   { key: 'k', ctrlKey: true },
 *   () => setSearchOpen(true)
 * );
 * 
 * // Escape
 * useKeyboardShortcut(
 *   { key: 'Escape' },
 *   () => setDialogOpen(false)
 * );
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        key,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        metaKey = false,
      } = shortcut;

      const matches =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey;

      if (matches) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled]);
}

/**
 * useEscapeKey Hook
 * 
 * Convenience hook for handling Escape key.
 * 
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the handler is enabled (default: true)
 * 
 * @example
 * useEscapeKey(() => setDialogOpen(false));
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useKeyboardShortcut({ key: 'Escape' }, callback, enabled);
}

/**
 * useEnterKey Hook
 * 
 * Convenience hook for handling Enter key.
 * 
 * @param callback - Function to call when Enter is pressed
 * @param enabled - Whether the handler is enabled (default: true)
 * 
 * @example
 * useEnterKey(() => handleSubmit());
 */
export function useEnterKey(callback: () => void, enabled = true) {
  useKeyboardShortcut({ key: 'Enter' }, callback, enabled);
}
