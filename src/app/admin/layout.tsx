import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#1B4332] text-[#FAF7F2] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg tracking-wide lowercase">
              mulliganlinks <span className="text-[#FAF7F2]/60 font-normal text-sm ml-1">admin</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Dashboard</Link>
              <Link href="/admin/users" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Users</Link>
              <Link href="/admin/content" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Content</Link>
              <Link href="/admin/courses" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Courses</Link>
              <Link href="/admin/waitlist" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Waitlist</Link>
            </nav>
          </div>
          <Link href="/app" className="text-sm text-[#FAF7F2]/60 hover:text-[#FAF7F2] transition-colors">
            ← Member view
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
