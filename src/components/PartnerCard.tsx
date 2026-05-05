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

interface PartnerCardProps {
  availability: PartnerAvailability
  canRequest: boolean       // false for fairway tier
  alreadyRequested: boolean
  onRequestClick: (availability: PartnerAvailability) => void
}

export function PartnerCard({
  availability,
  canRequest,
  alreadyRequested,
  onRequestClick,
}: PartnerCardProps) {
  const { profile, preferences, course } = availability
  const name = displayName(profile?.full_name ?? null)
  const initials = getInitials(profile?.full_name ?? null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-[#8FA889] text-xs">
            HCP: {preferences?.handicap_index ?? 'Not listed'}
          </p>
        </div>
        <span className="ml-auto text-xs font-medium bg-white/10 text-white px-2.5 py-1 rounded-full capitalize">
          {TIME_LABELS[availability.time_preference] ?? availability.time_preference}
        </span>
      </div>

      {/* Preference chips */}
      <div className="flex flex-wrap gap-1.5">
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
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            No drinks
          </span>
        )}
      </div>

      {/* Course + bio */}
      {course && (
        <p className="text-xs text-[#8FA889]">📍 {course.name}</p>
      )}
      {preferences?.bio && (
        <p className="text-sm text-[#8FA889] line-clamp-2">{preferences.bio}</p>
      )}
      {availability.notes && (
        <p className="text-xs text-[#8FA889] italic">"{availability.notes}"</p>
      )}

      {/* Action */}
      {canRequest ? (
        alreadyRequested ? (
          <button
            disabled
            className="w-full text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] cursor-default"
          >
            Request already sent
          </button>
        ) : (
          <button
            onClick={() => onRequestClick(availability)}
            className="w-full text-sm font-semibold py-2 rounded-lg bg-white text-[#1B4332] hover:bg-[#FAF7F2]"
          >
            Request to Play
          </button>
        )
      ) : (
        <a
          href="/app/membership"
          className="block text-center text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] hover:bg-white/10"
        >
          Eagle members can connect →
        </a>
      )}
    </div>
  )
}
