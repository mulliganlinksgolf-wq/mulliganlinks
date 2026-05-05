import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'TeeAhead Terms of Service — the rules of the road for using our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 border-b border-black/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Terms of Service</h1>
        <p className="text-[#6B7770] mb-12">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-10 text-[#1A1A1A]">

          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#6B7770] leading-relaxed">
              By creating a TeeAhead account or using any part of our platform, you agree to
              these Terms of Service. If you do not agree, do not use the platform. These terms
              apply to all users — golfers, course operators, and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. The Service</h2>
            <p className="text-[#6B7770] leading-relaxed">
              TeeAhead provides a golf membership platform that connects golfers with partner
              courses. We offer tee time booking, a loyalty points program (Fairway Points), paid
              membership tiers (Eagle and Ace), a member tee time trading marketplace, golf league
              management, playing partner matching (Eagle and Ace members), and in-round service
              requests. Course management tools are provided to partner courses under separate
              pricing terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Accounts</h2>
            <p className="text-[#6B7770] leading-relaxed">
              You must be 18 or older to create an account. You are responsible for keeping your
              login credentials secure and for all activity that occurs under your account. Notify
              us immediately at{' '}
              <a href="mailto:hello@teeahead.com" className="text-[#1B4332] underline">
                hello@teeahead.com
              </a>{' '}
              if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Memberships and Billing</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Paid memberships (Eagle and Ace) are billed annually or monthly as selected at
              signup. Credits and benefits are applied to your account upon successful payment.
              Credits do not roll over between billing periods. Memberships renew automatically
              unless cancelled before the renewal date. You may cancel at any time; access
              continues through the end of your paid period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Fairway Points</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Fairway Points are earned on bookings made through the TeeAhead platform. Earning
              rates vary by membership tier: Fairway members earn 1×, Eagle members earn 1.5×,
              and Ace members earn 2× points per dollar spent. Points have no cash value and
              cannot be transferred to another account. TeeAhead reserves the right to modify the
              points program with 30 days&apos; notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Bookings and Cancellations</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Tee time availability is managed by partner courses and is not guaranteed by
              TeeAhead. Cancellations must be made at least 1 hour before the scheduled tee
              time to receive a full refund. Late cancellations and no-shows are subject to the
              individual course's policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Course Operators</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Founding Partner courses receive complimentary access for 12 months; standard
              monthly subscription pricing applies thereafter. All courses agree to honor TeeAhead
              member benefits (zero booking fees, points accrual, member discounts) for all
              bookings made through the platform. Courses own all booking data generated on their
              property. TeeAhead does not sell or share course customer data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Tee Time Trading</h2>
            <p className="text-[#6B7770] leading-relaxed">
              TeeAhead members may list upcoming tee times they cannot use for other members to
              claim. When a listing is claimed, the original holder receives platform credit and
              the claiming member assumes the booking. TeeAhead platform credits issued through
              trading have no cash value, are non-transferable, and expire 12 months from
              issuance. TeeAhead does not guarantee that listed tee times will be claimed, nor
              that claimed tee times will be honored in the event of course changes or closures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. In-Round Service Requests</h2>
            <p className="text-[#6B7770] leading-relaxed">
              During an active round, members may submit service requests to course staff through
              the TeeAhead platform. This feature is subject to each partner course enabling it.
              TeeAhead transmits your request to the course and is not responsible for the
              course&apos;s response time, fulfillment, or any charges the course may apply for
              services rendered.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Prohibited Conduct</h2>
            <p className="text-[#6B7770] leading-relaxed">
              You agree not to: (a) use the platform for any unlawful purpose; (b) create fake
              accounts or falsify booking records; (c) attempt to reverse-engineer or interfere
              with platform functionality; (d) resell or transfer membership benefits without
              authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Limitation of Liability</h2>
            <p className="text-[#6B7770] leading-relaxed">
              TeeAhead is not liable for any indirect, incidental, or consequential damages
              arising from use of the platform, including but not limited to missed tee times,
              course closures, or errors in booking confirmation. Our total liability to you for
              any claim shall not exceed the amount you paid us in the 12 months preceding the
              claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">12. Changes to These Terms</h2>
            <p className="text-[#6B7770] leading-relaxed">
              We may update these terms periodically. We will notify you by email at least 14 days
              before material changes take effect. Continued use of the platform after that date
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">13. Contact</h2>
            <p className="text-[#6B7770] leading-relaxed">
              Questions about these terms?{' '}
              <a href="mailto:hello@teeahead.com" className="text-[#1B4332] underline">
                hello@teeahead.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-black/5 px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-[#6B7770]">
          <span className="text-[#1B4332] font-semibold">© 2026 TeeAhead</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
