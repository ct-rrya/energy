/**
 * ChatPanel Component
 * 
 * Main chat dialog panel with header, messages, and input.
 * Handles open/close animations, focus trap, and error display.
 */

import { useEffect, useState, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '../useChat';
import '../chat.css';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { messages, isLoading, error, sendMessage, retryLastMessage, clearChat } = useChat();

  const handleClose = () => {
    setIsOpen(false);
    
    // Dispatch close event
    window.dispatchEvent(new CustomEvent('ecostep:closechat'));
    
    // Return focus to launcher
    setTimeout(() => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }, 100);
  };

  const handleNewChat = () => {
    clearChat();
  };

  // Listen for open event
  useEffect(() => {
    const handleOpen = () => {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setIsOpen(true);
    };

    window.addEventListener('ecostep:openchat', handleOpen);
    return () => window.removeEventListener('ecostep:openchat', handleOpen);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus input after animation
      setTimeout(() => {
        const textarea = panelRef.current?.querySelector('textarea');
        textarea?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="chat-backdrop" onClick={handleClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="chat-panel"
        role="dialog"
        aria-label="EcoChat"
        aria-modal="true"
      >
        <ChatHeader onClose={handleClose} onNewChat={handleNewChat} />
        
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={sendMessage}
        />

        {error && (
          <div className="chat-error">
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
    </>
  );
}
