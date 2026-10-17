import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * HowItWorks Component
 * 
 * - Mobile: Connected vertical timeline matching design mock
 * - Desktop: Four-step process cards grid
 */
export function HowItWorks() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const steps = [
    { title: 'Step', desc: 'Students walk across the piezoelectric tile.' },
    { title: 'Harvest', desc: 'The tile converts mechanical energy into electrical energy.' },
    { title: 'Measure', desc: 'Sensors read the voltage, current, and power generated.' },
    { title: 'Monitor', desc: 'The ESP32 sends the data to the EcoStep web dashboard.' },
  ];

  return (
    <>
      <h2
        className="landing-h2"
        style={{
          color: 'var(--landing-ink)',
          margin: '0 0 10px',
          fontSize: isMobile ? '24px' : undefined,
          lineHeight: 1.15,
        }}
      >
        From footstep to dashboard in four moves
      </h2>
      <p
        className="sub"
        style={{
          color: 'var(--landing-mute)',
          fontSize: isMobile ? '14.5px' : '19px',
          maxWidth: '36em',
          margin: isMobile ? '0 0 28px' : '0 0 44px',
          lineHeight: 1.45,
        }}
      >
        A piezoelectric tile captures the pressure of each step. An ESP32 sends the readings online.
      </p>

      {isMobile ? (
        /* Mobile: Connected Vertical Timeline (Matching Attachment) */
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '4px' }}>
          {/* Continuous vertical connector line */}
          <div
            style={{
              position: 'absolute',
              left: '21px',
              top: '20px',
              bottom: '24px',
              width: '2px',
              background: 'rgba(34, 197, 94, 0.35)',
              zIndex: 0,
            }}
          />

          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                position: 'relative',
                zIndex: 1,
                paddingBottom: index === steps.length - 1 ? '0' : '28px',
              }}
            >
              {/* Step Number Circle */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '15px',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                }}
              >
                {index + 1}
              </div>

              {/* Step Content */}
              <div style={{ paddingTop: '2px' }}>
                <h3
                  style={{
                    margin: '0 0 3px',
                    fontSize: '16.5px',
                    fontWeight: 800,
                    color: 'var(--landing-ink)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--landing-mute)',
                    lineHeight: 1.4,
                    fontSize: '13.5px',
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Process Cards Grid */
        <div className="how-steps-grid steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className="card card-micro"
              style={{
                background: 'var(--landing-surface)',
                border: '1px solid var(--landing-line)',
                borderRadius: '28px',
                padding: '24px',
                counterIncrement: 's',
                position: 'relative',
                boxShadow: 'var(--landing-shadow)',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--landing-green)',
                  color: 'var(--landing-green-ink)',
                  fontWeight: 800,
                  marginBottom: '36px',
                }}
              >
                {index + 1}
              </div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                  letterSpacing: '-0.02em',
                  color: 'var(--landing-ink)',
                }}
              >
                {step.title}
              </h3>
              <p style={{ margin: 0, color: 'var(--landing-mute)', lineHeight: 1.5, fontSize: '15px' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
