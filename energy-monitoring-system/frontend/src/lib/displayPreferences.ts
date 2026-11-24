export interface DisplayPreferences {
  timezone: string;
  timeFormat: '12-hour' | '24-hour';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  dashboardRefresh: 5 | 10 | 30 | 60;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  timezone: 'Asia/Manila',
  timeFormat: '12-hour',
  dateFormat: 'MM/DD/YYYY',
  dashboardRefresh: 10,
};

export function getDisplayPreferences(): DisplayPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem('ecostep_preferences');
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      timezone: typeof parsed.timezone === 'string' && parsed.timezone ? parsed.timezone : DEFAULT_PREFERENCES.timezone,
      timeFormat: parsed.timeFormat === '24-hour' ? '24-hour' : '12-hour',
      dateFormat: parsed.dateFormat === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
      dashboardRefresh: [5, 10, 30, 60].includes(parsed.dashboardRefresh)
        ? parsed.dashboardRefresh
        : DEFAULT_PREFERENCES.dashboardRefresh,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Formats a YYYY-MM-DD taskDate string according to the user's saved dateFormat preference.
 * Example: '2026-11-24' -> '11/24/2026' (MM/DD/YYYY) or '24/11/2026' (DD/MM/YYYY).
 */
export function formatPrefDateString(ymd: string, includeYear = true): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!match) return ymd;
  const [, year, month, day] = match;
  const { dateFormat } = getDisplayPreferences();

  if (dateFormat === 'DD/MM/YYYY') {
    return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;
  }
  return includeYear ? `${month}/${day}/${year}` : `${month}/${day}`;
}

/**
 * Formats a Date or ISO timestamp according to the user's saved timezone, dateFormat, and timeFormat.
 * Example (12-hour, MM/DD/YYYY): '11/05/2026, 4:29 PM'
 */
export function formatPrefDateTime(input: string | Date, includeYear = false): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);

  const { timezone, timeFormat, dateFormat } = getDisplayPreferences();

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12-hour',
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12-hour',
    }).formatToParts(date);
  }

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const month = get('month');
  const day = get('day');
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');
  const dayPeriod = get('dayPeriod');

  const datePart =
    dateFormat === 'DD/MM/YYYY'
      ? includeYear
        ? `${day}/${month}/${year}`
        : `${day}/${month}`
      : includeYear
      ? `${month}/${day}/${year}`
      : `${month}/${day}`;

  const timePart =
    timeFormat === '12-hour' && dayPeriod
      ? `${hour}:${minute} ${dayPeriod}`
      : `${hour.padStart(2, '0')}:${minute}`;

  return `${datePart} · ${timePart}`;
}
