"use client";
import { useActionState } from "react";
import { updateCourseBilling } from "./actions";
import { dollars, formatBillingDate } from "@/lib/course-billing/model";
type View = {
  standard_monthly_cents: number;
  free_until: string | null;
  status: string;
  current_period_end: string | null;
  winter_state: string;
  winter_start_at: string | null;
  winter_end_at: string | null;
  hasSubscription: boolean;
  canCancelWinter: boolean;
};
export default function BillingControls({
  slug,
  account,
  isGlobalAdmin,
}: {
  slug: string;
  account: View | null;
  isGlobalAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateCourseBilling.bind(null, slug),
    {},
  );
  const button =
    "rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
  const input =
    "block rounded-lg border border-gray-300 p-2 mt-1 w-full max-w-xs";
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      <h2 className="text-lg font-semibold">Course subscription</h2>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-800">
          {state.success}
        </p>
      )}
      {state.url && (
        <a href={state.url} className={button}>
          Continue to secure Stripe checkout
        </a>
      )}
      {!account ? (
        <>
          <p className="text-sm text-gray-600">
            Your course has not started online billing. TeeAhead will confirm
            your signed price and any Founding Partner free period first.
          </p>
          {isGlobalAdmin && (
            <form action={action} className="space-y-4">
              <input type="hidden" name="action" value="approve" />
              <label className="block text-sm">
                Contracted monthly price ($)
                <input
                  className={input}
                  name="monthly"
                  type="number"
                  min="49.01"
                  max="10000"
                  step="0.01"
                  defaultValue="349"
                  required
                />
              </label>
              <label className="block text-sm">
                Free period ends (leave blank only if none)
                <input className={input} name="freeUntil" type="date" />
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="reviewed" value="yes" required />I
                checked the signed agreement, including any free year. Saving
                these terms does not charge the course.
              </label>
              <button className={button} disabled={pending}>
                Confirm contract terms
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <p className="text-sm">
            <strong>{dollars(account.standard_monthly_cents)}/month</strong> ·{" "}
            {account.status.replaceAll("_", " ")}
          </p>
          {account.free_until && (
            <p className="text-sm">
              Agreed free period ends {formatBillingDate(account.free_until)}.
            </p>
          )}
          {!account.hasSubscription && (
            <form action={action} className="space-y-3">
              <input type="hidden" name="action" value="checkout" />
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="reviewed" value="yes" required />I
                reviewed the price and free period above. Billing starts through
                Stripe after any remaining free period.
              </label>
              <button className={button} disabled={pending}>
                Set up monthly billing
              </button>
            </form>
          )}
          <form action={action}>
            <input type="hidden" name="action" value="refresh" />
            <button disabled={pending} className="text-sm underline">
              Refresh billing status
            </button>
          </form>
          {account.hasSubscription && (
            <div className="border-t pt-5 space-y-4">
              <h3 className="font-semibold">Winter Plan · $49/month</h3>
              <p className="text-sm text-gray-600">
                Keep course email marketing and your customer records through
                the off-season. New bookings pause during winter. Existing
                reservations stay in place—review your tee sheet before
                scheduling.
              </p>
              {account.winter_state === "scheduled" ? (
                <>
                  <p className="text-sm">
                    Winter starts {formatBillingDate(account.winter_start_at!)}.
                    Regular billing of {dollars(account.standard_monthly_cents)}
                    /month and new bookings resume{" "}
                    {formatBillingDate(account.winter_end_at!)}.
                  </p>
                  {account.canCancelWinter && (
                    <form action={action}>
                      <input type="hidden" name="action" value="cancelWinter" />
                      <button className="text-sm underline" disabled={pending}>
                        Cancel scheduled Winter Plan
                      </button>
                    </form>
                  )}
                </>
              ) : (
                account.status === "active" && (
                  <form action={action} className="space-y-3">
                    <input type="hidden" name="action" value="winter" />
                    <p className="text-sm">
                      Starts on your next renewal
                      {account.current_period_end
                        ? `, ${formatBillingDate(account.current_period_end)}`
                        : ""}
                      . Choose a reopening date 28 days to seven months later.
                    </p>
                    {account.winter_state === "preparing" ? (
                      <p className="text-sm">
                        Your change needs to finish. Retry uses the dates you
                        already selected:{" "}
                        {account.winter_end_at &&
                          formatBillingDate(account.winter_end_at)}
                        .
                      </p>
                    ) : (
                      <label className="block text-sm">
                        Reopening date
                        <input
                          className={input}
                          name="reopening"
                          type="date"
                          required
                        />
                      </label>
                    )}
                    <label className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="reviewed"
                        value="yes"
                        required
                      />
                      I agree to $49 monthly during winter, with no refund for a
                      partial month. On my reopening date (noon UTC, morning in
                      Michigan), new bookings and my regular{" "}
                      {dollars(account.standard_monthly_cents)}/month
                      subscription automatically resume.
                    </label>
                    <button className={button} disabled={pending}>
                      {pending
                        ? "Updating…"
                        : account.winter_state === "preparing"
                          ? "Finish winter setup"
                          : "Schedule Winter Plan"}
                    </button>
                  </form>
                )
              )}
              {account.status === "trialing" && (
                <p className="text-sm">
                  Your free period is still active. Winter Plan becomes
                  available after paid monthly billing begins.
                </p>
              )}
            </div>
          )}
        </>
      )}
      <p className="text-sm text-gray-600">
        For payment details, invoices, cancellation, or contract changes,
        contact{" "}
        <a href="mailto:hello@teeahead.com" className="underline">
          hello@teeahead.com
        </a>
        .
      </p>
    </section>
  );
}
