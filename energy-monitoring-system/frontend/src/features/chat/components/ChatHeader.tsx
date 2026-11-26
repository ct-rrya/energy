/**
 * ChatHeader Component
 * 
 * EcoGuide header with title (17px), subtitle (13px muted),
 * and 32x32 circular icon buttons (.ib style).
 */

import { RotateCcw, ChevronRight, ChevronDown, Pin } from 'lucide-react';
import '../chat.css';

interface ChatHeaderProps {
  onClose?: () => void;
  onCollapse?: () => void;
  onNewChat: () => void;
  isExpanded?: boolean;
  isFloating?: boolean;
  isMobile?: boolean;
  subtitle?: string;
  showNewChat?: boolean;
}

export function ChatHeader({
  onClose,
  onCollapse,
  onNewChat,
  isExpanded = true,
  isFloating = false,
  isMobile = false,
  subtitle = 'Learning assistant',
  showNewChat = true,
}: ChatHeaderProps) {
  const handleToggleOrClose = () => {
    if (isMobile && onClose) {
      onClose();
    } else if (onCollapse) {
      onCollapse();
    } else if (onClose) {
      onClose();
    }
  };

  const toggleAriaLabel = isMobile
    ? 'Close chat'
    : isFloating
      ? 'Pin EcoGuide open'
      : 'Collapse EcoGuide';

  const toggleTitle = isMobile
    ? 'Close'
    : isFloating
      ? 'Pin EcoGuide open ( ] )'
      : 'Collapse EcoGuide ( ] )';

  return (
    <div className="chat-header row">
      <div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--t)' }}>EcoGuide</h2>
        <div className="sub text-[13px] text-[var(--mu)]">{subtitle}</div>
      </div>
      
      <div className="ibs flex items-center gap-2">
        {showNewChat && (
          <button
            className="ib"
            onClick={onNewChat}
            aria-label="Start new chat"
            type="button"
            title="New conversation"
          >
            <RotateCcw size={16} strokeWidth={1.8} />
          </button>
        )}
        <button
          className="ib"
          onClick={handleToggleOrClose}
          aria-label={toggleAriaLabel}
          aria-expanded={isExpanded}
          type="button"
          title={toggleTitle}
        >
          {isMobile ? (
            <ChevronDown size={18} strokeWidth={2} />
          ) : isFloating ? (
            <Pin size={14} strokeWidth={2} />
          ) : (
            <ChevronRight size={16} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </div>
  );
}
