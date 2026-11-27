import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentModerationService } from './content-moderation.service';
import { GeminiAIService } from '../ai/gemini-ai.service';

describe('ContentModerationService', () => {
  let service: ContentModerationService;
  let mockGeminiAI: jest.Mocked<Pick<GeminiAIService, 'isAvailable' | 'processQuery'>>;
  let mockConfig: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(() => {
    mockGeminiAI = {
      isAvailable: jest.fn().mockReturnValue(false),
      processQuery: jest.fn().mockResolvedValue(null),
    };
    mockConfig = {
      get: jest.fn().mockReturnValue(undefined),
    };
    service = new ContentModerationService(
      mockGeminiAI as unknown as GeminiAIService,
      mockConfig as unknown as ConfigService,
    );
  });

  it('allows normal EcoStep feedback posts', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'The piezo tile voltage drops when two students step together',
        message: 'We noticed the power reading dips in the lobby during recess. Could we calibrate it?',
        category: 'issue',
      }),
    ).resolves.toBeUndefined();
  });

  it('blocks external links and bare spam domains for visitors', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'Check this out',
        message: 'Visit https://spam-casino.xyz/bonus for free prizes',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.assertAllowed({
        kind: 'reply',
        message: 'go to myshop.com/deals',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks English and Filipino profanity including leetspeak evasions', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'Tile problem',
        message: 'This f@cking tile is broken',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.assertAllowed({
        kind: 'reply',
        message: 'putang ina bakit ayaw gumana',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not false-positive on normal words like class or assess', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'Class hallway tile assessment',
        message: 'Our class passed by the lobby tile to assess its energy output.',
      }),
    ).resolves.toBeUndefined();
  });

  it('blocks keyboard smash and character flooding', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'asdfghjkl',
        message: 'qwertyuiop zxcvbnm',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.assertAllowed({
        kind: 'reply',
        message: 'aaaaaaaaaaaaaaaaaaaa',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('also moderates admin posts (blocks spam links, profanity, and off-topic posts)', async () => {
    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'Promo Notice',
        message: 'See deals at https://spam-site.xyz/deals',
        isAdmin: true,
      }),
    ).rejects.toThrow(BadRequestException);

    mockGeminiAI.isAvailable.mockReturnValue(true);
    mockGeminiAI.processQuery.mockResolvedValue(
      '{"allowed": false, "reason": "This post is unrelated to EcoStep."}',
    );

    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'The quick brown fox',
        message: 'What does the fox say',
        isAdmin: true,
      }),
    ).rejects.toThrow('This post is unrelated to EcoStep.');
  });

  it('rejects off-topic posts when AI moderation returns allowed=false', async () => {
    mockGeminiAI.isAvailable.mockReturnValue(true);
    mockGeminiAI.processQuery.mockResolvedValue(
      '{"allowed": false, "reason": "This post is unrelated to EcoStep."}',
    );

    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'The quick brown fox',
        message: 'What does the fox say ning ning nining ning',
        category: 'general',
      }),
    ).rejects.toThrow('This post is unrelated to EcoStep.');
  });

  it('fails open when AI provider throws or returns null', async () => {
    mockGeminiAI.isAvailable.mockReturnValue(true);
    mockGeminiAI.processQuery.mockRejectedValue(new Error('Network timeout'));

    await expect(
      service.assertAllowed({
        kind: 'post',
        title: 'Auto-reply for messages',
        message: 'You could add an auto-reply feature when a user sends a concern.',
        category: 'suggestion',
      }),
    ).resolves.toBeUndefined();
  });
});
