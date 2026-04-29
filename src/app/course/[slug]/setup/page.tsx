import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SetupForm from './SetupForm'

export default async function CourseSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams
  if (!token) notFound()

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('crm_course_users')
    .select('id, name, email, setup_token_expires_at, courses(name)')
    .eq('setup_token', token)
    .is('user_id', null)
    .single()

  const courseName = invite
    ? (Array.isArray(invite.courses) ? invite.courses[0]?.name : (invite.courses as { name: string } | null)?.name)
    : null

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Invalid setup link</h1>
          <p className="text-[#6B7770] mt-2 text-sm">This link is invalid or already used. Contact your TeeAhead account manager.</p>
        </div>
      </div>
    )
  }

  if (new Date(invite.setup_token_expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Link expired</h1>
          <p className="text-[#6B7770] mt-2 text-sm">Setup links expire after 72 hours. Contact your TeeAhead account manager to resend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#1B4332] mb-1">TeeAhead</div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Welcome, {invite.name}</h1>
          {courseName && <p className="text-[#6B7770] text-sm mt-1">{courseName} Partner Portal</p>}
        </div>
        <p className="text-sm text-[#6B7770] mb-6 text-center">Set a password to activate your account.</p>
        <SetupForm token={token} slug={slug} email={invite.email} />
      </div>
    </div>
  )
}
