export type PacePreference = 'relaxed' | 'moderate' | 'fast'
export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'flexible'
export type HolePreference = '9' | '18' | 'either'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'any'
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export type PlayStyle = 'casual' | 'moderate' | 'competitive'
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
export type OpenTo = 'anyone' | 'same_gender_only' | 'men_only' | 'women_only'

export interface PartnerPreferences {
  id: string
  profile_id: string
  handicap_index: number | null
  pace_preference: PacePreference | null
  prefers_walking: boolean
  drinks_ok: boolean
  smoking_ok: boolean
  preferred_holes: HolePreference
  skill_level: SkillLevel
  bio: string | null
  is_visible: boolean
  updated_at: string
  // v2
  play_style: PlayStyle
  gender: Gender
  open_to: OpenTo
}

export interface PartnerRating {
  id: string
  rater_id: string
  ratee_id: string
  connection_request_id: string
  stars: number
  comment: string | null
  created_at: string
}

export interface PartnerAvailability {
  id: string
  profile_id: string
  available_date: string
  time_preference: TimePreference
  course_id: string | null
  holes: HolePreference
  notes: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  // joined
  profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  preferences?: PartnerPreferences
  course?: {
    id: string
    name: string
    slug: string
  }
  avg_rating?: number | null
  rating_count?: number
}

export interface ConnectionRequest {
  id: string
  requester_id: string
  recipient_id: string
  availability_id: string | null
  message: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
  requester?: { full_name: string | null; avatar_url: string | null }
  recipient?: { full_name: string | null; avatar_url: string | null }
  availability?: { available_date: string } | null
}
