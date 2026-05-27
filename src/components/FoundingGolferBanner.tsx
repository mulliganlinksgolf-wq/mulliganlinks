export interface Props {
  spotsRemaining: number
  dark?: boolean
}

export function FoundingGolferBanner({ spotsRemaining, dark = false }: Props) {
  if (spotsRemaining <= 0) return null

  return (
    <div
      className={`rounded-xl border border-[#E0A800]/40 p-4 space-y-2 ${
        dark ? 'bg-[#E0A800]/10' : 'bg-[#E0A800]/15'
      }`}
      aria-live="polite"
      aria-label="Founding Golfer Offer"
    >
      <p className={`font-semibold text-sm ${dark ? 'text-[#FAF7F2]' : 'text-[#1A1A1A]'}`}>
        Founding Golfer Offer — First 100 members get 3 months of Eagle free at launch.
        Then $89/yr. Cancel anytime before.
      </p>
      <p className={`text-sm ${dark ? 'text-[#aaa]' : 'text-[#6B7770]'}`}>
        {spotsRemaining} of 100 spots remaining.
      </p>
    </div>
  )
}
