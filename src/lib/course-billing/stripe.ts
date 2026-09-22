import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { WINTER_MONTHLY_CENTS, type BillingAccount } from "./model";
type Admin = ReturnType<typeof createAdminClient>;
const idOf = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id;

export function assertCourseSubscription(
  sub: Stripe.Subscription,
  account: BillingAccount,
) {
  if (
    sub.metadata.kind !== "course_platform" ||
    sub.metadata.course_id !== account.course_id ||
    idOf(sub.customer) !== account.stripe_customer_id
  )
    throw new Error("This subscription is not linked to this course.");
}
export async function readBillingAccount(
  admin: Admin,
  courseId: string,
): Promise<BillingAccount | null> {
  const { data, error } = await admin
    .from("course_billing_accounts")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw new Error("Could not load course billing.");
  return data;
}
export async function saveAccount(
  admin: Admin,
  courseId: string,
  values: Record<string, unknown>,
) {
  const { error } = await admin
    .from("course_billing_accounts")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("course_id", courseId);
  if (error)
    throw new Error(
      "The billing display could not be saved. Refresh before making another change.",
    );
}
export async function syncCourseSubscription(
  sub: Stripe.Subscription,
  admin: Admin,
) {
  if (sub.metadata.kind !== "course_platform" || !sub.metadata.course_id)
    return;
  const account = await readBillingAccount(admin, sub.metadata.course_id);
  if (!account)
    throw new Error(
      "Course billing must be approved before starting a subscription.",
    );
  assertCourseSubscription(sub, account);
  if (
    account.stripe_subscription_id &&
    account.stripe_subscription_id !== sub.id &&
    !["canceled", "incomplete_expired"].includes(account.status)
  )
    throw new Error("A different course subscription is already linked.");
  if (sub.status === "incomplete") return;
  let winterState: BillingAccount["winter_state"] =
    account.winter_state === "preparing" ? "preparing" : "none";
  const scheduleId = idOf(sub.schedule);
  if (scheduleId) {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (
      schedule.metadata?.course_id === account.course_id &&
      schedule.metadata?.kind === "course_winter" &&
      schedule.status === "active"
    )
      winterState = "scheduled";
    // Preserve an in-flight intent until its schedule has been configured or retried.
    else if (account.winter_state === "preparing") winterState = "preparing";
  }
  await saveAccount(admin, account.course_id, {
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: sub.items.data[0]?.current_period_end
      ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
      : null,
    stripe_schedule_id: scheduleId ?? null,
    winter_state: winterState,
  });
  const { error } = await admin.from("course_booking_access").upsert({
    course_id: account.course_id,
    winter_start_at:
      winterState === "scheduled" ? account.winter_start_at : null,
    winter_end_at: winterState === "scheduled" ? account.winter_end_at : null,
    billing_blocked: !["active", "trialing"].includes(sub.status),
  });
  if (error) throw error;
}
export async function handleCourseBillingEvent(
  event: Stripe.Event,
  admin: Admin,
) {
  let subscriptionId: string | undefined;
  if (event.type === "checkout.session.completed")
    subscriptionId = idOf(
      (event.data.object as Stripe.Checkout.Session).subscription,
    );
  else if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)
  )
    subscriptionId = (event.data.object as Stripe.Subscription).id;
  else if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  )
    subscriptionId = idOf(
      (event.data.object as Stripe.Invoice).parent?.subscription_details
        ?.subscription ?? null,
    );
  else if (event.type.startsWith("subscription_schedule.")) {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    subscriptionId =
      idOf(schedule.subscription) ?? idOf(schedule.released_subscription);
  }
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (sub.metadata.kind !== "course_platform" || !sub.metadata.course_id)
      return;
    const { withBillingLock } = await import("./operations");
    await withBillingLock(admin, sub.metadata.course_id, async () => {
      await syncCourseSubscription(
        await stripe.subscriptions.retrieve(subscriptionId!),
        admin,
      );
    });
  }
}
export function assertWinterEligible(
  sub: Stripe.Subscription,
  account: BillingAccount,
) {
  assertCourseSubscription(sub, account);
  const item = sub.items.data[0];
  if (
    sub.status !== "active" ||
    sub.cancel_at_period_end ||
    sub.cancel_at ||
    sub.pause_collection ||
    sub.pending_update
  )
    throw new Error(
      "Winter Plan requires an active subscription with no pending cancellation or payment change.",
    );
  if (
    sub.items.data.length !== 1 ||
    item.quantity !== 1 ||
    item.price.currency !== "usd" ||
    item.price.recurring?.interval !== "month" ||
    item.price.recurring.interval_count !== 1 ||
    !item.price.unit_amount ||
    item.price.unit_amount <= WINTER_MONTHLY_CENTS ||
    item.price.unit_amount !== account.standard_monthly_cents ||
    sub.discounts.length ||
    item.discounts?.length ||
    item.tax_rates?.length ||
    sub.default_tax_rates?.length ||
    sub.automatic_tax?.enabled
  )
    throw new Error(
      "Contact TeeAhead to arrange winter billing for this custom contract.",
    );
  return item;
}
