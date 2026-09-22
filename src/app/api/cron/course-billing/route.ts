import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { courseBillingEnabled } from "@/lib/course-billing/access";
import { syncCourseSubscription } from "@/lib/course-billing/stripe";
import { withBillingLock } from "@/lib/course-billing/operations";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.COURSE_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  if (!courseBillingEnabled()) return Response.json({ disabled: true });
  const admin = createAdminClient();
  // Oldest-updated first means larger installations make progress on each tick.
  const { data, error } = await admin
    .from("course_billing_accounts")
    .select("course_id")
    .not("stripe_subscription_id", "is", null)
    .order("updated_at")
    .limit(20);
  if (error)
    return Response.json(
      { error: "Billing sync unavailable." },
      { status: 500 },
    );
  let processed = 0,
    failed = 0;
  const started = Date.now();
  for (const row of data ?? []) {
    if (Date.now() - started > 45000) break;
    try {
      await withBillingLock(admin, row.course_id, async (account) => {
        if (account.stripe_subscription_id)
          await syncCourseSubscription(
            await stripe.subscriptions.retrieve(account.stripe_subscription_id),
            admin,
          );
      });
      processed++;
    } catch (error) {
      console.error("[course-billing-sync]", error);
      failed++;
    }
  }
  return Response.json({ processed, failed }, { status: failed ? 500 : 200 });
}
export const POST = GET;
