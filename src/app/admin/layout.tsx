import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from '@/components/admin/AdminSidebar'

// Hardcoded fallback, also checked against profiles.is_admin in DB
const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isHardcoded = ADMIN_EMAILS.includes(user.email ?? '')
  if (!isHardcoded) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) redirect('/app')
  }

  const admin = createAdminClient()
  const { data: disputes } = await admin
    .from('payment_disputes')
    .select('id')
    .eq('status', 'open')
  const openDisputeCount = disputes?.length ?? 0

  const userEmail = user.email ?? ''

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAF7F2]">
      <div className="hidden lg:block"><AdminSidebar userEmail={userEmail} openDisputeCount={openDisputeCount} /></div>
      <details className="bg-slate-900 text-white lg:hidden"><summary className="cursor-pointer px-4 py-4 text-sm font-semibold">TeeAhead Admin · Menu</summary><AdminSidebar userEmail={userEmail} openDisputeCount={openDisputeCount} /></details>
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  )
}
