import { parseDateIntent, DateIntent } from './date-intent.parser';

describe('parseDateIntent (Asia/Manila -> UTC)', () => {
  // Reference "now": 2026-11-21 10:00:00 Asia/Manila === 2026-11-21T02:00:00.000Z
  const NOW = new Date('2026-11-21T02:00:00.000Z');

  it('parses "today" in Asia/Manila boundaries', () => {
    const res = parseDateIntent('How much energy did we generate today?', NOW);
    expect(res.kind).toBe('day');
    expect(res.isToday).toBe(true);
    expect(res.isFuture).toBe(false);
    expect(res.start?.toISOString()).toBe('2026-11-20T16:00:00.000Z');
    expect(res.end?.toISOString()).toBe('2026-11-21T15:59:59.999Z');
    expect(res.label).toContain('Nov 21, 2026');
  });

  it('parses "yesterday"', () => {
    const res = parseDateIntent('What was the power output yesterday?', NOW);
    expect(res.kind).toBe('day');
    expect(res.start?.toISOString()).toBe('2026-11-19T16:00:00.000Z');
    expect(res.end?.toISOString()).toBe('2026-11-20T15:59:59.999Z');
    expect(res.label).toContain('Yesterday');
  });

  it('parses "last 7 days"', () => {
    const res = parseDateIntent('Show energy for the last 7 days', NOW);
    expect(res.kind).toBe('range');
    // Nov 15 00:00 PHT -> Nov 14 16:00 UTC, through Nov 21 23:59:59.999 PHT
    expect(res.start?.toISOString()).toBe('2026-11-14T16:00:00.000Z');
    expect(res.end?.toISOString()).toBe('2026-11-21T15:59:59.999Z');
  });

  it('parses "this week" and "last week" (Monday start)', () => {
    // 2026-11-21 is Saturday -> this week starts Monday Nov 16
    const thisWeek = parseDateIntent('How many steps this week?', NOW);
    expect(thisWeek.kind).toBe('range');
    expect(thisWeek.start?.toISOString()).toBe('2026-11-15T16:00:00.000Z');
    expect(thisWeek.end?.toISOString()).toBe('2026-11-21T15:59:59.999Z');

    // Last week: Monday Nov 9 to Sunday Nov 15
    const lastWeek = parseDateIntent('What about last week?', NOW);
    expect(lastWeek.kind).toBe('range');
    expect(lastWeek.start?.toISOString()).toBe('2026-11-08T16:00:00.000Z');
    expect(lastWeek.end?.toISOString()).toBe('2026-11-15T15:59:59.999Z');
  });

  it('parses "this month" and "last month"', () => {
    const thisMonth = parseDateIntent('Total energy this month', NOW);
    expect(thisMonth.kind).toBe('range');
    expect(thisMonth.start?.toISOString()).toBe('2026-10-31T16:00:00.000Z');
    expect(thisMonth.end?.toISOString()).toBe('2026-11-21T15:59:59.999Z');

    const lastMonth = parseDateIntent('How much energy last month?', NOW);
    expect(lastMonth.kind).toBe('range');
    expect(lastMonth.start?.toISOString()).toBe('2026-09-30T16:00:00.000Z');
    expect(lastMonth.end?.toISOString()).toBe('2026-10-31T15:59:59.999Z');
  });

  it('parses explicit ISO, Month-Day, Day-Month, and slash dates', () => {
    const iso = parseDateIntent('Energy on 2026-11-18', NOW);
    expect(iso.kind).toBe('day');
    expect(iso.start?.toISOString()).toBe('2026-11-17T16:00:00.000Z');

    const mdy = parseDateIntent('Steps on Nov 18', NOW);
    expect(mdy.kind).toBe('day');
    expect(mdy.start?.toISOString()).toBe('2026-11-17T16:00:00.000Z');

    const dmy = parseDateIntent('Power on 18th of November 2026', NOW);
    expect(dmy.kind).toBe('day');
    expect(dmy.start?.toISOString()).toBe('2026-11-17T16:00:00.000Z');

    const slash = parseDateIntent('Readings for 11/18/2026', NOW);
    expect(slash.kind).toBe('day');
    expect(slash.start?.toISOString()).toBe('2026-11-17T16:00:00.000Z');
  });

  it('rolls back year when month/day without year would be in the future', () => {
    // NOW is Nov 21, 2026 -> "Dec 25" without year rolls back to Dec 25, 2025
    const res = parseDateIntent('How much energy on Dec 25?', NOW);
    expect(res.kind).toBe('day');
    expect(res.isFuture).toBe(false);
    expect(res.label).toBe('Dec 25, 2025');
    expect(res.start?.toISOString()).toBe('2025-12-24T16:00:00.000Z');
  });

  it('flags explicit future dates as isFuture=true', () => {
    const tomorrow = parseDateIntent('Energy tomorrow?', NOW);
    expect(tomorrow.kind).toBe('day');
    expect(tomorrow.isFuture).toBe(true);

    const futureIso = parseDateIntent('Energy on 2028-05-01', NOW);
    expect(futureIso.kind).toBe('day');
    expect(futureIso.isFuture).toBe(true);
  });

  it('parses custom ranges ("Nov 10 to Nov 15", "Nov 10-15", "from 2026-11-01 to 2026-11-10")', () => {
    const r1 = parseDateIntent('Energy from Nov 10 to Nov 15', NOW);
    expect(r1.kind).toBe('range');
    expect(r1.start?.toISOString()).toBe('2026-11-09T16:00:00.000Z');
    expect(r1.end?.toISOString()).toBe('2026-11-15T15:59:59.999Z');

    const r2 = parseDateIntent('Steps for Nov 10-15', NOW);
    expect(r2.kind).toBe('range');
    expect(r2.start?.toISOString()).toBe('2026-11-09T16:00:00.000Z');
    expect(r2.end?.toISOString()).toBe('2026-11-15T15:59:59.999Z');
  });

  it('parses implicit day-of-month ("on the 20th" and future-day rollback "on the 25th")', () => {
    const d20 = parseDateIntent('What happened on the 20th?', NOW);
    expect(d20.kind).toBe('day');
    expect(d20.label).toBe('Nov 20, 2026');

    // On Nov 21, "on the 25th" rolls back to Oct 25, 2026
    const d25 = parseDateIntent('Energy on the 25th?', NOW);
    expect(d25.kind).toBe('day');
    expect(d25.label).toBe('Oct 25, 2026');
  });

  it('parses explicit month names without misinterpreting English "may"', () => {
    const oct = parseDateIntent('How much energy in October?', NOW);
    expect(oct.kind).toBe('range');
    expect(oct.label).toBe('October 2026');

    const modalMay = parseDateIntent('How may I use EcoStep?', NOW);
    expect(modalMay.kind).toBe('none');
  });

  it('rejects invalid calendar dates cleanly', () => {
    expect(parseDateIntent('Energy on 2026-02-30', NOW).kind).toBe('none');
    expect(parseDateIntent('Energy on Feb 30', NOW).kind).toBe('none');
    expect(parseDateIntent('Energy on 13/45/2026', NOW).kind).toBe('none');
  });

  it('inherits lastDate on follow-up queries and resets when new date or all-time is asked', () => {
    const prev: DateIntent = parseDateIntent('Energy yesterday?', NOW);
    const followUp = parseDateIntent('what about steps?', NOW, prev);
    expect(followUp.kind).toBe('day');
    expect(followUp.inherited).toBe(true);
    expect(followUp.label).toBe(prev.label);

    const allTime = parseDateIntent('what is the all-time energy?', NOW, prev);
    expect(allTime.kind).toBe('none');

    const resetToday = parseDateIntent('what about today?', NOW, prev);
    expect(resetToday.isToday).toBe(true);
    expect(resetToday.inherited).toBeUndefined();
  });
});
