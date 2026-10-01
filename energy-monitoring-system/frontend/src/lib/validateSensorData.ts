/**
 * Sensor Data Validation Utility
 * 
 * Validates sensor readings against expected ranges to ensure data integrity.
 * Part of the EcoStep Hero Energy Dashboard implementation.
 * 
 * Requirements: 16.7, 16.8, 16.9, 16.10, 17.6, 17.7, 19.6
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation range interface
 */
interface ValidationRange {
  min: number;
  max: number;
  unit: string;
}

/**
 * Validation ranges for sensor readings
 * 
 * Based on requirements:
 * - Voltage: 0-500V (Requirement 16.8)
 * - Current: 0-100A (Requirement 16.9)
 * - Power: 0-50000W (Requirement 16.10)
 * - Step Count: 0-1000000 (Requirement 16.10)
 */
const VALIDATION_RANGES: Record<string, ValidationRange> = {
  voltage: { min: 0, max: 500, unit: 'V' },
  current: { min: 0, max: 100, unit: 'A' },
  power: { min: 0, max: 50000, unit: 'W' },
  stepCount: { min: 0, max: 1000000, unit: '' },
};

/**
 * Validates sensor data against expected ranges
 * 
 * Checks voltage, current, power, and stepCount values to ensure they fall
 * within acceptable ranges. Logs console warnings for out-of-range values
 * and returns a ValidationResult with detailed error messages.
 * 
 * @param data - Partial sensor reading data to validate
 * @returns ValidationResult with isValid boolean and error messages
 * 
 * @example
 * ```typescript
 * const result = validateSensorData({ voltage: 250, current: 5.5, power: 1375 });
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateSensorData(
  data: Partial<{
    voltage: number;
    current: number;
    power: number;
    stepCount: number;
  }>
): ValidationResult {
  const errors: string[] = [];

  // Validate each field that has a defined value
  for (const [field, range] of Object.entries(VALIDATION_RANGES)) {
    const value = data[field as keyof typeof data];

    // Skip validation if value is undefined or null
    if (value === undefined || value === null) {
      continue;
    }

    // Check if value is a valid number
    if (typeof value !== 'number' || isNaN(value)) {
      const error = `${field} is not a valid number: ${value}`;
      errors.push(error);
      console.warn(`[Validation] ${error}`);
      continue;
    }

    // Check if value is within valid range
    if (value < range.min || value > range.max) {
      const unit = range.unit ? range.unit : '';
      const error = `${field} (${value}${unit}) is outside valid range (${range.min}-${range.max}${unit})`;
      errors.push(error);
      console.warn(`[Validation] ${error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
