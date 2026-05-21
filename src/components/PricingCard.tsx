import Link from 'next/link'

export function PricingCard(props: {
  name: string; sub: string; price: string; unit?: string; subnote?: string;
  features: string[]; cta: string; hero?: boolean; badge?: string;
}) {
  const { name, sub, price, unit, subnote, features, cta, hero, badge } = props;
  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col gap-5 ${
        hero
          ? 'bg-[#0F3D2E] text-[#F4F1EA] -translate-y-2 shadow-[0_24px_56px_rgba(15,61,46,0.22)]'
          : 'bg-white text-[#1A1A1A] border border-[#0F3D2E]/10'
      }`}
    >
      {badge && (
        <div className="absolute -top-2.5 left-7 px-2.5 py-1 rounded-full bg-[#E0A800] text-[#082419] font-mono text-[10px] tracking-[0.1em] font-bold uppercase">
          {badge}
        </div>
      )}

      <div>
        <p
          className={`font-display tracking-[-0.01em] ${hero ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}
          style={{ fontSize: 28, fontWeight: 400 }}
        >
          {name}
        </p>
        <p className={`text-sm mt-0.5 ${hero ? 'text-[#F4F1EA]/65' : 'text-[#9DAA9F]'}`}>{sub}</p>
      </div>

      <div className={`flex items-baseline gap-1.5 pb-5 border-b ${hero ? 'border-[#F4F1EA]/15' : 'border-[#0F3D2E]/10'}`}>
        <span className="font-display leading-none" style={{ fontSize: 56, fontWeight: 400 }}>
          {price}
        </span>
        {unit && <span className={`text-sm ${hero ? 'text-[#F4F1EA]/65' : 'text-[#6B7770]'}`}>{unit}</span>}
      </div>
      {subnote && <p className={`-mt-2 text-xs ${hero ? 'text-[#F4F1EA]/55' : 'text-[#9DAA9F]'}`}>{subnote}</p>}

      <ul className="space-y-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="grid grid-cols-[16px_1fr] gap-2.5 text-sm leading-snug">
            <span className={`font-mono text-[11px] pt-0.5 ${hero ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>—</span>
            <span className={hero ? 'text-[#F4F1EA]/88' : 'text-[#1A1A1A]/80'}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/waitlist/golfer"
        className={`block text-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
          hero
            ? 'bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90'
            : 'border border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E]/5'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
