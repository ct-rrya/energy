import { Test, TestingModule } from '@nestjs/testing';
import { SessionManager, ChatSession, ChatMessage } from './session.manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionManager],
    }).compile();

    manager = module.get<SessionManager>(SessionManager);
  });

  afterEach(async () => {
    // Clean up all sessions after each test
    const count = await manager.cleanupExpiredSessions();
  });

  describe('Session Creation (Requirement 7.1, 7.4)', () => {
    it('should create new session with valid UUID v4', async () => {
      const session = await manager.getOrCreateSession();

      // Validate UUID v4 format
      expect(session.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(session.messageHistory).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should initialize session with empty message history', async () => {
      const session = await manager.getOrCreateSession();

      expect(session.messageHistory).toEqual([]);
      expect(session.messageHistory.length).toBe(0);
    });

    it('should set expiration time in the future', async () => {
      const session = await manager.getOrCreateSession();

      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create unique session IDs for multiple sessions', async () => {
      const session1 = await manager.getOrCreateSession();
      const session2 = await manager.getOrCreateSession();

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('Session Retrieval (Requirement 7.2, 7.3)', () => {
    it('should retrieve existing session by ID', async () => {
      const created = await manager.getOrCreateSession();
      const retrieved = await manager.getOrCreateSession(created.sessionId);

      expect(retrieved.sessionId).toBe(created.sessionId);
      expect(retrieved.createdAt).toEqual(created.createdAt);
    });

    it('should create new session when ID not found', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const session = await manager.getOrCreateSession(nonExistentId);

      // Should create new session, not return null
      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).not.toBe(nonExistentId);
    });

    it('should return null for non-existent session via getSession', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const session = await manager.getSession(nonExistentId);

      expect(session).toBeNull();
    });

    it('should return existing session via getSession', async () => {
      const created = await manager.getOrCreateSession();
      const retrieved = await manager.getSession(created.sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessionId).toBe(created.sessionId);
    });
  });

  describe('Session Update (Requirement 7.4, 7.5)', () => {
    it('should update lastActivity timestamp on message', async () => {
      const session = await manager.getOrCreateSession();
      const beforeUpdate = session.lastActivity.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const message: ChatMessage = {
        role: 'user',
        text: 'hello',
        timestamp: new Date(),
      };
      await manager.updateSession(session.sessionId, message);

      const updated = await manager.getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.lastActivity.getTime()).toBeGreaterThan(beforeUpdate);
    });

    it('should add message to history', async () => {
      const session = await manager.getOrCreateSession();

      const message: ChatMessage = {
        role: 'user',
        text: 'test message',
        timestamp: new Date(),
      };
      await manager.updateSession(session.sessionId, message);

      const updated = await manager.getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.messageHistory.length).toBe(1);
      expect(updated!.messageHistory[0].text).toBe('test message');
      expect(updated!.messageHistory[0].role).toBe('user');
    });

    it('should extend expiration time on update', async () => {
      const session = await manager.getOrCreateSession();
      const initialExpiry = session.expiresAt.getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const message: ChatMessage = {
        role: 'user',
        text: 'hello',
        timestamp: new Date(),
      };
      await manager.updateSession(session.sessionId, message);

      const updated = await manager.getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.expiresAt.getTime()).toBeGreaterThan(initialExpiry);
    });

    it('should maintain conversation history', async () => {
      const session = await manager.getOrCreateSession();

      const message1: ChatMessage = {
        role: 'user',
        text: 'first message',
        timestamp: new Date(),
      };
      await manager.updateSession(session.sessionId, message1);

      const message2: ChatMessage = {
        role: 'bot',
        text: 'bot response',
        timestamp: new Date(),
      };
      await manager.updateSession(session.sessionId, message2);

      const updated = await manager.getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.messageHistory.length).toBe(2);
      expect(updated!.messageHistory[0].text).toBe('first message');
      expect(updated!.messageHistory[1].text).toBe('bot response');
    });

    it('should limit message history to maximum (20 messages)', async () => {
      const session = await manager.getOrCreateSession();

      // Add 25 messages (exceeds the 20 message limit)
      for (let i = 0; i < 25; i++) {
        const message: ChatMessage = {
          role: i % 2 === 0 ? 'user' : 'bot',
          text: `message ${i}`,
          timestamp: new Date(),
        };
        await manager.updateSession(session.sessionId, message);
      }

      const updated = await manager.getSession(session.sessionId);
      expect(updated).not.toBeNull();
      expect(updated!.messageHistory.length).toBe(20);
      // Should keep the most recent 20 messages (5-24)
      expect(updated!.messageHistory[0].text).toBe('message 5');
      expect(updated!.messageHistory[19].text).toBe('message 24');
    });

    it('should handle update to non-existent session gracefully', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const message: ChatMessage = {
        role: 'user',
        text: 'hello',
        timestamp: new Date(),
      };

      // Should not throw error
      await expect(
        manager.updateSession(nonExistentId, message),
      ).resolves.not.toThrow();
    });
  });

  describe('Session Expiration (Requirement 7.10)', () => {
    it('should return null for expired session', async () => {
      const session = await manager.getOrCreateSession();

      // Manually expire the session
      session.expiresAt = new Date(Date.now() - 1000);

      const retrieved = await manager.getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });

    it('should remove expired session when accessing', async () => {
      const session = await manager.getOrCreateSession();
      const sessionId = session.sessionId;

      // Manually expire
      session.expiresAt = new Date(Date.now() - 1000);

      // Access should remove it
      await manager.getSession(sessionId);

      // Verify it's been removed from internal storage
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe('Session Cleanup (Requirement 7.6)', () => {
    it('should clean up expired sessions', async () => {
      const session1 = await manager.getOrCreateSession();
      const session2 = await manager.getOrCreateSession();

      // Expire only session1
      session1.expiresAt = new Date(Date.now() - 1000);

      const cleaned = await manager.cleanupExpiredSessions();

      expect(cleaned).toBe(1);
      expect(await manager.getSession(session1.sessionId)).toBeNull();
      expect(await manager.getSession(session2.sessionId)).not.toBeNull();
    });

    it('should return 0 when no sessions need cleanup', async () => {
      await manager.getOrCreateSession();
      await manager.getOrCreateSession();

      const cleaned = await manager.cleanupExpiredSessions();

      expect(cleaned).toBe(0);
    });

    it('should clean up multiple expired sessions', async () => {
      const session1 = await manager.getOrCreateSession();
      const session2 = await manager.getOrCreateSession();
      const session3 = await manager.getOrCreateSession();

      // Expire all sessions
      session1.expiresAt = new Date(Date.now() - 1000);
      session2.expiresAt = new Date(Date.now() - 1000);
      session3.expiresAt = new Date(Date.now() - 1000);

      const cleaned = await manager.cleanupExpiredSessions();

      expect(cleaned).toBe(3);
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe('Session Monitoring', () => {
    it('should track active session count', async () => {
      expect(manager.getSessionCount()).toBe(0);

      await manager.getOrCreateSession();
      expect(manager.getSessionCount()).toBe(1);

      await manager.getOrCreateSession();
      expect(manager.getSessionCount()).toBe(2);
    });

    it('should decrease count after cleanup', async () => {
      const session = await manager.getOrCreateSession();
      expect(manager.getSessionCount()).toBe(1);

      session.expiresAt = new Date(Date.now() - 1000);
      await manager.cleanupExpiredSessions();

      expect(manager.getSessionCount()).toBe(0);
    });
  });
});
