import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export default async function CourseLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/course/${slug}/reports`)

  const { data: course } = await supabase
    .from('courses').select('name').eq('slug', slug).single()
  if (!course) notFound()

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#1B4332] mb-1">TeeAhead</div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">{course.name}</h1>
          <p className="text-[#6B7770] text-sm mt-1">Partner Portal</p>
        </div>
        <LoginForm slug={slug} />
      </div>
    </div>
  )
}
