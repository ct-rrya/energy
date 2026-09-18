import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrendingUp, Zap, DollarSign, Leaf, BarChart3, LineChart, Activity, Sparkles } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getTimeSeries, analyzeHistorical, type HistoricalAnalysisRequest, type HistoricalAnalysisResponse } from '@/api/services/analytics.service';
import type { TimeSeries, MetricType, Granularity } from '@/features/analytics/types';

/**
 * Period Type
 */
type Period = 'last7days' | 'last30days' | 'last90days';

/**
 * Aggregation Type
 */
type Aggregation = 'hour' | 'day' | 'week' | 'month';

/**
 * Electrical Metric Type
 */
type ElectricalMetric = 'voltage' | 'current' | 'power';

/**
 * Historical Analytics Component
 * 
 * Displays historical energy data with interactive charts and AI-powered insights.
 * Features period selection, metric filtering, and on-demand AI analysis.
 */
export function HistoricalAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('last7days');
  const [selectedAggregation, setSelectedAggregation] = useState<Aggregation>('hour');
  const [selectedElectricalMetric, setSelectedElectricalMetric] = useState<ElectricalMetric>('power');
  const [aiAnalysis, setAiAnalysis] = useState<HistoricalAnalysisResponse | null>(null);

  // Calculate date range based on period
  const getDateRange = (period: Period) => {
    const end = new Date();
    let start = new Date();
    
    switch (period) {
      case 'last7days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last90days':
        start.setDate(end.getDate() - 90);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Auto-select aggregation based on period
  const getDefaultAggregation = (period: Period): Aggregation => {
    switch (period) {
      case 'last7days':
        return 'hour';
      case 'last30days':
        return 'day';
      case 'last90days':
        return 'week';
      default:
        return 'day';
    }
  };

  // Handle period change
  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    setSelectedAggregation(getDefaultAggregation(period));
    setAiAnalysis(null); // Clear previous AI analysis
  };

  const dateRange = getDateRange(selectedPeriod);

  // Fetch energy generation time series
  const { data: energyData, isLoading: isLoadingEnergy, error: energyError } = useQuery<TimeSeries>({
    queryKey: ['timeSeries', 'energy', selectedPeriod, selectedAggregation, dateRange],
    queryFn: () =>
      getTimeSeries({
        metric: 'energy' as MetricType,
        granularity: selectedAggregation as Granularity,
        ...dateRange,
        source: 'hardware',
      }),
  });

  // Fetch electrical measurements time series
  const { data: electricalData, isLoading: isLoadingElectrical, error: electricalError } = useQuery<TimeSeries>({
    queryKey: ['timeSeries', selectedElectricalMetric, selectedPeriod, selectedAggregation, dateRange],
    queryFn: () =>
      getTimeSeries({
        metric: selectedElectricalMetric as MetricType,
        granularity: selectedAggregation as Granularity,
        ...dateRange,
        source: 'hardware',
      }),
  });

  // AI Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: (request: HistoricalAnalysisRequest) => analyzeHistorical(request),
    onSuccess: (data) => {
      setAiAnalysis(data);
    },
  });

  const handleAnalyze = () => {
    analysisMutation.mutate({
      period: selectedPeriod,
    });
  };

  // Check if we have any data
  const hasData = energyData && energyData.dataPoints.length > 0;

  // Format chart data
  const formatChartData = (timeSeries: TimeSeries | undefined) => {
    if (!timeSeries) return [];
    return timeSeries.dataPoints.map((point) => ({
      time: point.label,
      value: point.value,
      min: point.min,
      max: point.max,
    }));
  };

  const energyChartData = formatChartData(energyData);
  const electricalChartData = formatChartData(electricalData);

  // Empty state
  if (!isLoadingEnergy && !hasData) {
    return (
      <EcoCard>
        <EcoEmptyState
          icon={BarChart3}
          title="No Historical Data Available"
          description="No historical sensor data has been collected yet. Connect your ESP32 and start collecting data to view analytics."
        />
      </EcoCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <EcoCard>
        <div className="space-y-4">
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-neutral-700))] mb-2">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'last7days' as Period, label: '7 Days' },
                { value: 'last30days' as Period, label: '30 Days' },
                { value: 'last90days' as Period, label: '3 Months' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-[#428475] text-white'
                      : 'bg-[rgb(var(--color-neutral-100))] text-[rgb(var(--color-neutral-700))] hover:bg-[rgb(var(--color-neutral-200))]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aggregation Selector */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-neutral-700))] mb-2">
              Aggregation
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'hour' as Aggregation, label: 'Hourly' },
                { value: 'day' as Aggregation, label: 'Daily' },
                { value: 'week' as Aggregation, label: 'Weekly' },
                { value: 'month' as Aggregation, label: 'Monthly' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedAggregation(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAggregation === option.value
                      ? 'bg-[#428475] text-white'
                      : 'bg-[rgb(var(--color-neutral-100))] text-[rgb(var(--color-neutral-700))] hover:bg-[rgb(var(--color-neutral-200))]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </EcoCard>

      {/* Summary Stats */}
      {hasData && energyData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EcoCard>
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <Zap className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--color-neutral-600))]">Total Energy</p>
                <p className="text-2xl font-bold text-[rgb(var(--color-neutral-900))]">
                  {energyData.summary.total?.toFixed(2) || '0.00'} kWh
                </p>
              </div>
            </div>
          </EcoCard>

          <EcoCard>
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--color-neutral-600))]">Peak Power</p>
                <p className="text-2xl font-bold text-[rgb(var(--color-neutral-900))]">
                  {energyData.summary.max.toFixed(2)} kWh
                </p>
              </div>
            </div>
          </EcoCard>

          <EcoCard>
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <Activity className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--color-neutral-600))]">Average</p>
                <p className="text-2xl font-bold text-[rgb(var(--color-neutral-900))]">
                  {energyData.summary.avg.toFixed(2)} kWh
                </p>
              </div>
            </div>
          </EcoCard>

          <EcoCard>
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <BarChart3 className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--color-neutral-600))]">Data Points</p>
                <p className="text-2xl font-bold text-[rgb(var(--color-neutral-900))]">
                  {energyData.summary.dataPoints}
                </p>
              </div>
            </div>
          </EcoCard>
        </div>
      )}

      {/* Energy Generation Chart */}
      <EcoCard>
        <div className="eco-card-header">
          <div className="flex items-center gap-3">
            <div className="eco-icon-container-lg">
              <LineChart className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="eco-card-title">Historical Energy Generation</h3>
              <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                Energy generated over time
              </p>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {isLoadingEnergy ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="md" />
            </div>
          ) : energyError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-[rgb(var(--color-neutral-600))]">
                Failed to load energy data
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={energyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-neutral-200))" />
                <XAxis 
                  dataKey="time" 
                  stroke="rgb(var(--color-neutral-400))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgb(var(--color-neutral-400))"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgb(var(--color-neutral-200))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#428475" 
                  strokeWidth={2}
                  dot={{ fill: '#428475', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Energy (kWh)"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </div>
      </EcoCard>

      {/* Electrical Measurements Chart */}
      <EcoCard>
        <div className="eco-card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <Activity className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="eco-card-title">Historical Electrical Measurements</h3>
                <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                  {selectedElectricalMetric === 'voltage' && 'Voltage over time'}
                  {selectedElectricalMetric === 'current' && 'Current over time'}
                  {selectedElectricalMetric === 'power' && 'Power over time'}
                </p>
              </div>
            </div>

            {/* Metric Selector */}
            <div className="flex gap-2">
              {[
                { value: 'voltage' as ElectricalMetric, label: 'Voltage', unit: 'V' },
                { value: 'current' as ElectricalMetric, label: 'Current', unit: 'A' },
                { value: 'power' as ElectricalMetric, label: 'Power', unit: 'W' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedElectricalMetric(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedElectricalMetric === option.value
                      ? 'bg-[#428475] text-white'
                      : 'bg-[rgb(var(--color-neutral-100))] text-[rgb(var(--color-neutral-700))] hover:bg-[rgb(var(--color-neutral-200))]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {isLoadingElectrical ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="md" />
            </div>
          ) : electricalError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-[rgb(var(--color-neutral-600))]">
                Failed to load electrical data
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={electricalChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-neutral-200))" />
                <XAxis 
                  dataKey="time" 
                  stroke="rgb(var(--color-neutral-400))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgb(var(--color-neutral-400))"
                  style={{ fontSize: '12px' }}
                  label={{ 
                    value: electricalData?.unit || '', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fontSize: '12px' } 
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgb(var(--color-neutral-200))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#89D7B7" 
                  strokeWidth={2}
                  dot={{ fill: '#89D7B7', r: 3 }}
                  activeDot={{ r: 5 }}
                  name={`${selectedElectricalMetric.charAt(0).toUpperCase() + selectedElectricalMetric.slice(1)} (${electricalData?.unit})`}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </div>
      </EcoCard>

      {/* AI Historical Analysis */}
      <EcoCard>
        <div className="eco-card-header">
          <div className="flex items-center gap-3">
            <div className="eco-icon-container-lg">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="eco-card-title">AI Historical Analysis</h3>
              <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                Get AI-powered insights about your energy trends
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!aiAnalysis && !analysisMutation.isPending && (
            <button
              onClick={handleAnalyze}
              disabled={!hasData || analysisMutation.isPending}
              className="eco-btn-primary w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              Analyze Historical Data
            </button>
          )}

          {analysisMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-3 text-sm text-[rgb(var(--color-neutral-600))]">
                Analyzing your energy data...
              </span>
            </div>
          )}

          {analysisMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to generate AI insights. Please try again.
              </p>
            </div>
          )}

          {aiAnalysis && (
            <div className="space-y-4">
              {/* AI Insights */}
              <div className="bg-[#F0F9F6] border border-[#89D7B7] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[rgb(var(--color-neutral-900))] mb-2">
                      AI Insights
                    </h4>
                    <p className="text-sm text-[rgb(var(--color-neutral-700))] leading-relaxed whitespace-pre-line">
                      {aiAnalysis.insights}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[rgb(var(--color-neutral-50))] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="h-4 w-4 text-[#428475]" strokeWidth={2} />
                    <p className="text-xs font-medium text-[rgb(var(--color-neutral-600))]">CO₂ Avoided</p>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-neutral-900))]">
                    {aiAnalysis.metrics.co2AvoidedKg.toFixed(2)} kg
                  </p>
                </div>

                <div className="bg-[rgb(var(--color-neutral-50))] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-[#428475]" strokeWidth={2} />
                    <p className="text-xs font-medium text-[rgb(var(--color-neutral-600))]">Cost Savings</p>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-neutral-900))]">
                    ${aiAnalysis.metrics.costSavingsUSD.toFixed(2)}
                  </p>
                </div>

                <div className="bg-[rgb(var(--color-neutral-50))] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-[#428475]" strokeWidth={2} />
                    <p className="text-xs font-medium text-[rgb(var(--color-neutral-600))]">Energy Trend</p>
                  </div>
                  <p className="text-lg font-bold text-[rgb(var(--color-neutral-900))] capitalize">
                    {aiAnalysis.metrics.energyTrend}
                  </p>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                className="eco-btn-secondary w-full sm:w-auto text-sm"
              >
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </EcoCard>
    </div>
  );
}
