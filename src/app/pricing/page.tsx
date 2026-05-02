import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Pricing — TeeAhead',
  description: 'No barter. No commissions. No hidden fees. Founding Partner courses get their first year free. Golfer memberships start at $0.',
  alternates: { canonical: '/pricing' },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const [{ data: counter }, { data: contentRows }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').ilike('key', 'pricing.%'),
  ])

  const spotsRemaining = Math.max(0, (counter?.cap ?? 10) - (counter?.count ?? 0))
  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  const courseTiers = [
    {
      name: 'Founding Partner',
      price: '$0',
      period: '/mo — first year',
      badge: `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} left`,
      badgeColor: 'bg-[#E0A800]/20 text-[#8B6F00]',
      features: [
        'Full tee sheet & booking engine',
        'Loyalty engine (Fairway Points)',
        'White-label golfer app',
        'Real-time analytics dashboard',
        'Zero barter tee times',
        'Zero commissions',
        'Zero data extraction',
        'Go live in 48 hours',
      ],
      cta: 'Claim a Founding Spot',
      href: '/waitlist/course',
      highlight: true,
    },
    {
      name: 'Standard',
      price: '$349',
      period: '/mo',
      badge: null,
      badgeColor: '',
      features: [
        'Everything in Founding Partner',
        'Priority support',
        'No annual commitment',
      ],
      cta: 'Join the Waitlist',
      href: '/waitlist/course',
      highlight: false,
    },
  ]

  const golferTiers = [
    {
      name: 'Fairway',
      price: '$0',
      period: 'forever',
      badge: null,
      features: [
        'Book tee times at partner courses',
        '1× Fairway Points per dollar',
        'Free cancellation (1hr policy)',
      ],
      cta: 'Join for Free',
      href: '/waitlist/golfer',
    },
    {
      name: 'Eagle',
      price: '$89',
      period: '/yr',
      badge: 'Most Popular',
      features: [
        '250 bonus Fairway Points on signup',
        '1.5× Fairway Points per dollar',
        'Priority booking: 48hr early access',
        'Always-on booking fee waiver',
        '1 guest pass per year',
        '10% birthday credit',
      ],
      cta: 'Join Eagle Waitlist',
      href: '/waitlist/golfer?tier=eagle',
    },
    {
      name: 'Ace',
      price: '$159',
      period: '/yr',
      badge: null,
      features: [
        '500 bonus Fairway Points on signup',
        '2× Fairway Points per dollar',
        'Priority booking: 72hr early access',
        'Always-on booking fee waiver',
        '2 guest passes per year',
        '15% birthday credit',
      ],
      cta: 'Join Ace Waitlist',
      href: '/waitlist/golfer?tier=ace',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0F3D2E] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F4F1EA] leading-tight tracking-tight">
              {c['pricing.hero_headline'] ?? 'Simple, transparent pricing.'}
            </h1>
            <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-2xl mx-auto">
              {c['pricing.hero_subhead'] ?? 'No barter. No commissions. No hidden fees. Founding Partners get their first year free.'}
            </p>
          </div>
        </section>

        {/* Course pricing */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {c['pricing.course_section_headline'] ?? 'For Golf Courses'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {courseTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-2xl p-8 space-y-6 ${
                    tier.highlight
                      ? 'bg-[#0F3D2E] text-[#F4F1EA] ring-2 ring-[#E0A800]'
                      : 'bg-[#FAF7F2] ring-1 ring-black/5'
                  }`}
                >
                  <div className="space-y-2">
                    {tier.badge && (
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${tier.badgeColor}`}>
                        {tier.badge}
                      </span>
                    )}
                    <p className={`text-lg font-bold ${tier.highlight ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'}`}>{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className={`text-5xl font-black leading-none ${tier.highlight ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>{tier.price}</span>
                      <span className={`text-sm pb-1 ${tier.highlight ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'}`}>{tier.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 ${tier.highlight ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>✓</span>
                        <span className={tier.highlight ? 'text-[#F4F1EA]/80' : 'text-[#6B7770]'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.href}
                    className={`block w-full text-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                      tier.highlight
                        ? 'bg-[#E0A800] text-[#0a0a0a] hover:bg-[#E0A800]/90'
                        : 'border-2 border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E]/5'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#6B7770] leading-relaxed">
              {c['pricing.founding_note'] ?? 'The first 10 Founding Partner courses get TeeAhead free for their first year. Standard pricing is $349/month after that — still 95% cheaper than a typical GolfNow barter contract.'}
            </p>
          </div>
        </section>

        {/* Golfer pricing */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {c['pricing.golfer_section_headline'] ?? 'For Golfers'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {golferTiers.map((tier) => (
                <div key={tier.name} className="bg-white rounded-2xl p-7 space-y-5 ring-1 ring-black/5">
                  <div className="space-y-2">
                    {tier.badge && (
                      <span className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-xs font-bold px-3 py-1 rounded-full">
                        {tier.badge}
                      </span>
                    )}
                    <p className="text-lg font-bold text-[#1A1A1A]">{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-[#0F3D2E] leading-none">{tier.price}</span>
                      <span className="text-sm text-[#6B7770] pb-1">{tier.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#6B7770]">
                        <span className="text-[#0F3D2E] mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.href}
                    className="block w-full text-center rounded-lg border-2 border-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
          <nav className="flex items-center gap-6 text-sm text-[#F4F1EA]/60">
            <Link href="/" className="hover:text-[#F4F1EA] transition-colors">Home</Link>
            <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">Golfer Waitlist</Link>
            <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">Course Waitlist</Link>
          </nav>
          <p className="text-xs text-[#F4F1EA]/30">© 2026 TeeAhead, LLC.</p>
        </div>
      </footer>
    </div>
  )
}
