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
  const prevMessagesLengthRef = useRef(messages.length);

  // Check if user has scrolled up away from bottom (~80px threshold)
  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - (list.scrollTop + list.clientHeight);
    
    if (distanceFromBottom > 80) {
      setShowJumpToLatest(true);
      setUserHasScrolled(true);
    } else {
      setShowJumpToLatest(false);
      setUserHasScrolled(false);
    }
  };

  // Auto-scroll to bottom on send and on receive
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    // When a new message is sent or received, always auto-scroll to newest
    if (hasNewMessage) {
      setUserHasScrolled(false);
      setShowJumpToLatest(false);
      const shouldScroll = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (typeof list.scrollTo === 'function') {
        list.scrollTo({
          top: list.scrollHeight,
          behavior: shouldScroll ? 'auto' : 'smooth',
        });
      } else {
        list.scrollTop = list.scrollHeight;
      }
    } else if (!userHasScrolled) {
      // Keep pinned to bottom during typing/streaming if user hasn't scrolled up
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, isLoading, userHasScrolled]);

  const scrollToBottom = () => {
    const list = listRef.current;
    if (!list) return;

    const shouldScroll = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: shouldScroll ? 'auto' : 'smooth',
      });
    } else {
      list.scrollTop = list.scrollHeight;
    }
    setUserHasScrolled(false);
    setShowJumpToLatest(false);
  };

  // Show suggestion chips only when there's just the greeting
  const showSuggestions = messages.length === 1;

  // Check if we should show timestamp (last in a consecutive group)
  const shouldShowTimestamp = (index: number): boolean => {
    if (index === messages.length - 1) return true;
    return messages[index].role !== messages[index + 1]?.role;
  };

  return (
    <div className="message-list-wrapper">
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
          aria-label="Jump to latest message"
        >
          Jump to latest ↓
        </button>
      )}
    </div>
  );
}
