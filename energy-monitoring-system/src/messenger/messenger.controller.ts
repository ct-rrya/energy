import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MessengerService } from './messenger.service';
import type { WebhookVerificationDto, WebhookBodyDto } from './dto';

/**
 * Messenger Controller
 * 
 * Handles Facebook Messenger webhook.
 * 
 * Endpoints:
 * - GET  /api/messenger/webhook - Webhook verification
 * - POST /api/messenger/webhook - Receive messages
 * 
 * Flow:
 * 1. Facebook verifies webhook (GET request)
 * 2. Server validates verify token
 * 3. Server returns challenge
 * 4. Facebook sends messages (POST requests)
 * 5. Server processes and responds
 * 
 * Security:
 * - Webhook verification with verify token
 * - Signature validation (future enhancement)
 * - HTTPS required in production
 */
@ApiTags('Messenger')
@Controller('messenger')
export class MessengerController {
  private readonly logger = new Logger(MessengerController.name);
  private readonly verifyToken: string;

  constructor(
    private messengerService: MessengerService,
    private configService: ConfigService,
  ) {
    this.verifyToken = this.configService.get<string>('messenger.verifyToken') || 'my-custom-verify-token';
    this.logger.log('Messenger Controller initialized');
    this.logger.log(`Verify token loaded: ${this.verifyToken.substring(0, 5)}...`);
  }

