import { registerAs } from '@nestjs/config';

/**
 * JWT configuration
 * Registers JWT settings for authentication tokens
 */
export default registerAs('jwt', () => {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET;
  if (isProd && (!secret || secret.length < 16)) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable must be set (min 16 chars) in production.',
    );
  }
  return {
    secret: secret || 'dev-only-jwt-secret-do-not-use-in-prod',
    expiresIn: process.env.JWT_EXPIRATION || '7d',

    // Refresh token settings (for future use)
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      (isProd ? secret : 'dev-only-refresh-secret-do-not-use-in-prod'),
    refreshExpiresIn: '30d',
  };
});
