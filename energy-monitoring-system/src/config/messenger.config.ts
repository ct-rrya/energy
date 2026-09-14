import { registerAs } from '@nestjs/config';

/**
 * Facebook Messenger Bot configuration
 * Registers settings for Facebook Messenger Platform integration
 */
export default registerAs('messenger', () => ({
  // Facebook Page Access Token (obtained from Facebook App settings)
  pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN || '',

  // Verify Token (custom token for webhook verification)
  verifyToken: process.env.MESSENGER_VERIFY_TOKEN || 'my-custom-verify-token',

  // App Secret (for validating webhook signatures)
  appSecret: process.env.MESSENGER_APP_SECRET || '',

  // Facebook Graph API version
  apiVersion: 'v18.0',

  // API endpoint
  apiUrl: 'https://graph.facebook.com',
}));
