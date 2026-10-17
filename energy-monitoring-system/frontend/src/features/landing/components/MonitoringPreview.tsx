import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ArrowRight, Info, Zap, Activity, TrendingUp, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/**
 * 12-hour sample energy generation dataset (8:00 AM to 7:00 PM)
 * Exact sample values: [12, 18, 14, 25, 21, 30, 17, 26, 15, 32, 24, 19]
 */
const SAMPLE_CHART_DATA = [
  { time: '8:00 AM', shortTime: '8A', energy: 12 },
  { time: '9:00 AM', shortTime: '9A', energy: 18 },
  { time: '10:00 AM', shortTime: '10A', energy: 14 },
  { time: '11:00 AM', shortTime: '11A', energy: 25 },
  { time: '12:00 PM', shortTime: '12P', energy: 21 },
  { time: '1:00 PM', shortTime: '1P', energy: 30 },
  { time: '2:00 PM', shortTime: '2P', energy: 17 },
  { time: '3:00 PM', shortTime: '3P', energy: 26 },
  { time: '4:00 PM', shortTime: '4P', energy: 15 },
  { time: '5:00 PM', shortTime: '5P', energy: 32 },
  { time: '6:00 PM', shortTime: '6P', energy: 24 },
  { time: '7:00 PM', shortTime: '7P', energy: 19 },
];

/**
 * Custom hook for smooth numerical count-up animation
 */
function useCountUp(target: number, decimals = 2, duration = 1200, start = false) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!start) {
      setVal(0);
      return;
    }
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Number((ease * target).toFixed(decimals)));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, decimals, duration, start]);

  return val.toFixed(decimals);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      time: string;
      energy: number;
    };
  }>;
}

/**
 * Custom glassmorphic tooltip for chart bars
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'rgba(10, 18, 36, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(57, 255, 136, 0.4)',
          borderRadius: '8px',
          padding: '6px 10px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '11px', color: '#93a39b', display: 'block', marginBottom: '1px' }}>
          {data.time}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <b style={{ fontSize: '15px', color: '#22c55e', letterSpacing: '-0.02em' }}>
            {data.energy}
          </b>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#86efac' }}>
            mJ
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * MonitoringPreview Component
 * 
 * Compact Device Showcase Mockup (inspired by promotional product mockups)
 * Displays the entire EcoStep dashboard inside a sleek laptop frame,
 * sized to fit completely within a single viewport without requiring scrolling.
 */
