import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ArrowRight } from 'lucide-react';

/**
 * EcoChatSection Component
 * 
 * Sample chat conversation showcasing the AI assistant.
 * Mobile layout matches the reference mockup: stacked text, chat bubbles in card, input pill with action button.
 * Desktop layout retains the two-column grid.
 */
export function EcoChatSection() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleAskEcoStep = () => {
    // Dispatch custom event to open the chat widget/assistant
    window.dispatchEvent(new CustomEvent('ecostep:openchat', { bubbles: true }));
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div>
          <h2
            className="landing-h2"
            style={{
              color: 'var(--landing-ink)',
              margin: '0 0 8px',
              fontSize: '24px',
              lineHeight: 1.15,
            }}
          >
            Ask EcoChat anything
          </h2>
          <p
            className="sub"
            style={{
              color: 'var(--landing-mute)',
              fontSize: '14px',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            The built-in assistant helps visitors understand the system and find the energy data they need.
          </p>
        </div>

        {/* Chat card matching reference */}
        <div
          style={{
            background: 'var(--landing-surface)',
            border: '1px solid var(--landing-line)',
            borderRadius: '24px',
            padding: '16px',
            boxShadow: 'var(--landing-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          {/* Bot Greeting Bubble */}
          <div
            style={{
              background: 'var(--landing-bg)',
              borderRadius: '16px',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: 1.4,
              color: 'var(--landing-ink)',
              maxWidth: '92%',
              alignSelf: 'flex-start',
            }}
          >
            Hi! I am your EcoStep assistant. Ask me about energy status, analytics, or system insights.
          </div>

          {/* User Question Bubble */}
          <div
            style={{
              background: '#15803d',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.4,
              maxWidth: '85%',
              alignSelf: 'flex-end',
            }}
          >
            How does a footstep make power?
          </div>

          {/* Bot Answer Bubble */}
          <div
            style={{
              background: 'var(--landing-bg)',
              borderRadius: '16px',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: 1.4,
              color: 'var(--landing-ink)',
              maxWidth: '92%',
              alignSelf: 'flex-start',
            }}
          >
            Each step presses the piezoelectric tile, which turns that pressure into a small electric charge we measure.
          </div>

          {/* Chat Input Pill */}
          <div
            onClick={handleAskEcoStep}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAskEcoStep();
              }
            }}
            style={{
              marginTop: '4px',
              background: 'var(--landing-bg)',
              borderRadius: '999px',
              padding: '4px 4px 4px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'border-color 0.2s',
            }}
          >
            <span style={{ fontSize: '12.5px', color: 'var(--landing-mute)' }}>
              Ask about energy or steps...
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#15803d',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowRight size={14} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ecochat-grid two">
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
          className="btn btn-micro"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '15px',
            border: '1px solid var(--landing-line)',
            background: 'var(--landing-surface)',
            color: 'var(--landing-ink)',
            cursor: 'pointer',
            boxShadow: 'var(--landing-shadow)',
          }}
        >
          Ask EcoStep
          <span className="arrow-micro">→</span>
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
    </div>
  );
}
