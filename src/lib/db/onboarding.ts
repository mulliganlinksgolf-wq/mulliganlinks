import { createAdminClient } from '@/lib/supabase/admin'

export type TeeSheetConfig = {
  id: string
  course_id: string
  interval_minutes: number
  max_players: number
  advance_booking_days: number
  cart_policy: 'mandatory' | 'optional' | 'walking_only'
  cancellation_window_minutes: number
  rain_check_policy: 'full_credit' | 'half_credit' | 'none'
}

export type CourseHours = {
  id: string
  course_id: string
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

export type CoursePricing = {
  id: string
  course_id: string
  rate_name: string
  green_fee_cents: number
  cart_fee_cents: number
  display_order: number
  is_active: boolean
}

export async function getTeeSheetConfig(courseId: string): Promise<TeeSheetConfig | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('course_tee_sheet_config')
    .select('id, course_id, interval_minutes, max_players, advance_booking_days, cart_policy, cancellation_window_minutes, rain_check_policy')
    .eq('course_id', courseId)
    .single()

  if (error || !data) return null
  return data as TeeSheetConfig
}

export async function getCourseHours(courseId: string): Promise<CourseHours[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('course_hours')
    .select('id, course_id, day_of_week, is_open, open_time, close_time')
    .eq('course_id', courseId)
    .order('day_of_week', { ascending: true })

  if (error || !data) return []
  return data as CourseHours[]
}

export async function getCoursePricing(courseId: string): Promise<CoursePricing[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('course_pricing')
    .select('id, course_id, rate_name, green_fee_cents, cart_fee_cents, display_order, is_active')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error || !data) return []
  return data as CoursePricing[]
}
