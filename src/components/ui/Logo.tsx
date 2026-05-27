export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Spartan helmet with football - Modo Fosa logo */}
      <g>
        {/* Wings left */}
        <path
          d="M80 200 L20 140 L40 180 L10 120 L50 170 L30 100 L60 160 L50 80 L70 155 L75 60 L80 160 L90 180 Z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Wings right */}
        <path
          d="M432 200 L492 140 L472 180 L502 120 L462 170 L482 100 L452 160 L462 80 L442 155 L437 60 L432 160 L422 180 Z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Helmet crest/plume */}
        <path
          d="M256 30 L230 50 L220 90 L216 140 L220 110 L230 80 L256 50 L282 80 L292 110 L296 140 L292 90 L282 50 Z"
          fill="currentColor"
        />
        <rect x="240" y="30" width="32" height="120" rx="4" fill="currentColor" />
        {/* Helmet dome */}
        <path
          d="M140 200 C140 130 190 70 256 70 C322 70 372 130 372 200 L372 220 L140 220 Z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M140 200 C140 130 190 70 256 70 C322 70 372 130 372 200 L372 220 L140 220 Z"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
        />
        {/* Football/soccer ball in helmet center */}
        <circle cx="256" cy="170" r="50" stroke="currentColor" strokeWidth="6" fill="none" />
        {/* Pentagon pattern */}
        <path
          d="M256 135 L272 148 L266 168 L246 168 L240 148 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Ball panel lines */}
        <line x1="256" y1="120" x2="256" y2="135" stroke="currentColor" strokeWidth="3" />
        <line x1="272" y1="148" x2="290" y2="140" stroke="currentColor" strokeWidth="3" />
        <line x1="266" y1="168" x2="280" y2="185" stroke="currentColor" strokeWidth="3" />
        <line x1="246" y1="168" x2="232" y2="185" stroke="currentColor" strokeWidth="3" />
        <line x1="240" y1="148" x2="222" y2="140" stroke="currentColor" strokeWidth="3" />
        {/* Visor/eye slit */}
        <rect x="160" y="230" width="192" height="16" rx="4" fill="currentColor" opacity="0.6" />
        {/* Face guard / nose piece */}
        <path
          d="M240 250 L240 340 L230 360 L256 380 L282 360 L272 340 L272 250"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Cheek guards */}
        <path
          d="M160 246 L150 320 L170 360 L200 370 L220 350 L230 300 L230 246"
          stroke="currentColor"
          strokeWidth="6"
          fill="currentColor"
          opacity="0.12"
        />
        <path
          d="M160 246 L150 320 L170 360 L200 370 L220 350 L230 300 L230 246"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M352 246 L362 320 L342 360 L312 370 L292 350 L282 300 L282 246"
          stroke="currentColor"
          strokeWidth="6"
          fill="currentColor"
          opacity="0.12"
        />
        <path
          d="M352 246 L362 320 L342 360 L312 370 L292 350 L282 300 L282 246"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
        />
        {/* Chin guard */}
        <path
          d="M200 370 L220 400 L256 415 L292 400 L312 370"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
