import Link from 'next/link'
import type { ReactNode } from 'react'
import { FadeIn } from '@/components/FadeIn'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

export type SeoSection =
  | { kind: 'narrative'; eyebrow: string; headline: ReactNode; body: ReactNode }
  | { kind: 'stats'; eyebrow: string; stats: { num: string; label: string; sub?: string }[] }
  | {
      kind: 'comparison'
      eyebrow: string
      columns: [string, string]
      rows: { l: string; a: string; b: string }[]
    }
  | { kind: 'faq'; eyebrow: string; items: { q: string; a: string }[] }

export type SeoLandingConfig = {
  eyebrow: string
  headline: ReactNode
  subhead: ReactNode
  sections: SeoSection[]
  spotsRemaining: number
}

export function SeoLandingTemplate({
  config,
  schema,
}: {
  config: SeoLandingConfig
  schema?: ReactNode
}) {
  const { spotsRemaining } = config
  const heroCta =
    spotsRemaining > 0
      ? `Claim a founding spot (${spotsRemaining} left)`
      : 'Join the course waitlist'

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {schema}

      <SiteHeader />

      <main className="flex-1">
        {/* Hero, editorial, cream */}
        <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <FadeIn>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-7 h-px bg-[#E0A800]" />
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
                  {config.eyebrow}
                </span>
              </div>
              <h1
                className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 400 }}
              >
                {config.headline}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-[#1A1A1A]/78 leading-relaxed max-w-3xl">
                {config.subhead}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/waitlist/course"
                  className="rounded-md bg-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors text-center"
                >
                  {heroCta}
                </Link>
                <Link
                  href="/damage"
                  className="rounded-md border border-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors text-center"
                >
                  Run your damage report →
                </Link>
              </div>
              <p className="mt-6 text-sm text-[#6B7770]">
                Golfer instead?{' '}
                <Link
                  href="/waitlist/golfer"
                  className="text-[#0F3D2E] font-semibold underline underline-offset-[3px]"
                >
                  Join the loyalty waitlist →
                </Link>
              </p>
            </div>
          </FadeIn>
        </section>

        {/* Sections, narrative / stats / comparison / faq, alternating bg */}
        {config.sections.map((section, i) => {
          const dark = i % 2 === 1
          return (
            <section
              key={i}
              className={`px-6 sm:px-10 lg:px-16 py-16 sm:py-20 ${
                dark ? 'bg-[#082419] text-[#F4F1EA]' : 'bg-white text-[#1A1A1A]'
              }`}
            >
              <FadeIn>
                <div className="max-w-5xl mx-auto">
                  <SectionEyebrow label={section.eyebrow} dark={dark} />

                  {section.kind === 'narrative' && (
                    <>
                      <h2
                        className={`font-display tracking-[-0.025em] leading-[1.05] mt-6 mb-6 max-w-3xl ${
                          dark ? 'text-[#F4F1EA]' : 'text-[#0F3D2E]'
                        }`}
                        style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400 }}
                      >
                        {section.headline}
                      </h2>
                      <div
                        className={`text-base leading-[1.7] max-w-3xl space-y-4 ${
                          dark ? 'text-[#F4F1EA]/82' : 'text-[#1A1A1A]/85'
                        }`}
                      >
                        {section.body}
                      </div>
                    </>
                  )}

                  {section.kind === 'stats' && (
                    <div className="mt-8 grid sm:grid-cols-3 gap-8">
                      {section.stats.map(({ num, label, sub }) => (
                        <div
                          key={label}
                          className={`border-t pt-4 ${dark ? 'border-[#E0A800]' : 'border-[#0F3D2E]'}`}
                        >
                          <p
                            className={`font-display leading-none tracking-[-0.025em] ${
                              dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'
                            }`}
                            style={{ fontSize: 'clamp(48px, 6vw, 64px)', fontWeight: 400 }}
                          >
                            {num}
                          </p>
                          <p
                            className={`mt-3 text-sm leading-relaxed ${
                              dark ? 'text-[#F4F1EA]/82' : 'text-[#1A1A1A]/80'
                            }`}
                          >
                            {label}
                          </p>
                          {sub && (
                            <p
                              className={`mt-1.5 text-xs font-mono tracking-[0.06em] ${
                                dark ? 'text-[#F4F1EA]/55' : 'text-[#0F3D2E]'
                              }`}
                            >
                              {sub}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.kind === 'comparison' && (
                    <div
                      className={`mt-8 rounded-xl overflow-hidden border ${
                        dark
                          ? 'border-[#F4F1EA]/15 bg-[#F4F1EA]/5'
                          : 'border-[#0F3D2E]/10 bg-white'
                      }`}
                    >
                      <div
                        className={`grid grid-cols-[1.4fr_1fr_1fr] px-5 py-3.5 ${
                          dark ? 'bg-[#F4F1EA]/[0.08]' : 'bg-[#0F3D2E]/[0.06]'
                        }`}
                      >
                        <span />
                        <span
                          className={`font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold ${
                            dark ? 'text-[#F4F1EA]/65' : 'text-[#6B7770]'
                          }`}
                        >
                          {section.columns[0]}
                        </span>
                        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-bold text-[#E0A800]">
                          {section.columns[1]}
                        </span>
                      </div>
                      {section.rows.map((r, j) => (
                        <div
                          key={r.l}
                          className={`grid grid-cols-[1.4fr_1fr_1fr] px-5 py-3.5 border-t items-center ${
                            dark ? 'border-[#F4F1EA]/10' : 'border-[#0F3D2E]/10'
                          } ${
                            j % 2 === 0
                              ? ''
                              : dark
                                ? 'bg-[#F4F1EA]/[0.03]'
                                : 'bg-[#FAF7F2]/60'
                          }`}
                        >
                          <span
                            className={`text-[13.5px] font-medium ${dark ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'}`}
                          >
                            {r.l}
                          </span>
                          <span className={`text-[13px] ${dark ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'}`}>
                            {r.a}
                          </span>
                          <span
                            className={`text-[13px] font-semibold ${
                              dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'
                            }`}
                          >
                            {r.b}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.kind === 'faq' && (
                    <div className="mt-8 grid lg:grid-cols-2 gap-4">
                      {section.items.map((f, j) => (
                        <details
                          key={f.q}
                          open={j < 2}
                          className={`group rounded-lg px-4 py-3 ${
                            dark
                              ? 'bg-[#F4F1EA]/[0.05] border border-[#F4F1EA]/10'
                              : 'bg-white border border-[#0F3D2E]/10'
                          }`}
                        >
                          <summary className="flex justify-between items-baseline gap-3 cursor-pointer list-none">
                            <span
                              className={`text-[14px] font-medium leading-[1.35] flex-1 ${
                                dark ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'
                              }`}
                            >
                              {f.q}
                            </span>
                            <span
                              className={`font-mono text-sm transition-transform group-open:rotate-90 ${
                                dark ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'
                              }`}
                              aria-hidden
                            >
                              +
                            </span>
                          </summary>
                          <p
                            className={`mt-2 text-[13px] leading-[1.55] ${
                              dark ? 'text-[#F4F1EA]/72' : 'text-[#6B7770]'
                            }`}
                          >
                            {f.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            </section>
          )
        })}

        {/* CTA */}
        <section className="px-6 py-20 bg-[#FAF7F2] text-center border-t border-[#0F3D2E]/10">
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-5">
              <h2
                className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-tight"
                style={{ fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 400 }}
              >
                Ready to <em className="italic text-[#E0A800]">drop GolfNow?</em>
              </h2>
              <p className="text-[#6B7770]">
                {spotsRemaining > 0
                  ? `${spotsRemaining} of 10 Founding Partner spots open. First year is free.`
                  : 'Join the course waitlist.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/waitlist/course"
                  className="rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
                >
                  Claim a founding spot →
                </Link>
                <Link
                  href="/contact"
                  className="rounded-md border border-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Talk to Neil &amp; Billy
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function SectionEyebrow({ label, dark }: { label: string; dark: boolean }) {
  if (!label) return null
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-xs tracking-[0.18em] uppercase font-semibold text-[#E0A800]">
        {label}
      </span>
      <span className={`flex-1 h-px ${dark ? 'bg-[#F4F1EA]/15' : 'bg-[#0F3D2E]/10'}`} />
    </div>
  )
}
