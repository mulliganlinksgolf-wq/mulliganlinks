import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/AppSidebar'
import AppBottomNav from '@/components/AppBottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0f2d1d] overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto md:pl-56">
        <div className="px-8 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <AppBottomNav />
    </div>
  )
}
