/**
 * TypeScript types for EcoChat widget
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface SuggestionChip {
  id: string;
  text: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}
