export function TriadLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <g stroke="#00f3ff" strokeWidth="3" fill="none" strokeLinejoin="miter" filter="url(#neon-glow)">
        {/* T */}
        <path d="M 40 60 H 160 M 100 60 V 140" />
        
        {/* R */}
        <path d="M 180 140 V 60 H 240 L 260 80 V 100 H 180 M 240 100 L 260 140" />
        
        {/* I (with the arrow bottom) */}
        <path d="M 295 60 V 120 L 305 140 L 315 120 V 60 Z" />
        
        {/* A */}
        <path d="M 370 60 L 330 140 H 350 L 360 120 H 380 L 390 140 H 410 Z M 370 90 L 355 115 H 385 Z" />
        
        {/* D */}
        <path d="M 430 60 V 140 H 490 L 530 100 L 490 60 Z" />
      </g>

      {/* Particle Effects around the 'I' and 'A' */}
      <g fill="#ff003c" filter="url(#neon-glow)">
        <circle cx="290" cy="90" r="2" />
        <circle cx="285" cy="105" r="1.5" />
        <circle cx="300" cy="115" r="2.5" />
        <circle cx="320" cy="125" r="1" />
        <circle cx="310" cy="85" r="2" />
        <circle cx="325" cy="100" r="1.5" />
      </g>
      <g fill="#00f3ff" filter="url(#neon-glow)">
        <circle cx="295" cy="80" r="1.5" />
        <circle cx="315" cy="110" r="2" />
        <circle cx="280" cy="120" r="1" />
        <circle cx="305" cy="95" r="2" />
      </g>
    </svg>
  );
}
