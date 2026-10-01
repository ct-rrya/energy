/**
 * Validation Utility Types
 * 
 * Type definitions for data validation and range checking utilities.
 * Used to ensure sensor data integrity before display.
 * 
 * @module validation.types
 */

import type { ValidationRange } from '../types/hero-dashboard.types';

/**
 * Sensor Field Names
 * 
 * Valid field names for sensor data validation.
 */
export type SensorFieldName = 'voltage' | 'current' | 'power' | 'stepCount' | 'dailyEnergy';

/**
 * Validation Ranges Configuration
 * 
 * Predefined validation ranges for all sensor fields.
 * Based on Requirements 16.7-16.10, 17.6.
 */
export const VALIDATION_RANGES: Record<SensorFieldName, Omit<ValidationRange, 'field'>> = {
  voltage: { min: 0, max: 500 }, // 0-500V
  current: { min: 0, max: 100 }, // 0-100A
  power: { min: 0, max: 50000 }, // 0-50000W
  stepCount: { min: 0, max: 1000000 }, // 0-1,000,000 steps
  dailyEnergy: { min: 0, max: 1000 }, // 0-1000 kWh
};

/**
 * Validatable Data
 * 
 * Generic interface for data objects that can be validated.
 */
export interface ValidatableData {
  [key: string]: number | string | boolean | undefined;
}
