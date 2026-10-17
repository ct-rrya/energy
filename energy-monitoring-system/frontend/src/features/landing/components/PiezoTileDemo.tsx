import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * PiezoTileDemo Component
 * 
 * Interactive demo tile that simulates stepping on a piezoelectric tile.
 * Press animation with ripple ring effect.
 * Increments steps and simulated mWh value.
 */
export function PiezoTileDemo() {
  const [steps, setSteps] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handlePress = () => {
    // Increment counters
    const newSteps = steps + 1;
    const newEnergy = energy + 0.4 + Math.random() * 0.5;
    
    setSteps(newSteps);
    setEnergy(newEnergy);
    
    // Trigger press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 180);
  };

  return (
    <div
      className="demo"
      style={{
        background: 'var(--landing-surface)',
        border: '1px solid var(--landing-line)',
        borderRadius: isMobile ? '24px' : '32px',
        padding: isMobile ? '16px' : '28px',
        boxShadow: 'var(--landing-shadow)',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* Tile button */}
      <button
        className={`tile ${isPressed ? 'hit' : ''}`}
        onClick={handlePress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePress();
          }
        }}
        aria-label="Step on the demo tile"
        style={{
          position: 'relative',
          width: isMobile ? '100%' : 'min(100%, 260px)',
          height: isMobile ? '110px' : undefined,
          aspectRatio: isMobile ? 'unset' : '1',
          margin: isMobile ? '0 0 12px' : '0 auto 20px',
          borderRadius: isMobile ? '18px' : '28px',
          border: 0,
          background: 'linear-gradient(145deg, var(--landing-green), #0fa953)',
          color: 'var(--landing-green-ink)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: isMobile ? '18px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isMobile ? '0 6px 16px rgba(25, 212, 106, 0.3)' : '0 18px 0 -6px rgba(5, 54, 31, 0.35)',
          transition: 'transform 0.18s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.18s',
          transform: isPressed ? 'translateY(6px) scale(0.98)' : 'translateY(0) scale(1)',
        }}
      >
        Step here
        
        {/* Ring animation */}
        {isPressed && (
          <span
            style={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              border: '3px solid var(--landing-green)',
              opacity: 0,
              animation: 'landing-ring 0.7s ease-out',
            }}
          />
        )}
      </button>

      {/* Readings */}
      <div
        className="read"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: isMobile ? '8px' : '10px',
        }}
      >
        <div
          style={{
            background: 'var(--landing-bg)',
            borderRadius: isMobile ? '14px' : '18px',
            padding: isMobile ? '10px' : '12px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: isMobile ? '22px' : '26px',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--landing-ink)',
            }}
          >
            {steps}
          </b>
          <span
            style={{
              fontSize: isMobile ? '12px' : '13px',
              color: 'var(--landing-mute)',
            }}
          >
            Steps
          </span>
        </div>
        <div
          style={{
            background: 'var(--landing-bg)',
            borderRadius: isMobile ? '14px' : '18px',
            padding: isMobile ? '10px' : '12px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: isMobile ? '22px' : '26px',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--landing-ink)',
            }}
          >
            {energy.toFixed(1)}
          </b>
          <span
            style={{
              fontSize: isMobile ? '12px' : '13px',
              color: 'var(--landing-mute)',
            }}
          >
            mWh (demo)
          </span>
        </div>
      </div>

      {/* Note */}
      <p
        className="note"
        style={{
          fontSize: isMobile ? '12px' : '13px',
          color: 'var(--landing-mute)',
          margin: isMobile ? '10px 0 0' : '14px 0 0',
        }}
      >
        {isMobile
          ? 'Try it: simulated values. Live readings are on the dashboard.'
          : 'Interactive demo with simulated values. Live readings are on the Dashboard page.'}
      </p>
    </div>
  );
}
