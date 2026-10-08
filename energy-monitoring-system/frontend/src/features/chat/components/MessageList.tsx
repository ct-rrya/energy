/**
 * MessageList Component
 * 
 * Scrollable message container with auto-scroll to newest.
 * Shows "Jump to latest" pill when user scrolls up.
 */

import { useRef, useEffect, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { SuggestionChips } from './SuggestionChips';
import '../chat.css';

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
}

export function MessageList({ messages, isLoading, onSuggestionClick }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Check if user has scrolled up
  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    
    if (distanceFromBottom > 100) {
      setShowJumpToLatest(true);
      setUserHasScrolled(true);
    } else {
      setShowJumpToLatest(false);
      setUserHasScrolled(false);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    // Don't auto-scroll if user has manually scrolled up
    if (!userHasScrolled) {
      const shouldScroll = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      list.scrollTo({
        top: list.scrollHeight,
        behavior: shouldScroll ? 'auto' : 'smooth',
      });
    }
  }, [messages, isLoading, userHasScrolled]);

  const scrollToBottom = () => {
    const list = listRef.current;
    if (!list) return;

    const shouldScroll = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: shouldScroll ? 'auto' : 'smooth',
    });
    setUserHasScrolled(false);
  };

  // Show suggestion chips only when there's just the greeting
  const showSuggestions = messages.length === 1;

  // Check if we should show timestamp (last in a consecutive group)
  const shouldShowTimestamp = (index: number): boolean => {
    if (index === messages.length - 1) return true;
    return messages[index].role !== messages[index + 1]?.role;
  };

  return (
    <>
      <div
        ref={listRef}
        className="message-list"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        onScroll={handleScroll}
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            showTimestamp={shouldShowTimestamp(index)}
          />
        ))}

        {showSuggestions && (
          <SuggestionChips onChipClick={onSuggestionClick} />
        )}

        {isLoading && <TypingIndicator />}
      </div>

      {showJumpToLatest && (
        <button
          className="jump-to-latest"
          onClick={scrollToBottom}
          type="button"
        >
          Jump to latest ↓
        </button>
      )}
    </>
  );
}