  /**
   * Webhook Verification
   * 
   * Facebook calls this endpoint to verify the webhook.
   * 
   * Flow:
   * 1. Facebook sends GET request with:
   *    - hub.mode=subscribe
   *    - hub.verify_token=YOUR_VERIFY_TOKEN
   *    - hub.challenge=CHALLENGE_STRING
   * 
   * 2. Server validates verify token
   * 
   * 3. Server returns challenge if valid
   * 
   * @param query - Webhook verification parameters
   * @returns Challenge string if verification successful
   * @throws BadRequestException if verification fails
   * 
   * Example:
   * GET /api/messenger/webhook?hub.mode=subscribe&hub.verify_token=my-token&hub.challenge=12345
   * Response: 12345
   */
  @Get('webhook')
  @ApiOperation({
    summary: 'Webhook verification',
    description:
      'Facebook Messenger webhook verification endpoint. ' +
      'Facebook calls this once to verify the webhook URL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook verified successfully, returns challenge',
    type: String,
  })
  @ApiResponse({
    status: 403,
    description: 'Verification failed - invalid token',
  })
  verifyWebhook(@Query() query: any): string {
    this.logger.log('Webhook verification request received');

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Log verification attempt (without exposing tokens)
    this.logger.log(`Mode: ${mode}, Challenge: ${challenge ? 'present' : 'missing'}`);

    // Check if mode and token are valid
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('✅ Webhook verified successfully');
      return challenge;
    } else {
      this.logger.warn('❌ Webhook verification failed - invalid token');
      throw new BadRequestException('Verification failed');
    }
  }

  /**
   * Receive Webhook Events
   * 
   * Facebook sends POST requests to this endpoint when:
   * - User sends a message
   * - User clicks a button
   * - Other messaging events occur
   * 
   * Flow:
   * 1. Facebook sends POST with event data
   * 2. Server validates payload (future: signature validation)
   * 3. Server processes events
   * 4. Server returns 200 OK immediately
   * 5. Server sends response to user asynchronously
   * 
   * @param body - Webhook event payload
   * @returns 200 OK with 'EVENT_RECEIVED'
   * 
   * Note:
   * - Must respond quickly (< 20 seconds)
   * - Process events asynchronously
   * - Return 200 OK even if processing fails
   * 
   * Payload Structure:
   * {
   *   object: 'page',
   *   entry: [{
   *     id: 'PAGE_ID',
   *     time: 1234567890,
   *     messaging: [{
   *       sender: { id: 'USER_ID' },
   *       recipient: { id: 'PAGE_ID' },
   *       message: { text: 'hello' }
   *     }]
   *   }]
   * }
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive webhook events',
    description:
      'Receives messages and events from Facebook Messenger. ' +
      'Processes user commands and sends responses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Event received and processed',
    type: String,
  })
  @ApiExcludeEndpoint() // Hide from public Swagger docs (internal webhook)
  async receiveWebhook(@Body() body: WebhookBodyDto): Promise<string> {
    this.logger.log('Webhook event received');

    // Validate webhook payload
    if (body.object !== 'page') {
      this.logger.warn('Invalid webhook object type: ' + body.object);
      throw new BadRequestException('Invalid webhook object');
    }

    // Process each entry
    for (const entry of body.entry) {
      // Process each messaging event
      for (const event of entry.messaging) {
        await this.processMessagingEvent(event);
      }
    }

    // Return 200 OK immediately (Facebook requires quick response)
    return 'EVENT_RECEIVED';
  }

  /**
   * Process Messaging Event
   * 
   * Handles individual messaging events.
   * 
   * Supports:
   * - Text messages
   * - Postback buttons (future)
   * - Quick replies (future)
   * 
   * @param event - Messaging event
   */
  private async processMessagingEvent(event: any): Promise<void> {
    const senderId = event.sender.id;

    // [TRACE 1: INCOMING PAYLOAD]
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[TRACE 1: INCOMING PAYLOAD] Full event object:');
    this.logger.log(JSON.stringify(event, null, 2));
    this.logger.log(`[TRACE 1: INCOMING PAYLOAD] Sender ID: ${senderId}`);
    this.logger.log('═══════════════════════════════════════════════════════');

    try {
      // [TRACE 2: EVENT FILTER] - Check for events that should be dropped
      this.logger.log('[TRACE 2: EVENT FILTER] Checking event type...');

      // Check for echo (message sent by the bot itself)
      if (event.message && event.message.is_echo) {
        this.logger.warn('[TRACE 2: EVENT FILTER] ⏭️  DROPPED: is_echo = true (bot sent this)');
        return;
      }

      // Check for delivery receipt
      if (event.delivery) {
        this.logger.warn('[TRACE 2: EVENT FILTER] ⏭️  DROPPED: delivery receipt event');
        return;
      }

      // Check for read receipt
      if (event.read) {
        this.logger.warn('[TRACE 2: EVENT FILTER] ⏭️  DROPPED: read receipt event');
        return;
      }

      // Check if message.text is missing
      if (event.message && !event.message.text && !event.message.quick_reply) {
        this.logger.warn('[TRACE 2: EVENT FILTER] ⏭️  DROPPED: message.text missing and no quick_reply');
        this.logger.warn(`[TRACE 2: EVENT FILTER] Message object: ${JSON.stringify(event.message)}`);
        return;
      }

      this.logger.log('[TRACE 2: EVENT FILTER] ✅ Event passed all filter checks');

      // IMPORTANT: Check Quick Reply FIRST before text message
      // Quick Replies include both text and quick_reply payload
      // We must prioritize the payload over the text
      if (event.message && event.message.quick_reply) {
        const payload = event.message.quick_reply.payload;
        const text = event.message.text || '';
        this.logger.log('[TRACE 2: EVENT FILTER] Event type: QUICK_REPLY');
        this.logger.log(`[TRACE 2: EVENT FILTER] ⚡ Quick reply from ${senderId}`);
        this.logger.log(`[TRACE 2: EVENT FILTER]    Payload: "${payload}"`);
        this.logger.log(`[TRACE 2: EVENT FILTER]    Text: "${text}"`);

        // Process quick reply payload as command (NOT the text)
        this.messengerService
          .handleMessage(senderId, payload)
          .catch((error) => {
            this.logger.error('[TRACE 2: EVENT FILTER] ❌ Error in quick reply handler:');
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error name: ${error.name}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error message: ${error.message}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Stack trace: ${error.stack}`);
          });
      }

      // Handle postback (button click from Persistent Menu or Button Template)
      else if (event.postback && event.postback.payload) {
        const payload = event.postback.payload;
        this.logger.log('[TRACE 2: EVENT FILTER] Event type: POSTBACK');
        this.logger.log(`[TRACE 2: EVENT FILTER] 🔘 Postback from ${senderId}: "${payload}"`);

        // Process postback as command
        this.messengerService
          .handleMessage(senderId, payload)
          .catch((error) => {
            this.logger.error('[TRACE 2: EVENT FILTER] ❌ Error in postback handler:');
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error name: ${error.name}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error message: ${error.message}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Stack trace: ${error.stack}`);
          });
      }

      // Handle regular text message (typed by user)
      else if (event.message && event.message.text) {
        const messageText = event.message.text;
        this.logger.log('[TRACE 2: EVENT FILTER] Event type: TEXT_MESSAGE');
        this.logger.log(`[TRACE 2: EVENT FILTER] 📩 Text message from ${senderId}: "${messageText}"`);
        this.logger.log(`[TRACE 2: EVENT FILTER]    Message length: ${messageText.length} characters`);
        this.logger.log('[TRACE 2: EVENT FILTER] ✅ Passing to MessengerService.handleMessage()...');

        // Process message asynchronously (don't block webhook response)
        this.messengerService
          .handleMessage(senderId, messageText)
          .catch((error) => {
            this.logger.error('[TRACE 2: EVENT FILTER] ❌ Error in text message handler:');
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error name: ${error.name}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Error message: ${error.message}`);
            this.logger.error(`[TRACE 2: EVENT FILTER]    Stack trace: ${error.stack}`);
          });
      } else {
        this.logger.warn('[TRACE 2: EVENT FILTER] ⏭️  DROPPED: Unknown event type');
        this.logger.warn(`[TRACE 2: EVENT FILTER] Event structure: ${JSON.stringify(event, null, 2)}`);
      }
    } catch (error) {
      this.logger.error('[TRACE 2: EVENT FILTER] ❌ EXCEPTION in processMessagingEvent:');
      this.logger.error(`[TRACE 2: EVENT FILTER]    Error name: ${error.name}`);
      this.logger.error(`[TRACE 2: EVENT FILTER]    Error message: ${error.message}`);
      this.logger.error(`[TRACE 2: EVENT FILTER]    Stack trace: ${error.stack}`);
    }
  }
}
