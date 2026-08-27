import * as Joi from 'joi';

/**
 * Environment Variables Validation Schema
 * 
 * This schema validates that all required environment variables:
 * 1. Exist
 * 2. Have the correct type
 * 3. Have valid values (where applicable)
 * 
 * If validation fails, the application will NOT start.
 * This prevents runtime errors due to missing configuration.
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // Database
  MONGODB_URI: Joi.string().required(),

  // JWT Authentication
  JWT_SECRET: Joi.string().required().min(16),
  JWT_EXPIRATION: Joi.string().default('7d'),

  // Messenger Bot (optional for now, required later)
  MESSENGER_PAGE_ACCESS_TOKEN: Joi.string().optional().allow(''),
  MESSENGER_VERIFY_TOKEN: Joi.string().optional().allow(''),
  MESSENGER_APP_SECRET: Joi.string().optional().allow(''),

  // ESP32 Authentication
  IOT_API_KEY: Joi.string().required(),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),

  // Notifications
  ENABLE_NOTIFICATIONS: Joi.boolean().default(false),
  NOTIFICATION_THRESHOLD_POWER: Joi.number().default(100),
});
