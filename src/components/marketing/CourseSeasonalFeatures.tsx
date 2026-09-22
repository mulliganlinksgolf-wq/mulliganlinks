import Link from "next/link";
export function CourseSeasonalFeatures() {
  const ready =
    process.env.COURSE_MARKETING_ENABLED === "true" &&
    process.env.COURSE_BILLING_ENABLED === "true";
  return (
    <section
      aria-labelledby="course-seasonal-heading"
      className="bg-[#F4F1E9] px-6 py-14 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#546659]">
          For course operators
        </p>
        <h2
          id="course-seasonal-heading"
          className="font-display text-3xl sm:text-4xl text-[#153E30]"
        >
          Stay connected. Even between seasons.
        </h2>
        {!ready && (
          <p className="mt-3 text-sm text-[#526058]">
            Coming to the course portal. Ask about availability when you join.
          </p>
        )}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <article>
            <h3 className="text-xl font-semibold text-[#153E30]">
              Give golfers a reason to come back.
            </h3>
            <p className="mt-3 leading-relaxed text-[#526058]">
              Email golfers who subscribe to your course updates about open tee
              times, leagues, pro shop offers, and clubhouse specials. Reach
              everyone or tailor a message to Fairway, Eagle, and Ace members.
            </p>
          </article>
          <article>
            <h3 className="text-xl font-semibold text-[#153E30]">
              A $49/month plan for winter.
            </h3>
            <p className="mt-3 leading-relaxed text-[#526058]">
              Eligible monthly course subscriptions can switch at their next
              renewal. Keep email marketing and customer records while new
              bookings pause. Choose your reopening date, and your regular
              monthly price and booking access resume automatically.
            </p>
            <p className="mt-2 text-sm text-[#526058]">
              Winter payments are monthly, with no partial-month refund.
              Existing reservations stay in place.
            </p>
          </article>
        </div>
        <Link
          href="/waitlist/course"
          className="mt-7 inline-flex rounded-lg bg-[#153E30] px-5 py-3 font-semibold text-white"
        >
          Talk through your course’s season →
        </Link>
      </div>
    </section>
  );
}
