/**
 * HowItWorks Component
 * 
 * Four-step process cards with CSS counter numbered circles.
 * Hover lift animation.
 */
export function HowItWorks() {
  const steps = [
    { title: 'Step', desc: 'Students walk across the piezoelectric tile.' },
    { title: 'Harvest', desc: 'The tile converts the mechanical energy into electrical energy.' },
    { title: 'Measure', desc: 'Sensors read the voltage, current, and power generated.' },
    { title: 'Monitor', desc: 'The ESP32 transmits the data to the EcoStep web dashboard.' },
  ];

  return (
    <>
      <h2 className="landing-h2" style={{ color: 'var(--landing-ink)', margin: '0 0 14px' }}>
        From footstep to dashboard in four moves
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
        A piezoelectric tile captures the pressure of each step. An ESP32 sends the readings online.
      </p>

      <div
        className="steps"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          counterReset: 's',
        }}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className="card"
            style={{
              background: 'var(--landing-surface)',
              border: '1px solid var(--landing-line)',
              borderRadius: '28px',
              padding: '26px',
              counterIncrement: 's',
              transition: 'transform 0.35s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.35s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                marginBottom: '46px',
              }}
            >
              {index + 1}
            </div>
            <h3
              style={{
                margin: '0 0 6px',
                fontSize: '22px',
                letterSpacing: '-0.02em',
                color: 'var(--landing-ink)',
              }}
            >
              {step.title}
            </h3>
            <p style={{ margin: 0, color: 'var(--landing-mute)' }}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          .steps {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .steps {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
