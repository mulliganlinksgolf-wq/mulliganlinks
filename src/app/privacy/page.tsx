import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'MulliganLinks Privacy Policy — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 border-b border-black/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="MulliganLinks" width={566} height={496} className="h-16 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Privacy Policy</h1>
        <p className="text-[#6B7770] mb-12">Last updated: April 2026</p>

        <div className="space-y-10 text-[#1A1A1A]">

          <section>
            <h2 className="text-xl font-bold mb-3">1. What We Collect</h2>
            <p className="text-[#6B7770] leading-relaxed mb-3">We collect the following information:</p>
            <ul className="text-[#6B7770] space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span><strong className="text-[#1A1A1A]">Account data:</strong> email address, full name, phone number</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span><strong className="text-[#1A1A1A]">Booking data:</strong> tee time bookings, courses played, number of players</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span><strong className="text-[#1A1A1A]">Payment data:</strong> processed securely by Stripe — we do not store card numbers</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span><strong className="text-[#1A1A1A]">Usage data:</strong> pages visited, features used, session duration</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
            <ul className="text-[#6B7770] space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span>Operate your account and process bookings</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span>Calculate and award Fairway Points</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span>Send transactional emails (booking confirmations, receipts, cancellations)</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span>Send occasional platform updates and membership communications (you can unsubscribe)</span></li>
              <li className="flex gap-2"><span className="text-[#1B4332] font-bold mt-0.5">•</span><span>Provide anonymized booking analytics to partner courses about their own members</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. What We Do NOT Do</h2>
            <ul className="text-[#6B7770] space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#B00020] font-bold mt-0.5">✕</span><span>We do not sell your personal data to third parties</span></li>
              <li className="flex gap-2"><span className="text-[#B00020] font-bold mt-0.5">✕</span><span>We do not share your booking data with competing courses</span></li>
              <li className="flex gap-2"><span className="text-[#B00020] font-bold mt-0.5">✕</span><span>We do not use your data to market competitor products to you</span></li>
              <li className="flex gap-2"><span className="text-[#B00020] font-bold mt-0.5">✕</span><span>We do not store payment card numbers — Stripe handles all payment data</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Sharing</h2>
            <p className="text-[#6B7770] leading-relaxed">
              We share your data only with: (a) the partner course where you make a booking, so
              they can prepare for your visit; (b) Stripe, for payment processing; (c) Resend,
              for transactional email delivery; (d) Vercel, for platform hosting and analytics.
              All third-party providers are contractually bound to use your data only to provide
              services to MulliganLinks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data Retention</h2>
            <p className="text-[#6B7770] leading-relaxed">
              We retain your account data for as long as your account is active. If you delete
              your account, we remove your personal data within 30 days, except where retention
              is required by law (e.g., financial records for 7 years). Anonymized booking
              statistics may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
            <p className="text-[#6B7770] leading-relaxed">
              You have the right to access, correct, or delete your personal data at any time.
              Email{' '}
              <a href="mailto:support@mulliganlinks.com" className="text-[#1B4332] underline">
                support@mulliganlinks.com
              </a>{' '}
              to make a data request. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Cookies</h2>
            <p className="text-[#6B7770] leading-relaxed">
              We use session cookies required for authentication (managed by Supabase) and
              analytics cookies (Vercel Analytics — anonymized, no cross-site tracking). We do
              not use advertising cookies or third-party tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Security</h2>
            <p className="text-[#6B7770] leading-relaxed">
              All data is transmitted over HTTPS. Passwords are never stored in plain text.
              Access to production data is restricted to authorized team members. We use
              row-level security on our database to ensure users can only access their own data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Contact</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Privacy questions or data requests:{' '}
              <a href="mailto:support@mulliganlinks.com" className="text-[#1B4332] underline">
                support@mulliganlinks.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-black/5 px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-[#6B7770]">
          <span>© 2026 MulliganLinks</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
