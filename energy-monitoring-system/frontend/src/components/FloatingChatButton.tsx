import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ChatInterface from '@/features/chat/components/ChatInterface';

/**
 * CSS Animations for expand/collapse and floating button
 * Requirements: 4.12, 12.10, 12.11
 */
const floatingChatStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  /* Smooth transitions for expand/collapse */
  .chat-panel-enter {
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .chat-panel-exit {
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Floating button animations */
  .floating-button-pulse {
    animation: pulse 2s infinite ease-in-out;
  }

  /* Prevent body scroll when chat is expanded on mobile */
  .chat-expanded-mobile {
    overflow: hidden;
  }

  /* Mobile full-screen chat */
  @media (max-width: 768px) {
    .floating-chat-panel {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 0 !important;
      margin: 0 !important;
    }
  }

  /* Reduced motion support - Requirement 18.9 */
  @media (prefers-reduced-motion: reduce) {
    @keyframes slideUp {
      from, to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes slideDown {
      from, to {
        opacity: 0;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
    }
    
    .chat-panel-enter,
    .chat-panel-exit,
    .floating-button-pulse {
      animation-duration: 0.01ms !important;
    }
  }
`;

// Inject animation styles
if (typeof document !== 'undefined' && !document.getElementById('floating-chat-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'floating-chat-animations';
  styleSheet.textContent = floatingChatStyles;
  document.head.appendChild(styleSheet);
}

/**
 * FloatingChatButton Component
 * 
 * A floating action button that expands into a full chat interface.
 * Positioned at bottom-right corner on desktop, full-screen on mobile.
 * Maintains session state when collapsed/expanded.
 * 
 * Features:
 * - Expandable/collapsible chat panel
 * - Smooth slide-up/fade-in animations
 * - Responsive design (400x600px desktop, full-screen mobile)
 * - Session persistence across expand/collapse
 * - EcoStep design system integration
 * - Keyboard accessibility with Escape to close
 * - Focus management
 * 
 * Requirements: 4.1, 4.2, 4.12, 7.7, 7.8, 12.1, 12.2, 12.3, 12.4, 12.10, 12.11
 */
export default function FloatingChatButton() {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Toggle chat panel expand/collapse
   * Requirements 18.2, 18.3, 18.4: Keyboard navigation, announce state changes, and focus management
   */
  const toggleChat = () => {
    if (isAnimating) return;

    if (!isExpanded) {
      // Save current focus before opening
      previousFocusRef.current = document.activeElement as HTMLElement;
      setIsExpanded(true);
      setIsAnimating(true);
      
      // Announce chat opening to screen readers - Requirement 18.3
      setStatusMessage('Chat assistant opened. You can now ask questions about your energy monitoring system.');

      // Focus first interactive element in chat after animation
      setTimeout(() => {
        setIsAnimating(false);
        // Focus the first focusable element (typically the input field)
        const focusableElements = chatPanelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          // Find the chat input (usually near the end)
          const chatInput = Array.from(focusableElements).find(
            el => el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'
          );
          (chatInput || focusableElements[0]).focus();
        } else {
          chatPanelRef.current?.focus();
        }
      }, prefersReducedMotion ? 10 : 300);
    } else {
      // Closing
      setIsAnimating(true);
      
      // Announce chat closing to screen readers - Requirement 18.3
      setStatusMessage('Chat assistant closed.');
      
      setTimeout(() => {
        setIsExpanded(false);
        setIsAnimating(false);

        // Restore focus to button after closing
        setTimeout(() => {
          buttonRef.current?.focus();
        }, 10);
      }, prefersReducedMotion ? 10 : 300);
    }
  };

  /**
   * Handle Escape key to close chat
   * Requirement 18.2: Keyboard navigation (Escape)
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && !isAnimating) {
        toggleChat();
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll on mobile when chat is open
      if (window.innerWidth <= 768) {
        document.body.classList.add('chat-expanded-mobile');
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('chat-expanded-mobile');
    };
  }, [isExpanded, isAnimating]);

  /**
   * Trap focus within chat panel when expanded
   * Requirements 18.1, 18.2, 18.8: ARIA labels, keyboard navigation, and focus trap
   */
  useEffect(() => {
    if (!isExpanded || isAnimating) return;

    const focusableElements = chatPanelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Ensure focus stays within the chat panel
      const currentFocusIndex = Array.from(focusableElements).findIndex(
        el => el === document.activeElement
      );

      if (e.shiftKey) {
        // Shift + Tab (backwards navigation)
        if (currentFocusIndex === 0 || document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward navigation)
        if (currentFocusIndex === focusableElements.length - 1 || document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isExpanded, isAnimating]);

  return (
    <>
      {/* Floating Chat Button - Requirements: 12.3, 12.11, 18.1, 18.2 */}
      {!isExpanded && (
        <button
          ref={buttonRef}
          onClick={toggleChat}
          onKeyDown={(e) => {
            // Requirement 18.2: Keyboard navigation (Enter and Space)
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleChat();
            }
          }}
          aria-label="Open chat assistant to get help with energy monitoring"
          aria-expanded={isExpanded}
          aria-haspopup="dialog"
          aria-controls="floating-chat-panel"
          className="floating-button-pulse"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            minWidth: '60px',
            minHeight: '60px',
            borderRadius: '50%',
            backgroundColor: '#89D7B7', // EcoStep accent color
            border: 'none',
            boxShadow: theme === 'light'
              ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
              : '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: prefersReducedMotion ? 'none' : 'transform 0.2s, box-shadow 0.2s',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = theme === 'light'
                ? '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)'
                : '0 6px 16px rgba(0, 0, 0, 0.5), 0 3px 6px rgba(0, 0, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = theme === 'light'
                ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)';
            }
          }}
          onFocus={(e) => {
            // Improved focus indicator - Requirement 18.5
            e.currentTarget.style.outline = '3px solid #428475';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          {/* Chat Icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A312C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h8M8 14h4" />
          </svg>

          {/* 
            TODO: Notification Badge (Future Enhancement)
            Requirements: 12.11 - Add notification badge for unread messages
            
            Implementation placeholder:
            - Show red badge with count when unread messages exist
            - Position: top-right corner of button (absolute positioning)
            - Style: 18px diameter circle, #EF4444 background, white text
            - Accessibility: Include aria-label with unread count
            
            Example structure:
            {unreadCount > 0 && (
              <div
                role="status"
                aria-label={`${unreadCount} unread messages`}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #89D7B7',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          */}
        </button>
      )}

      {/* Expandable Chat Panel - Requirements: 4.12, 12.10, 18.1, 18.4, 18.8 */}
      {(isExpanded || isAnimating) && (
        <div
          id="floating-chat-panel"
          ref={chatPanelRef}
          role="dialog"
          aria-label="Chat assistant panel - Ask questions about your energy monitoring system"
          aria-modal="true"
          aria-describedby="chat-description"
          tabIndex={-1}
          className={`floating-chat-panel ${
            isExpanded && !isAnimating ? 'chat-panel-enter' : 'chat-panel-exit'
          }`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            height: '600px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 10000,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: theme === 'light'
              ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)',
            outline: 'none',
          }}
        >
          {/* Chat Header with Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              backgroundColor: '#1A312C', // Primary color
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(137, 215, 183, 0.2)',
            }}
          >
            {/* Hidden description for screen readers - Requirement 18.1 */}
            <span id="chat-description" className="sr-only" style={{ 
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0
            }}>
              Interactive chat assistant for energy monitoring questions. Use Tab to navigate, Enter to interact with buttons, and Escape to close.
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* EcoStep Logo - Requirement 12.5 */}
              <div
                aria-hidden="true"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#89D7B7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1A312C',
                  flexShrink: 0,
                }}
              >
                🌱
              </div>
              <span
                style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                EcoStep Chat
              </span>
            </div>

            {/* Close Button - Requirements 4.12, 18.1, 18.2 */}
            <button
              onClick={toggleChat}
              onKeyDown={(e) => {
                // Requirement 18.2: Keyboard navigation (Enter, Space, Escape)
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleChat();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  toggleChat();
                }
              }}
              aria-label="Close chat assistant panel"
              title="Close chat (Esc)"
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: prefersReducedMotion ? 'none' : 'background-color 0.2s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid #89D7B7';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {/* Close Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ChatInterface Component - Requirements: 4.2, 4.3, 4.4, 4.5, 7.7, 7.8 */}
          <div
            style={{
              height: 'calc(100% - 64px)', // Subtract header height
              overflow: 'hidden',
            }}
          >
            <ChatInterface
              className="floating-chat-interface"
              initialMessage="👋 Hi! I'm your EcoStep assistant. Ask me about energy status, analytics, or system insights!"
            />
          </div>
        </div>
      )}

      {/* Backdrop for mobile (optional, can add for better UX) */}
      {isExpanded && window.innerWidth <= 768 && (
        <div
          onClick={toggleChat}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Screen reader announcement region for chat state changes - Requirement 18.3 */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {statusMessage}
      </div>
    </>
  );
}
