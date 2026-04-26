import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/app" className="text-[#1B4332] font-bold text-xl tracking-wide lowercase">
            mulliganlinks
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/app/bookings" className="text-[#6B7770] hover:text-[#1A1A1A]">Bookings</Link>
            <Link href="/app/points" className="text-[#6B7770] hover:text-[#1A1A1A]">Points</Link>
            <Link href="/app/courses" className="text-[#6B7770] hover:text-[#1A1A1A]">Courses</Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-[#6B7770] hover:text-[#1A1A1A]">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
