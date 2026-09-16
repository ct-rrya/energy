import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import api from '../../../lib/api';
import SuggestedActions from './SuggestedActions';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * CSS Animations for message slide-in and typing indicator
 * Requirements: 12.11 - Smooth scroll animation for new messages
 */
const messageAnimationStyles = `
  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes typingDotBounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-8px);
    }
  }

  /* Smooth scroll behavior - Requirement 12.11 */
  .message-list {
    scroll-behavior: smooth;
  }

  /* Markdown content styling for bot messages */
  .markdown-content p {
    margin: 0 0 8px 0;
  }

  .markdown-content p:last-child {
    margin-bottom: 0;
  }

  .markdown-content strong {
    font-weight: 600;
  }

  .markdown-content em {
    font-style: italic;
  }

  .markdown-content code {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  .markdown-content pre {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 8px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
  }

  .markdown-content pre code {
    background-color: transparent;
    padding: 0;
  }

  .markdown-content ul,
  .markdown-content ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  .markdown-content li {
    margin: 4px 0;
  }

  .markdown-content a {
    color: #89D7B7;
    text-decoration: underline;
  }

  .markdown-content a:hover {
    color: #6FC5A0;
  }

  /* Responsive styles for mobile */
  @media (max-width: 768px) {
    .chat-interface {
      height: 100% !important;
      max-height: 100% !important;
      border-radius: 8px !important;
    }

    .chat-header {
      padding: 12px 16px !important;
      font-size: 14px !important;
    }

    .message-list {
      padding: 12px !important;
    }

    /* Increase message bubble max-width on mobile for better space usage */
    .message-bubble {
      max-width: 85% !important;
      font-size: 14px !important;
    }

    /* Touch-friendly button sizes - minimum 44x44px */
    .chat-input button {
      min-height: 44px !important;
      min-width: 44px !important;
      padding: 12px 20px !important;
    }

    /* Stack chat input on very small screens */
    .chat-input {
      padding: 12px !important;
      gap: 10px !important;
    }
  }

  /* Small mobile devices */
  @media (max-width: 480px) {
    .chat-header {
      font-size: 13px !important;
      padding: 10px 12px !important;
    }

    .message-list {
      padding: 8px !important;
    }

    .message-bubble {
      max-width: 90% !important;
      padding: 10px 14px !important;
      font-size: 13px !important;
    }
  }

  /* Reduced motion support - Requirement 18.9 */
  @media (prefers-reduced-motion: reduce) {
    /* Disable slide-in animation */
    @keyframes messageSlideIn {
      from, to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Disable typing dot bounce */
    @keyframes typingDotBounce {
      0%, 100% {
        transform: translateY(0);
      }
    }
    
    /* Remove smooth scroll */
    .message-list {
      scroll-behavior: auto !important;
    }
    
    /* Reduce all transition durations */
    .message-wrapper,
    .message-bubble,
    .chat-input button,
    .typing-dot {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Inject animation styles
if (typeof document !== 'undefined' && !document.getElementById('chat-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'chat-animations';
  styleSheet.textContent = messageAnimationStyles;
  document.head.appendChild(styleSheet);
}


/**
 * Represents a single chat message
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  className?: string;
  initialMessage?: string;
}

/**
 * TypingIndicator Component
 * 
 * Displays an animated "typing" indicator with three bouncing dots.
 * Shown when the bot is processing a response.
 * Styled to match bot messages (left-aligned, #428475 background).
 * Supports light and dark theme variants.
 * 
 * Requirements: 4.8, 12.2, 12.10, 12.12, 18.3
 */
function TypingIndicator({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className="message-wrapper message-bot typing-indicator"
      role="status"
      aria-live="polite"
      aria-label="Bot is typing"
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '12px',
        animation: 'messageSlideIn 0.3s ease-out',
      }}
    >
      <div
        className="message-bubble"
        style={{
          padding: '12px 16px',
          borderRadius: '16px',
          // Bot message background: #428475 for both themes (Requirement 12.2)
          backgroundColor: '#428475',
          boxShadow: theme === 'light'
            ? '0 2px 4px rgba(0, 0, 0, 0.1)'
            : '0 2px 4px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '40px',
        }}
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="typing-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              animation: 'typingDotBounce 1.4s infinite ease-in-out',
              animationDelay: `${index * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Message Component
 * 
 * Displays a single chat message with role-based styling.
 * User messages are right-aligned with primary color (#1A312C).
 * Bot messages are left-aligned with secondary color (#428475) and support markdown rendering.
 * Supports light and dark theme variants.
 * Includes ARIA labels for screen reader accessibility.
 * 
 * Requirements: 4.3, 10.9, 12.1, 12.2, 12.3, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 18.1, 18.3
 */
function Message({ message, theme }: { message: ChatMessage; theme: 'light' | 'dark' }) {
  const isUser = message.role === 'user';
  
  // Format timestamp (e.g., "2:30 PM")
  const formattedTime = message.timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  /**
   * Render bot messages as markdown with sanitization
   * User messages are displayed as plain text
   * 
   * Requirements: 10.9
   */
  const renderMessageContent = () => {
    if (isUser) {
      // User messages are plain text
      return <div className="message-text" style={{ marginBottom: '4px' }}>{message.text}</div>;
    }
    
    // Bot messages support markdown
    const rawHtml = marked(message.text, { breaks: true }) as string;
    
    // Sanitize HTML to prevent XSS attacks
    // Allow only safe tags for formatting
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
    
    return (
      <div 
        className="message-text markdown-content" 
        style={{ marginBottom: '4px' }}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  return (
    <div
      className={`message-wrapper ${isUser ? 'message-user' : 'message-bot'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message at ${formattedTime}`}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        animation: 'messageSlideIn 0.3s ease-out', // Requirement 12.11: Smooth animation
      }}
    >
      <div
        className="message-bubble"
        style={{
          maxWidth: '70%',
          padding: '12px 16px', // Requirement 12.6: Appropriate padding
          borderRadius: '16px', // Requirement 12.6: Rounded message bubbles
          // User messages: #1A312C (Requirement 12.1)
          // Bot messages: #428475 (Requirement 12.2)
          backgroundColor: isUser ? '#1A312C' : '#428475',
          color: '#FFFFFF',
          fontSize: '15px', // Requirement 12.4: EcoStep font sizes
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", // Requirement 12.4: EcoStep font family
          lineHeight: '1.5',
          wordWrap: 'break-word',
          boxShadow: theme === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.1)' // Subtle shadow
            : '0 1px 3px rgba(0, 0, 0, 0.3)',
        }}
      >
        {renderMessageContent()}
        <div
          className="message-timestamp"
          aria-hidden="true"
          style={{
            fontSize: '11px',
            opacity: 0.7,
            textAlign: isUser ? 'right' : 'left',
            marginTop: '4px',
          }}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

/**
 * ChatInput Component
 * 
 * Text input area with send button for composing and sending messages.
 * Features:
 * - Enter key submits message (Shift+Enter creates newline)
 * - 1-second debounce to prevent rapid submissions
 * - Disabled state while loading
 * - setValue prop to allow external control (for suggested actions)
 * - Interactive elements use accent color #89D7B7 (Requirement 12.3)
 * - Supports light and dark theme variants (Requirement 12.10)
 * - Full keyboard accessibility with ARIA labels
 * - Focus management when messages are sent
 * 
 * Requirements: 4.4, 4.5, 4.6, 4.7, 12.3, 12.10, 13.7, 18.1, 18.2, 18.4
 */
interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  value?: string;
  setValue?: (value: string) => void;
  theme: 'light' | 'dark';
}

function ChatInput({ onSendMessage, disabled, value: externalValue, setValue: externalSetValue, theme }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect reduced motion preference - Requirement 18.9
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use external value if provided (for suggested actions)
  const currentValue = externalValue !== undefined ? externalValue : inputValue;
  const setCurrentValue = externalSetValue !== undefined ? externalSetValue : setInputValue;

  /**
   * Handle message submission with debounce protection
   * Requirement 18.4: Maintain focus management when messages sent
   */
  const handleSubmit = () => {
    const trimmedValue = currentValue.trim();
    
    // Don't send empty messages
    if (!trimmedValue || isDebouncing || disabled) {
      return;
    }

    // Activate debounce
    setIsDebouncing(true);
    
    // Send the message
    onSendMessage(trimmedValue);
    
    // Clear input
    setCurrentValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Maintain focus after sending (Requirement 18.4)
      textareaRef.current.focus();
    }

    // Clear debounce after 1 second
    debounceTimerRef.current = setTimeout(() => {
      setIsDebouncing(false);
    }, 1000);
  };

  /**
   * Handle Enter key press
   * - Enter alone: submit message
   * - Shift+Enter: insert newline (default textarea behavior)
   * 
   * Requirement 18.2: Keyboard navigation (Tab, Enter, Escape)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline insertion
      handleSubmit();
    } else if (e.key === 'Escape') {
      // Escape key clears the input
      setCurrentValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * Auto-resize textarea as user types
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isDisabled = disabled || isDebouncing;

  return (
    <div
      className="chat-input"
      style={{
        padding: '16px',
        borderTop: theme === 'light' ? '1px solid #E5E7EB' : '1px solid #2A2E37',
        backgroundColor: theme === 'light' ? '#F9FAFB' : '#1C1F26',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
      }}
    >
      <textarea
        ref={textareaRef}
        value={currentValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={
          isDebouncing 
            ? 'Please wait...' 
            : disabled 
            ? 'Sending...' 
            : 'Type your message...'
        }
        rows={1}
        aria-label="Chat message input"
        aria-describedby="chat-input-description"
        style={{
          flex: 1,
          padding: '12px',
          fontSize: '14px',
          lineHeight: '1.5',
          borderRadius: '8px',
          border: theme === 'light' ? '1px solid #D1D5DB' : '1px solid #2A2E37',
          backgroundColor: isDisabled 
            ? (theme === 'light' ? '#F3F4F6' : '#12141A')
            : (theme === 'light' ? '#FFFFFF' : '#12141A'),
          color: isDisabled 
            ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
            : (theme === 'light' ? '#1F2937' : '#EDEEF0'),
          resize: 'none',
          maxHeight: '120px',
          overflowY: 'auto',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.2s, background-color 0.2s',
          cursor: isDisabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!isDisabled) {
            // Improved focus indicator with better contrast - Requirement 18.5
            e.target.style.borderColor = '#428475'; // Higher contrast (3.02:1)
            e.target.style.boxShadow = '0 0 0 3px rgba(137, 215, 183, 0.4)'; // Additional visual emphasis
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#2A2E37';
          e.target.style.boxShadow = 'none';
        }}
      />
      <span id="chat-input-description" style={{ display: 'none' }}>
        Press Enter to send message, Shift+Enter to create new line, Escape to clear
      </span>
      <button
        onClick={handleSubmit}
        disabled={isDisabled || !currentValue.trim()}
        aria-label="Send message"
        aria-disabled={isDisabled || !currentValue.trim()}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          color: isDisabled || !currentValue.trim() 
            ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
            : '#1A312C',  // Dark text for better contrast (5.24:1) - Requirement 18.5
          // Send button uses accent color #89D7B7 (Requirement 12.3)
          backgroundColor: isDisabled || !currentValue.trim() 
            ? (theme === 'light' ? '#E5E7EB' : '#2A2E37')
            : '#89D7B7',
          border: 'none',
          borderRadius: '8px',
          cursor: isDisabled || !currentValue.trim() ? 'not-allowed' : 'pointer',
          transition: prefersReducedMotion ? 'none' : 'background-color 0.2s, transform 0.1s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && currentValue.trim()) {
            e.currentTarget.style.backgroundColor = '#6FC5A0';
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled && currentValue.trim()) {
            e.currentTarget.style.backgroundColor = '#89D7B7';
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }
        }}
      >
        {isDebouncing ? 'Wait...' : 'Send'}
      </button>
    </div>
  );
}

/**
 * MessageList Component
 * 
 * Scrollable container for displaying all chat messages.
 * Automatically scrolls to the latest message when new messages are added.
 * Shows typing indicator when bot is processing a response.
 * Includes enhanced ARIA live region for screen reader announcements.
 * 
 * Requirements: 4.2, 4.8, 12.11, 12.12, 18.3
 */
function MessageList({ messages, isLoading, theme }: { messages: ChatMessage[]; isLoading: boolean; theme: 'light' | 'dark' }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  // Auto-scroll to latest message when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Enhanced screen reader announcement when new bot message arrives
  // Requirement 18.3: Announce new messages to screen readers
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.role === 'bot') {
        // Announce new bot messages
        const messagePreview = lastMessage.text.substring(0, 150);
        const truncated = lastMessage.text.length > 150 ? '...' : '';
        setAnnouncement(`New message from assistant: ${messagePreview}${truncated}`);
      } else if (lastMessage.role === 'user') {
        // Announce user messages sent
        setAnnouncement('Your message has been sent.');
      }
    }
  }, [messages]);

  // Announce when bot starts typing
  // Requirement 18.3: Announce loading state changes
  useEffect(() => {
    if (isLoading) {
      setAnnouncement('Assistant is typing...');
    }
  }, [isLoading]);

  return (
    <div
      className="message-list"
      role="log"
      aria-label="Chat message history"
      aria-live="polite"
      aria-atomic="false"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} theme={theme} />
      ))}
      
      {/* Show typing indicator while waiting for bot response */}
      {isLoading && <TypingIndicator theme={theme} />}
      
      {/* Enhanced screen reader announcement region - Requirement 18.3 */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {announcement}
      </div>
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * ChatInterface Component
 * 
 * Main container component for the public chat interface on the landing page.
 * Manages chat state, message history, and communication with the backend API.
 * 
 * Features:
 * - Session management with persistence in sessionStorage
 * - Real-time message exchange with backend
 * - Error handling with user-friendly messages
 * - Markdown rendering for bot responses
 * - Supports light and dark theme variants (Requirement 12.10)
 * - Uses EcoStep color palette (Requirements 12.1, 12.2, 12.3)
 * - Full keyboard accessibility with skip link
 * 
 * Requirements: 4.1, 4.2, 4.9, 7.7, 7.8, 9.4, 9.10, 12.1, 12.2, 12.3, 12.10, 18.1, 18.2, 18.8
 */
export default function ChatInterface({ 
  className = '',
  initialMessage 
}: ChatInterfaceProps) {
  // Get theme from context (Requirement 12.10)
  const { theme } = useTheme();
  
  // Session storage key for persisting sessionId
  const SESSION_STORAGE_KEY = 'ecostep_chat_session_id';
  
  // Chat interface ref for skip link (Requirement 18.8)
  const chatInterfaceRef = useRef<HTMLDivElement>(null);
  
  // Chat state management
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initialize with welcome message if provided
    if (initialMessage) {
      return [
        {
          id: crypto.randomUUID(),
          role: 'bot',
          text: initialMessage,
          timestamp: new Date(),
        },
      ];
    }
    return [];
  });

  // Session ID for conversation continuity (Requirements: 7.7, 7.8)
  const [sessionId, setSessionId] = useState<string | null>(() => {
    // Restore sessionId from sessionStorage on mount
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Suggestions state - used for displaying suggested follow-up questions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Input value state - allows external control for suggested actions
  const [inputValue, setInputValue] = useState<string>('');

  /**
   * Persist sessionId to sessionStorage whenever it changes
   * Requirements: 7.8
   */
  useEffect(() => {
    if (sessionId && typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  }, [sessionId]);

  /**
   * Add a message to the chat history
   */
  const addMessage = (role: 'user' | 'bot', text: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  /**
   * Handle sending a new message
   * 
   * Workflow:
   * 1. Add user message to UI immediately
   * 2. Show loading indicator
   * 3. Call backend API
   * 4. Handle successful response (add bot message, update sessionId, show suggestions)
   * 5. Handle errors (display descriptive error in chat as bot message)
   * 
   * Requirements: 4.9, 7.7, 7.8, 9.4, 9.10, 18.3, 18.10
   */
  const handleSendMessage = async (text: string) => {
    // Add user message to UI immediately (Requirements: 7.7)
    addMessage('user', text);
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // Call backend API with message and sessionId (Requirements: 7.7)
      const response = await api.chat.sendMessage(text, sessionId || undefined);
      
      // Handle successful response (Requirements: 7.8)
      // Add bot response to messages
      addMessage('bot', response.response);
      
      // Update sessionId if new session was created
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      
      // Update suggestions for follow-up questions
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      } else {
        setSuggestions([]);
      }
      
    } catch (err) {
      // Enhanced error handling with descriptive messages (Requirements: 4.9, 9.4, 9.10, 18.10)
      let errorMessage = 'An unexpected error occurred. Please try again in a moment.';
      let errorDetails = '';
      
      if (err instanceof Error) {
        // Parse the error to provide more descriptive feedback
        if (err.message.includes('rate limit') || err.message.includes('Too many')) {
          errorMessage = 'You are sending messages too quickly. Please wait a moment before trying again.';
          errorDetails = 'Our system limits message frequency to ensure quality responses for all users.';
        } else if (err.message.includes('network') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the chat service. Please check your internet connection and try again.';
          errorDetails = 'If the problem persists, the service may be temporarily unavailable.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'The request took too long to complete. Please try sending your message again.';
          errorDetails = 'Consider breaking longer questions into smaller parts.';
        } else if (err.message.includes('validation') || err.message.includes('invalid')) {
          errorMessage = 'Your message could not be processed. Please check your input and try again.';
          errorDetails = 'Messages should be between 1 and 2000 characters.';
        } else {
          // Use the error message if available
          errorMessage = err.message || errorMessage;
        }
      }
      
      // Display descriptive error in chat as bot message (Requirement 18.10)
      const fullErrorMessage = `âŒ **Error**: ${errorMessage}\n\n${errorDetails}\n\nIf you continue to experience issues, please contact support or try again later.`;
      addMessage('bot', fullErrorMessage);
      
      // Clear suggestions on error
      setSuggestions([]);
    } finally {
      // Hide loading indicator
      setIsLoading(false);
    }
  };

  /**
   * Handle suggestion button click
   * Auto-populates the chat input with the suggested text
   * 
   * Requirements: 10.10
   */
  const handleSuggestionClick = (suggestion: string) => {
    // Set the input value to the clicked suggestion
    setInputValue(suggestion);
    
    // Clear suggestions after selection
    setSuggestions([]);
  };

  return (
    <>
      {/* Skip to chat link for keyboard users - Requirement 18.8 */}
      <a
        href="#chat-interface"
        onClick={(e) => {
          e.preventDefault();
          chatInterfaceRef.current?.focus();
        }}
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          ...(document.activeElement === document.body && {
            position: 'static',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
          })
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'static';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.overflow = 'visible';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-10000px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
          e.currentTarget.style.overflow = 'hidden';
        }}
      >
        Skip to chat interface
      </a>
      
      <div 
        id="chat-interface"
        ref={chatInterfaceRef}
        className={`chat-interface ${className}`}
        role="region"
        aria-label="EcoStep chat assistant"
        tabIndex={-1}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: className.includes('floating-chat-interface') ? '100%' : '600px',
          maxHeight: className.includes('floating-chat-interface') ? '100%' : '80vh',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
          borderRadius: className.includes('floating-chat-interface') ? '0' : '16px', // No border radius when inside floating panel
          boxShadow: className.includes('floating-chat-interface') 
            ? 'none' // No shadow when inside floating panel
            : (theme === 'light'
              ? '0 8px 24px rgba(0, 0, 0, 0.08)'
              : '0 8px 24px rgba(0, 0, 0, 0.4)'),
          overflow: 'hidden',
          transition: 'background-color 0.3s, box-shadow 0.3s',
          outline: 'none',
        }}
      >
        {/* Chat Header with EcoStep Logo - Requirements: 12.4, 12.5 */}
        {/* Hide header when inside floating panel (has its own header) */}
        {!className.includes('floating-chat-interface') && (
          <div
            className="chat-header"
            role="banner"
            style={{
              padding: '18px 24px',
              // Header uses user message color #1A312C (Requirement 12.1)
              backgroundColor: '#1A312C',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '16px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", // Requirement 12.4: EcoStep font family
              borderBottom: '1px solid rgba(137, 215, 183, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* EcoStep Logo - Requirement 12.5: Include EcoStep logo in chat header */}
            <div
              aria-hidden="true"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#89D7B7', // Accent color
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                color: '#1A312C',
                flexShrink: 0,
              }}
            >
              ðŸŒ±
            </div>
            <span>EcoStep Chat Assistant</span>
          </div>
        )}

        {/* Message List */}
        <MessageList messages={messages} isLoading={isLoading} theme={theme} />

        {/* Suggested Actions - displayed between messages and input */}
        <SuggestedActions 
          suggestions={suggestions} 
          onSuggestionClick={handleSuggestionClick}
          theme={theme}
        />

        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading}
          value={inputValue}
          setValue={setInputValue}
          theme={theme}
        />
      </div>
    </>
  );
}


