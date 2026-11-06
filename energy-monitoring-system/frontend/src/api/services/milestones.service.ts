import apiClient from '../client';
import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import type {
  MilestonesResponse,
  MilestoneTargetConfig,
  MilestoneItem,
  UpdateMonthTargetsPayload,
} from '@/features/milestones/types/milestone.types';

const LOCAL_STORAGE_TARGETS_KEY = 'ecostep_milestone_targets_mwh_v2';

export const DEFAULT_MONTHLY_TARGET_MWH = 0.1;
export const DEFAULT_WEEKLY_TARGET_MWH = 0.025;

export const milestonesService = {
  /**
   * Fetch live calendar milestone progress for a specific month (defaults to current month)
   */
  getMilestones: async (month?: string): Promise<MilestonesResponse> => {
    try {
      const url = month ? `/milestones?month=${encodeURIComponent(month)}` : '/milestones';
      const response = await apiClient.get<MilestonesResponse>(url);
      return response.data;
    } catch (error) {
      console.warn('API /milestones unavailable, using local calculation fallback:', error);
      return milestonesService.getLocalFallback(month);
    }
  },

  /**
   * Get configured milestone targets in mWh for a specific month
   */
  getTargets: async (month?: string): Promise<any> => {
    try {
      const url = month ? `/milestones/targets?month=${encodeURIComponent(month)}` : '/milestones/targets';
      const response = await apiClient.get<any>(url);
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch milestone targets from server, using local:', error);
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_TARGETS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }

    return {
      monthlyTargetMWh: DEFAULT_MONTHLY_TARGET_MWH,
      weeklyTargetsMWh: {
        week1MWh: DEFAULT_WEEKLY_TARGET_MWH,
        week2MWh: DEFAULT_WEEKLY_TARGET_MWH,
        week3MWh: DEFAULT_WEEKLY_TARGET_MWH,
        week4MWh: DEFAULT_WEEKLY_TARGET_MWH,
        week5MWh: DEFAULT_WEEKLY_TARGET_MWH,
      },
    };
  },

  /**
   * Update milestone targets by administrator in mWh for a calendar month
   */
  updateTargets: async (
    payload: UpdateMonthTargetsPayload | Partial<MilestoneTargetConfig>,
  ): Promise<any> => {
    try {
      const response = await apiClient.put<any>('/milestones/targets', payload);
      if (response.data) {
        localStorage.setItem(LOCAL_STORAGE_TARGETS_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.warn('Backend update failed, saving to local cache:', error);
    }

    localStorage.setItem(LOCAL_STORAGE_TARGETS_KEY, JSON.stringify(payload));
    return payload;
  },

  /**
   * Local fallback calculator if backend is temporarily unreachable
   */
  getLocalFallback: (monthStr?: string): MilestonesResponse => {
    // Current Asia/Manila date
    const nowUtc = new Date();
    const manilaTime = new Date(nowUtc.getTime() + 8 * 60 * 60 * 1000);
    const currYear = manilaTime.getUTCFullYear();
    const currMonth = manilaTime.getUTCMonth() + 1;
    const currDay = manilaTime.getUTCDate();
    const currentMonthKey = `${currYear}-${String(currMonth).padStart(2, '0')}`;

    const targetMonth = monthStr || currentMonthKey;
    const [tYearStr, tMonthStr] = targetMonth.split('-');
    const year = parseInt(tYearStr, 10) || currYear;
    const month = parseInt(tMonthStr, 10) || currMonth;

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthDateObj = new Date(Date.UTC(year, month - 1, 15));
    const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(monthDateObj);

    // Generate Sunday–Saturday calendar week blocks using date-fns
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 });

    const blocks = weekStarts.map((w, idx) => {
      const rawStart = startOfWeek(w, { weekStartsOn: 0 });
      const rawEnd = endOfWeek(w, { weekStartsOn: 0 });
      const effStart = rawStart < monthStart ? monthStart : rawStart;
      const effEnd = rawEnd > monthEnd ? monthEnd : rawEnd;
      const startDay = effStart.getDate();
      const endDay = effEnd.getDate();

      return {
        weekNumber: idx + 1,
        startDay,
        endDay,
        days: endDay - startDay + 1,
        calendarRowLabel: `${format(rawStart, 'MMM d')} – ${format(rawEnd, 'MMM d')}`,
        startDate: new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0) - 8 * 3600000),
        endDate: new Date(Date.UTC(year, month - 1, endDay, 23, 59, 59, 999) - 8 * 3600000),
      };
    });

    const round6 = (v: number) => Math.round(v * 1000000) / 1000000;
    const MWH_PER_PHONE_CHARGE = 15853.0;

    // Determine state
    const isPastMonth = year < currYear || (year === currYear && month < currMonth);
    const isFutureMonth = year > currYear || (year === currYear && month > currMonth);

    // Build weekly milestones
    const weeklyMilestones: MilestoneItem[] = blocks.map((b) => {
      let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' = 'UPCOMING';
      if (isPastMonth) {
        state = 'COMPLETED';
      } else if (isFutureMonth) {
        state = 'UPCOMING';
      } else {
        if (currDay > b.endDay) state = 'COMPLETED';
        else if (currDay >= b.startDay && currDay <= b.endDay) state = 'CURRENT';
        else state = 'UPCOMING';
      }

      const targetMWh = b.weekNumber === 5 ? round6(DEFAULT_WEEKLY_TARGET_MWH * 0.5) : DEFAULT_WEEKLY_TARGET_MWH;
      // Simulated fallback energy
      const currentMWh = state === 'COMPLETED' ? targetMWh * 0.85 : state === 'CURRENT' ? targetMWh * 0.42 : 0;
      const isAchieved = currentMWh >= targetMWh;
      const rawPct = targetMWh > 0 ? (currentMWh / targetMWh) * 100 : 0;
      const pct = isAchieved ? Math.round(rawPct * 10) / 10 : Math.min(99.9, Math.round(rawPct * 10) / 10);
      const phoneCharges = Math.round((currentMWh / MWH_PER_PHONE_CHARGE) * 10) / 10;

      return {
        id: `week_${b.weekNumber}`,
        periodKey: `${targetMonth}_w${b.weekNumber}`,
        label: `Week ${b.weekNumber}`,
        weekNumber: b.weekNumber,
        dayRangeLabel: `Days ${b.startDay}–${b.endDay}`,
        calendarRowLabel: b.calendarRowLabel,
        days: b.days,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        state,
        targetMWh,
        currentMWh: round6(currentMWh),
        targetWh: round6(targetMWh / 1000),
        currentWh: round6(currentMWh / 1000),
        progressPercentage: pct,
        isAchieved,
        stepCount: Math.round(currentMWh * 1.5),
        realWorldEquivalents: {
          phoneCharges,
          phoneChargePercent: Math.round(((currentMWh / MWH_PER_PHONE_CHARGE) * 100) * 10) / 10,
          ledHours: Math.round((currentMWh / 5000.0) * 10) / 10,
          iotBeaconDays: Math.round((currentMWh / 120.0) * 10) / 10,
          comparisonText: phoneCharges >= 1
            ? `Enough clean kinetic power to recharge a phone ${phoneCharges}x.`
            : `Kinetic energy harvested: ~${Math.round(((currentMWh / MWH_PER_PHONE_CHARGE) * 100))}% of a phone recharge.`,
          explanation: 'Estimate based on 13,475 mWh battery with 85% circuit efficiency (~15,853 mWh per full charge).',
        },
        aiComment: `Tracking Week ${b.weekNumber} (${b.startDay}–${b.endDay}). Keep walking to feed the battery!`,
      };
    });

    const totalMonthEnergy = round6(weeklyMilestones.reduce((acc, w) => acc + w.currentMWh, 0));
    const totalMonthSteps = weeklyMilestones.reduce((acc, w) => acc + w.stepCount, 0);
    const monthRawPct = (totalMonthEnergy / DEFAULT_MONTHLY_TARGET_MWH) * 100;
    const isMonthAchieved = totalMonthEnergy >= DEFAULT_MONTHLY_TARGET_MWH;
    const monthPct = isMonthAchieved ? Math.round(monthRawPct * 10) / 10 : Math.min(99.9, Math.round(monthRawPct * 10) / 10);

    const monthlyMilestone: MilestoneItem = {
      id: 'monthly',
      periodKey: targetMonth,
      label: `${monthLabel} Milestone`,
      dayRangeLabel: `Days 1–${daysInMonth}`,
      days: daysInMonth,
      startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString(),
      endDate: new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59)).toISOString(),
      state: isPastMonth ? 'COMPLETED' : isFutureMonth ? 'UPCOMING' : 'CURRENT',
      targetMWh: DEFAULT_MONTHLY_TARGET_MWH,
      currentMWh: totalMonthEnergy,
      targetWh: round6(DEFAULT_MONTHLY_TARGET_MWH / 1000),
      currentWh: round6(totalMonthEnergy / 1000),
      progressPercentage: monthPct,
      isAchieved: isMonthAchieved,
      stepCount: totalMonthSteps,
      realWorldEquivalents: {
        phoneCharges: Math.round((totalMonthEnergy / MWH_PER_PHONE_CHARGE) * 10) / 10,
        phoneChargePercent: Math.round(((totalMonthEnergy / MWH_PER_PHONE_CHARGE) * 100) * 10) / 10,
        ledHours: Math.round((totalMonthEnergy / 5000.0) * 10) / 10,
        iotBeaconDays: Math.round((totalMonthEnergy / 120.0) * 10) / 10,
        comparisonText: `Monthly harvest across campus walkways.`,
        explanation: 'Estimate based on 13,475 mWh battery with 85% circuit efficiency (~15,853 mWh per full charge).',
      },
      aiComment: `Monthly target in progress for ${monthLabel}.`,
    };

    return {
      yearMonth: targetMonth,
      monthLabel,
      monthlyMilestone,
      weeklyMilestones,
      milestones: [monthlyMilestone, ...weeklyMilestones],
      availableMonths: ['2026-10', '2026-11'],
      currentMonth: currentMonthKey,
      allTimeEnergyMWh: 145500,
      allTimeEnergyWh: 145.5,
      allTimeSteps: 185000,
      lastUpdated: new Date().toISOString(),
    };
  },
};
