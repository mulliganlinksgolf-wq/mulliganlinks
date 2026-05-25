import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { OperationsSettingsForm } from '@/components/course/OperationsSettingsForm'

export default async function OperationsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)

  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select(
      'id, name, slug, latitude, longitude, timezone, sunrise_offset_minutes, sunset_offset_minutes, sunrise_automation_enabled, allow_back_nine_booking'
    )
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/course/${slug}/settings`}
          className="text-sm text-[#6B7770] hover:text-[#1A1A1A] transition-colors"
        >
          ← Back to settings
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">Operations</h1>
        <p className="text-sm text-[#6B7770] mt-1">
          Location, hours automation, and back-nine booking. Sunrise/sunset windows refresh nightly.
        </p>
      </div>

      <OperationsSettingsForm slug={slug} course={course} />
    </div>
  )
}
