import "server-only";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingOrigin } from "@/lib/course-marketing/server";
import {
  assertWinterEligible,
  readBillingAccount,
  saveAccount,
  syncCourseSubscription,
} from "./stripe";
import { WINTER_MONTHLY_CENTS, winterEnd, type BillingAccount } from "./model";
type Admin = ReturnType<typeof createAdminClient>;

export async function withBillingLock<T>(
  admin: Admin,
  courseId: string,
  run: (account: BillingAccount) => Promise<T>,
) {
  const { data: token, error } = await admin.rpc("claim_course_billing", {
    p_course: courseId,
  });
  if (error || !token)
    throw new Error(
      "Billing is being updated. Wait a few minutes and refresh.",
    );
  try {
    const account = await readBillingAccount(admin, courseId);
    if (!account)
      throw new Error("Your course agreement needs to be confirmed first.");
    return await run(account);
  } finally {
    await admin
      .from("course_billing_accounts")
      .update({ locked_until: new Date(0).toISOString(), lock_token: null })
      .eq("course_id", courseId)
      .eq("lock_token", token);
  }
}

export async function createCourseCheckout(
  admin: Admin,
  account: BillingAccount,
  slug: string,
) {
  if (account.stripe_subscription_id)
    throw new Error(
      "A subscription is already linked. Contact TeeAhead for changes.",
    );
  if (!account.stripe_customer_id) {
    // Reconcile an earlier successful API call whose database write may have failed.
    const existing = await stripe.customers.search({
      query: `metadata['teeahead_course_id']:'${account.course_id}'`,
      limit: 2,
    });
    if (existing.data.length > 1)
      throw new Error("Contact TeeAhead to reconcile your billing account.");
    const customer =
      existing.data[0] ??
      (await stripe.customers.create(
        { metadata: { teeahead_course_id: account.course_id } },
        { idempotencyKey: `course-customer-${account.course_id}` },
      ));
    await saveAccount(admin, account.course_id, {
      stripe_customer_id: customer.id,
    });
    account.stripe_customer_id = customer.id;
  }
  const subs = await stripe.subscriptions.list({
    customer: account.stripe_customer_id,
    status: "all",
    limit: 100,
  });
  if (
    subs.data.some(
      (s) => !["canceled", "incomplete_expired"].includes(s.status),
    )
  )
    throw new Error(
      "A subscription already exists. Refresh billing before continuing.",
    );
  if (account.checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(
      account.checkout_session_id,
    );
    if (session.status === "open" && session.url) return session.url;
    if (session.status === "complete")
      throw new Error(
        "Payment is being confirmed. Refresh billing in a moment.",
      );
    account.checkout_nonce = randomUUID();
    await saveAccount(admin, account.course_id, {
      checkout_nonce: account.checkout_nonce,
      checkout_session_id: null,
    });
  }
  const trial = account.free_until
    ? Math.floor(Date.parse(account.free_until) / 1000)
    : undefined;
  if (
    trial &&
    trial > Date.now() / 1000 &&
    trial < Date.now() / 1000 + 48 * 3600
  )
    throw new Error(
      "Your free period ends within 48 hours. Return after it ends to start billing.",
    );
  const origin = marketingOrigin();
  const metadata = { kind: "course_platform", course_id: account.course_id };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: account.stripe_customer_id,
      client_reference_id: account.course_id,
      metadata,
      billing_address_collection: "required",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: account.standard_monthly_cents,
            recurring: { interval: "month" },
            product_data: { name: "TeeAhead Course Platform" },
          },
        },
      ],
      subscription_data: {
        metadata,
        ...(trial && trial > Date.now() / 1000 ? { trial_end: trial } : {}),
      },
      success_url: `${origin}/course/${slug}/billing?checkout=complete`,
      cancel_url: `${origin}/course/${slug}/billing`,
    },
    { idempotencyKey: `course-checkout-${account.checkout_nonce}` },
  );
  await saveAccount(admin, account.course_id, {
    checkout_session_id: session.id,
  });
  if (!session.url) throw new Error("Could not open secure checkout.");
  return session.url;
}

