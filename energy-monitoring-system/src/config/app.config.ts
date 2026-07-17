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
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  
  // IoT
  iotApiKey: process.env.IOT_API_KEY || 'default-iot-key-change-this',
  
  // Notifications
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  notificationThresholdPower: parseInt(process.env.NOTIFICATION_THRESHOLD_POWER || '100', 10),
}));
