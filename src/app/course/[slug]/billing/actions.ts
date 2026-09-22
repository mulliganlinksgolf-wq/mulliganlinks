"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/courseRole";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { courseBillingEnabled } from "@/lib/course-billing/access";
import { dateTimestamp } from "@/lib/course-billing/model";
import {
  readBillingAccount,
  saveAccount,
  syncCourseSubscription,
} from "@/lib/course-billing/stripe";
import {
  withBillingLock,
  createCourseCheckout,
  scheduleWinter,
  cancelWinter,
} from "@/lib/course-billing/operations";
export type BillingResult = { error?: string; success?: string; url?: string };
export async function updateCourseBilling(
  slug: string,
  _state: BillingResult,
  form: FormData,
): Promise<BillingResult> {
  const ctx = await requireManager(slug);
  if (!courseBillingEnabled())
    return { error: "Course billing is not enabled yet." };
  const action = String(form.get("action"));
  const admin = createAdminClient();
  try {
    if (action === "approve") {
      if (!ctx.isGlobalAdmin)
        throw new Error(
          "Only TeeAhead administrators can confirm contract terms.",
        );
      if (form.get("reviewed") !== "yes")
        throw new Error("Confirm the signed agreement and free period first.");
      const amount = Number(form.get("monthly")) * 100;
      if (!Number.isSafeInteger(amount) || amount < 4901 || amount > 1000000)
        throw new Error(
          "Enter a monthly price above $49 and no more than $10,000.",
        );
      const date = String(form.get("freeUntil") ?? "");
      const freeUntil = date
        ? new Date(dateTimestamp(date) * 1000).toISOString()
        : null;
      const { error } = await admin
        .from("course_billing_accounts")
        .insert({
          course_id: ctx.courseId,
          standard_monthly_cents: amount,
          free_until: freeUntil,
          approved_by: ctx.userId,
        });
      if (error)
        throw new Error(
          "Could not confirm the contract. Refresh to check whether it already exists.",
        );
    } else {
      const result = await withBillingLock(
        admin,
        ctx.courseId,
        async (account) => {
          if (action === "checkout") {
            if (form.get("reviewed") !== "yes")
              throw new Error(
                "Review your monthly price and free period before continuing.",
              );
            return { url: await createCourseCheckout(admin, account, slug) };
          }
          if (action === "winter") {
            if (form.get("reviewed") !== "yes")
              throw new Error(
                "Confirm the winter billing terms before continuing.",
              );
            await scheduleWinter(
              admin,
              account,
              String(form.get("reopening") ?? ""),
            );
          } else if (action === "cancelWinter")
            await cancelWinter(admin, account);
          else if (action === "refresh") {
            let subscriptionId = account.stripe_subscription_id;
            if (!subscriptionId && account.checkout_session_id) {
              const session = await stripe.checkout.sessions.retrieve(
                account.checkout_session_id,
              );
              subscriptionId =
                typeof session.subscription === "string"
                  ? session.subscription
                  : (session.subscription?.id ?? null);
            }
            if (subscriptionId)
              await syncCourseSubscription(
                await stripe.subscriptions.retrieve(subscriptionId),
                admin,
              );
            else if (account.stripe_customer_id) {
              const subs = await stripe.subscriptions.list({
                customer: account.stripe_customer_id,
                status: "all",
                limit: 100,
              });
              const matches = subs.data.filter(
                (s) =>
                  s.metadata.kind === "course_platform" &&
                  s.metadata.course_id === ctx.courseId &&
                  !["canceled", "incomplete_expired"].includes(s.status),
              );
              if (matches.length === 1)
                await syncCourseSubscription(matches[0], admin);
            }
            // Expired checkout attempts can be retried without changing the signed terms.
            const refreshed = await readBillingAccount(admin, ctx.courseId);
            if (refreshed?.status === "incomplete_expired")
              await saveAccount(admin, ctx.courseId, {
                checkout_nonce: randomUUID(),
              });
          } else throw new Error("Unknown billing action.");
          return {};
        },
      );
      revalidatePath(`/course/${slug}/billing`);
      if ("url" in result) return result;
    }
    revalidatePath(`/course/${slug}/billing`);
    return { success: "Billing updated." };
  } catch (error) {
    console.error("[course-billing]", error);
    // Stripe errors can contain internal identifiers; keep those out of the UI.
    return {
      error:
        error instanceof Error && !("type" in error)
          ? error.message
          : "Could not update Stripe billing. Refresh before trying again, or contact TeeAhead.",
    };
  }
}
