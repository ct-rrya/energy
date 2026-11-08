/**
 * MessageBubble Component
 * 
 * Renders individual chat message bubbles.
 * Bot messages: markdown-rendered with DOMPurify sanitization
 * User messages: plain text
 */

import type { ChatMessage } from '../chat.types';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import DOMPurify from 'dompurify';
import { useState } from 'react';
import 'katex/dist/katex.min.css';
import '../chat.css';

// Configure marked with KaTeX extension for math formulas
marked.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  })
);

interface MessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
}

// Configure DOMPurify to add target="_blank" to all links after sanitization
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function MessageBubble({ message, showTimestamp = false }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderBotMessage = (text: string) => {
    // Parse markdown with KaTeX math rendering
    const rawHtml = marked.parse(text, { async: false }) as string;
    
    // Sanitize HTML while preserving KaTeX and MathML elements
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true, mathMl: true, svg: true },
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'a',
        'span', 'div',
        'math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn',
        'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext',
        'mspace', 'mover', 'munder', 'munderover',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'aria-hidden', 'display', 'viewBox'],
    });

    return (
      <div
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  return (
    <div
      className={`chat-message-bubble ${
        message.role === 'user' ? 'chat-message-user' : 'chat-message-bot'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
    >
      {message.role === 'bot' ? renderBotMessage(message.text) : message.text}
      
      {(showTimestamp || isHovered) && (
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
}
