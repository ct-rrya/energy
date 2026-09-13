import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat message in session history
 */
export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

/**
 * Chat session data structure
 */
export interface ChatSession {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  messageHistory: ChatMessage[];
  metadata?: any;
}

/**
 * SessionManager
 * 
 * Manages anonymous web chat sessions with automatic cleanup.
 * Uses in-memory storage (Phase 1) - can be upgraded to Redis later.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.9
 */
@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private readonly sessions = new Map<string, ChatSession>();
  private readonly sessionTimeoutMinutes: number;
  private readonly maxMessageHistory = 20;

  constructor() {
    // Default to 30 minutes, can be configured via env
    this.sessionTimeoutMinutes =
      parseInt(process.env.CHAT_SESSION_TIMEOUT_MINUTES || '30', 10) || 30;
    
    this.logger.log(
      `SessionManager initialized with ${this.sessionTimeoutMinutes} minute timeout`,
    );
  }

  /**
   * Get existing session or create new one
   * 
   * @param sessionId - Optional existing session ID
   * @returns Promise<ChatSession>
   */
  async getOrCreateSession(sessionId?: string): Promise<ChatSession> {
    if (sessionId) {
      const existing = await this.getSession(sessionId);
      if (existing) {
        this.logger.debug(`Retrieved existing session: ${sessionId}`);
        return existing;
      }
      this.logger.debug(`Session ${sessionId} not found or expired`);
    }

    // Create new session
    const newSession = this.createSession();
    this.sessions.set(newSession.sessionId, newSession);
    this.logger.log(`Created new session: ${newSession.sessionId}`);
    return newSession;
  }

  /**
   * Get session if exists and not expired
   * 
   * @param sessionId - Session ID
   * @returns Promise<ChatSession | null>
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionId);
      this.logger.debug(`Session ${sessionId} expired and removed`);
      return null;
    }

    return session;
  }

  /**
   * Update session activity timestamp and add message to history
   * 
   * @param sessionId - Session ID
   * @param message - Message to add to history
   * @returns Promise<void>
   */
  async updateSession(
    sessionId: string,
    message: ChatMessage,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      this.logger.warn(`Attempted to update non-existent session: ${sessionId}`);
      return;
    }

    // Update timestamps
    session.lastActivity = new Date();
    session.expiresAt = this.calculateExpiryDate();

    // Add to message history (keep last N messages)
    session.messageHistory.push(message);
    if (session.messageHistory.length > this.maxMessageHistory) {
      session.messageHistory.shift(); // Remove oldest
    }

    this.logger.debug(`Updated session ${sessionId}, expires at ${session.expiresAt.toISOString()}`);
  }

  /**
   * Delete expired sessions (runs every 5 minutes)
   * 
   * @returns Promise<number> - Number of sessions cleaned up
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  }

  /**
   * Get current session count (for monitoring)
   * 
   * @returns number
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Create a new session
   * 
   * @returns ChatSession
   */
  private createSession(): ChatSession {
    return {
      sessionId: uuidv4(),
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: this.calculateExpiryDate(),
      messageHistory: [],
    };
  }

  /**
   * Calculate expiry date based on timeout
   * 
   * @returns Date
   */
  private calculateExpiryDate(): Date {
    return new Date(Date.now() + this.sessionTimeoutMinutes * 60 * 1000);
  }
}
