import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerAvailability, Gender, OpenTo } from '@/types/partners'
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

function isGenderCompatible(
  viewerGender: Gender,
  viewerOpenTo: OpenTo,
  posterGender: Gender,
  posterOpenTo: OpenTo,
): boolean {
  // Check poster's preference: are they open to the viewer?
  if (posterOpenTo !== 'anyone') {
    if (posterOpenTo === 'same_gender_only' && posterGender !== viewerGender) return false
    if (posterOpenTo === 'men_only' && viewerGender !== 'male') return false
    if (posterOpenTo === 'women_only' && viewerGender !== 'female') return false
  }
  // Check viewer's preference: are they open to the poster?
  if (viewerOpenTo !== 'anyone') {
    if (viewerOpenTo === 'same_gender_only' && viewerGender !== posterGender) return false
    if (viewerOpenTo === 'men_only' && posterGender !== 'male') return false
    if (viewerOpenTo === 'women_only' && posterGender !== 'female') return false
  }
  return true
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

  const { count: pendingRequestCount } = await supabase
    .from('partner_connection_requests')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  const [{ data: rows }, { data: sentRequests }, { data: viewerPrefs }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select(`
        id, profile_id, available_date, time_preference, holes, notes, course_id, expires_at, is_active, created_at,
        profile:profiles!profile_id(
          id, full_name, avatar_url,
          partner_preferences(
            id, profile_id, handicap_index, pace_preference, prefers_walking,
            drinks_ok, smoking_ok, preferred_holes, skill_level, bio, is_visible, updated_at,
            play_style, gender, open_to
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
    supabase
      .from('partner_preferences')
      .select('gender, open_to')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ])

  const viewerGender = (viewerPrefs?.gender ?? 'prefer_not_to_say') as Gender
  const viewerOpenTo = (viewerPrefs?.open_to ?? 'anyone') as OpenTo

  // Hoist preferences out of nested profile join; apply mutual gender filter
  const availabilities = (rows ?? [])
    .map((row: any) => ({
      ...row,
      profile: {
        id: row.profile?.id,
        full_name: row.profile?.full_name,
        avatar_url: row.profile?.avatar_url ?? null,
      },
      preferences: Array.isArray(row.profile?.partner_preferences)
        ? row.profile.partner_preferences[0] ?? undefined
        : row.profile?.partner_preferences ?? undefined,
    }))
    .filter((av: any) => {
      const prefs = av.preferences
      if (!prefs) return true // no prefs set — show them
      const posterGender = (prefs.gender ?? 'prefer_not_to_say') as Gender
      const posterOpenTo = (prefs.open_to ?? 'anyone') as OpenTo
      return isGenderCompatible(viewerGender, viewerOpenTo, posterGender, posterOpenTo)
    }) as unknown as PartnerAvailability[]

  const sentToAvailabilityIds = (sentRequests ?? [])
    .map((r: { availability_id: string | null }) => r.availability_id)
    .filter((id): id is string => id !== null)

  // Fetch avg ratings for all poster profile_ids
  const profileIds = [...new Set(availabilities.map(av => av.profile_id))]
  const ratingsMap: Record<string, { avg: number; count: number }> = {}
  if (profileIds.length > 0) {
    const { data: ratings } = await supabase
      .from('partner_ratings')
      .select('ratee_id, stars')
      .in('ratee_id', profileIds)
    for (const r of (ratings ?? [])) {
      const entry = ratingsMap[r.ratee_id] ?? { avg: 0, count: 0 }
      entry.count += 1
      entry.avg = (entry.avg * (entry.count - 1) + r.stars) / entry.count
      ratingsMap[r.ratee_id] = entry
    }
  }

  const availabilitiesWithRatings = availabilities.map(av => ({
    ...av,
    avg_rating: ratingsMap[av.profile_id]?.count >= 3 ? ratingsMap[av.profile_id].avg : null,
    rating_count: ratingsMap[av.profile_id]?.count ?? 0,
  }))

  // Group by date
  const groupMap = new Map<string, PartnerAvailability[]>()
  for (const av of availabilitiesWithRatings) {
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
            href="/app/partners/requests"
            className="relative bg-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/20"
          >
            Requests
            {(pendingRequestCount ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequestCount}
              </span>
            )}
          </a>
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
