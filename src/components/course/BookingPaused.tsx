import Link from "next/link";
import {
  formatBillingDate,
  type BookingAccess,
} from "@/lib/course-billing/model";
export default function BookingPaused({
  name,
  slug,
  access,
}: {
  name: string;
  slug: string;
  access: BookingAccess;
}) {
  return (
    <section className="mx-auto my-12 max-w-xl rounded-xl border border-gray-200 bg-white p-7 space-y-4">
      <h1 className="text-2xl font-semibold">{name}</h1>
      <h2 className="text-lg font-medium">New bookings are currently paused</h2>
      <p>
        {!access.billing_blocked && access.winter_end_at
          ? `The course is on its Winter Plan. New bookings resume ${formatBillingDate(access.winter_end_at)}.`
          : "Please contact the course for availability."}{" "}
        Existing reservations remain in place.
      </p>
      {process.env.COURSE_MARKETING_ENABLED === "true" && (
        <Link
          className="text-green-800 underline"
          href={`/course-updates/${slug}`}
        >
          Get course email updates
        </Link>
      )}
    </section>
  );
}
