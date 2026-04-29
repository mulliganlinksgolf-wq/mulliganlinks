import { createAdminClient } from '@/lib/supabase/admin'
import { sendBroadcastEmail } from '@/app/admin/communications/actions'

export const metadata = { title: 'Communications' }

const FILTER_LABELS: Record<string, string> = {
  all: 'All Members',
  eagle_ace: 'Eagle + Ace',
  ace: 'Ace only',
  eagle: 'Eagle only',
  fairway: 'Fairway only',
}

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const { sent } = await searchParams
  const admin = createAdminClient()

  const [membershipResult, historyResult] = await Promise.all([
    admin.from('memberships').select('tier').eq('status', 'active'),
    admin
      .from('admin_audit_log')
      .select('created_at, admin_email, details')
      .eq('event_type', 'email_sent')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const m = membershipResult.data ?? []
  const counts: Record<string, number> = {
    all: m.length,
    eagle_ace: m.filter((r: any) => ['eagle', 'ace'].includes(r.tier)).length,
    ace: m.filter((r: any) => r.tier === 'ace').length,
    eagle: m.filter((r: any) => r.tier === 'eagle').length,
    fairway: m.filter((r: any) => r.tier === 'fairway').length,
  }

  const history = historyResult.data ?? []

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Communications</h1>
        <p className="text-[#6B7770] text-sm mt-1">Send a broadcast email to your members.</p>
      </div>

      {sent && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
          Broadcast sent successfully
        </div>
      )}

      {/* Compose */}
      <form action={sendBroadcastEmail} className="bg-white rounded-xl ring-1 ring-black/5 p-6 space-y-5">
        <h2 className="font-bold text-[#1A1A1A]">Compose</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Recipients</label>
          <select
            name="filter"
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          >
            {Object.entries(FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label} ({counts[value] ?? 0} members)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Subject</label>
          <input
            name="subject"
            type="text"
            required
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Body</label>
          <textarea
            name="body"
            rows={6}
            required
            placeholder="Write your message here. Separate paragraphs with a blank line."
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90"
        >
          Send
        </button>
      </form>

      {/* Sent history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-[#1A1A1A]">Sent History</h2>
          <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-black/5">
            {history.map((row: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {row.details?.subject ?? '—'}
                    </p>
                    <p className="text-xs text-[#6B7770] mt-0.5">
                      {FILTER_LABELS[row.details?.filter] ?? row.details?.filter} · {row.details?.recipient_count ?? 0} recipients · by {row.admin_email}
                    </p>
                  </div>
                  <span className="text-xs text-[#6B7770] whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
