/**
 * ChatInput Component
 * 
 * Auto-growing textarea with send button.
 * Single flat container: <form class="chat-input"> with <textarea> and <button>.
 * Enter sends, Shift+Enter adds newline.
 */

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import '../chat.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const MAX_CHARS = 500;

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isMultiLine, setIsMultiLine] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea smoothly without borders or unwanted scrollbars
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 96;
    const minHeight = 24;

    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
      setIsMultiLine(true);
    } else {
      textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      textarea.style.overflowY = 'hidden';
      setIsMultiLine(scrollHeight > 36 || value.includes('\n'));
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
      setIsMultiLine(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
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

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      className={`chat-input ${isMultiLine ? 'is-multiline' : ''}`}
      onSubmit={handleSubmit}
    >
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        aria-label="Type your message"
        maxLength={MAX_CHARS}
      />
      <button
        type="submit"
        className="send chat-input-send"
        disabled={!canSend}
        aria-label="Send message"
      >
        <SendHorizontal size={16} strokeWidth={2} />
      </button>
    </form>
  );
}
