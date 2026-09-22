import { CourseSeasonalFeatures } from '@/components/marketing/CourseSeasonalFeatures'
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, MapPin, Plus } from "lucide-react";
import { captureReferralCode } from "@/lib/referrals/capture";
import { ImpersonateRedirect } from "@/components/ImpersonateRedirect";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import s from "@/components/marketing/marketing.module.css";
export const metadata: Metadata = {
  title: { absolute: "TeeAhead | A better way to play local golf" },
  description:
    "Golf booking and rewards for Metro Detroit golfers. Tee sheet software without barter for courses. Join the TeeAhead waitlist or explore becoming a founding course.",
  alternates: { canonical: "https://www.teeahead.com" },
};
const questions = [
  [
    "Can I book a tee time yet?",
    "Not yet. We’re building our Metro Detroit course network. Join the waitlist and we’ll email you when participating courses and launch timing are confirmed.",
  ],
  [
    "Does joining cost anything?",
    "The waitlist is free, with no payment details required. At launch, Fairway is our free membership with a standard $1.49 booking fee. Optional paid memberships offer additional benefits.",
  ],
  [
    "Which courses will be available?",
    "We’ll announce participating courses as they’re confirmed. After joining, you can tell us where you play to help shape the network.",
  ],
  [
    "I operate a course. Where do I start?",
    "Visit For courses to explore the software and Founding Partner program. You can register your interest or book a conversation with our founder.",
  ],
];
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  await captureReferralCode(params.ref ?? null);
  return (
    <div className={s.site}>
      <ImpersonateRedirect />
      <MarketingHeader />
      <main id="main-content">
        <section className={s.hero}>
          <div className={s.heroPhoto}>
            <Image
              src="/images/golf-morning.webp"
              alt="Morning light across a tree-lined golf green"
              fill
              sizes="100vw"
              preload
            />
          </div>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>
              <span className={s.statusDot} /> LOCAL GOLF. LOOKING FORWARD.
            </p>
            <h1>
              Your next round.
              <br />
              <span className={s.heroLastLine}>
                More rewarding<span className={s.period}>.</span>
              </span>
            </h1>
            <p className={s.heroDescription}>
              Book local tee times. Earn rewards when you play.
              <br />A new way to golf is coming to Metro Detroit.
            </p>
            <Link className={s.primary} href="/waitlist/golfer">
              Join the free waitlist <ArrowUpRight size={20} />
            </Link>
            <p className={s.micro}>
              We’ll let you know when it’s time to tee off.
            </p>
          </div>
          <div className={s.heroLocation}>
            <MapPin size={14} />
            <span>METRO DETROIT, MICHIGAN</span>
            <span className={s.launchLabel}>COMING SOON</span>
          </div>
        </section>
        <nav
          className={s.audienceRail}
          aria-label="Find your TeeAhead experience"
        >
          <Link href="#golfers">
            <span className={s.audienceLabel}>I’M HERE TO PLAY</span>
            <span className={s.audienceTitle}>
              More from every round.
              <ArrowUpRight size={23} />
            </span>
            <span className={s.audienceDescription}>
              Tee times, local courses, and Fairway Points.
            </span>
          </Link>
          <Link href="/for-courses">
            <span className={s.audienceLabel}>I RUN A GOLF COURSE</span>
            <span className={s.audienceTitle}>
              A better day starts here.
              <ArrowUpRight size={23} />
            </span>
            <span className={s.audienceDescription}>
              Your tee sheet. Your customers. No barter.
            </span>
          </Link>
        </nav>
        <section id="golfers" className={s.golfers}>
          <div className={s.sectionHeading}>
            <p className={s.eyebrow}>FOR GOLFERS</p>
            <h2>
              Make room
              <br />
              for <em>more golf.</em>
            </h2>
            <p>
              The early start. The usual foursome. That one shot that brings you
              back. We’re building a simpler way to get out there.
            </p>
          </div>
          <div className={s.benefits}>
            {[
              [
                "01",
                "Find your next tee time.",
                "Explore participating local courses and find a round that fits your day.",
              ],
              [
                "02",
                "Make your rounds count.",
                "Earn Fairway Points on your golf spending at participating courses.",
              ],
              [
                "03",
                "Start with a free membership.",
                "Join with Fairway. Explore optional upgrades when you know what fits your game.",
              ],
            ].map(([n, title, body]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <ArrowUpRight size={20} />
              </article>
            ))}
            <Link className={s.textLink} href="/waitlist/golfer">
              Put me on the list <ArrowRight size={17} />
            </Link>
            <div className="mt-5">
              <Link className={s.textLink} href="/features">
                Explore all TeeAhead features <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <section className={s.courseSection}>
          <div className={s.courseCopy}>
            <p className={s.eyebrow}>FOR COURSE OPERATORS</p>
            <h2>
              Your course.
              <br />
              Your customers.
              <br />
              <em>Your call.</em>
            </h2>
            <p>
              A better day for golfers starts with a better day for you. Bring
              your tee sheet, bookings, and golfer relationships together—with
              no barter or commissions.
            </p>
            <Link className={s.lightButton} href="/for-courses">
              Meet your next tee sheet <ArrowUpRight size={19} />
            </Link>
            <span className={s.courseNote}>
              Now welcoming founding course partners.
            </span>
          </div>
          <div className={s.productFrame}>
            <div className={s.productBar}>
              <span className={s.windowDots}>● ● ●</span>
              <span>TEEAHEAD / COURSE DASHBOARD</span>
            </div>
            <Image
              src="/screenshots/dashboard.png"
              alt="TeeAhead dashboard preview showing revenue, bookings, and member activity with sample data"
              width={924}
              height={540}
              sizes="(max-width:760px) 100vw, 55vw"
            />
            <div className={s.productCaption}>
              <span>One view. A clearer day.</span>
              <small>Product preview · Sample data</small>
            </div>
          </div>
        </section>
        <CourseSeasonalFeatures />
        <section className={s.founder}>
          <p className={s.eyebrow}>LOCAL ROOTS. A BIGGER IDEA.</p>
          <h2>
            A stronger local golf community
            <br />
            starts <em>right here.</em>
          </h2>
          <p>
            We’re starting in Metro Detroit, connecting the people who love to
            play with the people who keep local golf going. Help us build a
            network you’ll want to be part of.
          </p>
          <Link className={s.textLink} href="/about">
            Get to know TeeAhead <ArrowUpRight size={17} />
          </Link>
        </section>
        <section className={s.faq}>
          <div>
            <p className={s.eyebrow}>GOOD TO KNOW</p>
            <h2>
              A few good
              <br />
              <em>questions.</em>
            </h2>
          </div>
          <div>
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.finalCta}>
          <div>
            <p className={s.eyebrow}>GET IN EARLY</p>
            <h2>
              Be part of
              <br />
              <em>the first round.</em>
            </h2>
          </div>
          <div>
            <p>Get launch updates and help shape where TeeAhead goes next.</p>
            <Link className={s.primary} href="/waitlist/golfer">
              Join the free waitlist <ArrowUpRight size={19} />
            </Link>
            <Link className={s.textLink} href="/waitlist/course">
              Bring your course along <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
