import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import s from "@/components/marketing/marketing.module.css";
export const metadata: Metadata = {
  title: { absolute: "Golf course software, on your terms | TeeAhead" },
  description:
    "Explore TeeAhead tee sheet software, bookings and golfer relationships. No barter or commissions. Meet the founder and explore the Founding Partner program.",
  alternates: { canonical: "https://www.teeahead.com/for-courses" },
};
export default function CoursesPage() {
  return (
    <div className={s.site}>
      <MarketingHeader forCourses />
      <main id="main-content">
        <section className={s.operatorHero}>
          <p className={s.eyebrow}>TEE AHEAD. ON YOUR TERMS.</p>
          <h1>
            Your tee sheet.
            <br />
            Your customers.
            <br />
            <em>Your revenue.</em>
          </h1>
          <p>
            Run the day. Build the relationship. Keep control of your
            course—with tee sheet software that doesn’t ask for your tee times
            in return.
          </p>
          <div className={s.buttonRow}>
            <a
              href="https://scheduler.zoom.us/neil-barris-yro2rr/30-mins-with-teeahead"
              className={s.primary}
            >
              Book a walkthrough <ArrowUpRight size={18} />
            </a>
            <Link href="/waitlist/course" className={s.textLink}>
              Explore becoming a founding partner →
            </Link>
          </div>
          <div className={s.operatorScreenshot}>
            <Image
              src="/screenshots/dashboard.png"
              alt="TeeAhead course dashboard with sample revenue, bookings and member data"
              width={924}
              height={540}
              sizes="(max-width:1000px) 95vw, 1000px"
              preload
            />
            <p>Product preview · Sample data</p>
          </div>
        </section>
        <section className={s.golfers}>
          <div className={s.sectionHeading}>
            <p className={s.eyebrow}>BUILT AROUND YOUR BUSINESS</p>
            <h2>
              More control.
              <br />
              <em>Less friction.</em>
            </h2>
          </div>
          <div className={s.benefits}>
            {[
              [
                "01",
                "Your tee times stay yours.",
                "No barter inventory. No commissions. A clear software cost you can plan around.",
              ],
              [
                "02",
                "Know the golfers coming back.",
                "Keep bookings and member activity together, so relationships don’t get lost in the day-to-day.",
              ],
              [
                "03",
                "Talk through the switch.",
                "Meet with our founder to discuss your current setup, staff workflow, and what a launch would involve.",
              ],
            ].map(([n, t, p]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className={s.finalCta}>
          <div>
            <p className={s.eyebrow}>THE FOUNDING PARTNER PROGRAM</p>
            <h2>
              Help shape
              <br />
              <em>what comes next.</em>
            </h2>
          </div>
          <div>
            <p>
              Our founding offer includes a free first year for the first ten
              partner courses, then $349/month. Register your interest to
              discuss fit, availability, and next steps.
            </p>
            <Link href="/waitlist/course" className={s.primary}>
              Let’s talk about your course <ArrowUpRight size={18} />
            </Link>
            <Link href="/features#for-courses" className={s.textLink}>
              See all course features →
            </Link>
            <Link href="/pricing" className={s.textLink}>
              Explore pricing →
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
