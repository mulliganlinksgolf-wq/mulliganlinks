import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { getCourseHours, getCoursePricing, getTeeSheetConfig } from '@/lib/db/onboarding'
import type { TeeSheetConfig } from '@/lib/db/onboarding'
import { TeeSheetSettingsForm } from '@/components/course/TeeSheetSettingsForm'
import type { DayHours } from '@/components/onboarding/HoursEditor'
import type { PricingRow } from '@/components/onboarding/PricingEditor'

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_CONFIG: TeeSheetConfig = {
  id: '',
  course_id: '',
  interval_minutes: 10,
  max_players: 4,
  advance_booking_days: 14,
  cart_policy: 'optional',
  cancellation_window_minutes: 60,
  rain_check_policy: 'full_credit',
}

export default async function TeeSheetSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (courseError && courseError.code !== 'PGRST116') {
    throw new Error(`[TeeSheetSettingsPage] course query failed: ${courseError.message}`)
  }
  if (!course) notFound()

  const [rawHours, rawPricing, config] = await Promise.all([
    getCourseHours(course.id),
    getCoursePricing(course.id),
    getTeeSheetConfig(course.id),
  ])

  const hours: DayHours[] = rawHours.map(h => ({
    dayOfWeek: h.day_of_week,
    label: DAY_LABELS[h.day_of_week] ?? String(h.day_of_week),
    isOpen: h.is_open,
    openTime: h.open_time,
    closeTime: h.close_time,
  }))

  const pricing: PricingRow[] = rawPricing.map(p => ({
    id: p.id,
    rateName: p.rate_name,
    greenFeeCents: p.green_fee_cents,
    cartFeeCents: p.cart_fee_cents,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/course/${slug}`}
          className="text-sm text-[#6B7770] hover:text-[#1A1A1A] transition-colors"
        >
          ← Back to Tee Times
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">Tee Sheet Settings</h1>
      </div>

      <TeeSheetSettingsForm
        courseId={course.id}
        initialHours={hours}
        initialPricing={pricing}
        initialConfig={config ?? { ...DEFAULT_CONFIG, course_id: course.id }}
      />
    </div>
  )
}
