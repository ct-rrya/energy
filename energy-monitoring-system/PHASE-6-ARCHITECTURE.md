# Phase 6: Analytics & Energy Insights Module - Architecture Design

**Date:** January 18, 2025  
**Status:** 🎯 Planning Phase  
**Prerequisites:** Phases 1-5 Complete

---

## 📋 Executive Summary

Phase 6 transforms the Energy Monitoring System from **data collection** to **data intelligence**. While Phase 5 shows real-time sensor readings, Phase 6 provides historical trends, statistical analysis, and actionable insights through professional visualizations.

### Core Value Proposition
- **Transform** raw sensor data → meaningful business insights
- **Visualize** thousands of readings → clear trends and patterns
- **Enable** data-driven decisions for energy optimization
- **Prepare** foundation for AI-powered predictions (future)

---

## 🏗️ Current Architecture Review

### Existing Components (Phases 1-5)

#### Backend
- ✅ **Authentication Module** - JWT-based auth for all endpoints
- ✅ **Sensors Module** - Sensor registration and management
- ✅ **IoT Module** - Real-time data ingestion from ESP32
- ✅ **Dashboard Module** - WebSocket gateway for live updates
- ✅ **Analytics Module** - Basic analytics service (needs enhancement)
- ✅ **Energy Module** - Energy calculations and aggregations


#### Database Schema
```typescript
EnergyReading {
  sensorId: ObjectId          // Link to sensor
  voltage: number             // 0-50V
  current: number             // 0-10A
  power: number               // 0-500W
  energy: number              // kWh (currently 0, calculated later)
  batteryPercentage: number   // 0-100%
  temperature?: number        // -40 to 125°C (optional)
  frequency?: number          // 0-1000Hz (optional)
  timestamp: Date             // ESP32 time
  receivedAt: Date            // Server time
  source: 'hardware'|'mock'   // Data source
  
  // Virtual fields
  signalQuality: 'excellent'|'good'|'fair'|'poor'
  latency: number             // ms
  powerKW: number             // power / 1000
}
```

**Indexes:**
- `{ sensorId: 1, timestamp: -1 }` - Sensor time-series queries
- `{ source: 1, timestamp: -1 }` - Filter by source
- `{ timestamp: 1 }` - Recent readings across all sensors


#### Frontend
- ✅ **Authentication** - Login/logout with token management
- ✅ **Dashboard Page** - System overview with stats cards
- ✅ **Sensor Monitoring Page** - Real-time gauges and device status
- ✅ **WebSocket Integration** - Socket Context for live updates
- ✅ **TanStack Query** - API caching and state management
- ✅ **Recharts** - Already installed for circular gauges

#### Real-Time Data Flow
```
ESP32 → POST /api/iot/readings
         ↓
     IoT Service (store reading)
         ↓
     Dashboard Gateway (WebSocket broadcast)
         ↓
     Frontend Socket Context
         ↓
     TanStack Query Cache Invalidation
         ↓
     Component Re-render
```

---

## 🎯 Phase 6 Objectives

### Primary Goals
1. **Historical Visualization** - Display trends over time (hourly, daily, weekly, monthly)
2. **Statistical Analysis** - Calculate meaningful metrics (avg, min, max, totals)
3. **Energy Insights** - Automatic insights (peak hours, efficiency, patterns)
4. **Performance Optimization** - Handle thousands of readings efficiently


### Secondary Goals
5. **User Experience** - Loading states, error handling, responsive design
6. **Scalability** - Prepare for AI/ML predictions (future)
7. **Reusability** - Chart components usable across features

---

## 🔧 Backend Architecture

### Enhancement Strategy

**Existing Analytics Module** already provides:
- Daily/Weekly/Monthly summaries
- Peak generation detection
- Environmental impact calculations
- Cost savings estimates
- Trend analysis

**Phase 6 Enhancements** will add:
- Time-series data for charts (hourly/daily aggregations)
- Battery history tracking
- Sensor uptime statistics
- Custom date range filtering
- Efficient aggregation pipelines

