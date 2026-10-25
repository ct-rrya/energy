/**
 * ChatHeader Component
 * 
 * EcoGuide header with title (17px), subtitle (13px muted),
 * and 32x32 circular icon buttons (.ib style).
 */

import { X, RotateCcw, ChevronRight } from 'lucide-react';
import '../chat.css';

interface ChatHeaderProps {
  onClose?: () => void;
  onCollapse?: () => void;
  onNewChat: () => void;
  isExpanded?: boolean;
  isMobile?: boolean;
}

export function ChatHeader({
  onClose,
  onCollapse,
  onNewChat,
  isExpanded = true,
  isMobile = false,
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

  return (
    <div className="chat-header row">
      <div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--t)' }}>EcoGuide</h2>
        <div className="sub text-[13px] text-[var(--mu)]">Learning assistant</div>
      </div>
      
      <div className="ibs flex items-center gap-2">
        <button
          className="ib"
          onClick={onNewChat}
          aria-label="Start new chat"
          type="button"
          title="New conversation"
        >
          <RotateCcw size={16} strokeWidth={1.8} />
        </button>
        <button
          className="ib"
          onClick={handleToggleOrClose}
          aria-label={isMobile ? 'Close chat' : 'Collapse EcoGuide'}
          aria-expanded={isExpanded}
          type="button"
          title={isMobile ? 'Close' : 'Collapse EcoGuide ( ] )'}
        >
          {isMobile ? (
            <X size={16} strokeWidth={1.8} />
          ) : (
            <ChevronRight size={16} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </div>
  );
}
