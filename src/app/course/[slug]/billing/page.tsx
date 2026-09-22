import { winterHasNotStarted } from "@/lib/course-billing/model";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CsvExportButton from "@/components/reports/CsvExportButton";
import BillingControls from "./BillingControls";
import { courseBillingEnabled } from "@/lib/course-billing/access";
import { readBillingAccount } from "@/lib/course-billing/stripe";
import { requireManager } from "@/lib/courseRole";

export default async function CourseBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireManager(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/course/${slug}/login`);

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select(
      "id, name, slug, legal_entity_name, billing_email, created_at, status",
    )
    .eq("slug", slug)
    .single();
  if (courseError && courseError.code !== "PGRST116")
    throw new Error(`[CourseBillingPage] ${courseError.message}`);
  if (!course) notFound();

  const { data: payouts } = await admin
    .from("course_payouts")
    .select("id, amount_cents, arrival_date, status, created_at")
    .eq("course_id", course.id)
    .order("arrival_date", { ascending: false })
    .limit(50);

  const csvData = (payouts ?? []).map((p) => ({
    "Arrival Date": p.arrival_date,
    Amount: `$${(p.amount_cents / 100).toFixed(2)}`,
    Status: p.status,
  }));

  const account = courseBillingEnabled()
    ? await readBillingAccount(admin, course.id)
    : null;
  const view = account
    ? {
        standard_monthly_cents: account.standard_monthly_cents,
        free_until: account.free_until,
        status: account.status,
        current_period_end: account.current_period_end,
        winter_state: account.winter_state,
        winter_start_at: account.winter_start_at,
        winter_end_at: account.winter_end_at,
        hasSubscription: !!account.stripe_subscription_id,
        canCancelWinter: winterHasNotStarted(account.winter_start_at),
      }
    : null;

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">
        Billing &amp; Contract
      </h1>

      {courseBillingEnabled() ? (
        <BillingControls
          slug={slug}
          account={view}
          isGlobalAdmin={ctx.isGlobalAdmin}
        />
      ) : (
        <p>
          For course billing or Winter Plan, contact{" "}
          <a className="underline" href="mailto:hello@teeahead.com">
            hello@teeahead.com
          </a>
          .
        </p>
      )}

      {/* Payout history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">Payout History</h2>
            <p className="text-xs text-[#6B7770] mt-0.5">
              Payments from TeeAhead to your account
            </p>
          </div>
          <CsvExportButton data={csvData} filename={`${slug}-payouts.csv`} />
        </div>
        {(payouts ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center text-[#6B7770] text-sm">
            No payouts yet. Payouts will appear here once Stripe processing is
            active.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Arrival Date", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-medium text-[#6B7770] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(payouts ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-[#1A1A1A]">
                    {new Date(p.arrival_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">
                    ${(p.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
