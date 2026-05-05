import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/AppSidebar'
import AppBottomNav from '@/components/AppBottomNav'
import { SIDEBAR_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count: pendingCount } = await supabase
    .from('partner_connection_requests')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  const pending = pendingCount ?? 0

  const sidebarItems = SIDEBAR_NAV_ITEMS.map(item =>
    item.href === '/app/partners' && pending > 0
      ? { ...item, badge: pending }
      : item
  )
  const bottomItems = BOTTOM_NAV_ITEMS.map(item =>
    item.href === '/app/partners' && pending > 0
      ? { ...item, badge: pending }
      : item
  )

  return (
    <div className="flex h-screen bg-[#0f2d1d] overflow-hidden">
      <AppSidebar items={sidebarItems} />
      <main className="flex-1 overflow-y-auto md:pl-56">
        <div className="px-8 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <AppBottomNav items={bottomItems} />
    </div>
  )
}
