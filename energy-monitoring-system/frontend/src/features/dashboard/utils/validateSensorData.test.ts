import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSensorData } from './validateSensorData';
import type { SensorReading } from '../types/dashboard.types';

describe('validateSensorData', () => {
  // Mock console.warn
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate a correct sensor reading', () => {
    const validReading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: 12500,
      energy: 10,
      stepCount: 500,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(validReading);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should accept readings with optional fields undefined', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: 12500,
      energy: 10,
      timestamp: new Date().toISOString(),
      // stepCount is undefined
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject voltage above 500V', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 600,
      current: 50,
      power: 30000,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Voltage out of range');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Validation] Voltage out of range')
    );
  });

  it('should reject negative voltage', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: -10,
      current: 50,
      power: 0,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Voltage out of range');
  });

  it('should reject current above 100A', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 150,
      power: 37500,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Current out of range');
  });

  it('should reject negative current', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: -5,
      power: 0,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Current out of range');
  });

  it('should reject power above 50000W', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: 62500,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Power out of range');
  });

  it('should reject negative power', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: -100,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Power out of range');
  });

  it('should reject stepCount above 1000000', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: 12500,
      energy: 10,
      stepCount: 1500000,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Step Count out of range');
  });

  it('should reject negative stepCount', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 250,
      current: 50,
      power: 12500,
      energy: 10,
      stepCount: -100,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Step Count out of range');
  });

  it('should detect multiple validation errors', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 600, // Invalid
      current: 150, // Invalid
      power: 100000, // Invalid
      energy: 10,
      stepCount: -50, // Invalid
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(4);
    expect(result.errors[0]).toContain('Voltage');
    expect(result.errors[1]).toContain('Current');
    expect(result.errors[2]).toContain('Power');
    expect(result.errors[3]).toContain('Step Count');
  });

  it('should reject non-numeric values', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: NaN,
      current: 50,
      power: 12500,
      energy: 10,
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Voltage is not a valid number');
  });

  it('should validate boundary values correctly', () => {
    const reading: SensorReading = {
      sensorId: 'sensor-1',
      voltage: 0, // Min boundary
      current: 100, // Max boundary
      power: 50000, // Max boundary
      energy: 10,
      stepCount: 0, // Min boundary
      timestamp: new Date().toISOString(),
    };

    const result = validateSensorData(reading);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
