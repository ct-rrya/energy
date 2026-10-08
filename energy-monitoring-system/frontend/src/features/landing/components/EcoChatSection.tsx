/**
 * EcoChatSection Component
 * 
 * Sample chat conversation showcasing the AI assistant.
 * "Ask EcoStep" button opens the existing FloatingChatButton widget.
 */
export function EcoChatSection() {
  const handleAskEcoStep = () => {
    // Dispatch custom event to open the new chat panel
    window.dispatchEvent(new CustomEvent('ecostep:openchat', { bubbles: true }));
  };

  return (
    <div
      className="two"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '48px',
        alignItems: 'center',
      }}
    >
      {/* Left: Text and button */}
      <div>
        <h2 className="landing-h2" style={{ color: 'var(--landing-ink)', margin: '0 0 14px' }}>
          Ask EcoChat anything about EcoStep
        </h2>
        <p
          className="sub"
          style={{
            color: 'var(--landing-mute)',
            fontSize: '19px',
            margin: '0 0 24px',
          }}
        >
          The built-in AI assistant helps visitors understand the system and find the energy data they need.
        </p>
        <button
          onClick={handleAskEcoStep}
          className="btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '15px',
            border: '1px solid var(--landing-line)',
            background: 'var(--landing-surface)',
            color: 'var(--landing-ink)',
            cursor: 'pointer',
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
          Ask EcoStep
        </button>
      </div>

      {/* Right: Sample chat */}
      <div className="chat" style={{ display: 'grid', gap: '12px' }}>
        <div
          className="bub"
          style={{
            maxWidth: '88%',
            padding: '14px 18px',
            borderRadius: '22px',
            background: 'var(--landing-surface)',
            border: '1px solid var(--landing-line)',
          }}
        >
          <div className="who" style={{ fontWeight: 800, marginBottom: '4px', color: 'var(--landing-ink)' }}>
            EcoChat
          </div>
          <div style={{ color: 'var(--landing-ink)' }}>
            Hi! I'm your EcoStep assistant. Ask me about energy status, analytics, or system insights.
          </div>
        </div>

        <div
          className="bub me"
          style={{
            justifySelf: 'end',
            maxWidth: '88%',
            padding: '14px 18px',
            borderRadius: '22px',
            background: 'var(--landing-green)',
            border: '1px solid var(--landing-green)',
            color: 'var(--landing-green-ink)',
            fontWeight: 600,
          }}
        >
          How does a footstep make power?
        </div>

        <div
          className="bub"
          style={{
            maxWidth: '88%',
            padding: '14px 18px',
            borderRadius: '22px',
            background: 'var(--landing-surface)',
            border: '1px solid var(--landing-line)',
          }}
        >
          <div className="who" style={{ fontWeight: 800, marginBottom: '4px', color: 'var(--landing-ink)' }}>
            EcoChat
          </div>
          <div style={{ color: 'var(--landing-ink)' }}>
            Each step presses the piezoelectric tile, which turns that pressure into a small electric charge we measure.
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          .two {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
