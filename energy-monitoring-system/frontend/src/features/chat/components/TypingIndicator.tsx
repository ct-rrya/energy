/**
 * TypingIndicator Component
 * 
 * Displays three pulsing dots to indicate bot is typing.
 * Includes visually-hidden label for screen readers.
 */

import '../chat.css';

export function TypingIndicator() {
  return (
    <div className="chat-message-bubble chat-message-bot">
      <span className="sr-only">EcoStep is typing</span>
      <div className="typing-indicator">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
