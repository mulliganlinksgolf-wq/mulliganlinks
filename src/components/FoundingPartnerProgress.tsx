interface Props {
  claimed: number
  total: number
}

export function FoundingPartnerProgress({ claimed, total }: Props) {
  const pct = total > 0 ? Math.min((claimed / total) * 100, 100) : 0

  if (claimed >= total) {
    return (
      <p className="text-xs text-[#F4F1EA]/60 text-center">
        Founding Partner spots are full — join the standard waitlist
      </p>
    )
  }

  if (claimed === 0) {
    return (
      <p className="text-xs text-[#F4F1EA]/50 text-center">
        0 of {total} Founding Partner spots claimed — be first
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[#F4F1EA]/60 text-center">
        {claimed} of {total} spots claimed
      </p>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#8FA889] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
