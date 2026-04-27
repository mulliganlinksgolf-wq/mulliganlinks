interface Props {
  className?: string
}

export function TeeAheadLogo({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 160"
      className={className}
      aria-label="TeeAhead"
      role="img"
    >
      {/* Outlined T frame */}
      <g transform="translate(70, 80)" fill="none" stroke="#0F3D2E" strokeWidth="6" strokeLinejoin="miter">
        <path d="M -38 -36 L 38 -36 L 38 -18 L 12 -18 L 12 36 L -12 36 L -12 -18 L -38 -18 Z"/>
      </g>
      {/* Flagstick and pennant inside stem */}
      <g transform="translate(70, 80)" fill="#0F3D2E">
        <rect x="-1" y="-13" width="2" height="44"/>
        <path d="M 1 -13 L 10 -8 L 1 -3 Z"/>
      </g>
      {/* "eeAhead" wordmark */}
      <text
        x="116"
        y="106"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="80"
        fontWeight="700"
        fill="#0F3D2E"
        letterSpacing="-0.04em"
      >
        eeAhead
      </text>
    </svg>
  )
}
