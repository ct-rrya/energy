/**
 * ChatHeader Component
 * 
 * Panel header with Sprout icon, title, and controls.
 */

import { X, RotateCcw, Sprout } from 'lucide-react';
import '../chat.css';

interface ChatHeaderProps {
  onClose: () => void;
  onNewChat: () => void;
}

export function ChatHeader({ onClose, onNewChat }: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <div className="chat-avatar-tile">
          <Sprout size={20} strokeWidth={2} />
        </div>
        <div className="chat-header-text">
          <div className="chat-header-title">EcoChat</div>
          <div className="chat-header-subtitle">EcoStep assistant</div>
        </div>
      </div>
      
      <div className="chat-header-actions">
        <button
          className="chat-icon-button"
          onClick={onNewChat}
          aria-label="Start new chat"
          type="button"
        >
          <RotateCcw size={20} strokeWidth={2} />
        </button>
        <button
          className="chat-icon-button"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
