/**
 * TypingIndicator Component
 * 
 * Displays three pulsing dots to indicate bot is typing.
 * Includes visually-hidden label for screen readers.
 */

import '../chat.css';

export function TypingIndicator() {
  return (
    <div
      className="chat-message-bubble chat-message-bot chat-typing-bubble"
      role="status"
      aria-label="EcoStep is typing"
    >
      <span className="sr-only">EcoStep is typing</span>
      <div className="typing-indicator" aria-hidden="true">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