### New DTO Design

```typescript
// Time-series data points for charts
export class TimeSeriesDataPointDto {
  timestamp: Date;          // Data point time
  value: number;            // Metric value
  label: string;            // Display label (e.g., "14:00")
}

export class TimeSeriesDto {
  metric: string;           // 'power' | 'voltage' | 'current' | 'battery'
  unit: string;             // 'W' | 'V' | 'A' | '%'
  dataPoints: TimeSeriesDataPointDto[];
  summary: {
    min: number;
    max: number;
    avg: number;
    total?: number;         // For energy
  };
}
```


```typescript
// Query parameters for analytics
export class AnalyticsQueryDto {
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  sensorId?: string;        // Optional: specific sensor
  source?: 'hardware'|'mock'|'all'; // Filter by source
  granularity?: 'hour'|'day'|'week'|'month'; // Aggregation level
}

// Dashboard analytics summary
export class DashboardAnalyticsDto {
  // Today's metrics
  today: {
    energyKWh: number;
    avgPowerW: number;
    peakPowerW: number;
    readingCount: number;
  };
  
  // Yesterday comparison
  yesterday: {
    energyKWh: number;
    change: number;          // Percentage change
    trend: 'up'|'down'|'stable';
  };
  
  // Week metrics
  week: {
    energyKWh: number;
    avgPowerW: number;
    daysActive: number;
  };
  
  // Month metrics
  month: {
    energyKWh: number;
    projectedKWh: number;    // Based on daily average
    costSavings: number;
  };
  
  // System health
  system: {
    activeSensors: number;
    totalReadings: number;
    avgReportingInterval: number; // minutes
    systemUptime: number;    // percentage
  };
}
```


### New API Endpoints

```typescript
// Analytics Controller (Enhanced)
GET /api/analytics/dashboard
  → DashboardAnalyticsDto
  Purpose: Single endpoint for all dashboard summary data
  Efficient: Minimizes API requests
  
GET /api/analytics/time-series
  Query: startDate, endDate, metric, granularity, sensorId?
  → TimeSeriesDto
  Purpose: Chart data (power/voltage/current/battery over time)
  Examples:
    - Power last 24 hours (hourly): metric=power, granularity=hour
    - Voltage last 7 days (daily): metric=voltage, granularity=day
    
GET /api/analytics/battery-history
  Query: startDate, endDate, sensorId?
  → TimeSeriesDto
  Purpose: Battery charge/discharge patterns
  
GET /api/analytics/sensor-uptime
  Query: startDate, endDate
  → Array<{ sensorId, name, uptime%, lastSeen, readingCount }>
  Purpose: Sensor reliability tracking
  
GET /api/analytics/peaks
  Query: startDate, endDate, limit?
  → Array<PeakReadingDto>
  Purpose: Top N peak power readings
  
GET /api/analytics/hourly-averages
  Query: date
  → Array<{ hour, avgPower, avgVoltage, avgCurrent }>
  Purpose: 24-hour average pattern
```


### Database Aggregation Strategy

**Challenge:** Efficiently query thousands of readings for charts

**Solution:** MongoDB Aggregation Pipeline

```typescript
// Example: Hourly power averages for last 24 hours
db.energy_readings.aggregate([
  // Stage 1: Filter date range
  {
    $match: {
      timestamp: {
        $gte: ISODate("2026-07-17T00:00:00Z"),
        $lte: ISODate("2026-07-18T00:00:00Z")
      },
      source: "hardware" // Exclude mock data
    }
  },
  
  // Stage 2: Group by hour
  {
    $group: {
      _id: {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" },
        hour: { $hour: "$timestamp" }
      },
      avgPower: { $avg: "$power" },
      maxPower: { $max: "$power" },
      minPower: { $min: "$power" },
      count: { $sum: 1 }
    }
  },
  
  // Stage 3: Sort by time
  { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
  
  // Stage 4: Format output
  {
    $project: {
      timestamp: {
        $dateFromParts: {
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          hour: "$_id.hour"
        }
      },
      avgPower: { $round: ["$avgPower", 2] },
      maxPower: { $round: ["$maxPower", 2] },
      minPower: { $round: ["$minPower", 2] },
      count: 1
    }
  }
]);
```

