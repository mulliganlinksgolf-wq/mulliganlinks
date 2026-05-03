// src/app/course/[slug]/trading/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { formatCredit } from '@/lib/trading'
import { updateTradingSettings } from '@/app/actions/trading'

export default async function CourseTradingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { slug } = await params
  const { saved } = await searchParams
  await requireManager(slug)

  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, trading_enabled, trading_min_hours_before')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const admin = createAdminClient()
  const [{ data: activeListings }, { data: recentTransfers }] = await Promise.all([
    admin
      .from('tee_time_listings')
      .select(`
        id, credit_amount_cents, expires_at, listed_at,
        profiles!listed_by_member_id ( full_name ),
        tee_times ( scheduled_at )
      `)
      .eq('course_id', course.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: true }),
    admin
      .from('tee_time_transfers')
      .select(`
        id, credit_issued_cents, transferred_at,
        from_profile:profiles!from_member_id ( full_name ),
        to_profile:profiles!to_member_id ( full_name )
      `)
      .eq('course_id', course.id)
      .order('transferred_at', { ascending: false })
      .limit(20),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings   = (activeListings   ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transfers  = (recentTransfers  ?? []) as any[]

  async function handleSettingsUpdate(formData: FormData) {
    'use server'
    await updateTradingSettings(course!.id, {
      trading_enabled:           formData.get('trading_enabled') === 'on',
      trading_min_hours_before:  parseInt(formData.get('trading_min_hours_before') as string, 10),
    })
    redirect(`/course/${slug}/trading?saved=1`)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Member Trading Board</h1>
        <p className="text-sm text-[#6B7770] mt-1">
          Members can list tee times they can&apos;t use. Other members claim them. You keep your revenue — no refunds, no admin work.
        </p>
      </div>

      {saved === '1' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-emerald-700 text-sm font-semibold">✓ Settings saved</p>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#1A1A1A]">Settings</h2>
        <form action={handleSettingsUpdate} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Enable member trading</p>
              <p className="text-xs text-[#6B7770]">Allow members to list and claim tee times</p>
            </div>
            <input
              type="checkbox"
              name="trading_enabled"
              defaultChecked={course.trading_enabled}
              className="h-4 w-4 accent-[#1B4332]"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#1A1A1A]">
                Minimum hours before tee time
              </label>
              <p className="text-xs text-[#6B7770]">Listings expire this many hours before the tee time</p>
            </div>
            <select
              name="trading_min_hours_before"
              defaultValue={String(course.trading_min_hours_before)}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1B4332] text-[#FAF7F2] text-sm font-semibold rounded-lg hover:bg-[#1B4332]/90 transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Active listings */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[#1A1A1A]">
          Active Listings ({listings.length})
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Member', 'Tee Time', 'Credit Value', 'Expires'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">
                    No active listings.{' '}
                    {!course.trading_enabled && 'Enable trading above to let members list their times.'}
                  </td>
                </tr>
              ) : listings.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{l.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">
                    {new Date(l.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-[#1A1A1A] font-semibold">
                    {formatCredit(l.credit_amount_cents)}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7770] text-xs">
                    {new Date(l.expires_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent transfers */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[#1A1A1A]">Recent Transfers</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['From', 'To', 'Credit Issued', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">
                    No transfers yet.
                  </td>
                </tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-[#1A1A1A]">{t.from_profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#1A1A1A] font-medium">{t.to_profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {formatCredit(t.credit_issued_cents)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7770] text-xs">
                    {new Date(t.transferred_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
