// src/app/app/trading/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCredit } from '@/lib/trading'
import { claimListing, cancelListing } from '@/app/actions/trading'

export default async function TradingPage({
  searchParams,
}: {
  searchParams: Promise<{ listed?: string; claimed?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileRow },
    { data: availableListings },
    { data: myListings },
  ] = await Promise.all([
    supabase.from('profiles').select('teeahead_credit_cents').eq('id', user.id).single(),
    supabase
      .from('tee_time_listings')
      .select(`
        id, credit_amount_cents, expires_at, listed_at,
        profiles!listed_by_member_id ( full_name ),
        tee_times (
          scheduled_at,
          courses ( name )
        )
      `)
      .eq('status', 'active')
      .neq('listed_by_member_id', user.id)
      .order('expires_at', { ascending: true }),
    supabase
      .from('tee_time_listings')
      .select(`
        id, status, credit_amount_cents, expires_at,
        tee_times (
          scheduled_at,
          courses ( name )
        )
      `)
      .eq('listed_by_member_id', user.id)
      .order('listed_at', { ascending: false })
      .limit(5),
  ])

  const creditCents = profileRow?.teeahead_credit_cents ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = (availableListings ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mine = (myListings ?? []) as any[]
  const myActiveListings = mine.filter((l: { status: string }) => l.status === 'active')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          Member Exchange
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Available Times</h1>
        <p className="text-sm text-[#8FA889] mt-0.5">
          Tee times listed by other members — claim one to play.
        </p>
      </div>

      {/* Success banners */}
      {sp.listed === '1' && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 text-sm font-semibold">✓ Your time is listed</p>
          <p className="text-xs text-[#8FA889] mt-0.5">
            You&apos;ll get notified and credited instantly when someone claims it.
          </p>
        </div>
      )}
      {sp.claimed === '1' && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 text-sm font-semibold">✓ Time claimed — you&apos;re on the tee!</p>
          <p className="text-xs text-[#8FA889] mt-0.5">Show your booking confirmation at the pro shop.</p>
        </div>
      )}

      {/* Credit balance */}
      {creditCents > 0 && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#163d2a' }}>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#8FA889]">Your TeeAhead Credit</p>
            <p className="text-xl font-bold text-white">{formatCredit(creditCents)}</p>
          </div>
          <p className="text-xs text-[#8FA889] max-w-[160px] text-right">
            Applied automatically on your next booking
          </p>
        </div>
      )}

      {/* My active listings */}
      {myActiveListings.length > 0 && (
        <section className="space-y-2">
          <p className="text-[8px] uppercase tracking-widest text-[#aaa]">My Active Listings</p>
          {myActiveListings.map((l: { id: string; tee_times?: { courses?: { name?: string }; scheduled_at?: string }; credit_amount_cents: number }) => (
            <div key={l.id} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#163d2a' }}>
              <div>
                <p className="text-sm font-medium text-white">{l.tee_times?.courses?.name}</p>
                <p className="text-xs text-[#8FA889]">
                  {new Date(l.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                  })}
                </p>
                <p className="text-xs text-[#8FA889]">Credit if claimed: {formatCredit(l.credit_amount_cents)}</p>
              </div>
              <form action={async () => { 'use server'; await cancelListing(l.id); redirect('/app/trading') }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Cancel
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      {/* Available listings from other members */}
      <section className="space-y-2">
        <p className="text-[8px] uppercase tracking-widest text-[#aaa]">
          Available Times ({listings.length})
        </p>
        {listings.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: '#163d2a' }}>
            <p className="text-[#8FA889] text-sm">No times listed right now.</p>
            <p className="text-xs text-[#8FA889]/60 mt-1">
              Check back later or list your own from{' '}
              <Link href="/app/bookings" className="underline hover:text-white">My Bookings</Link>.
            </p>
          </div>
        ) : (
          listings.map(l => {
            const scheduledAt = new Date(l.tee_times?.scheduled_at)
            const expiresAt   = new Date(l.expires_at)
            const hoursLeft   = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))

            async function handleClaim() {
              'use server'
              const result = await claimListing(l.id)
              if (!result.error) redirect('/app/trading?claimed=1')
            }

            return (
              <div key={l.id} className="rounded-xl p-4 space-y-3" style={{ background: '#163d2a' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{l.tee_times?.courses?.name}</p>
                    <p className="text-xs text-[#8FA889] mt-0.5">
                      {scheduledAt.toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                      })}
                    </p>
                    <p className="text-xs text-[#8FA889]/60 mt-0.5">
                      Listed by {l.profiles?.full_name?.split(' ')[0] ?? 'a member'}
                      {' · '}
                      {hoursLeft > 0 ? `${hoursLeft}h left` : 'Expiring soon'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCredit(l.credit_amount_cents)}</p>
                    <p className="text-[10px] text-[#8FA889]">face value</p>
                  </div>
                </div>
                <form action={handleClaim}>
                  <button
                    type="submit"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors"
                    style={{ background: '#E0A800' }}
                  >
                    Claim This Time →
                  </button>
                </form>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
