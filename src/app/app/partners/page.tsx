import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerAvailability } from '@/types/partners'
import { BrowseFeed } from './BrowseFeed'

export const metadata: Metadata = { title: 'Find a Partner — TeeAhead' }

function buildDateLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  const formatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (diff === 0) return `Today — ${formatted}`
  if (diff === 1) return `Tomorrow — ${formatted}`
  return formatted
}

export default async function PartnersPage() {
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
  const canRequest = tier !== 'fairway'

  const today = new Date().toISOString().slice(0, 10)
  const fourteenDays = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)

  const [{ data: rows }, { data: sentRequests }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select(`
        id, profile_id, available_date, time_preference, holes, notes, course_id, expires_at, is_active, created_at,
        profile:profiles!profile_id(
          id, full_name,
          partner_preferences(
            id, profile_id, handicap_index, pace_preference, prefers_walking,
            drinks_ok, smoking_ok, preferred_holes, skill_level, bio, is_visible, updated_at
          )
        ),
        course:courses(id, name, slug)
      `)
      .neq('profile_id', user.id)
      .eq('is_active', true)
      .gte('available_date', today)
      .lte('available_date', fourteenDays)
      .order('available_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('partner_connection_requests')
      .select('availability_id')
      .eq('requester_id', user.id)
      .in('status', ['pending', 'accepted']),
  ])

  // Hoist preferences out of the nested profile join onto the top-level shape
  const availabilities = (rows ?? []).map((row: any) => ({
    ...row,
    profile: {
      id: row.profile?.id,
      full_name: row.profile?.full_name,
    },
    preferences: Array.isArray(row.profile?.partner_preferences)
      ? row.profile.partner_preferences[0] ?? undefined
      : row.profile?.partner_preferences ?? undefined,
  })) as unknown as PartnerAvailability[]
  const sentToAvailabilityIds = (sentRequests ?? [])
    .map((r: { availability_id: string | null }) => r.availability_id)
    .filter((id): id is string => id !== null)

  // Group by date
  const groupMap = new Map<string, PartnerAvailability[]>()
  for (const av of availabilities) {
    const existing = groupMap.get(av.available_date) ?? []
    existing.push(av)
    groupMap.set(av.available_date, existing)
  }
  const grouped = Array.from(groupMap.entries()).map(([date, items]) => ({
    date,
    dateLabel: buildDateLabel(date),
    items,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Playing Partner</h1>
          <p className="text-[#8FA889] mt-1">Members available to play in the next 14 days.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/app/partners/preferences"
            className="bg-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/20"
          >
            My Profile
          </a>
          <a
            href="/app/partners/my-availability"
            className="bg-white text-[#1B4332] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
          >
            + My Availability
          </a>
        </div>
      </div>

      <BrowseFeed
        grouped={grouped}
        canRequest={canRequest}
        sentToAvailabilityIds={sentToAvailabilityIds}
      />
    </div>
  )
}
