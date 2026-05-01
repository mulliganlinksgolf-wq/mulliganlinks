import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CourseSettingsForm } from '@/components/course/CourseSettingsForm'
import { requireManager } from '@/lib/courseRole'

export default async function CourseSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: admins } = await supabase
    .from('course_admins')
    .select('role, profiles(full_name)')
    .eq('course_id', course.id)

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Course Settings</h1>
      <CourseSettingsForm course={course} admins={admins as any ?? []} />
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1A1A1A] text-sm">Team members</p>
          <p className="text-xs text-[#6B7770] mt-0.5">Invite and manage staff who can access this portal.</p>
        </div>
        <Link
          href={`/course/${slug}/settings/team`}
          className="text-sm font-medium text-[#1B4332] hover:underline"
        >
          Manage →
        </Link>
      </div>
    </div>
  )
}
