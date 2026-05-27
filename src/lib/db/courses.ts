import { createAdminClient } from '@/lib/supabase/admin'

export type CourseOnboarding = {
  id: string
  name: string
  slug: string
  invite_token: string | null
  invite_used: boolean
  legal_entity_name: string | null
  gm_name: string | null
  email: string | null
  phone: string | null
  billing_email: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  tax_id: string | null
  holes: number
  description: string | null
  amenities: string[] | null
  onboarding_step: number
  onboarding_complete: boolean
  is_live: boolean
}

export async function getCourseByInviteToken(token: string): Promise<CourseOnboarding | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, name, slug, invite_token, invite_used, legal_entity_name, gm_name, email, phone, billing_email, website, address, city, state, zip, tax_id, holes, description, amenities, onboarding_step, onboarding_complete, is_live'
    )
    .eq('invite_token', token)
    .single()

  if (error || !data) return null
  return data as CourseOnboarding
}

export async function getCourseById(id: string): Promise<CourseOnboarding | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, name, slug, invite_token, invite_used, legal_entity_name, gm_name, email, phone, billing_email, website, address, city, state, zip, tax_id, holes, description, amenities, onboarding_step, onboarding_complete, is_live'
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as CourseOnboarding
}
