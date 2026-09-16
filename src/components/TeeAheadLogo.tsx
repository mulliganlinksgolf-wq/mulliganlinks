import Image from 'next/image'

interface Props {
  className?: string
  priority?: boolean
}

export function TeeAheadLogo({ className, priority }: Props) {
  return (
    <Image
      src="/brand/teeahead-logo-primary.svg"
      alt="TeeAhead"
      width={492}
      height={94}
      className={className}
      priority={priority}
    />
  )
}
