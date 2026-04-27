export interface Props {
  spotsRemaining: number
}

export function FoundingGolferBanner({ spotsRemaining }: Props) {
  if (spotsRemaining <= 0) return null

  return (
    <div
      className="rounded-xl bg-[#E0A800]/15 border border-[#E0A800]/40 p-4 space-y-2"
      aria-live="polite"
      aria-label="Founding Golfer Offer"
    >
      <p className="font-semibold text-[#1A1A1A] text-sm">
        Founding Golfer Offer — First 100 members get 3 months of Eagle free at launch.
        Then $79/yr. Cancel anytime before.
      </p>
      <p className="text-sm text-[#6B7770]">
        {spotsRemaining} of 100 spots remaining.
      </p>
    </div>
  )
}