export function winterPhases(
  price: string,
  product: string,
  phaseStart: number,
  start: number,
  end: number,
  courseId: string,
): Stripe.SubscriptionScheduleUpdateParams.Phase[] {
  const metadata = { kind: "course_platform", course_id: courseId };
  return [
    {
      start_date: phaseStart,
      end_date: start,
      items: [{ price, quantity: 1 }],
      proration_behavior: "none",
      metadata: { ...metadata, billing_season: "standard" },
    },
    {
      start_date: start,
      end_date: end,
      items: [
        {
          price_data: {
            product,
            currency: "usd",
            unit_amount: WINTER_MONTHLY_CENTS,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      billing_cycle_anchor: "phase_start",
      proration_behavior: "none",
      metadata: { ...metadata, billing_season: "winter" },
    },
    {
      start_date: end,
      duration: { interval: "month", interval_count: 1 },
      items: [{ price, quantity: 1 }],
      billing_cycle_anchor: "phase_start",
      proration_behavior: "none",
      metadata: { ...metadata, billing_season: "standard" },
    },
  ];
}

export async function scheduleWinter(
  admin: Admin,
  account: BillingAccount,
  reopening: string,
) {
  if (!account.stripe_subscription_id)
    throw new Error(
      "Start your course subscription before choosing Winter Plan.",
    );
  const sub = await stripe.subscriptions.retrieve(
    account.stripe_subscription_id,
  );
  const item = assertWinterEligible(sub, account);
  if (account.winter_state === "scheduled")
    throw new Error("A Winter Plan is already scheduled.");
  const start =
    account.winter_state === "preparing" && account.winter_start_at
      ? Date.parse(account.winter_start_at) / 1000
      : item.current_period_end;
  const end =
    account.winter_state === "preparing" && account.winter_end_at
      ? Date.parse(account.winter_end_at) / 1000
      : winterEnd(reopening, start);
  if (start <= Date.now() / 1000 + 600)
    throw new Error(
      "Your renewal is too close to safely change. Contact TeeAhead.",
    );
  const operation =
    account.winter_operation_id && account.winter_state === "preparing"
      ? account.winter_operation_id
      : randomUUID();
  const existingId =
    typeof sub.schedule === "string" ? sub.schedule : sub.schedule?.id;
  if (existingId && account.winter_state !== "preparing")
    throw new Error(
      "This subscription already has a schedule. Contact TeeAhead.",
    );
  await saveAccount(admin, account.course_id, {
    winter_operation_id: operation,
    winter_state: "preparing",
    winter_requested_at:
      account.winter_requested_at ?? new Date().toISOString(),
    winter_start_at: new Date(start * 1000).toISOString(),
    winter_end_at: new Date(end * 1000).toISOString(),
  });
  const schedule = existingId
    ? await stripe.subscriptionSchedules.retrieve(existingId)
    : await stripe.subscriptionSchedules.create(
        { from_subscription: sub.id },
        { idempotencyKey: `course-winter-create-${operation}` },
      );
  if (
    schedule.metadata?.kind &&
    (schedule.metadata.kind !== "course_winter" ||
      schedule.metadata.operation_id !== operation)
  )
    throw new Error("Another billing schedule exists. Contact TeeAhead.");
  if (!schedule.current_phase)
    throw new Error("The subscription schedule is not active.");
  const product =
    typeof item.price.product === "string"
      ? item.price.product
      : item.price.product.id;
  await stripe.subscriptionSchedules.update(
    schedule.id,
    {
      end_behavior: "release",
      proration_behavior: "none",
      metadata: {
        kind: "course_winter",
        course_id: account.course_id,
        operation_id: operation,
      },
      phases: winterPhases(
        item.price.id,
        product,
        schedule.current_phase.start_date,
        start,
        end,
        account.course_id,
      ),
    },
    { idempotencyKey: `course-winter-configure-${operation}` },
  );
  await saveAccount(admin, account.course_id, {
    stripe_schedule_id: schedule.id,
    winter_state: "scheduled",
  });
  await syncCourseSubscription(
    await stripe.subscriptions.retrieve(sub.id),
    admin,
  );
}

export async function cancelWinter(admin: Admin, account: BillingAccount) {
  if (
    !account.stripe_subscription_id ||
    !account.winter_start_at ||
    Date.parse(account.winter_start_at) <= Date.now()
  )
    throw new Error(
      "Contact TeeAhead to change a Winter Plan that has already started.",
    );
  const sub = await stripe.subscriptions.retrieve(
    account.stripe_subscription_id,
  );
  assertWinterEligible(sub, account);
  const id = typeof sub.schedule === "string" ? sub.schedule : sub.schedule?.id;
  if (id) {
    const schedule = await stripe.subscriptionSchedules.retrieve(id);
    if (
      schedule.metadata?.kind !== "course_winter" ||
      schedule.metadata.course_id !== account.course_id
    )
      throw new Error("Contact TeeAhead to review this schedule.");
    await stripe.subscriptionSchedules.release(
      id,
      {},
      { idempotencyKey: `course-winter-cancel-${account.winter_operation_id}` },
    );
  }
  await saveAccount(admin, account.course_id, {
    winter_state: "none",
    winter_start_at: null,
    winter_end_at: null,
    winter_operation_id: null,
    winter_requested_at: null,
    stripe_schedule_id: null,
  });
  await syncCourseSubscription(
    await stripe.subscriptions.retrieve(sub.id),
    admin,
  );
}
