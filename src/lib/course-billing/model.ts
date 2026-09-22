export const WINTER_MONTHLY_CENTS = 4900;
export const STANDARD_MONTHLY_CENTS = 34900;
export type BillingAccount = {
  course_id: string;
  standard_monthly_cents: number;
  free_until: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  checkout_session_id: string | null;
  checkout_nonce: string;
  status: string;
  current_period_end: string | null;
  stripe_schedule_id: string | null;
  winter_operation_id: string | null;
  winter_requested_at: string | null;
  winter_start_at: string | null;
  winter_end_at: string | null;
  winter_state: "none" | "preparing" | "scheduled";
  reminder_sent_at: string | null;
};
export type BookingAccess = {
  winter_start_at: string | null;
  winter_end_at: string | null;
  billing_blocked: boolean;
};
export function dateTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Choose a valid date.");
  // Noon UTC always falls on the selected calendar day in Michigan.
  const timestamp = Date.parse(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  )
    throw new Error("Choose a valid date.");
  return Math.floor(timestamp / 1000);
}
export function winterEnd(value: string, start: number) {
  const end = dateTimestamp(value);
  const days = (end - start) / 86400;
  if (days < 28 || days > 214)
    throw new Error(
      "Choose a reopening date between 28 days and seven months after your next renewal.",
    );
  return end;
}
export function bookingsPaused(
  access: BookingAccess | null,
  slot?: string,
  now = Date.now(),
) {
  if (!access) return false;
  if (access.billing_blocked) return true;
  if (!access.winter_start_at || !access.winter_end_at) return false;
  const start = Date.parse(access.winter_start_at),
    end = Date.parse(access.winter_end_at);
  return (
    (now >= start && now < end) ||
    (!!slot && Date.parse(slot) >= start && Date.parse(slot) < end)
  );
}
export function formatBillingDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Detroit",
  });
}
export const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);

export function winterHasNotStarted(start: string | null) {
  return !!start && Date.parse(start) > Date.now();
}
