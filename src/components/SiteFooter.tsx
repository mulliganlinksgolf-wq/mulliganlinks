import Link from "next/link";
import { TeeAheadLogo } from "@/components/TeeAheadLogo";
import styles from "@/components/marketing/footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Column 1, Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <TeeAheadLogo className={styles.logo} />
            <p className="text-sm text-[#65716b] leading-relaxed">
              Book ahead. Play more. Own your golf.
            </p>
            <p className="text-xs text-[#65716b]">Built in Metro Detroit.</p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/teeahead/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TeeAhead on Instagram"
                className="text-[#65716b] hover:text-[#142c23] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61589249283068"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TeeAhead on Facebook"
                className="text-[#65716b] hover:text-[#142c23] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://x.com/teeahead"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TeeAhead on X"
                className="text-[#65716b] hover:text-[#142c23] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2, For Courses */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#65716b] uppercase tracking-wider">
              For Courses
            </p>
            <nav className="flex flex-col gap-2 text-sm text-[#142c23]">
              <Link href="/for-courses" className="hover:underline">
                For courses
              </Link>
              <Link
                href="/features"
                className="hover:text-[#142c23] transition-colors"
              >
                All Features
              </Link>
              <Link
                href="/pricing"
                className="hover:text-[#142c23] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/barter"
                className="hover:text-[#142c23] transition-colors"
              >
                Barter Calculator
              </Link>
              <Link
                href="/damage"
                className="hover:text-[#142c23] transition-colors"
              >
                GolfNow Damage Report
              </Link>
              <Link
                href="/software-cost"
                className="hover:text-[#142c23] transition-colors"
              >
                Software Cost Calculator
              </Link>
              <Link
                href="/waitlist/course"
                className="hover:text-[#142c23] transition-colors"
              >
                Join Waitlist
              </Link>
            </nav>
          </div>

          {/* Column 3, Compare */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#65716b] uppercase tracking-wider">
              Compare
            </p>
            <nav className="flex flex-col gap-2 text-sm text-[#142c23]">
              <Link
                href="/tee-time-software"
                className="hover:text-[#142c23] transition-colors"
              >
                Tee Time Software
              </Link>
              <Link
                href="/best-tee-sheet-software"
                className="hover:text-[#142c23] transition-colors"
              >
                Best Tee Sheet
              </Link>
              <Link
                href="/golfnow-alternative"
                className="hover:text-[#142c23] transition-colors"
              >
                GolfNow Alternative
              </Link>
              <Link
                href="/golf-course-booking-software"
                className="hover:text-[#142c23] transition-colors"
              >
                Booking Software
              </Link>
            </nav>
          </div>

          {/* Column 4, Company */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#65716b] uppercase tracking-wider">
              Company
            </p>
            <nav className="flex flex-col gap-2 text-sm text-[#142c23]">
              <Link href="/waitlist/golfer" className="hover:underline">
                Golfer waitlist
              </Link>
              <Link href="/blog" className="hover:underline">
                Golf journal
              </Link>
              <Link
                href="/contact"
                className="hover:text-[#142c23] transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/about"
                className="hover:text-[#142c23] transition-colors"
              >
                About
              </Link>
              <Link
                href="/terms"
                className="hover:text-[#142c23] transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[#142c23] transition-colors"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-[#142c23]/15 pt-6 text-center space-y-2">
          <p className="text-xs text-[#65716b]">Metro Detroit, Michigan</p>
          <p className="text-xs text-[#65716b]">
            © 2026 TeeAhead, LLC. All rights reserved.
          </p>
          <p className="text-xs text-[#65716b] max-w-2xl mx-auto leading-relaxed">
            Competitor references are for comparative purposes only and based on
            publicly available information. TeeAhead is not affiliated with or
            endorsed by GolfNow or NBC Sports Next.
          </p>
        </div>
      </div>
    </footer>
  );
}
