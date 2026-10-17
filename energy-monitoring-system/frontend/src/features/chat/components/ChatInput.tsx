/**
 * ChatInput Component
 * 
 * Auto-growing textarea with send button.
 * Enter sends, Shift+Enter adds newline.
 * 500 char limit with counter appearing at 400+.
 */

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import '../chat.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const MAX_CHARS = 500;
const COUNTER_THRESHOLD = 400;

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea smoothly without unwanted scrollbars
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    if (scrollHeight > 96) {
      textarea.style.height = '96px';
      textarea.style.overflowY = 'auto';
      textarea.style.borderRadius = '18px';
    } else {
      textarea.style.height = `${Math.max(scrollHeight, 44)}px`;
      textarea.style.overflowY = 'hidden';
      textarea.style.borderRadius = scrollHeight > 50 ? '18px' : '999px';
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setValue(e.target.value);
    }
  };

  const showCounter = value.length >= COUNTER_THRESHOLD;
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder="Type your message..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          aria-label="Type your message"
        />
        {showCounter && (
          <span className="chat-input-counter">
            {value.length}/{MAX_CHARS}
          </span>
        )}
      </div>
      <button
        className="chat-input-send"
        onClick={handleSend}
        disabled={!canSend}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        style={{
          transform: isPressed && canSend ? 'scale(0.95)' : 'scale(1)',
        }}
        aria-label="Send message"
        type="button"
      >
        <SendHorizontal size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
