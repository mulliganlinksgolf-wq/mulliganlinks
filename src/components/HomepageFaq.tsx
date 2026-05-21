import { FadeIn } from '@/components/FadeIn'

const COURSE_FAQS = [
  { q: 'Is TeeAhead really free for courses for founding partners?', a: 'Yes. The first ten Metro Detroit courses pay $0 for their first year. After that, $349/mo flat. No commissions, no barter, ever.' },
  { q: 'What if my course already uses EZLinks, foreUP, or another system?', a: 'We can run alongside or replace. We handle the migration in under 48 hours. Reach out to billy@teeahead.com for a straight answer on your specific setup.' },
  { q: 'Do you actually pay rev share?', a: 'Yes. Stripe Connect auto-pays 10% of every membership you refer, monthly, for 12 months.' },
  { q: 'Can I export everything?', a: 'Always. Full CSV export from the Members page. Your data is yours.' },
]

const GOLFER_FAQS = [
  { q: 'When does TeeAhead launch?', a: 'Metro Detroit, summer 2026. Waitlist members get first access plus 250 bonus Fairway Points on signup.' },
  { q: 'Will my home course actually be on TeeAhead?', a: "We're targeting all independent Metro Detroit courses. If yours isn't on the list yet, refer them — you'll earn priority access." },
  { q: 'Why pay $89 for Eagle when GolfPass+ is $119?', a: 'Eagle has zero booking fees (GolfPass+ charges $2.49–$3.49/round), points that never expire, partner-finder access, and works at local courses — not national chains.' },
  { q: "Who's behind TeeAhead?", a: "Two Metro Detroit golfers: Neil (operator-side at Outing.golf) and Billy (lifelong member). See the founders' scorecard above." },
]

export function HomepageFaq() {
  return (
    <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-20">
      <FadeIn>
        <div className="max-w-6xl mx-auto">

          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">Common questions</span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#6B7770] uppercase">{COURSE_FAQS.length + GOLFER_FAQS.length} answers</span>
          </div>

          <h2
            className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-none max-w-3xl mb-10"
            style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400 }}
          >
            Quick answers, <em className="italic text-[#E0A800]">both sides.</em>
          </h2>

          <div className="grid lg:grid-cols-2 gap-10">
            <FaqColumn title="For course operators" items={COURSE_FAQS} />
            <FaqColumn title="For golfers"          items={GOLFER_FAQS} />
          </div>

          <div className="mt-8 pt-5 border-t border-[#0F3D2E]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[13px] text-[#6B7770]">Still wondering?</p>
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-[13px]">
              <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] font-semibold underline underline-offset-[3px] whitespace-nowrap">Email Neil directly →</a>
              <span className="text-[#0F3D2E]/20">·</span>
              <a href="mailto:billy@teeahead.com" className="text-[#0F3D2E] font-semibold underline underline-offset-[3px] whitespace-nowrap">Email Billy →</a>
            </div>
          </div>

        </div>
      </FadeIn>
    </section>
  )
}

function FaqColumn({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((f, i) => (
          <details
            key={f.q}
            className="group bg-white border border-[#0F3D2E]/10 rounded-lg px-4 py-3"
            open={i === 0}
          >
            <summary className="flex justify-between items-baseline gap-3 cursor-pointer list-none">
              <span className="text-[14px] font-medium text-[#1A1A1A] leading-[1.35] flex-1">{f.q}</span>
              <span
                className="font-mono text-sm text-[#6B7770] transition-transform group-open:rotate-90 inline-block"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-[13px] text-[#6B7770] leading-[1.55]">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
