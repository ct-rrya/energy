import { registerAs } from '@nestjs/config';

/**
 * Database configuration
 * Registers MongoDB connection settings from environment variables
 */
export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-monitoring',
  options: {
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 2,

    // Timeout settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Retry settings
    retryWrites: true,
    w: 'majority',
  },
}));
