import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/courseRole'
import { RewardsSettingsForm } from '@/components/course/RewardsSettingsForm'

export default async function RewardsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: settings } = await supabase
    .from('course_redemption_settings')
    .select('*')
    .eq('course_id', course.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Rewards Settings</h1>
        <p className="text-sm text-[#6B7770] mt-1">
          Control how members earn and redeem free rounds at your course.
        </p>
      </div>
      <RewardsSettingsForm courseId={course.id} initial={settings} />
    </div>
  )
}
