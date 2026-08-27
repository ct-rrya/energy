/**
 * EcoStep Logo Component
 * An integrated design where a leaf's silhouette subtly resembles a footprint
 * Deep forest green (#1A312C) with teal (#428475) and mint (#89D7B7) accents
 */
export function EcoStepLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main leaf body that subtly forms footprint shape */}
      <path
        d="M50 10 C 30 15, 20 30, 20 50 C 20 65, 30 75, 40 80 L 45 85 C 46 86, 48 87, 50 87 C 52 87, 54 86, 55 85 L 60 80 C 70 75, 80 65, 80 50 C 80 30, 70 15, 50 10 Z"
        fill="#1A312C"
        opacity="0.95"
      />
      
      {/* Secondary leaf vein - creates footprint arch */}
      <path
        d="M50 15 C 50 15, 45 35, 42 50 C 40 60, 42 70, 45 78"
        stroke="#428475"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Toe impressions - small circular accents */}
      <circle cx="45" cy="28" r="4" fill="#89D7B7" opacity="0.7" />
      <circle cx="55" cy="25" r="3.5" fill="#89D7B7" opacity="0.6" />
      <circle cx="50" cy="35" r="3" fill="#428475" opacity="0.5" />
      
      {/* Heel accent - bottom curve */}
      <ellipse
        cx="50"
        cy="75"
        rx="12"
        ry="8"
        fill="#428475"
        opacity="0.3"
      />
      
      {/* Subtle leaf veins */}
      <path
        d="M50 20 Q 60 35, 65 50"
        stroke="#89D7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M50 20 Q 40 35, 35 50"
        stroke="#89D7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
