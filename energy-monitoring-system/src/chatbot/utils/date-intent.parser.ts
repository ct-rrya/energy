import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  addDays,
  subMonths,
  addMonths,
  addWeeks,
  format,
} from 'date-fns';

export const PROJECT_TIMEZONE = 'Asia/Manila';

export interface DateIntent {
  start: Date | null;
  end: Date | null;
  label: string;
  kind: 'day' | 'range' | 'none';
  isFuture?: boolean;
  inherited?: boolean;
  isToday?: boolean;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTH_PATTERN =
  'january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec';

const NONE_INTENT: DateIntent = {
  start: null,
  end: null,
  label: '',
  kind: 'none',
};

function isValidCalendarDate(year: number, monthIndex: number, day: number): boolean {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31 || year < 1970 || year > 2100) {
    return false;
  }
  const d = new Date(year, monthIndex, day);
  return d.getFullYear() === year && d.getMonth() === monthIndex && d.getDate() === day;
}

function buildDayIntent(
  zonedDate: Date,
  zonedNow: Date,
  tz: string,
  prefixLabel?: string,
  extra?: Partial<DateIntent>,
): DateIntent {
  const dayStartZoned = startOfDay(zonedDate);
  const dayEndZoned = endOfDay(zonedDate);
  const startUtc = fromZonedTime(dayStartZoned, tz);
  const endUtc = fromZonedTime(dayEndZoned, tz);
  const formatted = format(dayStartZoned, 'MMM d, yyyy');
  const label = prefixLabel ? `${prefixLabel} (${formatted})` : formatted;
  const isFuture = dayStartZoned.getTime() > endOfDay(zonedNow).getTime();

  return {
    start: startUtc,
    end: endUtc,
    label,
    kind: 'day',
    isFuture,
    ...extra,
  };
}

function buildRangeIntent(
  startZoned: Date,
  endZoned: Date,
  zonedNow: Date,
  tz: string,
  label: string,
  extra?: Partial<DateIntent>,
): DateIntent {
  const s = startOfDay(startZoned);
  const e = endOfDay(endZoned);
  const startUtc = fromZonedTime(s, tz);
  const endUtc = fromZonedTime(e, tz);
  const isFuture = s.getTime() > endOfDay(zonedNow).getTime();

  return {
    start: startUtc,
    end: endUtc,
    label,
    kind: 'range',
    isFuture,
    ...extra,
  };
}

/**
 * Parse a single explicit date token into a zoned Date (Asia/Manila wall-clock).
 * Returns null if invalid.
 */
