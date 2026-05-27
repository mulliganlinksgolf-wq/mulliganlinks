import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { submitCourseInquiry } from '@/app/actions/contact'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Contact — Two Phones, Not a Ticket System',
  description: 'Neil and Billy answer their own email and pick up their own phones. Reach the TeeAhead founders directly.',
  alternates: { canonical: '/contact' },
  openGraph: {
    url: '/contact',
    title: 'Contact TeeAhead — Reachable directly',
    description: 'Email or call Neil Barris or Billy Beslock. Co-founders. Metro Detroit.',
  },
}

const FOUNDERS = [
  {
    name: 'Neil Barris',
    first: 'Neil',
    role: 'Co-founder · Operator side',
    initials: 'NB',
    email: 'neil@teeahead.com',
    phone: '+1 (248) 762-0531',
    phoneHref: 'tel:+12487620531',
    smsHref: 'sms:+12487620531',
    bestFor: 'Course owners, GMs, pro shops — pricing, onboarding, data migration, or partnership questions.',
    dark: true,
  },
  {
    name: 'Billy Beslock',
    first: 'Billy',
    role: 'Co-founder · Golfer side',
    initials: 'BB',
    email: 'billy@teeahead.com',
    phone: '+1 (248) 863-6330',
    phoneHref: 'tel:+12488636330',
    smsHref: 'sms:+12488636330',
    bestFor: "Golfers — questions about membership tiers, Fairway Points, partner finder, or your home course. Or you're just curious.",
    dark: false,
  },
]

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: contentRows } = await supabase
    .from('content_blocks')
    .select('key, value')
    .ilike('key', 'contact.%')
  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/features" className="text-sm text-[#0F3D2E]/70 hover:text-[#0F3D2E]">Features</Link>
            <Link href="/pricing"  className="text-sm text-[#0F3D2E]/70 hover:text-[#0F3D2E]">Pricing</Link>
            <Link href="/waitlist/course" className="inline-flex items-center rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90">
              Claim a spot →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-px bg-[#E0A800]" />
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
                {c['contact.hero_eyebrow'] ?? 'Get in touch · Reachable directly'}
              </span>
            </div>
            <h1
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em] max-w-3xl"
              style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 400 }}
            >
              {c['contact.hero_headline'] ?? (
                <>Not a support ticket. <em className="italic text-[#E0A800]">Two&nbsp;phones.</em></>
              )}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#1A1A1A]/78 leading-relaxed max-w-2xl">
              {c['contact.hero_subhead'] ?? "We're Neil and Billy. We answer our own email and pick up our own phones. If you run a Metro Detroit course or you're a golfer with a question — text, email, or use the form."}
            </p>

            {/* Founder cards */}
            <div className="mt-10 grid md:grid-cols-2 gap-4">
              {FOUNDERS.map((f) => <FounderCard key={f.name} f={f} />)}
            </div>
          </FadeIn>

          {/* Secondary form */}
          <FadeIn>
            <div className="mt-14 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-2.5">Or — a paper trail</p>
                <h2 className="font-display text-[#0F3D2E] tracking-[-0.015em] leading-[1.1] mb-3" style={{ fontSize: 32, fontWeight: 400 }}>
                  Rather <em className="italic text-[#E0A800]">write&nbsp;it&nbsp;out?</em>
                </h2>
                <p className="text-sm text-[#1A1A1A]/72 leading-[1.55]">
                  Use the form. We'll route it to whichever of us is best to answer and reply within one business day.
                </p>
              </div>

              <form action={submitCourseInquiry} className="bg-white border border-[#0F3D2E]/10 rounded-xl p-6 flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field id="name"  label="Your name" placeholder="Riley Mahoney" required />
                  <Field id="email" label="Email"     placeholder="riley@plumhollow.com" type="email" required />
                </div>
                <Field id="course" label="Course or club (optional)" placeholder="Plum Hollow Country Club" />
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold mb-1.5">I'm reaching out as a…</label>
                  <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
                    {[
                      { v: 'course',  l: 'Course operator' },
                      { v: 'golfer',  l: 'Golfer' },
                      { v: 'other',   l: 'Press / Other' },
                    ].map((opt, i) => (
                      <label key={opt.v} className="cursor-pointer">
                        <input
                          type="radio"
                          name="audience"
                          value={opt.v}
                          defaultChecked={i === 0}
                          className="peer sr-only"
                        />
                        <span className="block text-center text-[13px] font-medium px-3 py-2.5 rounded-md border border-[#0F3D2E]/15 text-[#0F3D2E] peer-checked:bg-[#0F3D2E] peer-checked:text-[#F4F1EA] peer-checked:border-[#0F3D2E] peer-checked:font-semibold transition-colors">
                          {opt.l}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold mb-1.5">What's on your mind</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Tell us about your course and what you're hoping to figure out…"
                    className="w-full rounded-md border border-[#0F3D2E]/15 bg-[#FAF7F2] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-[#0F3D2E] py-3 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
                >
                  Send → we reply within 1 business day
                </button>
                <p className="text-xs text-[#6B7770] text-center">No spam. No sales pressure.</p>
              </form>
            </div>
          </FadeIn>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

            {/* Column 1 — Brand */}
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">Book ahead. Play more. Own your golf.</p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>

            {/* Column 2 — For Courses */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">For Courses</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
                <Link href="/damage" className="hover:text-[#F4F1EA] transition-colors">GolfNow Damage Report</Link>
                <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors">Software Cost Calculator</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">Join Waitlist</Link>
              </nav>
            </div>

            {/* Column 3 — Compare */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Compare</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/tee-time-software" className="hover:text-[#F4F1EA] transition-colors">Tee Time Software</Link>
                <Link href="/best-tee-sheet-software" className="hover:text-[#F4F1EA] transition-colors">Best Tee Sheet</Link>
                <Link href="/golfnow-alternative" className="hover:text-[#F4F1EA] transition-colors">GolfNow Alternative</Link>
                <Link href="/golf-course-booking-software" className="hover:text-[#F4F1EA] transition-colors">Booking Software</Link>
              </nav>
            </div>

            {/* Column 4 — Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/contact" className="hover:text-[#F4F1EA] transition-colors">Contact</Link>
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About</Link>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-1">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan</p>
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FounderCard({ f }: { f: typeof FOUNDERS[0] }) {
  const cls = f.dark
    ? { bg: 'bg-[#0F3D2E] text-[#F4F1EA]', mute: 'text-[#F4F1EA]/60', line: 'border-[#F4F1EA]/15', accent: 'text-[#E0A800]', avatar: 'bg-[#E0A800] text-[#082419]', cta: 'bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90', textBtn: 'border-[#E0A800] text-[#E0A800]' }
    : { bg: 'bg-white border border-[#0F3D2E]/10 text-[#1A1A1A]', mute: 'text-[#6B7770]', line: 'border-[#0F3D2E]/10', accent: 'text-[#0F3D2E]', avatar: 'bg-[#0F3D2E] text-[#E0A800]', cta: 'bg-[#0F3D2E] text-[#F4F1EA] hover:bg-[#0F3D2E]/90', textBtn: 'border-[#0F3D2E] text-[#0F3D2E]' }

  return (
    <div className={`rounded-2xl p-7 sm:p-8 flex flex-col gap-5 ${cls.bg}`}>
      <div className="flex items-center gap-3.5">
        <div className={`size-16 rounded-full flex items-center justify-center font-display text-2xl ${cls.avatar}`} style={{ fontWeight: 400 }}>{f.initials}</div>
        <div>
          <p className="font-display text-[30px] leading-none tracking-[-0.015em]" style={{ fontWeight: 400 }}>{f.name}</p>
          <p className={`font-mono text-[10.5px] tracking-[0.14em] uppercase mt-1 ${cls.mute}`}>{f.role}</p>
        </div>
      </div>

      <p className={`text-sm leading-[1.5] ${cls.mute}`}>
        <strong className={f.dark ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'}>Best for:</strong> {f.bestFor}
      </p>

      <div className={`pt-4 border-t flex flex-col gap-2 ${cls.line}`}>
        <DetailRow label="Email" value={f.email} href={`mailto:${f.email}`} accent={cls.accent} mute={cls.mute} underline />
        <DetailRow label="Phone" value={f.phone} href={f.phoneHref} fontMono mute={cls.mute} valueColor={f.dark ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'} />
        <DetailRow label="Reply" value="Typically <4 hours, Mon–Fri" mute={cls.mute} />
      </div>

      <div className="mt-auto flex gap-2">
        <a
          href={`mailto:${f.email}`}
          className={`flex-1 text-center rounded-md px-4 py-3 text-[13px] font-semibold ${cls.cta}`}
        >
          Email {f.first} →
        </a>
        <a
          href={f.smsHref}
          className={`rounded-md border px-5 py-3 text-[13px] font-medium ${cls.textBtn}`}
        >
          Text
        </a>
      </div>
    </div>
  )
}

function DetailRow({ label, value, href, accent, mute, valueColor, fontMono, underline }: {
  label: string
  value: string
  href?: string
  accent?: string
  mute: string
  valueColor?: string
  fontMono?: boolean
  underline?: boolean
}) {
  const valueClass = `${fontMono ? 'font-mono' : ''} text-[14px] ${valueColor ?? accent ?? ''} ${underline ? 'underline underline-offset-[3px]' : ''}`
  return (
    <div className="flex items-baseline gap-3">
      <span className={`font-mono text-[10px] tracking-[0.12em] uppercase ${mute} min-w-[42px]`}>{label}</span>
      {href ? <a href={href} className={`font-medium ${valueClass}`}>{value}</a> : <span className={valueClass}>{value}</span>}
    </div>
  )
}

function Field({ id, label, placeholder, type = 'text', required }: { id: string; label: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold mb-1.5">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#0F3D2E]/15 bg-[#FAF7F2] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30"
      />
    </div>
  )
}
