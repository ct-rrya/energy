import { randomBytes } from 'crypto';

/**
 * API Key Generator Utility
 *
 * Generates secure random API keys for ESP32 sensor authentication.
 *
 * Format: "esp32_" + 32 random hexadecimal characters
 * Example: "esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *
 * Security:
 * - Uses Node.js crypto.randomBytes for cryptographically secure randomness
 * - 16 bytes = 128 bits of entropy = 32 hex characters
 * - Prefix "esp32_" for easy identification
 * - Total length: 38 characters (6 prefix + 32 random)
 *
 * Why not JWT for ESP32?
 * - ESP32 has limited memory and processing power
 * - JWT requires parsing and validation
 * - Simple API key is more efficient for IoT devices
 * - Stateless validation via database lookup
 *
 * Collision Probability:
 * - With 128 bits of entropy, collision is virtually impossible
 * - Database unique constraint prevents duplicates
 * - If collision occurs, service will generate new key
 */

/**
 * Generate Sensor API Key
 *
 * Creates a unique, cryptographically secure API key for sensor authentication.
 *
 * @returns API key string in format "esp32_[32 hex characters]"
 *
 * Example Output:
 * - "esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 * - "esp32_9f8e7d6c5b4a3928176f5e4d3c2b1a09"
 *
 * Usage:
 * ```typescript
 * const apiKey = generateSensorApiKey();
 * await sensor.save({ apiKey });
 * ```
 *
 * Security Notes:
 * - API key should be transmitted to ESP32 over secure channel
 * - Store in ESP32 flash memory or EEPROM
 * - Never expose in public logs or error messages
 * - Can be regenerated if compromised
 */
export function generateSensorApiKey(): string {
  // Generate 16 random bytes (128 bits)
  const randomBuffer = randomBytes(16);

  // Convert to hexadecimal string (32 characters)
  const randomHex = randomBuffer.toString('hex');

  // Add prefix and return
  return `esp32_${randomHex}`;
}

/**
 * Validate API Key Format
 *
 * Checks if a string matches the expected API key format.
 *
 * @param apiKey - API key string to validate
 * @returns true if format is valid, false otherwise
 *
 * Format Requirements:
 * - Must start with "esp32_"
 * - Must be exactly 38 characters long
 * - Last 32 characters must be hexadecimal (0-9, a-f)
 *
 * Usage:
 * ```typescript
 * if (isValidApiKeyFormat(apiKey)) {
 *   // Proceed with database lookup
 * } else {
 *   throw new BadRequestException('Invalid API key format');
 * }
 * ```
 *
 * Note:
 * - This only validates FORMAT, not authenticity
 * - Database lookup still required to verify key exists
 * - Used for early validation before database query
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Check if string exists
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Check length (6 prefix + 32 hex = 38 total)
  if (apiKey.length !== 38) {
    return false;
  }

  // Check prefix
  if (!apiKey.startsWith('esp32_')) {
    return false;
  }

  // Extract random part (after prefix)
  const randomPart = apiKey.substring(6);

  // Check if random part is valid hexadecimal
  const hexRegex = /^[0-9a-f]{32}$/;
  return hexRegex.test(randomPart);
}
