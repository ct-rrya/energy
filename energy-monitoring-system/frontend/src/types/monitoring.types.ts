/**
 * Monitoring Types
 * 
 * TypeScript interfaces for EcoStep Monitoring Suite features.
 * Covers the 7 hardware-proposed monitoring measurements.
 */

// ============================================================================
// Core Monitoring Measurements
// ============================================================================

/**
 * Energy Generation
 * 
 * Measurement: Generated Energy (J) or Joules
 * Note: Energy is measured in Joules, NOT watts (power)
 */
export interface EnergyGeneration {
  energyJ: number; // Joules
  powerW?: number; // Watts (if separately calculated)
  timestamp: string;
}

/**
 * Voltage Measurement
 * 
 * Measurement: Voltage (V)
 */
export interface VoltageMeasurement {
  voltage: number; // Volts
  timestamp: string;
}

/**
 * Capacitor Capacity Measurement
 * 
 * Measurement: Capacitor voltage (V)
 * Note: Use actual hardware-provided measurement, not fabricated percentage
 */
export interface CapacitorMeasurement {
  capacitorVoltage: number; // Volts
  timestamp: string;
}

/**
 * Step Count
 * 
 * Measurement: Number of detected footsteps
 */
export interface StepCountMeasurement {
  stepCount: number;
  timestamp: string;
}

// ============================================================================
// Connectivity Status (NOT time-series charts)
// ============================================================================

/**
 * Wi-Fi Connectivity
 * 
 * Status indicator, NOT a chart
 */
export interface WiFiStatus {
  connected: boolean;
  status: 'Connected' | 'Disconnected' | 'Unknown';
}

/**
 * Bluetooth Connectivity
 * 
 * Status indicator, NOT a chart
 */
export interface BluetoothStatus {
  connected: boolean;
  status: 'Available' | 'Connected' | 'Disconnected' | 'Unknown';
}

/**
 * Real-Time Data Transfer
 * 
 * Shows whether telemetry is reaching the dashboard
 * Status indicator with last update, NOT a chart
 */
export interface DataTransferStatus {
  status: 'Receiving' | 'Waiting for Data' | 'Offline' | 'Connection Lost' | 'Error';
  lastUpdate: string | null;
  latencyMs?: number;
}

// ============================================================================
// Consolidated Monitoring Data
// ============================================================================

/**
 * Current Monitoring State
 * 
 * Real-time snapshot of all monitoring metrics
 */
export interface MonitoringState {
  // Primary measurements
  energyJ: number;
  voltage: number;
  powerW?: number;
  capacitorVoltage?: number;
  stepCount?: number;
  
  // Connectivity (status only)
  wifiConnected: boolean;
  bluetoothConnected: boolean;
  dataTransferStatus: DataTransferStatus['status'];
  
  // Metadata
  timestamp: string;
  lastUpdate: string | null;
  deviceOnline: boolean;
}

/**
 * Monitoring Metric Card
 * 
 * UI component data for metric display cards
 */
export interface MonitoringCard {
  id: string;
  title: string;
  value: number | string;
  unit: string;
  type: 'measurement' | 'status';
  status?: 'normal' | 'warning' | 'error';
  icon?: string;
}

/**
 * Chart Configuration
 * 
 * Configuration for time-series charts
 */
export interface MonitoringChartConfig {
  id: string;
  title: string;
  metric: 'energy' | 'voltage' | 'capacitor' | 'steps' | 'power';
  yAxisLabel: string;
  unit: string;
  showLegend: boolean;
  timeRange: 'realtime' | 'today' | 'week' | 'month';
}

// ============================================================================
// Empty States
// ============================================================================

/**
 * Empty State Reason
 */
export type EmptyStateReason =
  | 'no-data'
  | 'no-sensor'
  | 'device-offline'
  | 'waiting-for-data'
  | 'no-real-iot-data'
  | 'insufficient-data';

/**
 * Empty State Configuration
 */
export interface EmptyStateConfig {
  reason: EmptyStateReason;
  title: string;
  message: string;
  icon?: string;
}

// ============================================================================
// Historical Analytics Integration
// ============================================================================

/**
 * Historical Monitoring Summary
 * 
 * Aggregated historical data for analytics
 */
export interface HistoricalMonitoringSummary {
  // Energy
  totalEnergyJ: number;
  avgEnergyJ: number;
  peakEnergyJ: number;
  
  // Voltage
  avgVoltage: number;
  minVoltage: number;
  maxVoltage: number;
  
  // Capacitor
  avgCapacitorVoltage?: number;
  minCapacitorVoltage?: number;
  maxCapacitorVoltage?: number;
  
  // Steps
  totalSteps?: number;
  avgStepsPerPeriod?: number;
  
  // Period
  startDate: string;
  endDate: string;
  periodLabel: string;
}

// ============================================================================
// System Diagnostics Types
// ============================================================================

/**
 * Diagnostic Comparison Result
 * 
 * For System Diagnostics feature
 */
export interface DiagnosticComparison {
  appliedTestCondition: string; // e.g., "10 kg"
  expectedEnergy: number; // Joules
  measuredEnergy: number; // Joules
  difference: number; // Joules
  result: 'Within Expected Range' | 'Below Expected Output' | 'Above Expected Output' | 'Insufficient Data' | 'Not Tested' | 'No Reference Configured';
  timestamp: string;
}

// ============================================================================
// Data Source Labeling
// ============================================================================

/**
 * Data Source
 */
export type DataSource = 'real-iot' | 'demo' | 'unknown';

/**
 * Data Source Label
 */
export interface DataSourceLabel {
  source: DataSource;
  label: string;
  isReal: boolean;
}
