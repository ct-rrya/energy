import { registerAs } from '@nestjs/config';

/**
 * Application configuration
 * Registers general application settings
 */
export default registerAs('app', () => ({
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  
  // CORS (Requirements: 5.11, 8.10, 11.10, 15.1)
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  productionUrl: process.env.PRODUCTION_URL || '',
  
  // IoT
  iotApiKey: process.env.IOT_API_KEY || 'default-iot-key-change-this',
  
  // Notifications
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  notificationThresholdPower: parseInt(process.env.NOTIFICATION_THRESHOLD_POWER || '100', 10),
}));
