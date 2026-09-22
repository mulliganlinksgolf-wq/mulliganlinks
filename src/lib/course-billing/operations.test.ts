// @vitest-environment node
import { beforeEach, it, expect, vi } from "vitest";
import type Stripe from "stripe";
import type { BillingAccount } from "./model";
const m = vi.hoisted(() => ({
  retrieve: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getSchedule: vi.fn(),
  release: vi.fn(),
  from: vi.fn(),
  customerSearch: vi.fn(),
  customerCreate: vi.fn(),
  listSubs: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: { retrieve: m.retrieve, list: m.listSubs },
    subscriptionSchedules: {
      create: m.create,
      update: m.update,
      retrieve: m.getSchedule,
      release: m.release,
    },
    customers: { search: m.customerSearch, create: m.customerCreate },
    checkout: { sessions: { create: m.checkout } },
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: m.from }),
}));
import { createAdminClient } from "@/lib/supabase/admin";
import { assertWinterEligible, syncCourseSubscription } from "./stripe";
import {
  winterPhases,
  scheduleWinter,
  createCourseCheckout,
} from "./operations";
const account = {
  course_id: "course",
  stripe_customer_id: "cus_course",
  stripe_subscription_id: "sub_course",
  standard_monthly_cents: 29900,
  winter_state: "none",
  checkout_nonce: "nonce",
} as BillingAccount;
function subscription() {
  return {
    id: "sub_course",
    customer: "cus_course",
    metadata: { kind: "course_platform", course_id: "course" },
    status: "active",
    discounts: [],
    items: {
      data: [
        {
          quantity: 1,
          price: {
            id: "price_original",
            product: "prod_course",
            currency: "usd",
            unit_amount: 29900,
            recurring: { interval: "month", interval_count: 1 },
          },
          current_period_end: Date.parse("2026-11-01T12:00:00Z") / 1000,
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01"));
  m.retrieve.mockResolvedValue(subscription());
  const q = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: account }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    then: (resolve: (v: unknown) => void) => resolve({ error: null }),
  };
  m.from.mockReturnValue(q);
});
it("restores the actual contracted Stripe price, at the selected date, with no prorations", () => {
  const phases = winterPhases(
    "price_299",
    "prod_course",
    100,
    200,
    300,
    "course",
  );
  expect(phases.map((p) => [p.start_date, p.end_date])).toEqual([
    [100, 200],
    [200, 300],
    [300, undefined],
  ]);
  expect(phases[1].items[0].price_data?.unit_amount).toBe(4900);
  expect(phases[2].items[0].price).toBe("price_299");
  expect(phases[2].billing_cycle_anchor).toBe("phase_start");
  expect(phases.every((p) => p.proration_behavior === "none")).toBe(true);
});
it("rejects cross-course and golfer subscriptions", () => {
  expect(() =>
    assertWinterEligible(
      {
        ...subscription(),
        metadata: { kind: "membership", user_id: "member" },
      },
      account,
    ),
  ).toThrow();
  expect(() =>
    assertWinterEligible({ ...subscription(), customer: "cus_other" }, account),
  ).toThrow();
});
it("does not overwrite custom, discounted, trialing, or cancelling subscriptions", () => {
  for (const change of [
    { status: "trialing" },
    { cancel_at_period_end: true },
    { discounts: ["di_discount"] },
  ])
    expect(() =>
      assertWinterEligible(
        { ...subscription(), ...change } as Stripe.Subscription,
        account,
      ),
    ).toThrow();
});
it("ignores golfer subscriptions without touching course billing", async () => {
  await syncCourseSubscription(
    { ...subscription(), metadata: { user_id: "golfer", tier: "ace" } },
    createAdminClient(),
  );
  expect(m.from).not.toHaveBeenCalled();
});
it("refuses an unrelated existing Stripe schedule before creating a winter intent", async () => {
  m.retrieve.mockResolvedValue({ ...subscription(), schedule: "sched_other" });
  await expect(
    scheduleWinter(createAdminClient(), account, "2027-04-01"),
  ).rejects.toThrow("already has a schedule");
  expect(m.create).not.toHaveBeenCalled();
  expect(m.from).not.toHaveBeenCalled();
});
it("retries the persisted winter operation with the same Stripe idempotency key and dates", async () => {
  const retry = {
    ...account,
    winter_state: "preparing" as const,
    winter_operation_id: "operation",
    winter_start_at: "2026-11-01T12:00:00Z",
    winter_end_at: "2027-04-01T12:00:00Z",
  };
  m.create.mockResolvedValue({
    id: "sched",
    current_phase: { start_date: 100 },
    metadata: {},
  });
  m.update.mockRejectedValue(new Error("temporary Stripe failure"));
  await expect(scheduleWinter(createAdminClient(), retry, "")).rejects.toThrow(
    "temporary",
  );
  expect(m.create).toHaveBeenCalledWith(
    { from_subscription: "sub_course" },
    { idempotencyKey: "course-winter-create-operation" },
  );
  expect(m.update.mock.calls[0][1].phases[1].end_date).toBe(
    Date.parse(retry.winter_end_at) / 1000,
  );
});
it("preserves a remaining free year in Stripe checkout and uses the agreed price", async () => {
  m.listSubs.mockResolvedValue({ data: [] });
  m.checkout.mockResolvedValue({
    id: "cs",
    url: "https://checkout.stripe.com/example",
  });
  const trial = {
    ...account,
    stripe_subscription_id: null,
    free_until: "2027-06-01T12:00:00Z",
  };
  await createCourseCheckout(createAdminClient(), trial, "course");
  expect(m.checkout.mock.calls[0][0].subscription_data.trial_end).toBe(
    Date.parse(trial.free_until) / 1000,
  );
  expect(m.checkout.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(
    29900,
  );
});
it("prevents duplicate subscription checkout and protects nearly expired free periods", async () => {
  m.listSubs.mockResolvedValue({ data: [{ status: "active" }] });
  await expect(
    createCourseCheckout(
      createAdminClient(),
      { ...account, stripe_subscription_id: null },
      "course",
    ),
  ).rejects.toThrow("already exists");
  m.listSubs.mockResolvedValue({ data: [] });
  await expect(
    createCourseCheckout(
      createAdminClient(),
      {
        ...account,
        stripe_subscription_id: null,
        free_until: "2026-10-02T00:00:00Z",
      },
      "course",
    ),
  ).rejects.toThrow("48 hours");
  expect(m.checkout).not.toHaveBeenCalled();
});
