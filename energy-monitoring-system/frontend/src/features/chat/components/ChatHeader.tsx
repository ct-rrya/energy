/**
 * ChatHeader Component
 * 
 * EcoGuide header with title (17px), subtitle (13px muted),
 * and 32x32 circular icon buttons (.ib style).
 */

import { RotateCcw, ChevronRight, ChevronDown, Pin, Bell, BellOff } from 'lucide-react';
import '../chat.css';

interface ChatHeaderProps {
  onClose?: () => void;
  onCollapse?: () => void;
  onTogglePin?: () => void;
  onNewChat: () => void;
  onToggleAlertsMute?: () => void;
  isAlertsMuted?: boolean;
  isExpanded?: boolean;
  isPinned?: boolean;
  isFloating?: boolean;
  isMobile?: boolean;
  subtitle?: string;
  showNewChat?: boolean;
}

export function ChatHeader({
  onClose,
  onCollapse,
  onTogglePin,
  onNewChat,
  onToggleAlertsMute,
  isAlertsMuted = false,
  isExpanded = true,
  isPinned = false,
  isFloating = false,
  isMobile = false,
  subtitle = 'Learning assistant',
  showNewChat = true,
}: ChatHeaderProps) {
  const handleClose = () => {
    if (isMobile && onClose) {
      onClose();
    } else if (onCollapse) {
      onCollapse();
    } else if (onClose) {
      onClose();
    }
  };

  const handlePin = () => {
    if (onTogglePin) {
      onTogglePin();
    } else if (onCollapse) {
      onCollapse();
    }
  };

  const pinAriaLabel = isPinned
    ? 'Unpin and close EcoGuide'
    : 'Pin EcoGuide to page';
  const pinTitle = isPinned
    ? 'Unpin and close EcoGuide'
    : 'Pin EcoGuide as part of page';

  const closeAriaLabel = isMobile ? 'Close chat' : 'Collapse EcoGuide';
  const closeTitle = isMobile ? 'Close' : 'Collapse EcoGuide ( ] )';

  return (
    <div className="chat-header row">
      <div className="min-w-0">
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--t)' }}>EcoGuide</h2>
        <div className="sub text-[13px] text-[var(--mu)] truncate">{subtitle}</div>
      </div>
      
      <div className="ibs flex items-center gap-1.5 shrink-0">
        {onToggleAlertsMute && (
          <button
            className="ib"
            onClick={onToggleAlertsMute}
            aria-label={isAlertsMuted ? 'Unmute chat notifications' : 'Mute chat notifications'}
            aria-pressed={isAlertsMuted}
            type="button"
            title={
              isAlertsMuted
                ? 'Chat alerts muted (click to turn on sound & toast)'
                : 'Mute chat alerts (sound & toast)'
            }
            style={
              isAlertsMuted
                ? {
                    borderColor: 'rgba(245, 158, 11, 0.45)',
                    color: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  }
                : undefined
            }
          >
            {isAlertsMuted ? (
              <BellOff size={15} strokeWidth={1.8} />
            ) : (
              <Bell size={15} strokeWidth={1.8} />
            )}
          </button>
        )}
        {showNewChat && (
          <button
            className="ib"
            onClick={onNewChat}
            aria-label="Start new chat"
            type="button"
            title="New conversation"
          >
            <RotateCcw size={15} strokeWidth={1.8} />
          </button>
        )}
        {!isMobile && (onTogglePin || isFloating || isPinned) && (
          <button
            className="ib"
            onClick={handlePin}
            aria-label={pinAriaLabel}
            aria-pressed={isPinned}
            type="button"
            title={pinTitle}
            style={
              isPinned
                ? {
                    borderColor: 'var(--acc)',
                    color: 'var(--acc)',
                    backgroundColor: 'rgba(25, 212, 106, 0.12)',
                  }
                : undefined
            }
          >
            <Pin size={14} strokeWidth={2} />
          </button>
        )}
        <button
          className="ib"
          onClick={handleClose}
          aria-label={closeAriaLabel}
          aria-expanded={isExpanded}
          type="button"
          title={closeTitle}
        >
          {isMobile ? (
            <ChevronDown size={18} strokeWidth={2} />
          ) : (
            <ChevronRight size={16} strokeWidth={1.9} />
          )}
        </button>
      </div>
    </div>
  );
}
