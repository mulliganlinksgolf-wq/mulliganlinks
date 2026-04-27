import Image from 'next/image'

interface Props {
  className?: string
  priority?: boolean
}

export function TeeAheadLogo({ className, priority }: Props) {
  return (
    <Image
      src="/brand/teeahead-logo-final.png"
      alt="TeeAhead"
      width={1200}
      height={320}
      className={className}
      priority={priority}
    />
  )
}
