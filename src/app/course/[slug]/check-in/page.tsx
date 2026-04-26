import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CheckInSearch from '@/components/course/CheckInSearch'

export const metadata = { title: 'Member Check-in' }

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Member check-in</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          Search by name or email to find a MulliganLinks member and award Fairway Points for their round.
        </p>
      </div>

      <CheckInSearch courseId={course.id} courseName={course.name} slug={slug} />
    </div>
  )
}
