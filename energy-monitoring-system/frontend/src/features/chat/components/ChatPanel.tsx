/**
 * ChatPanel Component - EcoGuide
 * 
 * Right-hand panel in the three-column layout:
 * - Desktop/Tablet (>=768px): 330px when expanded, 56px when collapsed
 * - Mobile (<768px): Bottom sheet / full overlay
 * - Synchronized with ecostep.rightCollapsed
 */

import { useEffect, useState, useRef } from 'react';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import '../chat.css';

interface ChatPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatPanel({ isCollapsed: controlledCollapsed, onToggleCollapse }: ChatPanelProps) {
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Uncontrolled fallback state if not controlled by parent
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('ecostep.rightCollapsed');
      if (stored !== null) return stored === 'true';
      const legacyExpanded = localStorage.getItem('ecostep_chat_docked_expanded');
      if (legacyExpanded !== null) return legacyExpanded === 'false';
      return window.innerWidth < 1280;
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const panelRef = useRef<HTMLElement>(null);
  const { messages, isLoading, error, sendMessage, retryLastMessage, clearChat } = useChat();

  // Track viewport changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('ecostep.rightCollapsed', String(next));
          localStorage.setItem('ecostep_chat_docked_expanded', String(!next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  };

  // Keyboard shortcut listener for standalone mode (] or Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === ']' || ((e.key === 'j' || e.key === 'J') && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlledCollapsed, onToggleCollapse]);

  const handleCloseMobile = () => {
    setIsMobileOpen(false);
    window.dispatchEvent(new CustomEvent('ecostep:closechat'));
  };

  // Listen for custom events (e.g. from mobile chat triggers)
  useEffect(() => {
    const handleOpen = () => {
      if (isMobile) {
        setIsMobileOpen(true);
      } else if (isCollapsed) {
        handleToggle();
      }
    };

    const handleClose = () => {
      if (isMobile) {
        setIsMobileOpen(false);
      } else if (!isCollapsed) {
        handleToggle();
      }
    };

    window.addEventListener('ecostep:openchat', handleOpen);
    window.addEventListener('ecostep:closechat', handleClose);

    return () => {
      window.removeEventListener('ecostep:openchat', handleOpen);
      window.removeEventListener('ecostep:closechat', handleClose);
    };
  }, [isMobile, isCollapsed]);

  // Set scrollTop = 0 on guide on mount
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, []);

  const panelClasses = [
    'cp',
    'guide',
    'docked-chat-panel',
    isCollapsed ? 'collapsed' : 'expanded',
    isMobile ? (isMobileOpen ? 'mobile-open' : 'mobile-closed') : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          className="ecoguide-mobile-backdrop"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        ref={panelRef}
        className={panelClasses}
        role="complementary"
        aria-label="Chat"
        id="ecoguide-panel"
      >
        {/* Collapsed Slim Rail (56px) */}
        <div 
          className="docked-chat-rail" 
          aria-hidden={!isCollapsed || isMobile}
        >
          <button
            type="button"
            className="ib es-toggle-btn"
            onClick={handleToggle}
            aria-expanded={false}
            aria-controls="ecoguide-panel"
            aria-label="Expand EcoGuide"
            title="Expand EcoGuide ( ] )"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span
            className="mt-6 text-[var(--acc)] opacity-70"
            aria-hidden="true"
          >
            <MessageSquare size={18} strokeWidth={2} />
          </span>
          <span className="docked-rail-label">EcoGuide</span>
        </div>

        {/* Expanded Chat Content (330px desktop / full-height bottom sheet mobile) */}
        <div 
          className="docked-chat-content" 
          aria-hidden={isCollapsed && !isMobile}
        >
          {isMobile && <div className="ecoguide-sheet-handle" aria-hidden="true" />}
          <ChatHeader
            onClose={isMobile ? handleCloseMobile : handleToggle}
            onCollapse={handleToggle}
            onNewChat={clearChat}
            isExpanded={!isCollapsed}
            isMobile={isMobile}
          />

          <MessageList
            messages={messages}
            isLoading={isLoading}
            onSuggestionClick={sendMessage}
          />

          {error && (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              <button
                className="chat-error-retry"
                onClick={retryLastMessage}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </aside>
    </>
  );
}