export function MonitoringPreview() {
  const [isVisible, setIsVisible] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const element = mockupRef.current;
    if (!element) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );

      observer.observe(element);
      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, []);

  // Smooth numerical count-up
  const voltageVal = useCountUp(4.85, 2, 1100, isVisible);
  const currentVal = useCountUp(14.20, 2, 1200, isVisible);
  const powerVal = useCountUp(68.90, 2, 1300, isVisible);

  const kpis = useMemo(() => [
    {
      label: 'Voltage',
      value: `${voltageVal} V`,
      icon: <Zap size={12} style={{ color: '#22c55e' }} />,
      color: '#22c55e',
      badge: 'Peak',
    },
    {
      label: 'Current',
      value: `${currentVal} mA`,
      icon: <Activity size={12} style={{ color: '#38bdf8' }} />,
      color: '#38bdf8',
      badge: 'Equiv',
    },
    {
      label: 'Power',
      value: `${powerVal} mW`,
      icon: <TrendingUp size={12} style={{ color: '#fbbf24' }} />,
      color: '#fbbf24',
      badge: 'Peak',
    },
    {
      label: 'System',
      value: 'Active',
      icon: <Sparkles size={12} style={{ color: '#22c55e' }} />,
      color: '#22c55e',
      isStatus: true,
      badge: 'Optimal',
    },
  ], [voltageVal, currentVal, powerVal]);

  return (
    <div
      ref={mockupRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1040px',
        margin: '0 auto',
      }}
    >
      {/* Compact Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2
          className="landing-h2"
          style={{
            color: 'var(--landing-ink)',
            margin: '0 0 6px',
            fontSize: 'clamp(26px, 3.8vw, 40px)',
            lineHeight: 1.1,
          }}
        >
          See what others are generating
        </h2>
        <p
          className="sub"
          style={{
            color: 'var(--landing-mute)',
            fontSize: '15px',
            maxWidth: '38em',
            margin: '0 auto',
            lineHeight: 1.4,
          }}
        >
          Energy generation, electrical measurements, system status, and analytics in one live dashboard.
        </p>
      </div>

      {/* Floating Promotional Callout Tags (Reference Image Style) */}
      <div
        className="callout-tags-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#22c55e',
          }}
        >
          <Zap size={13} />
          Key Electrical Metrics
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#38bdf8',
          }}
        >
          <Activity size={13} />
          Interactive Generation Chart
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fbbf24',
          }}
        >
          <Sparkles size={13} />
          Tile System Diagnostics
        </span>
      </div>

      {/* Laptop Showcase Frame (Fits comfortably in a single viewport) */}
      <div
        className="laptop-mockup-wrapper"
        style={{
          width: '100%',
          maxWidth: '820px',
          position: 'relative',
        }}
      >
        {/* Laptop Display Lid */}
        <div
          style={{
            background: '#151d2f',
            border: '2px solid #2a3754',
            borderRadius: '16px 16px 2px 2px',
            padding: '8px 8px 10px',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 30px rgba(34, 197, 94, 0.08)',
          }}
        >
          {/* Laptop Camera Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#334155',
                display: 'inline-block',
              }}
            />
          </div>

          {/* Screen Content: Miniature EcoStep Dashboard */}
          <div
            style={{
              background: '#070d1e',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: isMobile ? '10px' : '14px 16px',
              overflow: 'hidden',
            }}
          >
            {/* Miniature Dashboard Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                marginBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#eaf3ee', marginLeft: '6px' }}>
                  EcoStep Central
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', display: isMobile ? 'none' : 'inline' }}>
                  • 100 Hz Piezoelectric Tile
                </span>
              </div>

              {/* Pulsing Live Demo Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                    animation: 'mockup-pulse 1.8s infinite ease-in-out',
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>
                  LIVE PREVIEW
                </span>
              </div>
            </div>

            {/* 4 Metric Cards Row (Sized to fit cleanly without vertical scroll) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {kpi.icon}
                      <span style={{ fontSize: '11px', color: '#93a39b', fontWeight: 600 }}>
                        {kpi.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: kpi.color,
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {kpi.badge}
                    </span>
                  </div>

                  <b
                    style={{
                      display: 'block',
                      fontSize: kpi.isStatus ? '16px' : '18px',
                      fontWeight: 800,
                      color: '#eaf3ee',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {kpi.value}
                  </b>
                </div>
              ))}
            </div>

            {/* Energy Generation Bar Chart (Compact, fits within laptop screen) */}
            <div
              style={{
                background: 'rgba(11, 19, 43, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '10px 12px 6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#eaf3ee' }}>
                    Energy Generation Over Time
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    (mJ)
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#93a39b' }}>
                  8:00 AM – 7:00 PM
                </span>
              </div>

              {/* Bar Chart Container */}
              <div style={{ width: '100%', height: isMobile ? '120px' : '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SAMPLE_CHART_DATA}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="laptopBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39FF88" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#19D46A" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(val, idx) => (isMobile ? SAMPLE_CHART_DATA[idx]?.shortTime : val)}
                      stroke="rgba(255, 255, 255, 0.12)"
                      tick={{ fill: '#93a39b', fontSize: 9 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      interval={0}
                    />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.12)"
                      tick={{ fill: '#93a39b', fontSize: 9 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      domain={[0, 36]}
                      ticks={[0, 15, 30]}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(57, 255, 136, 0.08)' }}
                    />
                    <Bar
                      dataKey="energy"
                      fill="url(#laptopBarGrad)"
                      radius={[4, 4, 1, 1]}
                      isAnimationActive={isVisible}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Demo Label below chart inside screen */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  marginTop: '4px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#93a39b' }}>
                  <Info size={12} style={{ color: '#22c55e' }} />
                  <span>Illustrative Demo Data — Not Live Readings</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  Sample yield: 243 mJ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Aluminum Base & Notch */}
        <div
          style={{
            position: 'relative',
            width: '104%',
            left: '-2%',
            height: '12px',
            background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
            borderRadius: '0 0 14px 14px',
            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {/* Thumb Notch */}
          <div
            style={{
              width: '64px',
              height: '4px',
              background: '#0f172a',
              borderRadius: '0 0 4px 4px',
            }}
          />
        </div>
      </div>

      {/* Button navigating to actual live dashboard */}
      <div
        style={{
          marginTop: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link
          to={ROUTES.DASHBOARD}
          className="btn go"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '14px',
            border: '1px solid var(--landing-green)',
            background: 'var(--landing-green)',
            color: 'var(--landing-green-ink)',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(25, 212, 106, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Open Dashboard
          <ArrowRight size={15} />
        </Link>
        <span style={{ fontSize: '13px', color: 'var(--landing-mute)' }}>
          Click to access live database readings & diagnostics
        </span>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes mockup-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.6;
          }
        }

        @media (max-width: 640px) {
          .laptop-mockup-wrapper {
            max-width: 100% !important;
          }
          .callout-tags-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