**Performance Benefits:**
- Database-side aggregation (fast)
- Only necessary fields returned
- Reduced network transfer
- Indexed queries (timestamp)


---

## 🎨 Frontend Architecture

### Page Structure

```
/analytics
  ├── Summary Section
  │   ├── Period Selector (Today/Yesterday/Week/Month/Custom)
  │   ├── Summary Cards (4-6 cards)
  │   └── Quick Insights
  │
  ├── Charts Section
  │   ├── Energy Generation (Line/Area Chart)
  │   ├── Power Trends (Line Chart)
  │   ├── Voltage & Current (Dual-axis Line Chart)
  │   └── Battery History (Line Chart)
  │
  ├── Insights Section
  │   ├── Peak Production Time
  │   ├── Average Daily Pattern
  │   ├── Sensor Performance
  │   └── System Health
  │
  └── Data Table Section
      ├── Recent Peaks
      ├── Sensor Uptime
      └── Export Options
```

### Component Architecture

```typescript
// Page-level component
features/analytics/
  ├── pages/
  │   └── AnalyticsPage.tsx           // Main analytics page
  │
  ├── components/
  │   ├── summary/
  │   │   ├── PeriodSelector.tsx      // Date range picker + presets
  │   │   ├── SummaryCard.tsx         // Reusable stat card
  │   │   └── SummaryGrid.tsx         // Grid of summary cards
  │   │
  │   ├── charts/
  │   │   ├── EnergyChart.tsx         // Area chart for energy
  │   │   ├── PowerTrendChart.tsx     // Line chart for power
  │   │   ├── VoltageCurrentChart.tsx // Dual-axis chart
  │   │   ├── BatteryHistoryChart.tsx // Battery trend
  │   │   └── BaseChart.tsx           // Shared chart wrapper
  │   │
  │   ├── insights/
  │   │   ├── InsightsPanel.tsx       // Container for insights
  │   │   ├── PeakTimeInsight.tsx     // Peak production time
  │   │   ├── PatternInsight.tsx      // Usage patterns
  │   │   └── HealthInsight.tsx       // System health
  │   │
  │   └── tables/
  │       ├── PeaksTable.tsx          // Top peaks table
  │       ├── SensorUptimeTable.tsx   // Sensor stats table
  │       └── DataTable.tsx           // Generic table component
  │
  ├── hooks/
  │   ├── useAnalytics.ts             // Main analytics data hook
  │   ├── useTimeSeries.ts            // Time-series data hook
  │   ├── useDateRange.ts             // Date range state management
  │   └── useChartData.ts             // Chart data transformations
  │
  └── types/
      └── analytics.types.ts          // TypeScript interfaces
```


### Charting Library Decision

**Option 1: Recharts** (RECOMMENDED)
- ✅ Already installed (used in Phase 5)
- ✅ React-first API (declarative)
- ✅ Responsive by default
- ✅ Good TypeScript support
- ✅ Customizable and themeable
- ✅ Handles time-series data well
- ⚠️ Bundle size moderate (60KB gzipped)

**Option 2: Chart.js + react-chartjs-2**
- ⚠️ Need to install new dependency
- ⚠️ More imperative API
- ✅ Slightly smaller bundle

**Option 3: Visx (Airbnb)**
- ⚠️ Low-level (more code to write)
- ✅ Very customizable
- ⚠️ Steeper learning curve

**Decision: Use Recharts**
- Consistency with Phase 5
- No new dependencies
- Faster development
- Good documentation

### Chart Specifications

