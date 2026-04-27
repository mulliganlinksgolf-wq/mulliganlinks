interface Props {
  className?: string
}

export function TeeAheadLogo({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 80"
      className={className}
      aria-label="TeeAhead"
      role="img"
    >
      {/* T mark: 100×120 units scaled to 60×72px, offset y=4 for vertical centering */}
      <g transform="translate(0, 4) scale(0.6)">
        <path
          fillRule="evenodd"
          fill="#0F3D2E"
          d="M 0,0 H 100 V 38 H 75 V 120 H 25 V 38 H 0 Z M 13,13 H 87 V 25 H 13 Z M 38,51 H 62 V 107 H 38 Z"
        />
        {/* Flag pennant inside stem void */}
        <path fill="#0F3D2E" d="M 40,71 L 62,79 L 40,87 Z" />
      </g>
      {/* "eeAhead" — Inter 700, tight tracking */}
      <text
        x="66"
        y="65"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="72"
        fill="#0F3D2E"
        letterSpacing="-1.5"
      >
        eeAhead
      </text>
    </svg>
  )
}
