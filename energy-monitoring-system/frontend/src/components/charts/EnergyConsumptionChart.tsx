import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EnergyDataPoint {
  time: string;
  consumption: number;
  predicted?: number;
}

interface EnergyConsumptionChartProps {
  data: EnergyDataPoint[];
  height?: number;
}

/**
 * Energy Consumption Chart - Soft Premium Design
 * Smooth area chart with teal gradient fill
 */
export function EnergyConsumptionChart({ 
  data, 
  height = 320 
}: EnergyConsumptionChartProps) {
  const chartData = useMemo(() => data, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          {/* Soft teal gradient for area fill */}
          <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop 
              offset="0%" 
              stopColor="rgb(66, 132, 117)" 
              stopOpacity={0.25} 
            />
            <stop 
              offset="95%" 
              stopColor="rgb(137, 215, 183)" 
              stopOpacity={0.05} 
            />
          </linearGradient>
        </defs>

        {/* Minimal grid lines */}
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(26, 49, 44, 0.06)" 
          vertical={false}
        />

        {/* X Axis - Time */}
        <XAxis
          dataKey="time"
          tick={{ 
            fill: 'rgb(115, 115, 115)', 
            fontSize: 12,
            fontWeight: 500 
          }}
          axisLine={{ stroke: 'rgba(26, 49, 44, 0.08)' }}
          tickLine={false}
          dy={8}
        />

        {/* Y Axis - Consumption */}
        <YAxis
          tick={{ 
            fill: 'rgb(115, 115, 115)', 
            fontSize: 12,
            fontWeight: 500 
          }}
          axisLine={{ stroke: 'rgba(26, 49, 44, 0.08)' }}
          tickLine={false}
          dx={-8}
          tickFormatter={(value) => `${value}kW`}
        />

        {/* Tooltip */}
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(26, 49, 44, 0.12)',
            backdropFilter: 'blur(16px)',
            padding: '12px 16px',
          }}
          labelStyle={{
            color: 'rgb(26, 49, 44)',
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '6px',
          }}
          itemStyle={{
            color: 'rgb(66, 132, 117)',
            fontWeight: 500,
            fontSize: '13px',
            padding: '2px 0',
          }}
          formatter={(value: any) => [`${value} kWh`, 'Consumption']}
          cursor={{ stroke: 'rgba(66, 132, 117, 0.2)', strokeWidth: 2 }}
        />

        {/* Main consumption area with smooth curve */}
        <Area
          type="monotone"
          dataKey="consumption"
          stroke="rgb(66, 132, 117)"
          strokeWidth={2.5}
          fill="url(#consumptionGradient)"
          animationDuration={800}
          animationEasing="ease-out"
        />

        {/* Optional predicted consumption */}
        {chartData.some(d => d.predicted) && (
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="rgb(137, 215, 183)"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
            animationDuration={800}
            animationEasing="ease-out"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
