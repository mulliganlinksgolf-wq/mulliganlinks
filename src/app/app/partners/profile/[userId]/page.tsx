import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Partner Profile — TeeAhead' }

const PLAY_STYLE_LABELS: Record<string, string> = {
  casual: '🎉 Casual',
  moderate: '⛳ Moderate',
  competitive: '🏆 Competitive',
}

const PACE_LABELS: Record<string, string> = {
  relaxed: 'Relaxed pace',
  moderate: 'Moderate pace',
  fast: 'Fast pace',
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function StarRow({ avg, count }: { avg: number; count: number }) {
  const full = Math.round(avg)
  return (
    <span className="flex items-center gap-1 text-sm text-[#8FA889]">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= full ? 'text-[#E0A800] text-lg' : 'text-lg opacity-20'}>★</span>
      ))}
      <span className="ml-1">{avg.toFixed(1)} ({count} {count === 1 ? 'rating' : 'ratings'})</span>
    </span>
  )
}

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: targetUserId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Security gate: only accepted partners can view each other's profiles
  const { data: connection } = await supabase
    .from('partner_connection_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`
    )
    .maybeSingle()

  if (!connection) notFound()

  const [{ data: profile }, { data: prefs }, { data: ratings }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', targetUserId).single(),
    supabase.from('partner_preferences').select('*').eq('profile_id', targetUserId).maybeSingle(),
    supabase.from('partner_ratings').select('stars').eq('ratee_id', targetUserId),
  ])

  if (!profile) notFound()

  const name = displayName(profile.full_name)
  const initials = getInitials(profile.full_name)
  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / ratings.length
    : null
  const ratingCount = ratings?.length ?? 0

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link href="/app/partners/requests" className="text-sm text-[#8FA889] hover:text-white flex items-center gap-1">
        ← Back to Requests
      </Link>

      {/* Profile header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-white/10">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{name}</h1>
            {prefs?.handicap_index != null && (
              <p className="text-[#8FA889] text-sm mt-0.5">HCP {prefs.handicap_index}</p>
            )}
            {avgRating != null && ratingCount > 0 && (
              <div className="mt-1.5">
                <StarRow avg={avgRating} count={ratingCount} />
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {prefs?.bio && (
          <p className="text-[#8FA889] text-sm leading-relaxed border-t border-white/10 pt-4">
            {prefs.bio}
          </p>
        )}
      </div>

      {/* Preferences */}
      {prefs && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-[#8FA889] font-medium">Playing Style</h2>
          <div className="flex flex-wrap gap-2">
            {prefs.play_style && (
              <span className="text-sm bg-white/10 text-white px-3 py-1.5 rounded-full">
                {PLAY_STYLE_LABELS[prefs.play_style] ?? prefs.play_style}
              </span>
            )}
            {prefs.pace_preference && (
              <span className="text-sm bg-white/10 text-[#8FA889] px-3 py-1.5 rounded-full">
                {PACE_LABELS[prefs.pace_preference] ?? prefs.pace_preference}
              </span>
            )}
            {prefs.preferred_holes && (
              <span className="text-sm bg-white/10 text-[#8FA889] px-3 py-1.5 rounded-full">
                {prefs.preferred_holes === 'either' ? '9 or 18 holes' : `${prefs.preferred_holes} holes`}
              </span>
            )}
            {prefs.prefers_walking !== undefined && (
              <span className="text-sm bg-white/10 text-[#8FA889] px-3 py-1.5 rounded-full">
                {prefs.prefers_walking ? '🚶 Walking' : '🚗 Riding'}
              </span>
            )}
            {prefs.drinks_ok === false && (
              <span className="text-sm bg-white/10 text-[#8FA889] px-3 py-1.5 rounded-full">No drinks</span>
            )}
            {prefs.smoking_ok === true && (
              <span className="text-sm bg-white/10 text-[#8FA889] px-3 py-1.5 rounded-full">Smoking OK</span>
            )}
          </div>
        </div>
      )}

      {/* Skill */}
      {prefs?.skill_level && prefs.skill_level !== 'any' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-[#8FA889] font-medium mb-2">Skill Level</h2>
          <p className="text-white capitalize text-sm">{prefs.skill_level}</p>
        </div>
      )}
    </div>
  )
}