function parseExplicitDateToken(token: string, zonedNow: Date): { date: Date; hasExplicitYear: boolean } | null {
  const clean = token.trim().replace(/,/g, '').replace(/\s+/g, ' ');

  // 1. ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    if (!isValidCalendarDate(y, m, d)) return null;
    return { date: new Date(y, m, d), hasExplicitYear: true };
  }

  // 2. Numeric MM/DD/YYYY or MM/DD
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const m = Number(slashMatch[1]) - 1;
    const d = Number(slashMatch[2]);
    let y = zonedNow.getFullYear();
    const hasExplicitYear = Boolean(slashMatch[3]);
    if (slashMatch[3]) {
      y = slashMatch[3].length === 2 ? 2000 + Number(slashMatch[3]) : Number(slashMatch[3]);
    }
    if (!isValidCalendarDate(y, m, d)) return null;
    let candidate = new Date(y, m, d);
    if (!hasExplicitYear && startOfDay(candidate).getTime() > endOfDay(zonedNow).getTime()) {
      const prevYear = y - 1;
      if (isValidCalendarDate(prevYear, m, d)) {
        candidate = new Date(prevYear, m, d);
      }
    }
    return { date: candidate, hasExplicitYear };
  }

  // 3. Month Day [Year] (e.g. "Nov 18", "November 18th 2026")
  const mdyRegex = new RegExp(`^(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?$`, 'i');
  const mdyMatch = clean.match(mdyRegex);
  if (mdyMatch) {
    const m = MONTH_MAP[mdyMatch[1].toLowerCase()];
    const d = Number(mdyMatch[2]);
    const hasExplicitYear = Boolean(mdyMatch[3]);
    const y = hasExplicitYear ? Number(mdyMatch[3]) : zonedNow.getFullYear();
    if (!isValidCalendarDate(y, m, d)) return null;
    let candidate = new Date(y, m, d);
    if (!hasExplicitYear && startOfDay(candidate).getTime() > endOfDay(zonedNow).getTime()) {
      const prevYear = y - 1;
      if (isValidCalendarDate(prevYear, m, d)) {
        candidate = new Date(prevYear, m, d);
      }
    }
    return { date: candidate, hasExplicitYear };
  }

  // 4. Day [of] Month [Year] (e.g. "18 Nov", "18th of November 2026")
  const dmyRegex = new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${MONTH_PATTERN})\\.?(?:\\s+(\\d{4}))?$`, 'i');
  const dmyMatch = clean.match(dmyRegex);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = MONTH_MAP[dmyMatch[2].toLowerCase()];
    const hasExplicitYear = Boolean(dmyMatch[3]);
    const y = hasExplicitYear ? Number(dmyMatch[3]) : zonedNow.getFullYear();
    if (!isValidCalendarDate(y, m, d)) return null;
    let candidate = new Date(y, m, d);
    if (!hasExplicitYear && startOfDay(candidate).getTime() > endOfDay(zonedNow).getTime()) {
      const prevYear = y - 1;
      if (isValidCalendarDate(prevYear, m, d)) {
        candidate = new Date(prevYear, m, d);
      }
    }
    return { date: candidate, hasExplicitYear };
  }

  return null;
}

function isFollowUpQuery(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (/\b(all[\s-]?time|overall|lifetime|ever|total accumulated)\b/.test(lower)) {
    return false;
  }
  const hasFollowUpCue =
    /^(and|what about|how about|also|same for|how many|what was|what were|show me|give me)\b/.test(lower) ||
    /\b(steps|power|peak|voltage|current|energy|readings|average|avg|max|min|that day|that week|that month|then)\b/.test(lower);
  return hasFollowUpCue;
}

/**
 * Parse natural-language date/range expressions in Asia/Manila timezone and
 * return UTC boundaries suitable for MongoDB range queries.
 */
export function parseDateIntent(
  message: string,
  now: Date = new Date(),
  lastDate?: DateIntent | null,
  timezone: string = PROJECT_TIMEZONE,
): DateIntent {
  const text = (message || '').trim();
  if (!text) return NONE_INTENT;

  const lower = text.toLowerCase();
  const zonedNow = toZonedTime(now, timezone);

  // -------------------------------------------------------------------------
  // 1. Explicit date ranges
  // -------------------------------------------------------------------------

  // 1a. Same-month shorthand range: "Nov 10 to 15", "Nov 10-15, 2026", "November 10 - 15"
  const sameMonthRangeRe = new RegExp(
    `\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:to|thru|through|-)\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`,
    'i',
  );
  const sameMonthMatch = text.match(sameMonthRangeRe);
  if (sameMonthMatch) {
    const m = MONTH_MAP[sameMonthMatch[1].toLowerCase()];
    const d1 = Number(sameMonthMatch[2]);
    const d2 = Number(sameMonthMatch[3]);
    const hasYear = Boolean(sameMonthMatch[4]);
    let y = hasYear ? Number(sameMonthMatch[4]) : zonedNow.getFullYear();
    if (isValidCalendarDate(y, m, d1) && isValidCalendarDate(y, m, d2) && d1 <= d2) {
      let startZ = new Date(y, m, d1);
      let endZ = new Date(y, m, d2);
      if (!hasYear && startOfDay(startZ).getTime() > endOfDay(zonedNow).getTime()) {
        y -= 1;
        if (isValidCalendarDate(y, m, d1) && isValidCalendarDate(y, m, d2)) {
          startZ = new Date(y, m, d1);
          endZ = new Date(y, m, d2);
        }
      }
      return buildRangeIntent(
        startZ,
        endZ,
        zonedNow,
        timezone,
        `${format(startZ, 'MMM d')} – ${format(endZ, 'MMM d, yyyy')}`,
      );
    }
    return NONE_INTENT;
  }

  // 1b. Two explicit dates separated by "to", "through", "thru", "and" (after "between"), or " - "
  const dateAtom = `(?:\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|(?:${MONTH_PATTERN})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?(?:\\s+of)?\\s+(?:${MONTH_PATTERN})\\.?(?:,?\\s*\\d{4})?)`;
  const rangeRe = new RegExp(
    `(?:(?:from|between)\\s+)?(${dateAtom})\\s+(?:to|through|thru|and|-)\\s+(${dateAtom})`,
    'i',
  );
  const rangeMatch = text.match(rangeRe);
  if (rangeMatch) {
    const parsedA = parseExplicitDateToken(rangeMatch[1], zonedNow);
    const parsedB = parseExplicitDateToken(rangeMatch[2], zonedNow);
    if (parsedA && parsedB) {
      const startZ = parsedA.date <= parsedB.date ? parsedA.date : parsedB.date;
      const endZ = parsedA.date <= parsedB.date ? parsedB.date : parsedA.date;
      return buildRangeIntent(
        startZ,
        endZ,
        zonedNow,
        timezone,
        `${format(startZ, 'MMM d, yyyy')} – ${format(endZ, 'MMM d, yyyy')}`,
      );
    }
    return NONE_INTENT;
  }

  // -------------------------------------------------------------------------
  // 2. Relative day/range keywords
  // -------------------------------------------------------------------------
  if (/\b(day before yesterday)\b/.test(lower)) {
    return buildDayIntent(subDays(zonedNow, 2), zonedNow, timezone, 'Day before yesterday');
  }
  if (/\b(yesterday)\b/.test(lower)) {
    return buildDayIntent(subDays(zonedNow, 1), zonedNow, timezone, 'Yesterday');
  }
  if (/\b(tomorrow)\b/.test(lower)) {
    return buildDayIntent(addDays(zonedNow, 1), zonedNow, timezone, 'Tomorrow', { isFuture: true });
  }
  if (/\b(today|tonight|this morning|so far today)\b/.test(lower)) {
    return buildDayIntent(zonedNow, zonedNow, timezone, 'Today', { isToday: true });
  }

  // "N days ago"
  const daysAgoMatch = lower.match(/\b(\d{1,3})\s+days?\s+ago\b/);
  if (daysAgoMatch) {
    const n = Number(daysAgoMatch[1]);
    if (n >= 1 && n <= 365) {
      return buildDayIntent(subDays(zonedNow, n), zonedNow, timezone, `${n} day${n === 1 ? '' : 's'} ago`);
    }
    return NONE_INTENT;
  }

  // "last N days" / "past N days"
  const lastNDaysMatch = lower.match(/\b(?:last|past)\s+(\d{1,3})\s+days?\b/);
  if (lastNDaysMatch) {
    const n = Number(lastNDaysMatch[1]);
    if (n >= 1 && n <= 365) {
      const startZ = subDays(zonedNow, n - 1);
      return buildRangeIntent(
        startZ,
        zonedNow,
        zonedNow,
        timezone,
        `Last ${n} days (${format(startZ, 'MMM d')} – ${format(zonedNow, 'MMM d, yyyy')})`,
      );
    }
    return NONE_INTENT;
  }

  // "this week" / "last week" / "next week"
  if (/\b(this week)\b/.test(lower)) {
    const startZ = startOfWeek(zonedNow, { weekStartsOn: 1 });
    return buildRangeIntent(
      startZ,
      zonedNow,
      zonedNow,
      timezone,
      `This week (${format(startZ, 'MMM d')} – ${format(zonedNow, 'MMM d, yyyy')})`,
    );
  }
  if (/\b(last week|previous week|past week)\b/.test(lower)) {
    const prevWeekRef = subDays(zonedNow, 7);
    const startZ = startOfWeek(prevWeekRef, { weekStartsOn: 1 });
    const endZ = endOfWeek(prevWeekRef, { weekStartsOn: 1 });
    return buildRangeIntent(
      startZ,
      endZ,
      zonedNow,
      timezone,
      `Last week (${format(startZ, 'MMM d')} – ${format(endZ, 'MMM d, yyyy')})`,
    );
  }
  if (/\b(next week)\b/.test(lower)) {
    const nextWeekRef = addWeeks(zonedNow, 1);
    const startZ = startOfWeek(nextWeekRef, { weekStartsOn: 1 });
    const endZ = endOfWeek(nextWeekRef, { weekStartsOn: 1 });
    return buildRangeIntent(
      startZ,
      endZ,
      zonedNow,
      timezone,
      `Next week (${format(startZ, 'MMM d')} – ${format(endZ, 'MMM d, yyyy')})`,
      { isFuture: true },
    );
  }

  // "this month" / "last month" / "next month"
  if (/\b(this month|current month)\b/.test(lower)) {
    const startZ = startOfMonth(zonedNow);
    return buildRangeIntent(
      startZ,
      zonedNow,
      zonedNow,
      timezone,
      `This month (${format(startZ, 'MMMM yyyy')})`,
    );
  }
  if (/\b(last month|previous month|past month)\b/.test(lower)) {
    const prevMonth = subMonths(zonedNow, 1);
    const startZ = startOfMonth(prevMonth);
    const endZ = endOfMonth(prevMonth);
    return buildRangeIntent(
      startZ,
      endZ,
      zonedNow,
      timezone,
      `Last month (${format(startZ, 'MMMM yyyy')})`,
    );
  }
  if (/\b(next month)\b/.test(lower)) {
    const nextMonth = addMonths(zonedNow, 1);
    const startZ = startOfMonth(nextMonth);
    const endZ = endOfMonth(nextMonth);
    return buildRangeIntent(
      startZ,
      endZ,
      zonedNow,
      timezone,
      `Next month (${format(startZ, 'MMMM yyyy')})`,
      { isFuture: true },
    );
  }

  // -------------------------------------------------------------------------
  // 3. Explicit single date
  // -------------------------------------------------------------------------
  const singleDateRe = new RegExp(`\\b(${dateAtom})\\b`, 'i');
  const singleMatch = text.match(singleDateRe);
  if (singleMatch) {
    const parsed = parseExplicitDateToken(singleMatch[1], zonedNow);
    if (parsed) {
      return buildDayIntent(parsed.date, zonedNow, timezone);
    }
    return NONE_INTENT;
  }

  // -------------------------------------------------------------------------
  // 4. Explicit month name (e.g. "in October", "October 2026", "for September")
  // -------------------------------------------------------------------------
  const monthOnlyRe = new RegExp(
    `(?:\\b(?:in|for|during|of)\\s+)?\\b(${MONTH_PATTERN})\\b(?:\\s+(\\d{4}))?`,
    'i',
  );
  const monthMatch = text.match(monthOnlyRe);
  if (monthMatch) {
    // Avoid false positive on English auxiliary verb "may" (e.g. "may I ask") unless capitalized or preceded by in/for/during/of or followed by a year
    const rawWord = monthMatch[1];
    const hasPrepOrYear = Boolean(monthMatch[2]) || /\b(?:in|for|during|of)\s+may\b/i.test(text);
    if (rawWord.toLowerCase() !== 'may' || hasPrepOrYear || rawWord === 'May') {
      const m = MONTH_MAP[rawWord.toLowerCase()];
      const hasYear = Boolean(monthMatch[2]);
      let y = hasYear ? Number(monthMatch[2]) : zonedNow.getFullYear();
      let startZ = new Date(y, m, 1);
      if (!hasYear && startOfDay(startZ).getTime() > endOfDay(zonedNow).getTime()) {
        y -= 1;
        startZ = new Date(y, m, 1);
      }
      const endZ = endOfMonth(startZ);
      return buildRangeIntent(startZ, endZ, zonedNow, timezone, format(startZ, 'MMMM yyyy'));
    }
  }

  // -------------------------------------------------------------------------
  // 5. Weekday reference (e.g. "last Monday", "on Friday")
  // -------------------------------------------------------------------------
  const weekdayRe = /\b(?:(last|this|on)\s+)?(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)\b/i;
  const weekdayMatch = lower.match(weekdayRe);
  if (weekdayMatch) {
    const modifier = weekdayMatch[1] || '';
    const targetDow = WEEKDAY_MAP[weekdayMatch[2]];
    const currentDow = zonedNow.getDay();
    let diff = (currentDow - targetDow + 7) % 7;
    if (diff === 0 && modifier === 'last') {
      diff = 7;
    }
    const targetDate = subDays(zonedNow, diff);
    return buildDayIntent(targetDate, zonedNow, timezone, format(targetDate, 'EEEE'));
  }

  // -------------------------------------------------------------------------
  // 6. Implicit day-of-month (e.g. "on the 20th", "for the 1st", "the 15th")
  // -------------------------------------------------------------------------
  const ordinalDayMatch = lower.match(/\b(?:on\s+the|for\s+the|the)\s+(\d{1,2})(?:st|nd|rd|th)\b/);
  if (ordinalDayMatch) {
    const day = Number(ordinalDayMatch[1]);
    let year = zonedNow.getFullYear();
    let month = zonedNow.getMonth();
    if (day > zonedNow.getDate()) {
      const prev = subMonths(zonedNow, 1);
      year = prev.getFullYear();
      month = prev.getMonth();
    }
    if (isValidCalendarDate(year, month, day)) {
      return buildDayIntent(new Date(year, month, day), zonedNow, timezone);
    }
    return NONE_INTENT;
  }

  // -------------------------------------------------------------------------
  // 7. Follow-up inheritance from session's lastDate
  // -------------------------------------------------------------------------
  if (lastDate && lastDate.kind !== 'none' && lastDate.start && lastDate.end && isFollowUpQuery(text)) {
    return {
      ...lastDate,
      inherited: true,
    };
  }

  return NONE_INTENT;
}
