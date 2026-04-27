interface Props {
  className?: string
}

export function TeeAheadLogo({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 550 120"
      className={className}
      aria-label="TeeAhead"
      role="img"
    >
      {/* Hollow T mark — thick outlined geometry matching brand favicon */}
      <path
        fillRule="evenodd"
        fill="#0F3D2E"
        d="M 0,4 H 108 V 30 H 76 V 116 H 32 V 30 H 0 Z
           M 7,11 H 101 V 23 H 7 Z
           M 39,37 H 69 V 109 H 39 Z"
      />
      {/* Flagstick and pennant inside stem void */}
      <rect x="53" y="37" width="3" height="52" fill="#0F3D2E"/>
      <path d="M 56,37 L 67,47 L 56,57 Z" fill="#0F3D2E"/>
      {/* "eeAhead" — tight against the T mark */}
      <text
        x="112"
        y="62"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="700"
        fontSize="80"
        fill="#0F3D2E"
        letterSpacing="-0.04em"
      >
        eeAhead
      </text>
    </svg>
  )
}
