/**
 * Shared Hour-Range Filter Utilities
 *
 * Builds MongoDB $expr conditions that filter Date fields by local hour-of-day
 * (0-23) in Asia/Manila (UTC+8). Supports normal ranges (e.g. 08-17),
 * single-hour filters (e.g. 10-10), and overnight wrap-around ranges (e.g. 22-02).
 */

export function parseHourParam(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > 23) return undefined;
  return num;
}

export function buildHourRangeExpr(
  fieldName: string,
  startHour?: number | string,
  endHour?: number | string,
  timezone = 'Asia/Manila',
): Record<string, any> | null {
  const s = parseHourParam(startHour);
  const e = parseHourParam(endHour);
  if (s === undefined || e === undefined) return null;
  if (s === 0 && e === 23) return null; // Full day — no extra filter needed

  const hourExpr = { $hour: { date: `$${fieldName}`, timezone } };
  if (s <= e) {
    return { $and: [{ $gte: [hourExpr, s] }, { $lte: [hourExpr, e] }] };
  }

  // Overnight wrap-around (e.g. 22:00 to 02:00)
  return { $or: [{ $gte: [hourExpr, s] }, { $lte: [hourExpr, e] }] };
}
