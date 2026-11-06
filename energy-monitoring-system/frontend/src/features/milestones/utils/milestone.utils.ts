/**
 * Milestone Utility Functions
 *
 * Provides precision formatting, safe parsing, and Wh conversion
 * for EcoStep milliwatt-hour (mWh) milestone targets and actual accumulated energy.
 */

export type MilestoneLifecycleState = 'COMPLETED' | 'CURRENT' | 'UPCOMING';

/**
 * Formats a milliwatt-hour (mWh) or general energy value with appropriate precision
 * up to 6 decimal places without unnecessary trailing zeros.
 *
 * Examples:
 * - 0.09 -> "0.09"
 * - 0.005 -> "0.005"
 * - 0.0001 -> "0.0001"
 * - 1.25 -> "1.25"
 * - 5000 -> "5,000"
 * - 0.000001 -> "0.000001"
 * - 0 -> "0"
 */
export function formatMWh(val: number | null | undefined, maxDecimals = 6): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  if (val === 0) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(val);
}

/**
 * Formats equivalent Watt-hours (Wh) from milliwatt-hours (mWh).
 * 1 Wh = 1,000 mWh.
 * Displays up to 9 decimal places without unnecessary trailing zeros.
 */
export function formatWhFromMWh(mwh: number | null | undefined, maxDecimals = 9): string {
  if (mwh === null || mwh === undefined || isNaN(mwh)) return '0';
  if (mwh === 0) return '0';
  const wh = mwh / 1000;
  return formatMWh(wh, maxDecimals);
}

/**
 * Formats progress percentage cleanly.
 * If 0 < pct < 1, displays up to 2 decimal places (e.g. 0.05%).
 * Otherwise displays up to 1 decimal place (e.g. 45.2% or 100%).
 * Guarantees that an unachieved milestone never displays 100%.
 */
export function formatProgressPercent(pct: number | null | undefined, isAchieved?: boolean): string {
  if (pct === null || pct === undefined || isNaN(pct)) return '0%';
  if (pct === 0) return '0%';
  if (pct > 0 && pct < 1) {
    return `${Math.round(pct * 100) / 100}%`;
  }
  const rounded = Math.round(pct * 10) / 10;
  if (isAchieved === false && rounded >= 100) {
    return '99.9%';
  }
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(rounded)}%`;
}

/**
 * Safely parses and rounds a decimal value to at most 6 decimal places.
 * Returns null if invalid or <= 0.
 */
export function parsePositiveDecimal(val: string | number, maxDecimals = 6): number | null {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || num <= 0 || !isFinite(num)) {
    return null;
  }
  const factor = Math.pow(10, maxDecimals);
  return Math.round(num * factor) / factor;
}

/**
 * Formats "YYYY-MM" into a readable English month and year string, e.g. "November 2026"
 */
export function formatMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return yearMonth;

  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/**
 * Formats the exact start and end dates of a period in local time.
 * e.g. "Nov 1, 2026 – Nov 7, 2026 (GMT+8)"
 */
export function formatPeriodDateRange(
  startDateStr?: string,
  endDateStr?: string,
  days = 7,
): { rangeText: string; startFormatted: string; endFormatted: string; timeZoneName: string } {
  const end = endDateStr ? new Date(endDateStr) : new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date(end.getTime() - days * 86400000);

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  });

  const startFormatted = formatter.format(start);
  const endFormatted = formatter.format(end);
  const tzParts = tzFormatter.formatToParts(end);
  const tzName = tzParts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+8';

  return {
    rangeText: `${startFormatted} – ${endFormatted} (${tzName})`,
    startFormatted,
    endFormatted,
    timeZoneName: tzName,
  };
}
