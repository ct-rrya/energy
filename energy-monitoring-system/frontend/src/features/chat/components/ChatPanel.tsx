/**
 * ChatPanel Component - EcoGuide
 * 
 * Right-hand panel in the three-column layout:
 * - Desktop/Tablet (>=768px): 330px when expanded, 56px when collapsed
 * - Mobile (<768px): Bottom sheet / full overlay
 * - Synchronized with ecostep.rightCollapsed
 */

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminChatService } from '@/api/services/adminChat.service';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { AdminChatView } from './AdminChatView';
import { AdminQuickInboxView } from './AdminQuickInboxView';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import { useAdminChat } from '../useAdminChat';
import '../chat.css';

interface ChatPanelProps {
  isCollapsed?: boolean;
  isFloating?: boolean;
  isPinned?: boolean;
  onToggleCollapse?: () => void;
  onTogglePin?: () => void;
  onClosePanel?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusCapture?: () => void;
  onBlurCapture?: (e: React.FocusEvent<HTMLElement>) => void;
  onEscapeFloating?: () => void;
}

export function ChatPanel({
  isCollapsed: controlledCollapsed,
  isFloating = false,
  isPinned,
  onToggleCollapse,
  onTogglePin,
  onClosePanel,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  onEscapeFloating,
}: ChatPanelProps) {
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Uncontrolled fallback state if not controlled by parent (default collapsed)
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const pinned = localStorage.getItem('ecostep.rightPinned');
      if (pinned !== null) return pinned !== 'true';
      const stored = localStorage.getItem('ecostep.rightCollapsed');
      if (stored !== null) return stored === 'true';
      const legacyExpanded = localStorage.getItem('ecostep_chat_docked_expanded');
      if (legacyExpanded !== null) return legacyExpanded === 'false';
      return true;
    } catch {
      return true;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const resolvedPinned = isPinned !== undefined ? isPinned : !isCollapsed;

  const panelRef = useRef<HTMLElement>(null);
  const { isAuthenticated, user } = useAuth();
  const isAdmin = Boolean(isAuthenticated && user);

  const [activeMode, setActiveMode] = useState<'bot' | 'admin'>('bot');
  const { messages, isLoading, error, sendMessage, retryLastMessage, clearChat } = useChat();
  const adminChat = useAdminChat(!isAdmin && activeMode === 'admin');

  const { data: adminInboxMeta } = useQuery({
    queryKey: ['admin-chat-threads'],
    queryFn: () => adminChatService.listThreadsForAdmin(),
    enabled: isAdmin,
    refetchInterval: 15_000,
  });
  const secondTabUnread = isAdmin
    ? adminInboxMeta?.totalUnread ?? 0
    : adminChat.unreadCount;

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

  // Keyboard shortcut listener (Ctrl+J always; ] only in standalone mode since EcoSidebar handles ])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFloating && onEscapeFloating) {
        onEscapeFloating();
        return;
      }

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

      const isCtrlJ = (e.key === 'j' || e.key === 'J') && (e.ctrlKey || e.metaKey);
      const isBracket = !onToggleCollapse && e.key === ']';
      if (isCtrlJ || isBracket) {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlledCollapsed, onToggleCollapse, isFloating, onEscapeFloating]);

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

  const [railHovered, setRailHovered] = useState(false);

  // Set scrollTop = 0 on guide on mount
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      setRailHovered(false);
    }
  }, [isCollapsed]);

  const panelClasses = [
    'cp',
    'guide',
    'docked-chat-panel',
    isCollapsed ? 'collapsed' : 'expanded',
    isFloating && !isMobile ? 'is-floating' : '',
    isMobile ? (isMobileOpen ? 'mobile-open' : 'mobile-closed') : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <aside
        ref={panelRef}
        className={panelClasses}
        role="complementary"
        aria-label="EcoGuide"
        id="ecoguide-panel"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
      >
        {/* Collapsed Slim Rail (56px) — Click to expand, hover shows tooltip */}
        <button
          type="button"
          className="docked-chat-rail w-full h-full border-0 bg-transparent cursor-pointer"
          aria-hidden={!isCollapsed || isMobile}
          aria-expanded={!isCollapsed}
          aria-controls="ecoguide-panel"
          aria-label="Expand to chat with EcoGuide"
          onClick={handleToggle}
          onMouseEnter={() => setRailHovered(true)}
          onMouseLeave={() => setRailHovered(false)}
          onFocus={() => setRailHovered(true)}
          onBlur={() => setRailHovered(false)}
        >
          <span
            className="mt-4 text-[var(--acc)] opacity-80"
            aria-hidden="true"
          >
            <MessageSquare size={18} strokeWidth={2} />
          </span>
          <span className="docked-rail-label">EcoGuide</span>
        </button>

        {isCollapsed && !isMobile && railHovered && typeof document !== 'undefined' && createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: '76px',
              right: '68px',
              zIndex: 9999,
            }}
            className="pointer-events-none px-3 py-1.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#131916] text-xs font-medium text-[var(--t)] whitespace-nowrap"
          >
            Expand to chat with EcoGuide
          </div>,
          document.body,
        )}

        {/* Expanded Chat Content (330px desktop / full-height bottom sheet mobile) */}
        <div 
          className="docked-chat-content" 
          aria-hidden={isCollapsed && !isMobile}
        >
          {isMobile && <div className="ecoguide-sheet-handle" aria-hidden="true" />}
          <ChatHeader
            onClose={isMobile ? handleCloseMobile : (onClosePanel ?? handleToggle)}
            onCollapse={onClosePanel ?? handleToggle}
            onTogglePin={onTogglePin}
            onNewChat={clearChat}
            isExpanded={!isCollapsed}
            isPinned={resolvedPinned}
            isFloating={isFloating && !isMobile}
            isMobile={isMobile}
            subtitle={
              activeMode === 'bot'
                ? 'Instant AI assistant'
                : isAdmin
                  ? 'Admin Visitor Inbox'
                  : 'Direct to EcoStep Admin'
            }
            showNewChat={activeMode === 'bot'}
          />

          {/* Mode Switcher: EcoGuide AI vs Talk to Admin / Visitor Inbox (single horizontal row) */}
          <div className="py-2 border-b border-[var(--line)] shrink-0">
            <div
              className="flex items-center gap-1 p-1 rounded-xl bg-[var(--soft)] border border-[var(--line)]"
              role="tablist"
              aria-label="Chat mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'bot'}
                onClick={() => setActiveMode('bot')}
                className={`flex-auto flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeMode === 'bot'
                    ? 'bg-[var(--panel)] text-[var(--t)] shadow-xs border border-[var(--line)]'
                    : 'text-[var(--mu)] hover:text-[var(--t)] border border-transparent'
                }`}
              >
                <Sparkles size={12} className={`shrink-0 ${activeMode === 'bot' ? 'text-[var(--acc)]' : ''}`} />
                <span>EcoGuide AI</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'admin'}
                onClick={() => setActiveMode('admin')}
                className={`flex-auto relative flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeMode === 'admin'
                    ? 'bg-[var(--panel)] text-[var(--t)] shadow-xs border border-[var(--line)]'
                    : 'text-[var(--mu)] hover:text-[var(--t)] border border-transparent'
                }`}
              >
                <ShieldCheck size={12} className={`shrink-0 ${activeMode === 'admin' ? 'text-[var(--acc)]' : ''}`} />
                <span>{isAdmin ? 'Visitor Inbox' : 'Talk to Admin'}</span>
                {secondTabUnread > 0 && activeMode !== 'admin' && (
                  <span
                    className="shrink-0 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[10px] font-bold inline-flex items-center justify-center"
                    aria-label={`${secondTabUnread} unread messages`}
                  >
                    {secondTabUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeMode === 'bot' ? (
            <>
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
            </>
          ) : isAdmin ? (
            <AdminQuickInboxView />
          ) : (
            <>
              <AdminChatView
                messages={adminChat.messages}
                visitorName={adminChat.visitorName}
                isLoading={adminChat.isLoading}
                isSending={adminChat.isSending}
                error={adminChat.error}
                onRefresh={adminChat.refresh}
              />
              <ChatInput
                onSend={adminChat.sendMessage}
                disabled={adminChat.isSending}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
