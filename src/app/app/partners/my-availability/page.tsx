import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { AvailabilityForm } from './AvailabilityForm'
import { DeleteAvailabilityButton } from './DeleteAvailabilityButton'

export const metadata: Metadata = { title: 'My Availability — TeeAhead' }

export default async function MyAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'

  const today = new Date().toISOString().slice(0, 10)
  const admin = createAdminClient()

  const [{ data: windows }, { data: courses }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select('id, available_date, time_preference, holes, notes, courses(name)')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .gte('available_date', today)
      .order('available_date', { ascending: true }),
    admin
      .from('courses')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
  ])

  type WindowSlot = {
    id: string
    available_date: string
    time_preference: string
    holes: string
    notes: string | null
    courses: { name: string } | null
  }

  const slots: WindowSlot[] = (windows ?? []).map(w => ({
    id: String(w.id),
    available_date: String(w.available_date),
    time_preference: String(w.time_preference),
    holes: String(w.holes),
    notes: w.notes ? String(w.notes) : null,
    courses: (w.courses && Array.isArray(w.courses) && w.courses.length > 0)
      ? { name: String(w.courses[0].name) }
      : null,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Availability</h1>
        <p className="text-[#8FA889] mt-1">
          Let other members know when you're free to play.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Your Upcoming Availability</h2>
          <span className="text-sm text-[#8FA889]">{slots.length} of 7 slots used</span>
        </div>
        {slots.length === 0 ? (
          <p className="text-[#8FA889] text-sm">No upcoming availability posted.</p>
        ) : (
          <div className="space-y-2">
            {slots.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-white font-medium text-sm">
                    {new Date(s.available_date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    <span className="capitalize text-[#8FA889]">{s.time_preference}</span>
                    {' · '}
                    <span className="text-[#8FA889]">{s.holes === 'either' ? 'Any holes' : `${s.holes} holes`}</span>
                  </p>
                  {s.courses && <p className="text-xs text-[#8FA889]">{s.courses.name}</p>}
                  {s.notes && <p className="text-xs text-[#8FA889] italic">"{s.notes}"</p>}
                </div>
                <DeleteAvailabilityButton availabilityId={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Availability</h2>
        {tier === 'fairway' ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white font-medium mb-2">Eagle or Ace membership required</p>
            <p className="text-[#8FA889] text-sm mb-4">
              Upgrade to post your availability and connect with other members.
            </p>
            <a
              href="/app/membership"
              className="inline-block bg-white text-[#1B4332] font-semibold px-6 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
            >
              Upgrade to Eagle →
            </a>
          </div>
        ) : (
          <AvailabilityForm courses={(courses ?? []) as Array<{ id: string; name: string }>} />
        )}
      </div>
    </div>
  )
}
