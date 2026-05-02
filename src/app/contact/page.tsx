import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { submitCourseInquiry } from '@/app/actions/contact'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Bring TeeAhead to Your Course',
  description: 'Free tee sheet software for Metro Detroit golf courses. Zero barter tee times, zero commissions — go live in 48 hours.',
  alternates: { canonical: '/contact' },
  openGraph: {
    url: '/contact',
    title: 'Bring TeeAhead to Your Course',
    description: 'Free tee sheet software for Metro Detroit golf courses. Zero barter tee times, zero commissions — go live in 48 hours.',
  },
}

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
      <header className="bg-[#FAF7F2]/95 border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
          >
            For Golfers
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 bg-[#1B4332] text-[#FAF7F2]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
            <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
            <span className="text-sm font-medium">{c['contact.hero_badge'] ?? 'Free for courses — always'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            {c['contact.hero_headline'] ?? 'Your tee sheet. Your customers. Your revenue.'}
          </h1>
          <p className="text-lg text-[#FAF7F2]/80 max-w-2xl mx-auto leading-relaxed">
            {c['contact.hero_subhead'] ?? 'TeeAhead gives your course a complete management platform at zero cost. No barter tee times. No commissions. No data extraction. The software works for you — not against you.'}
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-10 text-center">Everything a course needs. Nothing it doesn&apos;t.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Live tee sheet', body: 'Cloud-based, any device, real-time. Replace legacy systems in 48 hours.' },
              { icon: '🌐', title: 'Online booking engine', body: 'White-label embed on your own website. Golfers book direct. You keep the relationship.' },
              { icon: '⭐', title: 'Loyalty engine', body: 'Fairway Points auto-awarded every round. Members come back to earn — not to price-hunt.' },
              { icon: '📊', title: 'Analytics dashboard', body: 'Utilization rates, revenue trends, member LTV. Data you actually own.' },
              { icon: '🔔', title: 'Waitlist & auto-fill', body: 'Cancellations auto-filled via SMS and email. Save staff time. Recover lost revenue.' },
              { icon: '💳', title: 'Integrated payments', body: 'Stripe and Square — online and in-person. No middleman on the transaction.' },
            ].map((f) => (
              <div key={f.title} className="bg-[#FAF7F2] rounded-xl p-6 space-y-2">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="font-bold text-[#1A1A1A]">{f.title}</h3>
                <p className="text-sm text-[#6B7770] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The math */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">What GolfNow actually costs you</h2>
          <p className="text-[#6B7770] leading-relaxed">
            Studies of ~400 courses put the average barter cost at{' '}
            <strong className="text-[#1A1A1A]">$37,000–$150K+ per year</strong> in surrendered tee time revenue —
            and one operator documented that{' '}
            <strong className="text-[#1A1A1A]">39.6% of all rounds</strong> over three years were zero-revenue barter.
            Windsor Parke Golf Club saw a <strong className="text-[#1A1A1A]">382% increase in online revenue</strong> after switching
            ($81K → $393K). Missouri Bluffs saw a 36.3% green fee revenue increase.
          </p>
          <div className="bg-[#1B4332] text-[#FAF7F2] rounded-xl p-8 text-center">
            <p className="text-4xl font-bold">$0</p>
            <p className="text-[#FAF7F2]/80 mt-2">What TeeAhead costs your course. Forever.</p>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Get in touch</h2>
            <p className="text-[#6B7770]">
              We&apos;ll get back to you within one business day. Onboarding takes 48 hours.
              No contract, no commitment.
            </p>
          </div>

          <form action={submitCourseInquiry} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-[#1A1A1A]">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Neil Barris"
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@yourcourse.com"
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="course" className="text-sm font-medium text-[#1A1A1A]">Course name</label>
              <input
                id="course"
                name="course"
                type="text"
                required
                placeholder="Pebble Hills Golf Club"
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="software" className="text-sm font-medium text-[#1A1A1A]">Current tee sheet software</label>
              <select
                id="software"
                name="software"
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              >
                <option value="">Select one</option>
                <option value="golfnow">GolfNow / EZLinks</option>
                <option value="lightspeed">Lightspeed Golf</option>
                <option value="foreup">foreUP</option>
                <option value="jonas">Jonas Club Software</option>
                <option value="other">Other</option>
                <option value="none">None / paper</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium text-[#1A1A1A]">Anything else?</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                placeholder="Tell us about your course, your biggest pain points, or anything you'd like us to know."
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1B4332] py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Send inquiry
            </button>

            <p className="text-xs text-[#6B7770] text-center">
              No spam. No sales pressure. We&apos;ll reach out to schedule a quick call.
            </p>
          </form>
        </div>
      </section>

      <footer className="bg-[#FAF7F2] border-t border-black/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <TeeAheadLogo className="h-14 w-auto" />
          <nav className="flex items-center gap-5 text-sm text-[#6B7770]">
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
          </nav>
          <p className="text-xs text-[#6B7770]">© 2026 TeeAhead</p>
        </div>
      </footer>
    </div>
  )
}
