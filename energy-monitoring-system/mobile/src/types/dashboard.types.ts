/**
 * Dashboard Types
 * 
 * Type definitions for dashboard metrics and alerts.
 */

/**
 * Dashboard Metrics
 * Combined metrics for the main dashboard view
 * Matches backend: GET /api/dashboard/metrics response
 */
export interface DashboardMetrics {
  dailyEnergy: number;              // Today's energy (kWh)
  totalReadings: number;            // Total readings in system
  todayTotalPower: number;          // Today's total power sum (W)
  todayAvgPower: number;            // Today's average power (W)
  todayEstimatedEnergyKWh: number;  // Today's estimated energy (kWh)
  activeSensors: number;            // Number of active sensors
  lastReadingAt: string | null;     // ISO 8601
  lastReadingPower: number | null;  // Last reading power (W)
  lastReadingSensorId?: string | null;
  aiInsight?: string;               // AI-generated insight (optional)
}