```typescript
// 1. Energy Generation Chart (Area Chart)
<AreaChart data={energyData}>
  <XAxis dataKey="time" />
  <YAxis label="Energy (kWh)" />
  <Tooltip />
  <Area 
    type="monotone" 
    dataKey="energy" 
    stroke="#10b981" 
    fill="#d1fae5" 
  />
</AreaChart>

// 2. Power Trend Chart (Line Chart)
<LineChart data={powerData}>
  <XAxis dataKey="time" />
  <YAxis label="Power (W)" />
  <Tooltip />
  <Legend />
  <Line 
    type="monotone" 
    dataKey="avgPower" 
    stroke="#3b82f6" 
    strokeWidth={2}
  />
  <Line 
    type="monotone" 
    dataKey="maxPower" 
    stroke="#ef4444" 
    strokeDasharray="5 5"
  />
</LineChart>
```


```typescript
// 3. Voltage & Current Chart (Dual-axis)
<LineChart data={voltageCurrentData}>
  <XAxis dataKey="time" />
  <YAxis yAxisId="left" label="Voltage (V)" />
  <YAxis yAxisId="right" orientation="right" label="Current (A)" />
  <Tooltip />
  <Legend />
  <Line 
    yAxisId="left"
    type="monotone" 
    dataKey="voltage" 
    stroke="#8b5cf6" 
  />
  <Line 
    yAxisId="right"
    type="monotone" 
    dataKey="current" 
    stroke="#f59e0b" 
  />
</LineChart>

// 4. Battery History Chart (Line Chart with Reference Lines)
<LineChart data={batteryData}>
  <XAxis dataKey="time" />
  <YAxis domain={[0, 100]} label="Battery %" />
  <Tooltip />
  <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
  <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" />
  <Line 
    type="monotone" 
    dataKey="battery" 
    stroke="#10b981" 
    strokeWidth={2}
  />
</LineChart>
```

### State Management Strategy

**TanStack Query for Server State:**
```typescript
// Fetch dashboard analytics
const { data, isLoading, error } = useQuery({
  queryKey: ['analytics', 'dashboard', dateRange],
  queryFn: () => analyticsService.getDashboardAnalytics(dateRange),
  staleTime: 5 * 60 * 1000, // 5 minutes (slow-changing data)
  refetchOnWindowFocus: true,
});

// Fetch time-series data
const { data: timeSeriesData } = useQuery({
  queryKey: ['analytics', 'timeSeries', metric, dateRange, granularity],
  queryFn: () => analyticsService.getTimeSeries({
    metric,
    startDate: dateRange.start,
    endDate: dateRange.end,
    granularity
  }),
  staleTime: 2 * 60 * 1000, // 2 minutes
  enabled: !!metric && !!dateRange.start,
});
```


**React State for UI State:**
```typescript
// Date range picker state
const [dateRange, setDateRange] = useState<DateRange>({
  start: subDays(new Date(), 7),
  end: new Date(),
  preset: 'last7days'
});

// Active chart selection
const [activeMetric, setActiveMetric] = useState<'power' | 'voltage' | 'current'>('power');

// Chart granularity
const [granularity, setGranularity] = useState<'hour' | 'day'>('hour');
```

---

## 🔄 Real-Time Integration

### WebSocket Update Strategy

**Challenge:** Analytics page shows historical data, but new readings arrive via WebSocket

**Solution:** Intelligent cache invalidation

```typescript
// In Socket Context
socket.on('reading:new', (newReading) => {
  // 1. Update sensor monitoring page (already implemented)
  queryClient.invalidateQueries({ queryKey: ['sensors', 'readings'] });
  
  // 2. Update analytics (NEW)
  // Only invalidate if new reading affects current view
  const isToday = isToday(newReading.timestamp);
  const isInDateRange = isWithinDateRange(newReading.timestamp, userDateRange);
  
  if (isToday || isInDateRange) {
    // Invalidate dashboard summary
    queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
    
    // Invalidate relevant time-series
    queryClient.invalidateQueries({ queryKey: ['analytics', 'timeSeries'] });
  }
});
```

