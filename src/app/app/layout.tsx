import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/AppSidebar'
import s from '@/components/app/member-portal.module.css'
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
    <div className={s.shell}>
      <a href="#member-content" className={s.skipLink}>Skip to content</a>
      <AppSidebar items={sidebarItems} />
      <main id="member-content" tabIndex={-1} className={s.main}>
        <header className={s.pageIntro}><p>Your next round starts here.</p><span>TeeAhead membership</span></header>
        <div className={s.page}>
          {children}
        </div>
      </main>
      <AppBottomNav items={bottomItems} />
    </div>
  )
}
