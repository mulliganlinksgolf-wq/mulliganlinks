import styles from "./pricing.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/FadeIn";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  TYPICAL_ANNUAL_BARTER_LABEL,
  HIGH_VOLUME_ANNUAL_BARTER_LABEL,
  MONTHLY_PRICE_LABEL,
} from "@/lib/barter-math";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "No barter. No commissions. No hidden fees. Founding Partner courses get their first year free. Golfer memberships start at $0.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const supabase = await createClient();
  const [{ data: counter }, { data: contentRows }] = await Promise.all([
    supabase.from("founding_partner_counter").select("count, cap").single(),
    supabase
      .from("content_blocks")
      .select("key, value")
      .ilike("key", "pricing.%"),
  ]);

  const spotsRemaining = Math.max(
    0,
    (counter?.cap ?? 10) - (counter?.count ?? 0),
  );
  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [
      r.key,
      r.value,
    ]),
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <PricingHero c={c} />
        <CourseAndGolferPricing c={c} spotsRemaining={spotsRemaining} />
        <CompareAndFAQ />
        <FinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}

function PricingHero({ c }: { c: Record<string, string> }) {
  const headline = c["pricing.hero_headline"];
  return (
    <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-16">
      <FadeIn>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-px bg-[#E0A800]" />
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
                Pricing · for courses & golfers
              </span>
            </div>
            <h1
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
              style={{ fontSize: "clamp(56px, 8vw, 80px)", fontWeight: 400 }}
            >
              {headline ?? (
                <>
                  What would you rather{" "}
                  <em className="italic text-[#E0A800]">pay?</em>
                </>
              )}
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#1A1A1A]/78 max-w-lg">
              {c["pricing.hero_subhead"] ??
                "We're not the cheapest. We're the honest one. No barter, no commissions, no data extraction, and Founding Partner courses get the first year free."}
            </p>
          </div>

          {/* Comparison card */}
          <div className={styles.comparisonCard}>
            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonColumn}>
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold mb-3">
                  GolfNow&apos;s &ldquo;free&rdquo;
                </p>
                <p className={styles.comparisonValue}>
                  {TYPICAL_ANNUAL_BARTER_LABEL}
                  <span className="text-[#C24A3B]">.</span>
                </p>
                <p className="text-xs text-[#6B7770] mt-2 leading-snug">
                  Per year in barter tee times the typical daily-fee course
                  gives away ({HIGH_VOLUME_ANNUAL_BARTER_LABEL}+ for high-volume
                  courses). Plus commissions on every booking.
                </p>
                <ul className="mt-3.5">
                  {[
                    "Barter required",
                    "Commissions per booking",
                    "Your golfers, their database",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex gap-2 text-xs text-[#6B7770] py-0.5 items-baseline"
                    >
                      <span className="text-[#C24A3B] font-mono">×</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.comparisonColumn}>
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold mb-3">
                  TeeAhead
                </p>
                <p className={styles.comparisonValue}>
                  $0<span className="text-[#E0A800]">.</span>
                </p>
                <p className="text-xs text-[#6B7770] mt-2 leading-snug">
                  First year for the first 10 Founding Partner courses. $349/mo
                  flat after.
                </p>
                <ul className="mt-3.5">
                  {[
                    "No barter, ever",
                    "Zero commissions",
                    "Your data, exported anytime",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex gap-2 text-xs text-[#1A1A1A] py-0.5 items-baseline"
                    >
                      <span className="font-mono text-[11px] text-[#0F3D2E]">
                        —
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 px-4 py-3 bg-[#0F3D2E]/[0.06] rounded-md text-xs text-[#0F3D2E] leading-snug">
              <strong>Founding Partner Year 1:</strong> a typical{" "}
              {TYPICAL_ANNUAL_BARTER_LABEL} saved, then {MONTHLY_PRICE_LABEL}/mo
              flat. That&apos;s the deal.
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-6xl mx-auto pt-4 border-t border-[#0F3D2E]/10 font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770]">
          NGCOA &amp; Golf Inc. industry analysis, 2024. Actual barter terms
          vary. TeeAhead is not affiliated with GolfNow or NBC Sports Next.
        </p>
      </FadeIn>
    </section>
  );
}

function CourseAndGolferPricing({
  c,
  spotsRemaining,
}: {
  c: Record<string, string>;
  spotsRemaining: number;
}) {
  return (
    <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-16 space-y-16">
      <div className="max-w-6xl mx-auto">
        {/* Course pricing */}
        <FadeIn>
          <div className="space-y-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                {c["pricing.course_section_headline"] ??
                  "For golf course operators"}
              </span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770]">
                Founding Partner program
              </span>
            </div>

            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-stretch pt-4">
              <FoundingPartnerCard spotsRemaining={spotsRemaining} />
              <StandardCard />
            </div>

            <p className="text-sm text-[#6B7770] leading-relaxed max-w-3xl">
              {c["pricing.founding_note"] ??
                "The first 10 Founding Partner courses get TeeAhead free for their first year. Standard pricing is $349/month after that, still over 90% cheaper than a typical GolfNow barter contract."}
            </p>
          </div>
        </FadeIn>

        {/* Golfer pricing */}
        <FadeIn>
          <div className="space-y-6 mt-16">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                {c["pricing.golfer_section_headline"] ?? "For golfers"}
              </span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770]">
                3 tiers · no lock-in
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5 items-stretch pt-4">
              <GolferTierCard tier="fairway" />
              <GolferTierCard tier="eagle" hero />
              <GolferTierCard tier="ace" />
            </div>

            <p className="text-sm text-[#6B7770] leading-relaxed max-w-3xl">
              Play a season, earn a free round. Fairway Points never expire, and
              5,000 of them redeem for one complimentary round, about every 71
              rounds on Fairway, 48 as Eagle (1.5×), or 36 as Ace (2×). The
              membership pays for itself on the included complimentary round and
              birthday credit. Points are the long game on top.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function FoundingPartnerCard({ spotsRemaining }: { spotsRemaining: number }) {
  return (
    <div className="relative bg-[#0F3D2E] text-[#F4F1EA] rounded-2xl p-7 sm:p-8 shadow-[0_24px_56px_rgba(15,61,46,0.22)]">
      <div className="absolute -top-2.5 left-7 px-3 py-1 bg-[#E0A800] text-[#082419] rounded-full font-mono text-[10px] tracking-[0.1em] uppercase font-bold">
        Founding Partner · Most picked
      </div>
      <div className="grid md:grid-cols-2 gap-8 mt-1">
        <div>
          <p
            className="font-display text-[32px] text-[#E0A800] tracking-[-0.015em]"
            style={{ fontWeight: 400 }}
          >
            Founding Partner
          </p>
          <p className="text-[13px] text-[#F4F1EA]/65 mt-0.5">
            First 10 Metro Detroit courses
          </p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span
              className="font-display text-6xl leading-[0.88] tracking-[-0.025em]"
              style={{ fontWeight: 400 }}
            >
              $0
            </span>
            <span className="text-[13px] text-[#F4F1EA]/65">/ first year</span>
          </div>
          <p className="text-[11.5px] text-[#F4F1EA]/55 mt-1">
            $349/mo flat after year 1
          </p>
          <Link
            href="/waitlist/course"
            className="mt-5 block w-full text-center rounded-md bg-[#E0A800] text-[#082419] px-4 py-3 text-sm font-bold hover:bg-[#E0A800]/90"
          >
            {spotsRemaining > 0
              ? "Claim a founding spot →"
              : "Join the course waitlist"}
          </Link>
        </div>
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold mb-3">
            Everything included
          </p>
          <ul className="flex flex-col gap-2 text-[13px]">
            {[
              "Tee sheet, booking, QR check-in",
              "Loyalty engine + golfer app",
              "Stripe direct payouts",
              "0% commission, no barter",
              "Full data export, anytime",
              "Leagues, exchange, partners",
              "10% rev share on referrals",
              "Live in 48 hours",
            ].map((f) => (
              <li
                key={f}
                className="grid grid-cols-[14px_1fr] gap-2 text-[#F4F1EA]/88"
              >
                <span className="font-mono text-[11px] text-[#E0A800]">—</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StandardCard() {
  return (
    <div className="bg-white border border-[#0F3D2E]/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-4">
      <div>
        <p
          className="font-display text-2xl text-[#0F3D2E] tracking-[-0.01em]"
          style={{ fontWeight: 400 }}
        >
          Standard
        </p>
        <p className="text-[12.5px] text-[#6B7770] mt-0.5">
          Year 2 onward, or course #11+
        </p>
      </div>
      <div className="pb-4 border-b border-[#0F3D2E]/10 flex items-baseline gap-1.5">
        <span
          className="font-display text-5xl text-[#0F3D2E] leading-[0.88] tracking-[-0.02em]"
          style={{ fontWeight: 400 }}
        >
          $349
        </span>
        <span className="text-[12.5px] text-[#6B7770]">/ mo, flat</span>
      </div>
      <p className="flex-1 text-[12.5px] text-[#6B7770] leading-relaxed">
        Everything in Founding Partner. No annual commitment. 3+ course
        operators pay $279/mo per course.
      </p>
      <Link
        href="/contact"
        className="block text-center rounded-md border border-[#0F3D2E] text-[#0F3D2E] px-4 py-2.5 text-sm font-semibold hover:bg-[#0F3D2E]/5"
      >
        Talk to us →
      </Link>
    </div>
  );
}

const GOLFER_TIERS = {
  fairway: {
    name: "Fairway",
    sub: "Free, forever",
    price: "$0",
    unit: "",
    badge: null,
    feats: [
      "Book at partner courses",
      "1× Fairway Points",
      "Standard $1.49 booking fee",
      "Free 1hr cancellation",
      "In-round service",
    ],
    href: "/waitlist/golfer",
  },
  eagle: {
    name: "Eagle",
    sub: "For regulars",
    price: "$89",
    unit: "/yr",
    badge: "BEATS GOLFPASS+ BY $30",
    feats: [
      "250 bonus pts on signup",
      "1 comp round/yr",
      "Zero booking fees, always",
      "1.5× Fairway Points",
      "48hr priority booking",
      "1 guest pass · $10 birthday",
    ],
    href: "/waitlist/golfer?tier=eagle",
  },
  ace: {
    name: "Ace",
    sub: "All-in",
    price: "$159",
    unit: "/yr",
    badge: null,
    feats: [
      "500 bonus pts on signup",
      "2 comp rounds/yr",
      "Zero booking fees, always",
      "2× Fairway Points",
      "72hr priority booking",
      "2 guest passes · $20 birthday",
    ],
    href: "/waitlist/golfer?tier=ace",
  },
} as const;

function GolferTierCard({
  tier,
  hero,
}: {
  tier: keyof typeof GOLFER_TIERS;
  hero?: boolean;
}) {
  const t = GOLFER_TIERS[tier];
  return (
    <div
      className={`relative rounded-xl p-6 flex flex-col gap-4 ${
        hero
          ? "bg-[#0F3D2E] text-[#F4F1EA] -translate-y-1 shadow-[0_24px_56px_rgba(15,61,46,0.2)]"
          : "bg-white border border-[#0F3D2E]/10 text-[#1A1A1A]"
      }`}
    >
      {t.badge && (
        <div className="absolute -top-2.5 left-5 px-2.5 py-1 bg-[#E0A800] text-[#082419] rounded-full font-mono text-[9.5px] tracking-[0.08em] font-bold">
          {t.badge}
        </div>
      )}
      <div>
        <p
          className={`font-display text-[26px] tracking-[-0.01em] ${hero ? "text-[#E0A800]" : "text-[#0F3D2E]"}`}
          style={{ fontWeight: 400 }}
        >
          {t.name}
        </p>
        <p
          className={`text-[12.5px] mt-0.5 ${hero ? "text-[#F4F1EA]/65" : "text-[#9DAA9F]"}`}
        >
          {t.sub}
        </p>
      </div>
      <div
        className={`pb-3 border-b flex items-baseline gap-1 ${hero ? "border-[#F4F1EA]/15" : "border-[#0F3D2E]/10"}`}
      >
        <span
          className="font-display text-[44px] leading-[0.9] tracking-[-0.02em]"
          style={{ fontWeight: 400 }}
        >
          {t.price}
        </span>
        {t.unit && (
          <span
            className={`text-[13px] ${hero ? "text-[#F4F1EA]/65" : "text-[#6B7770]"}`}
          >
            {t.unit}
          </span>
        )}
      </div>
      <ul className="flex-1 flex flex-col gap-1.5 text-[12.5px]">
        {t.feats.map((f) => (
          <li
            key={f}
            className={`grid grid-cols-[14px_1fr] gap-2 ${hero ? "text-[#F4F1EA]/88" : "text-[#1A1A1A]/80"}`}
          >
            <span
              className={`font-mono text-[11px] ${hero ? "text-[#E0A800]" : "text-[#0F3D2E]"}`}
            >
              —
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={t.href}
        className={`block text-center rounded-md px-4 py-2.5 text-sm font-semibold ${
          hero
            ? "bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90"
            : "border border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
        }`}
      >
        Join the waitlist →
      </Link>
    </div>
  );
}

const COMPARE_ROWS = [
  { l: "Annual price", g: "$119", t: "$89" },
  { l: "Booking fees per round", g: "$2.49–$3.49", t: "Zero, always" },
  { l: "Credit expiration", g: "Resets monthly", t: "Never expires" },
  { l: "Works at", g: "National chains", t: "Local Metro Detroit partners" },
  { l: "Loyalty earn rate", g: "1× (no upgrade)", t: "1× / 1.5× / 2× by tier" },
  { l: "Find a playing partner", g: "—", t: "Eagle + Ace included" },
  { l: "Tee time exchange", g: "—", t: "Included" },
];

const FAQS = [
  {
    q: "What happens after my Founding Partner year ends?",
    a: "You stay at $349/mo, flat. No annual commitment, cancel anytime.",
  },
  {
    q: "Why isn't there a free tier for golfers? There is.",
    a: "Fairway tier is free forever. Eagle ($89) pays for itself on the included complimentary round and the $10 birthday credit alone. Faster points, priority booking, and the guest pass are upside. Ace ($159) clears its price on two complimentary rounds plus the $20 birthday credit.",
  },
  {
    q: "Do you actually pay rev share?",
    a: "Yes. Stripe Connect auto-pays 10% of every membership you refer, monthly, for 12 months.",
  },
  {
    q: "Can I export everything?",
    a: "Always. Full CSV export from the Members page. Your data is yours.",
  },
];

function CompareAndFAQ() {
  return (
    <section className="bg-[#F4F1EA] px-6 sm:px-10 lg:px-16 py-16">
      <FadeIn>
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              Eagle vs. GolfPass+
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
          </div>
          <h2
            className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-none max-w-3xl"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 400 }}
          >
            $30 cheaper. <em className="italic text-[#E0A800]">And</em> it
            actually fits your weekend.
          </h2>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
            {/* Comparison table */}
            <div className="bg-white border border-[#0F3D2E]/10 rounded-xl overflow-hidden">
              <div data-comparison-heading className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-4 sm:px-5 py-3.5 bg-[#0F3D2E]/[0.06]">
                <span />
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold">
                  GolfPass+
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#E0A800] font-bold">
                  Eagle ($89/yr)
                </span>
              </div>
              {COMPARE_ROWS.map((r, i) => (
                <div
                  key={r.l}
                  className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-4 sm:px-5 py-3.5 border-t border-[#0F3D2E]/10 items-center ${i % 2 ? "bg-[#FAF7F2]" : ""}`}
                >
                  <span className="text-[13.5px] font-medium text-[#1A1A1A]">
                    {r.l}
                  </span>
                  <span className="text-[13px] text-[#6B7770]">{r.g}</span>
                  <span className="text-[13px] text-[#0F3D2E] font-semibold">
                    {r.t}
                  </span>
                </div>
              ))}
              <p className="px-5 py-3 border-t border-[#0F3D2E]/10 text-[11px] text-[#9DAA9F] leading-relaxed">
                GolfPass+ pricing and features as of May 2026, subject to
                change. TeeAhead is not affiliated with or endorsed by NBC
                Sports Next.
              </p>
            </div>

            {/* FAQ */}
            <div className="space-y-2.5">
              <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold">
                Common questions
              </p>
              {FAQS.map((f, i) => (
                <details
                  key={f.q}
                  className="group bg-white border border-[#0F3D2E]/10 rounded-lg px-4 py-3"
                  open={i === 0}
                >
                  <summary className="flex justify-between items-baseline cursor-pointer list-none">
                    <span className="text-[13.5px] font-medium text-[#1A1A1A] leading-snug pr-3">
                      {f.q}
                    </span>
                    <span className="text-[#6B7770] group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="text-[12.5px] text-[#6B7770] mt-2 leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-white px-6 py-16 text-center border-t border-[#0F3D2E]/10">
      <FadeIn>
        <div className="max-w-2xl mx-auto space-y-5">
          <h2
            className="font-display text-[#0F3D2E] leading-tight tracking-[-0.02em]"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400 }}
          >
            Ready to stop paying GolfNow?
          </h2>
          <p className="text-[#6B7770]">
            First year is free for Founding Partners. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
            >
              Claim a founding spot →
            </Link>
            <Link
              href="/damage"
              className="inline-flex items-center justify-center rounded-md border border-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
            >
              Run my damage report
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
