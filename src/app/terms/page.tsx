import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'TeeAhead Terms of Service: the rules of the road for using our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 sm:py-20">
        <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
          Last updated · May 21, 2026
        </p>
        <h1
          className="font-display tracking-[-0.025em] leading-none text-[#0F3D2E] mt-3"
          style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 400 }}
        >
          Terms of Service
        </h1>

        <div className="mt-14 space-y-12">
          <Section n="1" title="Acceptance of Terms">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              By creating a TeeAhead account or using any part of our platform, you agree to
              these Terms of Service. If you do not agree, do not use the platform. These terms
              apply to all users, golfers, course operators, and visitors.
            </p>
          </Section>

          <Section n="2" title="The Service">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              TeeAhead provides a golf membership platform that connects golfers with partner
              courses. We offer tee time booking, a loyalty points program (Fairway Points), paid
              membership tiers (Eagle and Ace), a member tee time trading marketplace, golf league
              management, playing partner matching (Eagle and Ace members), and in-round service
              requests. Course management tools are provided to partner courses under separate
              pricing terms.
            </p>
          </Section>

          <Section n="3" title="Accounts">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              You must be 18 or older to create an account. You are responsible for keeping your
              login credentials secure and for all activity that occurs under your account. Notify
              us immediately at{' '}
              <a href="mailto:hello@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                hello@teeahead.com
              </a>{' '}
              if you suspect unauthorized access.
            </p>
          </Section>

          <Section n="4" title="Memberships and Billing">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Paid memberships (Eagle and Ace) are billed annually or monthly as selected at
              signup. Credits and benefits are applied to your account upon successful payment.
              Credits do not roll over between billing periods. Memberships renew automatically
              unless cancelled before the renewal date. You may cancel at any time; access
              continues through the end of your paid period.
            </p>
          </Section>

          <Section n="5" title="Fairway Points">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Fairway Points are earned on bookings made through the TeeAhead platform. Earning
              rates vary by membership tier: Fairway members earn 1×, Eagle members earn 1.5×,
              and Ace members earn 2× points per dollar spent. Points have no cash value and
              cannot be transferred to another account. TeeAhead reserves the right to modify the
              points program with 30 days&apos; notice.
            </p>
          </Section>

          <Section n="6" title="Bookings and Cancellations">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Tee time availability is managed by partner courses and is not guaranteed by
              TeeAhead. Cancellations must be made at least 1 hour before the scheduled tee
              time to receive a full refund. Late cancellations and no-shows are subject to the
              individual course&apos;s policies.
            </p>
          </Section>

          <Section n="7" title="Course Operators">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Founding Partner courses receive complimentary access for 12 months; standard
              monthly subscription pricing applies thereafter. All courses agree to honor TeeAhead
              member benefits (zero booking fees, points accrual, member discounts) for all
              bookings made through the platform. Courses own all booking data generated on their
              property. TeeAhead does not sell or share course customer data with third parties.
            </p>
          </Section>

          <Section n="8" title="Tee Time Trading">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              TeeAhead members may list upcoming tee times they cannot use for other members to
              claim. When a listing is claimed, the original holder receives platform credit and
              the claiming member assumes the booking. TeeAhead platform credits issued through
              trading have no cash value, are non-transferable, and expire 12 months from
              issuance. TeeAhead does not guarantee that listed tee times will be claimed, nor
              that claimed tee times will be honored in the event of course changes or closures.
            </p>
          </Section>

          <Section n="9" title="In-Round Service Requests">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              During an active round, members may submit service requests to course staff through
              the TeeAhead platform. This feature is subject to each partner course enabling it.
              TeeAhead transmits your request to the course and is not responsible for the
              course&apos;s response time, fulfillment, or any charges the course may apply for
              services rendered.
            </p>
          </Section>

          <Section n="10" title="Prohibited Conduct">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              You agree not to: (a) use the platform for any unlawful purpose; (b) create fake
              accounts or falsify booking records; (c) attempt to reverse-engineer or interfere
              with platform functionality; (d) resell or transfer membership benefits without
              authorization.
            </p>
          </Section>

          <Section n="11" title="Limitation of Liability">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              TeeAhead is not liable for any indirect, incidental, or consequential damages
              arising from use of the platform, including but not limited to missed tee times,
              course closures, or errors in booking confirmation. Our total liability to you for
              any claim shall not exceed the amount you paid us in the 12 months preceding the
              claim.
            </p>
          </Section>

          <Section n="12" title="Changes to These Terms">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              We may update these terms periodically. We will notify you by email at least 14 days
              before material changes take effect. Continued use of the platform after that date
              constitutes acceptance of the updated terms.
            </p>
          </Section>

          <Section n="13" title="Contact">
            <p className="text-[#1A1A1A]/85 leading-[1.7]">
              Questions about these terms?{' '}
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
