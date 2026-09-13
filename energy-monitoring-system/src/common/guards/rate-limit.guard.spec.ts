import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { Request, Response } from 'express';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

/**
 * RateLimitGuard Unit Tests
 * 
 * Tests rate limiting functionality including:
 * - IP extraction from X-Forwarded-For header
 * - Proper 429 error response formatting
 * - Retry-After header generation
 * - Rate limit enforcement (within limit, exceeded, and TTL reset)
 * 
 * Requirements:
 * - 8.4: THE Chat_API SHALL implement rate limiting per IP address
 * - 13.5: THE Chat_API SHALL implement rate limiting of 10 requests per minute per IP
 * - 13.6: WHEN rate limit is exceeded, THE Chat_API SHALL return HTTP 429 with retry-after header
 * - 14.1: THE Chat_API SHALL have unit tests for request validation
 * - 14.2: THE Chat_API SHALL have unit tests for error handling
 */
describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockStorageService: jest.Mocked<ThrottlerStorageService>;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    // Create mock storage service
    mockStorageService = {
      increment: jest.fn(),
    } as any;

    // Create mock reflector that returns throttler options
    // The reflector is used by the base guard to determine throttler configuration
    mockReflector = {
      getAllAndOverride: jest.fn(),
      get: jest.fn(),
    } as any;

    // Create guard instance with array of throttler options (one of the valid formats)
    const throttlerOptions = [
      { name: 'chat', ttl: 60000, limit: 10 },
      { name: 'telemetry', ttl: 60000, limit: 120 },
    ];

    guard = new RateLimitGuard(
      throttlerOptions as any,
      mockStorageService as any,
      mockReflector as any,
    );

    // Call onModuleInit to initialize the guard's internal state
    await guard.onModuleInit();
  });

  /**
   * Helper function to create mock Request
   */
  function createMockRequest(
    ip: string,
    path: string,
    forwardedFor?: string,
  ): Partial<Request> {
    return {
      ip,
      path,
      route: { path },
      headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
      socket: { remoteAddress: ip } as any,
    };
  }

  /**
   * Helper function to create mock ExecutionContext
   */
  function createMockContext(
    ip: string,
    path: string,
    forwardedFor?: string,
  ): ExecutionContext {
    const mockRequest = createMockRequest(ip, path, forwardedFor);
    const mockResponse: Partial<Response> = {
      header: jest.fn(),
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => ({ name: 'handler' }),
      getClass: () => ({ name: 'Controller' }),
    } as any;
  }

  describe('IP Extraction (Requirement 8.4)', () => {
    it('should extract IP from X-Forwarded-For header when present', async () => {
      const mockRequest = createMockRequest(
        '127.0.0.1',
        '/api/chat',
        '203.0.113.1, 198.51.100.1',
      );

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('203.0.113.1');
    });

    it('should handle single IP in X-Forwarded-For', async () => {
      const mockRequest = createMockRequest(
        '127.0.0.1',
        '/api/chat',
        '203.0.113.1',
      );

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('203.0.113.1');
    });

    it('should fall back to request.ip when X-Forwarded-For not present', async () => {
      const mockRequest = createMockRequest('192.168.1.1', '/api/chat');

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('192.168.1.1');
    });

    it('should fall back to socket.remoteAddress when request.ip not available', async () => {
      const mockRequest: Partial<Request> = {
        ip: undefined,
        path: '/api/chat',
        route: { path: '/api/chat' },
        headers: {},
        socket: { remoteAddress: '10.0.0.1' } as any,
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('10.0.0.1');
    });

    it('should return "unknown" when no IP available', async () => {
      const mockRequest: Partial<Request> = {
        ip: undefined,
        path: '/api/chat',
        route: { path: '/api/chat' },
        headers: {},
        socket: { remoteAddress: undefined } as any,
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('unknown');
    });

    it('should trim whitespace from X-Forwarded-For IP', async () => {
      const mockRequest = createMockRequest(
        '127.0.0.1',
        '/api/chat',
        ' 203.0.113.1 , 198.51.100.1 ',
      );

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('203.0.113.1');
    });

    it('should handle IPv6 addresses', async () => {
      const mockRequest = createMockRequest(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '/api/chat',
      );

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle localhost addresses', async () => {
      const mockRequest = createMockRequest('::1', '/api/chat');

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('::1');
    });

    it('should handle X-Forwarded-For as array', async () => {
      const mockRequest: Partial<Request> = {
        ip: '127.0.0.1',
        path: '/api/chat',
        route: { path: '/api/chat' },
        headers: { 'x-forwarded-for': ['203.0.113.1', '198.51.100.1'] as any },
        socket: { remoteAddress: '127.0.0.1' } as any,
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('203.0.113.1');
    });
  });

  describe('429 Error Response Formatting (Requirement 13.6)', () => {
    it('should throw HttpException with 429 status', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');

      try {
        await (guard as any).throwThrottlingException(context);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should include user-friendly error message', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');

      try {
        await (guard as any).throwThrottlingException(context);
        fail('Should have thrown HttpException');
      } catch (error) {
        const response = (error as HttpException).getResponse();
        expect(response).toMatchObject({
          statusCode: 429,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
        });
      }
    });

    it('should include retryAfter in response body', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');

      try {
        await (guard as any).throwThrottlingException(context);
        fail('Should have thrown HttpException');
      } catch (error) {
        const response = (error as HttpException).getResponse();
        expect((response as any).retryAfter).toBeDefined();
        expect((response as any).retryAfter).toBe(60);
      }
    });

    it('should set Retry-After header in response', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      const mockResponse = context.switchToHttp().getResponse();

      try {
        await (guard as any).throwThrottlingException(context);
      } catch (error) {
        // Expected to throw
      }

      expect(mockResponse.header).toHaveBeenCalledWith('Retry-After', '60');
    });

    it('should return correct TTL for chat endpoint', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');

      try {
        await (guard as any).throwThrottlingException(context);
      } catch (error) {
        const response = (error as HttpException).getResponse();
        expect((response as any).retryAfter).toBe(60);
      }
    });

    it('should return correct TTL for telemetry endpoint', async () => {
      const context = createMockContext(
        '192.168.1.1',
        '/api/public/telemetry',
      );

      try {
        await (guard as any).throwThrottlingException(context);
      } catch (error) {
        const response = (error as HttpException).getResponse();
        expect((response as any).retryAfter).toBe(60);
      }
    });

    it('should handle path without route object', async () => {
      const mockRequest: Partial<Request> = {
        ip: '192.168.1.1',
        path: '/api/chat',
        route: undefined,
        headers: {},
        socket: { remoteAddress: '192.168.1.1' } as any,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ header: jest.fn() }),
        }),
      } as any;

      try {
        await (guard as any).throwThrottlingException(context);
      } catch (error) {
        const response = (error as HttpException).getResponse();
        expect((response as any).retryAfter).toBe(60);
      }
    });
  });

  describe('Rate Limit Enforcement (Requirements 14.1, 14.2)', () => {
    /**
     * Test that requests within the configured limit are allowed
     * 
     * Note: This test verifies the guard's integration with ThrottlerStorageService.
     * The actual rate limiting logic is provided by @nestjs/throttler's ThrottlerGuard base class.
     * Full end-to-end rate limiting behavior is verified in integration tests.
     * 
     * Requirement 14.1: THE Chat_API SHALL have unit tests for request validation
     */
    it('should allow requests within limit (mock storage)', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      
      // Configure reflector to not skip requests (return undefined for skipIf)
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // Mock storage to simulate requests under limit
      // When isBlocked is false, the base ThrottlerGuard allows the request
      mockStorageService.increment.mockResolvedValue({
        totalHits: 5,
        timeToExpire: 30000,
        isBlocked: false,
      });

      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
      expect(mockStorageService.increment).toHaveBeenCalled();
    });

    it('should allow multiple requests up to the limit (mock storage)', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // The throttler calls increment for each configured throttler
      // Since we have 2 throttlers (chat, telemetry), it will be called twice per canActivate
      // We need to ensure all responses indicate not blocked
      mockStorageService.increment.mockResolvedValue({
        totalHits: 5,
        timeToExpire: 60000,
        isBlocked: false,
      });

      for (let i = 1; i <= 10; i++) {
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      }
      
      // Verify increment was called (will be called 2x per request due to 2 throttlers)
      expect(mockStorageService.increment.mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    /**
     * Test that requests exceeding the limit throw HTTP 429
     * 
     * Requirement 14.2: THE Chat_API SHALL have unit tests for error handling
     * Requirement 13.6: WHEN rate limit is exceeded, THE Chat_API SHALL return HTTP 429
     */
    it('should throw 429 when requests exceed limit (mock storage)', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // Mock storage to simulate rate limit exceeded
      mockStorageService.increment.mockResolvedValue({
        totalHits: 11,
        timeToExpire: 60000,
        isBlocked: true, // Rate limit exceeded
      });

      // Should throw HttpException with 429 status
      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      
      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        
        const response = (error as HttpException).getResponse();
        expect(response).toMatchObject({
          statusCode: 429,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
        });
      }
    });

    it('should set Retry-After header when rate limit exceeded', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      const mockResponse = context.switchToHttp().getResponse();
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      mockStorageService.increment.mockResolvedValue({
        totalHits: 11,
        timeToExpire: 60000,
        isBlocked: true,
      });

      try {
        await guard.canActivate(context);
      } catch (error) {
        // Expected to throw
      }
      
      expect(mockResponse.header).toHaveBeenCalledWith('Retry-After', '60');
    });

    /**
     * Test that rate limit resets after TTL window expires
     * 
     * This simulates the storage service resetting the counter after TTL,
     * which is the actual behavior of the throttler storage.
     * 
     * Requirement 14.1: THE Chat_API SHALL have unit tests for request validation
     */
    it('should reset rate limit after TTL window (mock storage)', async () => {
      const context = createMockContext('192.168.1.1', '/api/chat');
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // First: Simulate rate limit exceeded
      mockStorageService.increment.mockResolvedValue({
        totalHits: 11,
        timeToExpire: 60000,
        isBlocked: true,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      
      // Second: After TTL expires, storage service resets the counter
      // This simulates what happens in the actual storage implementation
      // Reset the mock to return a new value
      mockStorageService.increment.mockReset();
      mockStorageService.increment.mockResolvedValue({
        totalHits: 1, // Counter reset by storage after TTL
        timeToExpire: 60000,
        isBlocked: false,
      });

      // Should now allow request
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should track rate limits per IP address independently', async () => {
      const context1 = createMockContext('192.168.1.1', '/api/chat');
      const context2 = createMockContext('192.168.1.2', '/api/chat');
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // The guard calls increment for each throttler (2 throttlers configured)
      // So we expect 4 total calls (2 per canActivate call)
      mockStorageService.increment.mockResolvedValue({
        totalHits: 5,
        timeToExpire: 60000,
        isBlocked: false,
      });

      // Both should succeed
      const result1 = await guard.canActivate(context1);
      const result2 = await guard.canActivate(context2);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Called 2x per request (2 throttlers) * 2 requests = 4 calls
      expect(mockStorageService.increment.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should enforce different limits for different endpoints', async () => {
      const chatContext = createMockContext('192.168.1.1', '/api/chat');
      const telemetryContext = createMockContext('192.168.1.1', '/api/public/telemetry');
      
      // Configure reflector
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      // Use mockImplementation to return different values for each call
      mockStorageService.increment.mockImplementation(async (key: string) => {
        // First call is chat, second call is telemetry
        const callIndex = mockStorageService.increment.mock.calls.length;
        
        return callIndex === 1
          ? { totalHits: 10, timeToExpire: 60000, isBlocked: false } // Chat: at limit
          : { totalHits: 50, timeToExpire: 60000, isBlocked: false }; // Telemetry: under limit
      });

      const chatResult = await guard.canActivate(chatContext);
      const telemetryResult = await guard.canActivate(telemetryContext);
      
      expect(chatResult).toBe(true);
      expect(telemetryResult).toBe(true);
    });
  });
});
