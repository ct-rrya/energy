import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

/**
 * MonitoringPreview Component
 * 
 * Dashboard preview with KPI tiles and animated bar chart.
 * Bars grow in when scrolled into view (IntersectionObserver).
 */
export function MonitoringPreview() {
  const [isVisible, setIsVisible] = useState(false);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = dashRef.current;
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
        { threshold: 0.3 }
      );

      observer.observe(element);
      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, []);

  const barHeights = [35, 55, 40, 70, 60, 85, 50, 75, 45, 90, 65, 55];

  return (
    <>
      <h2 className="landing-h2" style={{ color: 'var(--landing-ink)', margin: '0 0 14px' }}>
        See what each step produces
      </h2>
      <p
        className="sub"
        style={{
          color: 'var(--landing-mute)',
          fontSize: '19px',
          maxWidth: '36em',
          margin: '0 0 44px',
        }}
      >
        Energy generation, electrical measurements, system status, and analytics in one dashboard.
      </p>

      <div
        ref={dashRef}
        className={`dash ${isVisible ? 'show' : ''}`}
        style={{
          background: 'var(--landing-surface)',
          border: '1px solid var(--landing-line)',
          borderRadius: '32px',
          padding: '24px',
          boxShadow: 'var(--landing-shadow)',
        }}
      >
        {/* KPI tiles */}
        <div
          className="kpis"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {['Voltage', 'Current', 'Power', 'System'].map((label) => (
            <div
              key={label}
              style={{
                background: 'var(--landing-bg)',
                borderRadius: '20px',
                padding: '16px',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--landing-mute)' }}>{label}</span>
              <b
                style={{
                  display: 'block',
                  fontSize: '30px',
                  letterSpacing: '-0.03em',
                  color: 'var(--landing-ink)',
                }}
              >
                --
              </b>
            </div>
          ))}
        </div>

        {/* Animated bars */}
        <div
          className="bars"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '170px',
            padding: '16px',
            background: 'var(--landing-bg)',
            borderRadius: '20px',
          }}
          aria-hidden="true"
        >
          {barHeights.map((height, index) => (
            <i
              key={index}
              style={{
                flex: 1,
                height: `${height}%`,
                borderRadius: '8px 8px 4px 4px',
                background: 'var(--landing-green)',
                opacity: 0.85,
                transformOrigin: 'bottom',
                transform: isVisible ? 'scaleY(1)' : 'scaleY(0.08)',
                transition: `transform 0.9s cubic-bezier(0.65, 0, 0.15, 1) ${index * 50}ms`,
              }}
            />
          ))}
        </div>

        <p className="note" style={{ fontSize: '13px', color: 'var(--landing-mute)', marginTop: '12px' }}>
          Preview layout. Open Dashboard for live values.
        </p>
      </div>

      <p style={{ marginTop: '24px' }}>
        <Link
          to={ROUTES.DASHBOARD}
          className="btn go"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '15px',
            border: '1px solid var(--landing-green)',
            background: 'var(--landing-green)',
            color: 'var(--landing-green-ink)',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Open Dashboard
        </Link>
      </p>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          .kpis {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </>
  );
}
