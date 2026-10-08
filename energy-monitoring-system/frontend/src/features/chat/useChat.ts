/**
 * useChat Hook
 * 
 * Manages chat state, message sending, rate limiting, and error handling.
 * Stores sessionId in sessionStorage for backend conversation continuity.
 */

import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from './chat.types';
import api from '@/lib/api';

const SESSION_ID_KEY = 'ecostep_chat_session_id';
const RATE_LIMIT_MS = 1500; // 1.5 seconds between messages

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearChat: () => void;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'bot',
  text: "Hi! I'm your EcoStep assistant. Ask me about energy status, analytics, or system insights.",
  timestamp: new Date(),
};

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastSendTimeRef = useRef<number>(0);
  const lastUserMessageRef = useRef<string>('');
  const sessionIdRef = useRef<string | null>(
    sessionStorage.getItem(SESSION_ID_KEY)
  );

  const sendMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Client-side rate limiting
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    if (timeSinceLastSend < RATE_LIMIT_MS) {
      setError(`Please wait ${Math.ceil((RATE_LIMIT_MS - timeSinceLastSend) / 1000)} seconds before sending another message.`);
      return;
    }

    // Clear any previous error
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    lastSendTimeRef.current = now;
    lastUserMessageRef.current = trimmedText;

    try {
      const response = await api.chat.sendMessage(
        trimmedText,
        sessionIdRef.current || undefined
      );

      // Store sessionId for continuity
      if (response.sessionId) {
        sessionIdRef.current = response.sessionId;
        sessionStorage.setItem(SESSION_ID_KEY, response.sessionId);
      }

      // Add bot response
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      
      // Check for specific error patterns
      if (errorMessage.includes('Too many messages')) {
        setError('Too many messages, try again in a moment.');
      } else if (errorMessage.includes('Failed to connect') || errorMessage.includes("couldn't reach")) {
        setError("I couldn't reach EcoStep right now. Check your connection and try again.");
      } else {
        setError("I couldn't reach EcoStep right now. Check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([INITIAL_GREETING]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearChat,
  };
}
