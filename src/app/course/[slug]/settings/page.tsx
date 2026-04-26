import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CourseSettingsForm } from '@/components/course/CourseSettingsForm'

export default async function CourseSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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
    </div>
  )
}
