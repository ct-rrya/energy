import { registerAs } from '@nestjs/config';

/**
 * JWT configuration
 * Registers JWT settings for authentication tokens
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION || '7d',

  // Refresh token settings (for future use)
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
  refreshExpiresIn: '30d',
}));
