import type { PartnerAvailability } from '@/types/partners'

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

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible',
}

const PLAY_STYLE_LABELS: Record<string, string> = {
  casual: '🎉 Casual', moderate: '⛳ Moderate', competitive: '🏆 Competitive',
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  const full = Math.round(avg)
  return (
    <span className="flex items-center gap-1 text-xs text-[#8FA889]">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= full ? 'text-[#E0A800]' : 'opacity-30'}>★</span>
      ))}
      <span className="ml-0.5">{avg.toFixed(1)} ({count})</span>
    </span>
  )
}

interface PartnerCardProps {
  availability: PartnerAvailability
  canRequest: boolean
  alreadyRequested: boolean
  onRequestClick: (availability: PartnerAvailability) => void
}

export function PartnerCard({ availability, canRequest, alreadyRequested, onRequestClick }: PartnerCardProps) {
  const { profile, preferences, course } = availability
  const name = displayName(profile?.full_name ?? null)
  const initials = getInitials(profile?.full_name ?? null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-[#8FA889] text-xs">HCP: {preferences?.handicap_index ?? 'Not listed'}</p>
          {availability.avg_rating != null && availability.rating_count != null && (
            <StarRating avg={availability.avg_rating} count={availability.rating_count} />
          )}
        </div>
        <span className="ml-auto text-xs font-medium bg-white/10 text-white px-2.5 py-1 rounded-full capitalize flex-shrink-0">
          {TIME_LABELS[availability.time_preference] ?? availability.time_preference}
        </span>
      </div>

      {/* Preference chips */}
      <div className="flex flex-wrap gap-1.5">
        {preferences?.play_style && preferences.play_style !== 'casual' && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            {PLAY_STYLE_LABELS[preferences.play_style] ?? preferences.play_style}
          </span>
        )}
        {preferences?.prefers_walking !== undefined && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            {preferences.prefers_walking ? '🚶 Walking' : '🚗 Riding'}
          </span>
        )}
        {preferences?.pace_preference && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full capitalize">
            {preferences.pace_preference} pace
          </span>
        )}
        <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
          {availability.holes === 'either' ? '9 or 18' : `${availability.holes} holes`}
        </span>
        {preferences?.drinks_ok === false && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">No drinks</span>
        )}
        {preferences?.smoking_ok === true && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">Smoking OK</span>
        )}
      </div>

      {course && <p className="text-xs text-[#8FA889]">📍 {course.name}</p>}
      {preferences?.bio && <p className="text-sm text-[#8FA889] line-clamp-2">{preferences.bio}</p>}
      {availability.notes && <p className="text-xs text-[#8FA889] italic">"{availability.notes}"</p>}

      {canRequest ? (
        alreadyRequested ? (
          <button disabled className="w-full text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] cursor-default">
            Request already sent
          </button>
        ) : (
          <button onClick={() => onRequestClick(availability)}
            className="w-full text-sm font-semibold py-2 rounded-lg bg-white text-[#1B4332] hover:bg-[#FAF7F2]">
            Request to Play
          </button>
        )
      ) : (
        <a href="/app/membership"
          className="block text-center text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] hover:bg-white/10">
          Eagle members can connect →
        </a>
      )}
    </div>
  )
}
