/**
 * Webhook DTOs for Facebook Messenger
 *
 * These DTOs match the structure of incoming webhook events from Facebook.
 *
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks
 */

/**
 * Webhook Verification Query DTO
 *
 * Used when Facebook verifies the webhook endpoint.
 *
 * Note: Using interface instead of class to avoid validation
 * issues with dot-notation property names.
 */
export interface WebhookVerificationDto {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

/**
 * Message Event DTO
 *
 * Represents a message sent by a user.
 */
export interface MessageEventDto {
  mid: string; // Message ID
  text?: string; // Message text
  quick_reply?: {
    payload: string;
  };
}

/**
 * Postback Event DTO
 *
 * Represents a postback from button click.
 */
export interface PostbackEventDto {
  title: string;
  payload: string;
}

/**
 * Messaging Event DTO
 *
 * Contains sender, recipient, and event details.
 */
export interface MessagingEventDto {
  sender: {
    id: string; // Facebook User ID (PSID)
  };
  recipient: {
    id: string; // Page ID
  };
  timestamp: number;
  message?: MessageEventDto;
  postback?: PostbackEventDto;
}

/**
 * Webhook Entry DTO
 *
 * Contains one or more messaging events.
 */
export interface WebhookEntryDto {
  id: string; // Page ID
  time: number;
  messaging: MessagingEventDto[];
}

/**
 * Webhook Body DTO
 *
 * Top-level webhook payload from Facebook.
 */
export interface WebhookBodyDto {
  object: string; // Should be "page"
  entry: WebhookEntryDto[];
}
