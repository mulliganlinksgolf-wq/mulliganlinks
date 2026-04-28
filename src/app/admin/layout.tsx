import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from '@/components/admin/AdminSidebar'

// Hardcoded fallback — also checked against profiles.is_admin in DB
const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

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
    <div className="flex min-h-screen bg-[#FAF7F2]">
      <AdminSidebar userEmail={userEmail} openDisputeCount={openDisputeCount} />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  )
}
