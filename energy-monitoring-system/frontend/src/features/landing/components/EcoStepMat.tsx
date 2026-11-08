import { useId } from 'react';

export interface EcoStepMatProps {
  className?: string;
  showLabels?: boolean;
}

// One footprint (left foot). The right foot is the same shape mirrored with scale(-1 1).
function Foot({ transform }: { transform?: string }) {
  return (
    <g fill="#E4F7EA" transform={transform}>
      <path d="M-14 -14C-16 -28 -6 -34 4 -32C14 -30 18 -20 17 -10C16 2 10 8 9 18C8 28 6 40 -4 40C-14 40 -16 30 -14 20C-13 10 -13 0 -14 -14Z" />
      <ellipse cx="10" cy="-41" rx="6.2" ry="6.8" />
      <ellipse cx="-0.5" cy="-43.5" rx="4.8" ry="5.4" />
      <ellipse cx="-9" cy="-41.5" rx="4.2" ry="4.8" />
      <ellipse cx="-15" cy="-36.5" rx="3.6" ry="4.2" />
      <ellipse cx="-18.5" cy="-30" rx="3" ry="3.5" />
    </g>
  );
}

export function EcoStepMat({ className, showLabels = true }: EcoStepMatProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const clipId = `ecostep-matclip-${id}`;
  const glowId = `ecostep-glow-${id}`;

  return (
    <svg
      className={className}
      viewBox="0 0 600 500"
      role="img"
      aria-label="Top view of the EcoStep floor mat with six piezoelectric discs and a footstep pulse, with an energy line flowing to a phone dashboard"
      style={{ width: '100%', height: 'auto' }}
    >
      <style>{`
        .ecostep-ripple{transform-box:fill-box;transform-origin:center;animation:ecostep-ripple 3.6s ease-out infinite}
        .ecostep-rp2{animation-delay:1.2s}
        .ecostep-rp3{animation-delay:2.4s}
        .ecostep-flow{stroke-dasharray:7 11;animation:ecostep-dash 1.4s linear infinite}
        .ecostep-floaty{animation:ecostep-floaty 6s ease-in-out infinite}
        @keyframes ecostep-ripple{0%{opacity:.85;transform:scale(.7)}100%{opacity:0;transform:scale(3.6)}}
        @keyframes ecostep-dash{to{stroke-dashoffset:-36}}
        @keyframes ecostep-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media (prefers-reduced-motion:reduce){.ecostep-ripple,.ecostep-flow,.ecostep-floaty{animation:none}}
      `}</style>
      <defs>
        <clipPath id={clipId}>
          <rect x="50" y="170" width="410" height="290" rx="34" />
        </clipPath>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2BDE7C" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="#2BDE7C" stopOpacity="0.07" />
          <stop offset="1" stopColor="#2BDE7C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* backdrop glow */}
      <circle cx="300" cy="262" r="250" fill={`url(#${glowId})`} />

      {/* mat */}
      <rect x="50" y="170" width="410" height="290" rx="34" fill="#14231C" stroke="#2A3D33" strokeWidth="2" />
      <rect x="66" y="186" width="378" height="258" rx="24" fill="none" stroke="#2E4A3B" strokeWidth="2" strokeDasharray="4 8" />

      {/* footstep pulse */}
      <g clipPath={`url(#${clipId})`}>
        <circle className="ecostep-ripple" cx="255" cy="315" r="30" fill="none" stroke="#2BDE7C" strokeWidth="3" />
        <circle className="ecostep-ripple ecostep-rp2" cx="255" cy="315" r="30" fill="none" stroke="#2BDE7C" strokeWidth="3" />
        <circle className="ecostep-ripple ecostep-rp3" cx="255" cy="315" r="30" fill="none" stroke="#2BDE7C" strokeWidth="3" />
      </g>

      {/* wiring */}
      <g stroke="#2E4A3B" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M125 240V390" />
        <path d="M385 240V390" />
      </g>
      <path d="M415 315H460" stroke="#17BC62" strokeWidth="4" strokeLinecap="round" />

      {/* piezoelectric discs */}
      <g fill="#0F8F4A">
        <circle cx="125" cy="240" r="30" /><circle cx="125" cy="315" r="30" /><circle cx="125" cy="390" r="30" />
        <circle cx="385" cy="240" r="30" /><circle cx="385" cy="315" r="30" /><circle cx="385" cy="390" r="30" />
      </g>
      <g fill="#2BDE7C">
        <circle cx="125" cy="240" r="19" /><circle cx="125" cy="315" r="19" /><circle cx="125" cy="390" r="19" />
        <circle cx="385" cy="240" r="19" /><circle cx="385" cy="315" r="19" /><circle cx="385" cy="390" r="19" />
      </g>

      {/* footprints */}
      <Foot transform="translate(232 322) rotate(-6)" />
      <Foot transform="translate(280 304) rotate(6) scale(-1 1)" />

      {/* energy line to dashboard */}
      <path className="ecostep-flow" d="M460 315 C 545 315, 545 300, 545 262" fill="none" stroke="#2BDE7C" strokeWidth="4" strokeLinecap="round" />
      <circle cx="460" cy="315" r="7" fill="#2BDE7C" />

      {/* dashboard phone */}
      <g className="ecostep-floaty">
        <rect x="490" y="90" width="104" height="172" rx="18" fill="#1F2D26" stroke="#3A4E43" strokeWidth="3" />
        <rect x="508" y="112" width="52" height="8" rx="4" fill="#E4F7EA" />
        <rect x="508" y="128" width="32" height="6" rx="3" fill="#6B8576" />
        <rect x="508" y="206" width="12" height="34" rx="3" fill="#1E8F58" />
        <rect x="526" y="166" width="12" height="74" rx="3" fill="#2BDE7C" />
        <rect x="544" y="190" width="12" height="50" rx="3" fill="#1E8F58" />
        <rect x="562" y="178" width="12" height="62" rx="3" fill="#1E8F58" />
      </g>

      {showLabels && (
        <>
          <text x="50" y="488" fontFamily="'JetBrains Mono', ui-monospace, Menlo, monospace" fontSize="12" letterSpacing="2" fill="var(--mu, #9DB2A5)">FLOOR MAT · PIEZO ELEMENTS</text>
          <text x="490" y="78" fontFamily="'JetBrains Mono', ui-monospace, Menlo, monospace" fontSize="12" letterSpacing="2" fill="var(--mu, #9DB2A5)">DASHBOARD</text>
        </>
      )}
    </svg>
  );
}

export default EcoStepMat;

