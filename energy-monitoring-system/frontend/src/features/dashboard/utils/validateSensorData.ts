import type { SensorReading } from '../types/dashboard.types';

/**
 * Validation range configuration
 */
interface ValidationRange {
  min: number;
  max: number;
  field: keyof SensorReading;
  label: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation ranges for sensor data fields
 * Requirements: 16.7, 16.8, 16.9, 16.10
 */
const VALIDATION_RANGES: ValidationRange[] = [
  { field: 'voltage', min: 0, max: 500, label: 'Voltage' },
  { field: 'current', min: 0, max: 100, label: 'Current' },
  { field: 'power', min: 0, max: 50000, label: 'Power' },
  { field: 'stepCount', min: 0, max: 1000000, label: 'Step Count' },
];

/**
 * Validates sensor reading data against acceptable ranges
 * 
 * Validates voltage (0-500V), current (0-100A), power (0-50000W), 
 * and stepCount (0-1000000) are within acceptable ranges.
 * 
 * @param reading - The sensor reading to validate
 * @returns ValidationResult with isValid boolean and error messages
 * 
 * Requirements: 16.7, 16.8, 16.9, 16.10, 17.6, 17.7, 19.6
 * 
 * @example
 * const result = validateSensorData(reading);
 * if (!result.isValid) {
 *   console.warn('Validation failed:', result.errors);
 * }
 */
export function validateSensorData(reading: SensorReading): ValidationResult {
  const errors: string[] = [];

  for (const range of VALIDATION_RANGES) {
    const value = reading[range.field];

    // Skip validation if field is undefined (optional fields)
    if (value === undefined) {
      continue;
    }

    // Ensure value is a number
    if (typeof value !== 'number' || isNaN(value)) {
      const errorMsg = `${range.label} is not a valid number`;
      errors.push(errorMsg);
      console.warn(`[Validation] ${errorMsg}:`, value);
      continue;
    }

    // Check if value is within acceptable range
    if (value < range.min || value > range.max) {
      const errorMsg = `${range.label} out of range: ${value} (expected ${range.min}-${range.max})`;
      errors.push(errorMsg);
      console.warn(`[Validation] ${errorMsg}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
