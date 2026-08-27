# Phase 6 - New Analytics Service Methods

These methods should be added to `analytics.service.ts` before the final closing brace.

## Public Methods to Add:

1. `getDashboardAnalytics()` - Line 50 of analytics.service.enhanced.ts
2. `getTimeSeries()` - Line 100 of analytics.service.enhanced.ts
3. `getBatteryHistory()` - Line 200 of analytics.service.enhanced.ts
4. `getHourlyAverages()` - Line 220 of analytics.service.enhanced.ts
5. `getSensorUptime()` - Line 280 of analytics.service.enhanced.ts

## Private Helper Methods to Add:

- `getTodayMetrics()`
- `compareWithYesterday()`
- `getWeekMetrics()`
- `getMonthMetrics()`
- `getSystemHealth()`
- `buildAggregationPipeline()`
- `getGroupByExpression()`
- `getSortExpression()`
- `getTimestampExpression()`
- `getDateFields()`
- `transformToDataPoints()`
- `generateLabel()`
- `calculateSummary()`
- `getFieldName()`
- `getUnit()`
- `countDaysWithData()`
- `getDateString()`
- `subtractDays()`
- `getEndOfDay()`
- `getMondayOfWeek()` (already exists, keep existing)

## Note:
Copy from `analytics.service.enhanced.ts` lines 50-500 and paste before the final `}` in `analytics.service.ts`
