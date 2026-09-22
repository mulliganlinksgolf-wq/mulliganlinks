import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingAccess } from "./model";
export function courseBillingEnabled() {
  return process.env.COURSE_BILLING_ENABLED === "true";
}
export async function getCourseBookingAccess(
  courseId: string,
): Promise<BookingAccess | null> {
  if (!courseBillingEnabled()) return null;
  const { data, error } = await createAdminClient()
    .from("course_booking_access")
    .select("winter_start_at,winter_end_at,billing_blocked")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw new Error("Could not check course booking availability.");
  return data;
}