**Optimization:**
- Don't refetch if user is viewing last month (old data)
- Debounce invalidation (batch multiple readings)
- Use background refetch (don't show loading spinner)


---

## ⚡ Performance Optimization

### Backend Optimizations

1. **Aggregation Pipelines** - Database-side computation
2. **Indexed Queries** - Use existing indexes efficiently
3. **Projection** - Only return needed fields
4. **Caching** - Cache computed statistics (future: Redis)
5. **Pagination** - For large result sets (tables)
6. **Parallel Queries** - Fetch multiple analytics concurrently

```typescript
// Example: Parallel aggregations
async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
  const [today, yesterday, week, month, systemHealth] = await Promise.all([
    this.getTodayMetrics(),
    this.getYesterdayMetrics(),
    this.getWeekMetrics(),
    this.getMonthMetrics(),
    this.getSystemHealth(),
  ]);
  
  return { today, yesterday, week, month, systemHealth };
}
```

### Frontend Optimizations

1. **Code Splitting** - Lazy load analytics page
```typescript
const AnalyticsPage = lazy(() => import('./features/analytics/pages/AnalyticsPage'));
```

2. **Memoization** - Prevent unnecessary re-renders
```typescript
const chartData = useMemo(() => transformDataForChart(rawData), [rawData]);
```

3. **Virtual Scrolling** - For large data tables (react-window)
4. **Debounced Filters** - Wait for user to finish typing
5. **Skeleton Loaders** - Show placeholders while loading
6. **Background Refetch** - Update data without loading spinners


---

## 🎯 Insights Algorithm

### Automatic Insight Generation

**Peak Production Time**
```typescript
// Algorithm: Find hour with highest average power
const hourlyAverages = await getHourlyAverages(dateRange);
const peakHour = hourlyAverages.reduce((max, curr) => 
  curr.avgPower > max.avgPower ? curr : max
);

// Output: "Peak production at 2:00 PM (avg 45.2W)"
```

**Energy Pattern Detection**
```typescript
// Algorithm: Compare weekday vs weekend
const weekdayAvg = calculateAverageEnergy(weekdays);
const weekendAvg = calculateAverageEnergy(weekends);
const difference = ((weekdayAvg - weekendAvg) / weekendAvg) * 100;

// Output: "Weekday generation is 23% higher than weekends"
```

**Sensor Reliability Score**
```typescript
// Algorithm: Reading consistency + uptime
const expectedReadings = (dateRange.days * 24 * 60) / reportingInterval;
const actualReadings = sensor.readingCount;
const reliabilityScore = (actualReadings / expectedReadings) * 100;

// Output: "Sensor A: 98% reliability (excellent)"
```

**Battery Health Assessment**
```typescript
// Algorithm: Discharge rate + cycle count
const dischargeRate = calculateDischargeRate(batteryData);
const cycleCount = countChargeCycles(batteryData);
const health = assessBatteryHealth(dischargeRate, cycleCount);

// Output: "Battery health: Good (estimated 850 cycles remaining)"
```


---

## 📊 Data Visualization Specifications

### Color Palette (Consistent with Existing Design)

```typescript
// From Tailwind CSS v4 theme
const colors = {
  primary: '#3b82f6',    // Blue - Main actions
  secondary: '#8b5cf6',  // Purple - Secondary metrics
  accent: '#f59e0b',     // Amber - Highlights
  success: '#10b981',    // Green - Positive trends
  warning: '#f59e0b',    // Orange - Warnings
  danger: '#ef4444',     // Red - Critical alerts
  info: '#06b6d4',       // Cyan - Information
  
  // Chart-specific
  voltage: '#8b5cf6',    // Purple
  current: '#f59e0b',    // Orange
  power: '#3b82f6',      // Blue
  energy: '#10b981',     // Green
  battery: '#10b981',    // Green
};
```

### Chart Responsive Breakpoints

```typescript
// Chart dimensions
const chartConfig = {
  mobile: {
    height: 250,
    width: '100%',
    fontSize: 11,
  },
  tablet: {
    height: 300,
    width: '100%',
    fontSize: 12,
  },
  desktop: {
    height: 400,
    width: '100%',
    fontSize: 14,
  },
};
```

### Accessibility Considerations

1. **Color Contrast** - WCAG AA compliant
2. **Keyboard Navigation** - Tab through charts and filters
3. **Screen Readers** - ARIA labels on charts
4. **Data Tables** - Always provide tabular alternative to charts
5. **Focus Indicators** - Visible focus states


---

## 🚀 Implementation Plan

### Phase 6.1: Backend Enhancement (Estimated: 4-6 hours)

**Step 1: Create New DTOs** (30 min)
- [ ] `TimeSeriesDataPointDto`
- [ ] `TimeSeriesDto`
- [ ] `AnalyticsQueryDto`
- [ ] `DashboardAnalyticsDto`
- [ ] `HourlyAverageDto`
- [ ] `SensorUptimeDto`

**Step 2: Enhance Analytics Service** (2-3 hours)
- [ ] `getDashboardAnalytics()` - Comprehensive summary
- [ ] `getTimeSeries()` - Time-series data with aggregation
- [ ] `getBatteryHistory()` - Battery tracking
- [ ] `getHourlyAverages()` - 24-hour pattern
- [ ] `getSensorUptime()` - Reliability metrics
- [ ] `getTopPeaks()` - Peak readings table

**Step 3: Update Analytics Controller** (1 hour)
- [ ] Add new endpoints with Swagger docs
- [ ] Add query parameter validation
- [ ] Add error handling

**Step 4: Test Backend** (1 hour)
- [ ] Test aggregation queries with sample data
- [ ] Verify performance with 1000+ readings
- [ ] Test date range edge cases
- [ ] Verify mock data filtering

**Step 5: Backend Compilation** (15 min)
- [ ] Run `npm run build`
- [ ] Fix TypeScript errors
- [ ] Fix ESLint errors


### Phase 6.2: Frontend Core Components (Estimated: 6-8 hours)

**Step 1: Setup Analytics Feature** (30 min)
- [ ] Create folder structure
- [ ] Create TypeScript interfaces
- [ ] Create API service functions

**Step 2: Create Reusable Chart Components** (2-3 hours)
- [ ] `BaseChart.tsx` - Wrapper with common config
- [ ] `EnergyChart.tsx` - Area chart for energy
- [ ] `PowerTrendChart.tsx` - Line chart for power
- [ ] `VoltageCurrentChart.tsx` - Dual-axis chart
- [ ] `BatteryHistoryChart.tsx` - Battery trend

**Step 3: Create Summary Components** (1-2 hours)
- [ ] `PeriodSelector.tsx` - Date range picker with presets
- [ ] `SummaryCard.tsx` - Stat card component
- [ ] `SummaryGrid.tsx` - Grid layout

**Step 4: Create Insight Components** (1 hour)
- [ ] `InsightsPanel.tsx` - Container
- [ ] `PeakTimeInsight.tsx` - Peak production
- [ ] `PatternInsight.tsx` - Usage patterns
- [ ] `HealthInsight.tsx` - System health

**Step 5: Create Custom Hooks** (1-2 hours)
- [ ] `useAnalytics.ts` - Main data fetching
- [ ] `useTimeSeries.ts` - Time-series data
- [ ] `useDateRange.ts` - Date range state
- [ ] `useChartData.ts` - Data transformations


### Phase 6.3: Analytics Page Assembly (Estimated: 4-5 hours)

**Step 1: Create Main Page** (2-3 hours)
- [ ] `AnalyticsPage.tsx` - Main layout
- [ ] Integrate all components
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states

**Step 2: Add Navigation** (30 min)
- [ ] Update routes config
- [ ] Add to sidebar
- [ ] Update dashboard quick actions

**Step 3: Responsive Design** (1 hour)
- [ ] Mobile layout (single column)
- [ ] Tablet layout (2 columns)
- [ ] Desktop layout (grid)
- [ ] Chart responsiveness

**Step 4: Polish UI** (1 hour)
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error boundaries
- [ ] Smooth transitions

### Phase 6.4: Testing & Optimization (Estimated: 2-3 hours)

**Step 1: Frontend Compilation** (15 min)
- [ ] Run `npm run build`
- [ ] Fix TypeScript errors
- [ ] Fix ESLint errors

**Step 2: Integration Testing** (1-2 hours)
- [ ] Test with mock data
- [ ] Test date range filters
- [ ] Test chart interactions
- [ ] Test real-time updates
- [ ] Test responsive design

**Step 3: Performance Testing** (30 min)
- [ ] Test with 1000+ readings
- [ ] Check render performance
- [ ] Verify query caching
- [ ] Check bundle size

**Step 4: Documentation** (30 min)
- [ ] Create `PHASE-6-COMPLETE.md`
- [ ] Document new endpoints
- [ ] Update README if needed


---

## 📁 File Structure

```
energy-monitoring-system/
├── src/ (Backend)
│   └── analytics/
│       ├── dto/
│       │   ├── index.ts
│       │   ├── time-series.dto.ts              # NEW
│       │   ├── analytics-query.dto.ts          # NEW
│       │   ├── dashboard-analytics.dto.ts      # NEW
│       │   ├── hourly-average.dto.ts           # NEW
│       │   └── sensor-uptime.dto.ts            # NEW
│       ├── analytics.controller.ts             # ENHANCED
│       ├── analytics.service.ts                # ENHANCED
│       └── analytics.module.ts                 # No changes
│
└── frontend/ (Frontend)
    └── src/
        ├── api/services/
        │   ├── analytics.service.ts            # NEW
        │   └── index.ts                        # UPDATED
        │
        └── features/analytics/
            ├── pages/
            │   └── AnalyticsPage.tsx           # NEW
            │
            ├── components/
            │   ├── summary/
            │   │   ├── PeriodSelector.tsx      # NEW
            │   │   ├── SummaryCard.tsx         # NEW
            │   │   ├── SummaryGrid.tsx         # NEW
            │   │   └── index.ts                # NEW
            │   │
            │   ├── charts/
            │   │   ├── BaseChart.tsx           # NEW
            │   │   ├── EnergyChart.tsx         # NEW
            │   │   ├── PowerTrendChart.tsx     # NEW
            │   │   ├── VoltageCurrentChart.tsx # NEW
            │   │   ├── BatteryHistoryChart.tsx # NEW
            │   │   └── index.ts                # NEW
            │   │
            │   ├── insights/
            │   │   ├── InsightsPanel.tsx       # NEW
            │   │   ├── PeakTimeInsight.tsx     # NEW
            │   │   ├── PatternInsight.tsx      # NEW
            │   │   ├── HealthInsight.tsx       # NEW
            │   │   └── index.ts                # NEW
            │   │
            │   └── tables/
            │       ├── PeaksTable.tsx          # NEW
            │       ├── SensorUptimeTable.tsx   # NEW
            │       └── index.ts                # NEW
            │
            ├── hooks/
            │   ├── useAnalytics.ts             # NEW
            │   ├── useTimeSeries.ts            # NEW
            │   ├── useDateRange.ts             # NEW
            │   ├── useChartData.ts             # NEW
            │   └── index.ts                    # NEW
            │
            └── types/
                └── analytics.types.ts          # NEW
```


---

## 🎓 Key Architectural Decisions

### Decision 1: Enhance Existing Analytics Module vs Create New

**Decision:** Enhance existing module ✅

**Rationale:**
- Analytics service already has daily/weekly/monthly logic
- DTOs already defined for summaries
- Controller already has authentication
- No need to duplicate code
- Just add new time-series and chart-specific methods

### Decision 2: Server-side Aggregation vs Client-side

**Decision:** Server-side aggregation ✅

**Rationale:**
- Thousands of readings too large for client
- Database aggregation is fast (indexed queries)
- Reduced network transfer
- Better scalability
- Client only receives aggregated data points

### Decision 3: Real-time Charts vs Static

**Decision:** Static with WebSocket invalidation ✅

**Rationale:**
- Historical data doesn't change frequently
- New readings only affect "today" view
- Use TanStack Query cache invalidation
- Background refetch (no loading spinner)
- More performant than streaming


### Decision 4: Multiple Chart Components vs Generic

**Decision:** Specialized chart components ✅

**Rationale:**
- Different chart types (area, line, dual-axis)
- Different data transformations needed
- Easier to customize individual charts
- Still share `BaseChart` wrapper for common config
- Better TypeScript type safety

### Decision 5: Date Range State Management

**Decision:** React state + URL params ✅

**Rationale:**
- Store in component state for immediate updates
- Sync to URL for shareability
- Use custom hook (`useDateRange`) for reusability
- Presets (today, week, month) for UX

```typescript
// URL: /analytics?start=2026-07-10&end=2026-07-17&preset=last7days
const [dateRange, setDateRange] = useDateRange();
```

### Decision 6: Export Functionality

**Decision:** Phase 7 (Future) ⏳

**Rationale:**
- Core visualizations more important first
- Export requires CSV/Excel library
- Can add later without affecting architecture
- Placeholder button for now


---

## 🔮 Future Enhancements (Phase 7+)

### AI/ML Predictions
- Energy generation forecasting
- Anomaly detection
- Predictive maintenance
- Optimization recommendations

**Architecture Preparation:**
- Time-series data already in optimal format
- Historical data for training models
- Separate `/api/analytics/predictions` endpoint
- Frontend can display prediction bands on charts

### Advanced Filters
- Multi-sensor selection
- Custom metric combinations
- Saved filter presets
- Alert configuration

### Data Export
- CSV export
- Excel export with charts
- PDF reports
- Automated email reports

### Comparison Features
- Compare multiple sensors side-by-side
- Compare time periods (this week vs last week)
- Benchmark against industry standards

---

## ✅ Success Criteria

### Backend
- [ ] All aggregation queries execute in < 2 seconds
- [ ] Endpoints return correct data for all date ranges
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Swagger documentation complete


### Frontend
- [ ] All charts render correctly with sample data
- [ ] Date range picker works (presets + custom)
- [ ] Charts responsive on mobile/tablet/desktop
- [ ] Loading skeletons display during data fetch
- [ ] Empty states for no data
- [ ] Error handling with retry
- [ ] WebSocket updates refresh analytics
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Production build succeeds
- [ ] Bundle size reasonable (< 1MB gzipped)

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Charts render in < 500ms
- [ ] Smooth animations (60fps)
- [ ] No memory leaks
- [ ] Efficient re-rendering

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] WCAG AA contrast ratios
- [ ] Focus indicators visible
- [ ] Alt text on charts

### User Experience
- [ ] Intuitive date range selection
- [ ] Clear chart labels and legends
- [ ] Helpful tooltips
- [ ] Smooth transitions
- [ ] Professional appearance

---

## 📖 Documentation Deliverables

1. **PHASE-6-ARCHITECTURE.md** (this document) ✅
2. **PHASE-6-COMPLETE.md** - Implementation summary
3. **API Documentation** - Updated Swagger docs
4. **Component Documentation** - JSDoc comments
5. **README Updates** - Phase 6 features

---

## 🚦 Ready to Proceed?

This architecture provides:
- ✅ Clear backend enhancement plan
- ✅ Detailed frontend component structure
- ✅ Performance optimization strategies
- ✅ Real-time integration approach
- ✅ Scalability for future AI features
- ✅ Comprehensive testing plan

**Estimated Total Time:** 16-22 hours
**Implementation Order:** Backend → Core Components → Page Assembly → Testing

**Next Step:** Begin implementation with backend DTOs and service enhancements.

---

**Approved for Implementation:** Awaiting user confirmation 🎯
