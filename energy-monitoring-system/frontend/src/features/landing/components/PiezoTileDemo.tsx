import { useState } from 'react';

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
        borderRadius: '32px',
        padding: '28px',
        boxShadow: 'var(--landing-shadow)',
        textAlign: 'center',
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
          width: 'min(100%, 260px)',
          aspectRatio: '1',
          margin: '0 auto 20px',
          borderRadius: '28px',
          border: 0,
          background: 'linear-gradient(145deg, var(--landing-green), #0fa953)',
          color: 'var(--landing-green-ink)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: '20px',
          boxShadow: '0 18px 0 -6px rgba(5, 54, 31, 0.35)',
          transition: 'transform 0.18s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.18s',
          transform: isPressed ? 'translateY(12px) scale(0.97)' : 'translateY(0) scale(1)',
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
          gap: '10px',
        }}
      >
        <div
          style={{
            background: 'var(--landing-bg)',
            borderRadius: '18px',
            padding: '12px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '26px',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--landing-ink)',
            }}
          >
            {steps}
          </b>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--landing-mute)',
            }}
          >
            Steps
          </span>
        </div>
        <div
          style={{
            background: 'var(--landing-bg)',
            borderRadius: '18px',
            padding: '12px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '26px',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--landing-ink)',
            }}
          >
            {energy.toFixed(1)}
          </b>
          <span
            style={{
              fontSize: '13px',
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
          fontSize: '13px',
          color: 'var(--landing-mute)',
          margin: '14px 0 0',
        }}
      >
        Interactive demo with simulated values. Live readings are on the Dashboard page.
      </p>
    </div>
  );
}
