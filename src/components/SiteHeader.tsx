"use client";

import { usePathname } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const courseRoutes = [
  "/waitlist/course",
  "/for-courses",
  "/pricing",
  "/barter",
  "/damage",
  "/software-cost",
  "/tee-time-software",
  "/best-tee-sheet-software",
  "/golfnow-alternative",
  "/golf-course-booking-software",
  "/case-studies",
];

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  return (
    <MarketingHeader
      forCourses={courseRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      )}
    />
  );
}
