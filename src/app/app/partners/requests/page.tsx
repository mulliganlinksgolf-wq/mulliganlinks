import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ConnectionRequest } from '@/types/partners'
import { RespondButtons, WithdrawButton } from './RequestActions'

export const metadata: Metadata = { title: 'Partner Requests — TeeAhead' }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
  withdrawn: 'bg-white/10 text-[#8FA889]',
}

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'sent' ? 'sent' : 'received'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: received }, { data: sent }] = await Promise.all([
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        requester:profiles!requester_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        recipient:profiles!recipient_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const receivedRequests = (received ?? []) as unknown as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]
  const sentRequests = (sent ?? []) as unknown as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]

  const pendingReceived = receivedRequests.filter(r => r.status === 'pending')
  const historicReceived = receivedRequests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Partner Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['received', 'sent'] as const).map(t => (
          <a
            key={t}
            href={t === 'received' ? '/app/partners/requests' : '/app/partners/requests?tab=sent'}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === t ? 'bg-white text-[#1B4332]' : 'text-[#8FA889] hover:text-white'
            }`}
          >
            {t}
            {t === 'received' && pendingReceived.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingReceived.length}
              </span>
            )}
          </a>
        ))}
      </div>

      {activeTab === 'received' ? (
        <div className="space-y-6">
          {/* Pending */}
          {pendingReceived.length === 0 && historicReceived.length === 0 && (
            <p className="text-[#8FA889]">No requests yet.</p>
          )}
          {pendingReceived.length > 0 && (
            <div className="space-y-3">
              {pendingReceived.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {displayName((r.requester as any)?.full_name ?? null)}
                      </p>
                      {r.availability?.available_date && (
                        <p className="text-[#8FA889] text-xs">
                          {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                            'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                          )}
                        </p>
                      )}
                    </div>
                    <RespondButtons requestId={r.id} />
                  </div>
                  {r.message && (
                    <p className="text-sm text-[#8FA889] italic border-l-2 border-white/10 pl-3">
                      "{r.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {historicReceived.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#8FA889] uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-2">
                {historicReceived.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <p className="text-white text-sm">
                      {displayName((r.requester as any)?.full_name ?? null)}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sentRequests.length === 0 && (
            <p className="text-[#8FA889]">You haven't sent any requests yet.</p>
          )}
          {sentRequests.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-white text-sm font-medium">
                  {displayName((r.recipient as any)?.full_name ?? null)}
                </p>
                {r.availability?.available_date && (
                  <p className="text-[#8FA889] text-xs">
                    {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                      'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[r.status]}`}>
                  {r.status}
                </span>
                {r.status === 'pending' && <WithdrawButton requestId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
