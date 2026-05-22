import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'TeeAhead Privacy Policy — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto" />
          </Link>
          <Link
            href="/waitlist/course"
            className="rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
          >
            Claim a spot →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 sm:py-20">
        <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
          Last updated · May 21, 2026
        </p>
        <h1
          className="font-display tracking-[-0.025em] leading-none text-[#0F3D2E] mt-3"
          style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 400 }}
        >
          Privacy Policy
        </h1>

        <div className="mt-14 space-y-12">
          <Section n="1" title="What We Collect">
            <p className="text-[#1A1A1A]/85 leading-[1.7] mb-3">We collect the following information:</p>
            <DashList items={[
              <><strong className="text-[#0F3D2E]">Account data:</strong> email address, full name, phone number</>,
              <><strong className="text-[#0F3D2E]">Booking data:</strong> tee time bookings, courses played, number of players</>,
              <><strong className="text-[#0F3D2E]">Payment data:</strong> processed securely by Stripe — we do not store card numbers</>,
              <><strong className="text-[#0F3D2E]">Profile data:</strong> optional partner-matching preferences (handicap, pace of play, play style, gender, bio) and profile photo</>,
              <><strong className="text-[#0F3D2E]">Service request data:</strong> in-round request type and optional note submitted to course staff</>,
              <><strong className="text-[#0F3D2E]">Usage data:</strong> pages visited, features used, session duration (including session recordings via LogRocket)</>,
            ]} />
          </Section>

          <Section n="2" title="How We Use Your Information">
            <DashList items={[
              'Operate your account and process bookings',
              'Calculate and award Fairway Points',
              'Send transactional emails (booking confirmations, receipts, cancellations)',
              'Send occasional platform updates and membership communications (you can unsubscribe)',
              'Provide anonymized booking analytics to partner courses about their own members',
            ]} />
          </Section>

          <Section n="3" title="What We Do NOT Do">
            <NegList items={[
              'We do not sell your personal data to third parties',
              'We do not share your booking data with competing courses',
              'We do not use your data to market competitor products to you',
              'We do not store payment card numbers — Stripe handles all payment data',
            ]} />
          </Section>

          <Section n="4" title="Data Sharing">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              We share your data only with: (a) the partner course where you make a booking, so
              they can prepare for your visit; (b) Supabase, for database hosting and
              authentication; (c) Stripe, for payment processing; (d) Resend, for transactional
              email delivery; (e) Vercel, for platform hosting and analytics; (f) LogRocket, for
              session recording and error monitoring (records user interactions to help us diagnose
              bugs — sensitive fields are masked).
              All third-party providers are contractually bound to use your data only to provide
              services to TeeAhead.
            </p>
          </Section>

          <Section n="5" title="Data Retention">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              We retain your account data for as long as your account is active. If you delete
              your account, we remove your personal data within 30 days, except where retention
              is required by law (e.g., financial records for 7 years). Anonymized booking
              statistics may be retained indefinitely.
            </p>
          </Section>

          <Section n="6" title="Your Rights">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              You have the right to access, correct, or delete your personal data at any time.
              Email{' '}
              <a href="mailto:hello@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                hello@teeahead.com
              </a>{' '}
              to make a data request. We will respond within 30 days.
            </p>
          </Section>

          <Section n="7" title="Cookies">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              We use session cookies required for authentication (managed by Supabase),
              analytics cookies (Vercel Analytics — anonymized, no cross-site tracking), and a
              referral attribution cookie (<strong className="text-[#0F3D2E]">ta_ref</strong> — set when you arrive via a
              course referral link, expires after 30 days, used only to credit the referring
              course). We do not use advertising cookies or third-party tracking pixels.
            </p>
          </Section>

          <Section n="8" title="Security">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              All data is transmitted over HTTPS. Passwords are never stored in plain text.
              Access to production data is restricted to authorized team members. We use
              row-level security on our database to ensure users can only access their own data.
            </p>
          </Section>

          <Section n="9" title="Contact">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Privacy questions or data requests:{' '}
              <a href="mailto:hello@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                hello@teeahead.com
              </a>
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        className="font-display text-[#0F3D2E] tracking-[-0.015em] mb-4"
        style={{ fontSize: 26, fontWeight: 400 }}
      >
        <span className="font-mono text-xs tracking-[0.16em] text-[#6B7770] mr-3 align-middle">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function DashList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[18px_1fr] gap-3 items-baseline">
          <span className="font-mono text-[11px] text-[#0F3D2E] leading-[1.7]" aria-hidden>—</span>
          <span className="text-[#1A1A1A]/85 leading-[1.7]">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function NegList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[18px_1fr] gap-3 items-baseline">
          <span className="font-mono text-[11px] text-[#C24A3B] leading-[1.7]" aria-hidden>×</span>
          <span className="text-[#1A1A1A]/85 leading-[1.7]">{item}</span>
        </li>
      ))}
    </ul>
  )
}
